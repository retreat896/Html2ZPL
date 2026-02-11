export const createTables = async (db) => {
    try {
        await db.exec(`
            CREATE TABLE IF NOT EXISTS zpl_users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS zpl_projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                data TEXT NOT NULL,
                is_template BOOLEAN DEFAULT 0,
                is_public BOOLEAN DEFAULT 0,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES zpl_users(id)
            );
            CREATE TABLE IF NOT EXISTS zpl_user_settings (
                user_id INTEGER PRIMARY KEY,
                settings TEXT NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES zpl_users(id)
            );
        `);
        console.log('Tables ready (D1).');

        // Migrations: Add is_template column if missing
        try {
            await db.prepare("ALTER TABLE zpl_projects ADD COLUMN is_template BOOLEAN DEFAULT 0").run();
            console.log("Added is_template column (D1).");
        } catch (e) {
            // Ignore if column exists
        }

        // Migrations: Add is_public column if missing
        try {
            await db.prepare("ALTER TABLE zpl_projects ADD COLUMN is_public BOOLEAN DEFAULT 0").run();
            console.log("Added is_public column (D1).");
        } catch (e) {
            // Ignore if column exists
        }
    } catch (err) {
        console.error('Error creating tables:', err);
    }
};

export default { createTables };
