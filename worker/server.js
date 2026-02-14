
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';
import bcrypt from 'bcryptjs';
import { createTables } from './dbd1';

const app = new Hono();

// Middleware
app.use('/*', cors());

// Initialize tables on first request (or separate migration)
// Ideally this should be a separate migration step, but for simplicity:
app.use('*', async (c, next) => {
    // Basic check to ensuring tables exist - could allow skipping via env var
    // await createTables(c.env.DB); 
    // Commented out to avoid overhead on every request, should be run once or via migration
    await next();
});

// Helper to get user from token (Hono jwt middleware puts payload in c.get('jwtPayload'))
// But we need to configure the middleware first.

app.post('/register', async (c) => {
    const { username, password } = await c.req.json();
    if (!username || !password) return c.json({ error: 'Username and password are required' }, 400);

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const { success } = await c.env.DB.prepare('INSERT INTO zpl_users (username, password) VALUES (?, ?)')
            .bind(username, hashedPassword)
            .run();

        if (!success) return c.json({ error: 'Failed to register' }, 500);

        // We need the ID, verify doesn't return lastInsertRowid in all cases? 
        // D1 run() returns meta which has last_row_id (snake_case in some versions?)
        // Let's check D1 docs or assume standard behavior. 
        // Better to select it back or assume success.

        return c.json({ message: 'User registered successfully' }, 201);
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            return c.json({ error: 'Username already exists' }, 400);
        }
        return c.json({ error: err.message }, 500);
    }
});

app.post('/login', async (c) => {
    const { username, password } = await c.req.json();
    if (!username || !password) return c.json({ error: 'Username and password are required' }, 400);

    try {
        const user = await c.env.DB.prepare('SELECT * FROM zpl_users WHERE username = ?')
            .bind(username)
            .first();

        if (!user) return c.json({ error: 'Invalid credentials' }, 401);

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return c.json({ error: 'Invalid credentials' }, 401);

        const SECRET_KEY = c.env.SECRET_KEY || 'your_secret_key_here';
        // Create token using Hono's jwt.sign or regular jsonwebtoken if imported
        // Since we imported jwt from hono/jwt which is middleware, 
        // we should use import { sign } from 'hono/jwt'
        const { sign } = await import('hono/jwt');
        const token = await sign({ id: user.id, username: user.username, exp: Math.floor(Date.now() / 1000) + 60 * 60 }, SECRET_KEY);

        return c.json({ message: 'Login successful', token });
    } catch (err) {
        return c.json({ error: 'Server error: ' + err.message }, 500);
    }
});

// Protected Routes
// We define a sub-app or just use middleware on paths
// Hono JWT middleware:
app.use('/projects/*', (c, next) => {
    console.log('JWT Middleware called for /projects/*');
    const jwtMiddleware = jwt({ secret: c.env.SECRET_KEY || 'your_secret_key_here', alg: 'HS256' });
    return jwtMiddleware(c, next);
});
app.use('/settings', (c, next) => {
    const jwtMiddleware = jwt({ secret: c.env.SECRET_KEY || 'your_secret_key_here', alg: 'HS256' });
    return jwtMiddleware(c, next);
});

// Get all projects
app.get('/projects', async (c) => {
    console.log("[GET /projects]");
    const payload = c.get('jwtPayload');
    try {
        const { results } = await c.env.DB.prepare(`
            SELECT id, name, is_template, is_public, updated_at, thumbnail_small,
            json_array_length(json_extract(data, '$.labels')) as label_count 
            FROM zpl_projects 
            WHERE user_id = ? 
            ORDER BY updated_at DESC
        `)
            .bind(payload.id)
            .all();
        return c.json(results);
    } catch (err) {
        return c.json({ error: err.message }, 500);
    }
});

// Save project
app.post('/projects', async (c) => {
    console.log("[POST /projects]");
    const payload = c.get('jwtPayload');
    const body = await c.req.json();
    const { name, data, id, isTemplate, thumbnailSmall, thumbnailLarge } = body;

    console.log(`[POST /projects] User: ${payload.id}, Project ID: ${id || 'new'}`);

    if (!name || !data) {
        console.warn('[POST /projects] Validation failed: missing name or data');
        return c.json({ error: 'Name and data required' }, 400);
    }

    const isTemplateVal = isTemplate ? 1 : 0;

    try {
        if (id) {
            let result;
            const isUuid = isNaN(id) && typeof id === 'string' && id.length > 20;

            if (isUuid) {
                console.log(`[POST /projects] Updating project by UUID: ${id}`);
                result = await c.env.DB.prepare('UPDATE zpl_projects SET name = ?, data = ?, is_template = ?, thumbnail_small = ?, thumbnail_large = ?, updated_at = CURRENT_TIMESTAMP WHERE uuid = ? AND user_id = ?')
                    .bind(name, data, isTemplateVal, thumbnailSmall, thumbnailLarge, id, payload.id)
                    .run();
            } else {
                console.log(`[POST /projects] Updating project by ID: ${id}`);
                result = await c.env.DB.prepare('UPDATE zpl_projects SET name = ?, data = ?, is_template = ?, thumbnail_small = ?, thumbnail_large = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?')
                    .bind(name, data, isTemplateVal, thumbnailSmall, thumbnailLarge, id, payload.id)
                    .run();
            }

            console.log(`[POST /projects] Update result:`, result);
            return c.json({ message: 'Project updated', id });
        } else {
            const uuid = crypto.randomUUID();
            console.log(`[POST /projects] Creating new project with UUID: ${uuid}`);

            const stmt = c.env.DB.prepare('INSERT INTO zpl_projects (user_id, name, data, is_template, uuid, thumbnail_small, thumbnail_large) VALUES (?, ?, ?, ?, ?, ?, ?)')
                .bind(payload.id, name, data, isTemplateVal, uuid, thumbnailSmall, thumbnailLarge);
            console.log('[POST /projects] Executing query:', stmt);
            const result = await stmt.run();


            console.log(`[POST /projects] Create result:`, result);
            return c.json({ message: 'Project saved', id: result.meta?.last_row_id, uuid });
        }
    } catch (err) {
        console.error('[POST /projects] Exception occurred:', err);
        return c.json({ error: err.message }, 500);
    }
});

// Get specific project
app.get('/projects/:id', async (c) => {
    const payload = c.get('jwtPayload');
    const id = c.req.param('id');
    try {
        const isUuid = isNaN(id) && typeof id === 'string' && id.length > 20;
        let project;

        if (isUuid) {
            project = await c.env.DB.prepare('SELECT * FROM zpl_projects WHERE uuid = ? AND user_id = ?')
                .bind(id, payload.id)
                .first();
        } else {
            project = await c.env.DB.prepare('SELECT * FROM zpl_projects WHERE id = ? AND user_id = ?')
                .bind(id, payload.id)
                .first();
        }

        if (!project) return c.json({ error: 'Project not found' }, 404);
        return c.json(project);
    } catch (err) {
        return c.json({ error: err.message }, 500);
    }
});

// Get Public Templates
app.get('/public/templates', async (c) => {
    try {
        // Since this is public, no auth needed
        const { results } = await c.env.DB.prepare('SELECT id, name, is_template, is_public, updated_at, thumbnail_small FROM zpl_projects WHERE is_public = 1 ORDER BY updated_at DESC').all();
        return c.json(results);
    } catch (err) {
        return c.json({ error: err.message }, 500);
    }
});

// Get Specific Public Project/Template
app.get('/public/projects/:id', async (c) => {
    const id = c.req.param('id');
    try {
        const isUuid = isNaN(id) && typeof id === 'string' && id.length > 20;
        let project;

        if (isUuid) {
            project = await c.env.DB.prepare('SELECT * FROM zpl_projects WHERE uuid = ? AND is_public = 1')
                .bind(id)
                .first();
        } else {
            project = await c.env.DB.prepare('SELECT * FROM zpl_projects WHERE id = ? AND is_public = 1')
                .bind(id)
                .first();
        }

        if (!project) return c.json({ error: 'Project not found or not public' }, 404);
        return c.json(project);
    } catch (err) {
        return c.json({ error: err.message }, 500);
    }
});

// Toggle Public Status
app.post('/projects/:id/publish', async (c) => {
    const payload = c.get('jwtPayload'); // Auth middleware must be applied to this route? 
    // Wait, my middleware logic applies to /projects/*, so yes.
    const id = c.req.param('id');
    const { isPublic } = await c.req.json();

    try {
        // Attempt update
        const result = await c.env.DB.prepare('UPDATE zpl_projects SET is_public = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?')
            .bind(isPublic ? 1 : 0, id, payload.id)
            .run();
        if (result.meta?.changes === 0) return c.json({ error: 'Project not found or unauthorized' }, 404);
        return c.json({ message: `Project ${isPublic ? 'published' : 'unpublished'}` });
    } catch (err) {
        return c.json({ error: err.message }, 500);
    }
});

// Delete project
app.delete('/projects/:id', async (c) => {
    const payload = c.get('jwtPayload');
    const id = c.req.param('id');
    try {
        const result = await c.env.DB.prepare('DELETE FROM zpl_projects WHERE id = ? AND user_id = ?')
            .bind(id, payload.id)
            .run();
        if (result.meta?.changes === 0) return c.json({ error: 'Project not found' }, 404);
        return c.json({ success: true, message: 'Project deleted' });
    } catch (err) {
        return c.json({ error: err.message }, 500);
    }
});

// Get User Settings
app.get('/settings', async (c) => {
    const payload = c.get('jwtPayload');
    try {
        const row = await c.env.DB.prepare('SELECT settings FROM zpl_user_settings WHERE user_id = ?')
            .bind(payload.id)
            .first();
        if (row) {
            return c.json(JSON.parse(row.settings));
        } else {
            return c.json({});
        }
    } catch (err) {
        return c.json({ error: err.message }, 500);
    }
});

// Update User Settings
app.put('/settings', async (c) => {
    const payload = c.get('jwtPayload');
    const { settings } = await c.req.json();
    if (!settings) return c.json({ error: 'Settings required' }, 400);

    try {
        await c.env.DB.prepare(`
            INSERT INTO zpl_user_settings (user_id, settings, updated_at) 
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id) DO UPDATE SET settings=excluded.settings, updated_at=CURRENT_TIMESTAMP
        `).bind(payload.id, JSON.stringify(settings)).run();
        return c.json({ message: 'Settings saved' });
    } catch (err) {
        return c.json({ error: err.message }, 500);
    }
});

export default app;
