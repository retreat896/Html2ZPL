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
    } catch (err) {
        console.error('Error creating tables:', err);
    }
};

export default { createTables };
