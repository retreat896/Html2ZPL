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
        res.status(500).json({ error: 'Server error' });
    }
});

// Middleware to authenticate token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Get all projects for a user
app.get('/projects', authenticateToken, (req, res) => {
    try {
        const stmt = db.prepare('SELECT id, name, is_template, is_public, updated_at FROM projects WHERE user_id = ? ORDER BY updated_at DESC');
        const projects = stmt.all(req.user.id);
        res.json(projects);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Save a project (Create or Update)
// For simplicity, we'll just create new ones or update if ID provided, 
// but usually the frontend might send ID if it knows it.
// Let's implement: POST /projects to create, PUT /projects/:id to update.
app.post('/projects', authenticateToken, (req, res) => {
    const { name, data, id, isTemplate } = req.body;

    if (!name || !data) {
        return res.status(400).json({ error: 'Name and data required' });
    }

    try {
        const isTemplateVal = isTemplate ? 1 : 0;
        if (id) {
            // Update
            const stmt = db.prepare('UPDATE projects SET name = ?, data = ?, is_template = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?');
            const result = stmt.run(name, data, isTemplateVal, id, req.user.id);
            if (result.changes === 0) return res.status(404).json({ error: 'Project not found or unauthorized' });
            res.json({ message: 'Project updated', id });
        } else {
            // Create
            const stmt = db.prepare('INSERT INTO projects (user_id, name, data, is_template) VALUES (?, ?, ?, ?)');
            const result = stmt.run(req.user.id, name, data, isTemplateVal);
            res.json({ message: 'Project saved', id: result.lastInsertRowid });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Load a specific project
app.get('/projects/:id', authenticateToken, (req, res) => {
    try {
        const stmt = db.prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?');
        const project = stmt.get(req.params.id, req.user.id);
        if (!project) return res.status(404).json({ error: 'Project not found' });
        res.json(project);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Public Templates
app.get('/public/templates', (req, res) => {
    try {
        const stmt = db.prepare('SELECT id, name, is_template, is_public, updated_at FROM projects WHERE is_public = 1 ORDER BY updated_at DESC');
        const projects = stmt.all();
        res.json(projects);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Specific Public Project/Template
app.get('/public/projects/:id', (req, res) => {
    try {
        const stmt = db.prepare('SELECT * FROM projects WHERE id = ? AND is_public = 1');
        const project = stmt.get(req.params.id);
        if (!project) return res.status(404).json({ error: 'Project not found or not public' });
        res.json(project);
    } catch (err) {
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
        res.status(500).json({ error: err.message });
    }
});

// Delete a project
app.delete('/projects/:id', authenticateToken, (req, res) => {
    try {
        const stmt = db.prepare('DELETE FROM projects WHERE id = ? AND user_id = ?');
        const result = stmt.run(req.params.id, req.user.id);
        if (result.changes === 0) return res.status(404).json({ error: 'Project not found' });
        res.json({ message: 'Project deleted' });
    } catch (err) {
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
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
