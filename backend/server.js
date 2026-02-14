const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || 'your_secret_key_here'; // Use .env in production

app.use(cors());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Enhanced logging middleware for development
app.use((req, res, next) => {
    const start = Date.now();
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] Incoming ${req.method} ${req.url}`);

    if (req.body && Object.keys(req.body).length > 0) {
        // Avoid logging large data buffers or sensitive info if strict, 
        // but for dev usage, truncated or full logging is helpful.
        // We'll log a summary for 'data' fields if they are huge (like images)
        const bodyLog = { ...req.body };
        if (bodyLog.data && typeof bodyLog.data === 'string' && bodyLog.data.length > 500) {
            bodyLog.data = bodyLog.data.substring(0, 50) + '... [TRUNCATED]';
        }
        console.log('Body:', JSON.stringify(bodyLog, null, 2));
    }

    if (req.query && Object.keys(req.query).length > 0) {
        console.log('Query:', JSON.stringify(req.query, null, 2));
    }

    // Log response on finish
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] Completed ${req.method} ${req.url} ${res.statusCode} (${duration}ms)`);
    });

    next();
});

// Register Endpoint
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const insert = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
        const section = insert.run(username, hashedPassword);

        res.status(201).json({ message: 'User registered successfully', userId: section.lastInsertRowid });
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Login Endpoint
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const query = db.prepare('SELECT * FROM users WHERE username = ?');
        const user = query.get(username);

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ message: 'Login successful', token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Middleware to authenticate token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            console.error('JWT Verification Failed:', err.message);
            return res.sendStatus(403);
        }
        req.user = user;
        next();
    });
};

// Get all projects for a user
app.get('/projects', authenticateToken, (req, res) => {
    try {
        const stmt = db.prepare(`
            SELECT id, name, is_template, is_public, updated_at, thumbnail_small,
            json_array_length(json_extract(data, '$.labels')) as label_count 
            FROM projects 
            WHERE user_id = ? 
            ORDER BY updated_at DESC
        `);
        const projects = stmt.all(req.user.id);
        res.json(projects);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Save a project (Create or Update)
// For simplicity, we'll just create new ones or update if ID provided, 
// but usually the frontend might send ID if it knows it.
// Let's implement: POST /projects to create, PUT /projects/:id to update.
app.post('/projects', authenticateToken, (req, res) => {
    const { name, data, id, isTemplate, thumbnailSmall, thumbnailLarge } = req.body;

    if (!name || !data) {
        return res.status(400).json({ error: 'Name and data required' });
    }

    try {
        const isTemplateVal = isTemplate ? 1 : 0;
        if (id) {
            // Update
            // Check if ID is integer (legacy ID) or UUID string
            // actually frontend sends whatever it has.
            // If it's a UUID, we need to find the ID first? Or just update by UUID?
            // Our DB schema uses ID as primary key.
            // Let's assume for update, if we have a numeric ID we use it. 
            // If we have a UUID string passed as 'id', we should handle that too?
            // For now, let's stick to ID being the primary key ID if possible, 
            // OR update the logic to handle UUID.

            let stmt;
            let result;

            // Basic check if id is likely a UUID (length > 20 and not purely numeric)
            const isUuid = isNaN(id) && typeof id === 'string' && id.length > 20;

            if (isUuid) {
                stmt = db.prepare('UPDATE projects SET name = ?, data = ?, is_template = ?, thumbnail_small = ?, thumbnail_large = ?, updated_at = CURRENT_TIMESTAMP WHERE uuid = ? AND user_id = ?');
                result = stmt.run(name, data, isTemplateVal, thumbnailSmall, thumbnailLarge, id, req.user.id);
            } else {
                stmt = db.prepare('UPDATE projects SET name = ?, data = ?, is_template = ?, thumbnail_small = ?, thumbnail_large = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?');
                result = stmt.run(name, data, isTemplateVal, thumbnailSmall, thumbnailLarge, id, req.user.id);
            }

            if (result.changes === 0) return res.status(404).json({ error: 'Project not found or unauthorized' });

            // Return both ID and UUID if possible. If we updated by UUID, we might want to return the integer ID too?
            // For now, just return success.
            res.json({ message: 'Project updated', id });
        } else {
            // Create
            const uuid = require('crypto').randomUUID();
            const stmt = db.prepare('INSERT INTO projects (user_id, name, data, is_template, uuid, thumbnail_small, thumbnail_large) VALUES (?, ?, ?, ?, ?, ?, ?)');
            const result = stmt.run(req.user.id, name, data, isTemplateVal, uuid, thumbnailSmall, thumbnailLarge);
            res.json({ message: 'Project saved', id: result.lastInsertRowid, uuid });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Load a specific project
app.get('/projects/:id', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        let stmt;
        let project;

        // Check if ID is likely a UUID
        const isUuid = isNaN(id) && typeof id === 'string' && id.length > 20;

        if (isUuid) {
            stmt = db.prepare('SELECT * FROM projects WHERE uuid = ? AND user_id = ?');
            project = stmt.get(id, req.user.id);
        } else {
            stmt = db.prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?');
            project = stmt.get(id, req.user.id);
        }

        if (!project) return res.status(404).json({ error: 'Project not found' });
        res.json(project);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Get Public Templates
app.get('/public/templates', (req, res) => {
    try {
        const stmt = db.prepare('SELECT id, name, is_template, is_public, updated_at, thumbnail_small FROM projects WHERE is_public = 1 ORDER BY updated_at DESC');
        const projects = stmt.all();
        res.json(projects);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Get Specific Public Project/Template
app.get('/public/projects/:id', (req, res) => {
    try {
        const { id } = req.params;
        let stmt;
        let project;

        const isUuid = isNaN(id) && typeof id === 'string' && id.length > 20;

        if (isUuid) {
            stmt = db.prepare('SELECT * FROM projects WHERE uuid = ? AND is_public = 1');
            project = stmt.get(id);
        } else {
            stmt = db.prepare('SELECT * FROM projects WHERE id = ? AND is_public = 1');
            project = stmt.get(id);
        }

        if (!project) return res.status(404).json({ error: 'Project not found or not public' });
        res.json(project);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Toggle Public Status
app.post('/projects/:id/publish', authenticateToken, (req, res) => {
    const { isPublic } = req.body;
    try {
        const stmt = db.prepare('UPDATE projects SET is_public = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?');
        const result = stmt.run(isPublic ? 1 : 0, req.params.id, req.user.id);
        if (result.changes === 0) return res.status(404).json({ error: 'Project not found or unauthorized' });
        res.json({ message: `Project ${isPublic ? 'published' : 'unpublished'}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Delete a project
app.delete('/projects/:id', authenticateToken, (req, res) => {
    try {
        const stmt = db.prepare('DELETE FROM projects WHERE id = ? AND user_id = ?');
        const result = stmt.run(req.params.id, req.user.id);
        if (result.changes === 0) return res.status(404).json({ error: 'Project not found or unauthorized' });
        res.json({ success: true, message: 'Project deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Get User Settings
app.get('/settings', authenticateToken, (req, res) => {
    try {
        const stmt = db.prepare('SELECT settings FROM user_settings WHERE user_id = ?');
        const row = stmt.get(req.user.id);
        if (row) {
            res.json(JSON.parse(row.settings));
        } else {
            res.json({}); // Default empty if none exist
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Update User Settings
app.put('/settings', authenticateToken, (req, res) => {
    const { settings } = req.body;
    if (!settings) return res.status(400).json({ error: 'Settings required' });

    try {
        const stmt = db.prepare(`
            INSERT INTO user_settings (user_id, settings, updated_at) 
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id) DO UPDATE SET settings=excluded.settings, updated_at=CURRENT_TIMESTAMP
        `);
        stmt.run(req.user.id, JSON.stringify(settings));
        res.json({ message: 'Settings saved' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
