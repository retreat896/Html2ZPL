const Database = require('better-sqlite3');
const path = require('path');

// Create a new database file in the backend directory
const dbPath = path.resolve(__dirname, 'users.db');

const db = new Database(dbPath, { verbose: console.log });

console.log('Connected to the SQLite database.');

// Create users table if it doesn't exist
const createTable = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  )
`;

try {
  db.exec(createTable);

  const createProjectsTable = `
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      data TEXT NOT NULL,
      is_template BOOLEAN DEFAULT 0,
      is_public BOOLEAN DEFAULT 0,
      uuid TEXT UNIQUE,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `;
  db.exec(createProjectsTable);
} catch (err) {
  console.warn('Error creating table:', err.message);
}


// Migration: Add is_template column
try {
  const getTableInfo = () => db.prepare("PRAGMA table_info(projects)").all();

  const columns = getTableInfo();
  if (!columns.some(c => c.name === 'is_template')) {
    db.exec("ALTER TABLE projects ADD COLUMN is_template BOOLEAN DEFAULT 0");
    console.log("Added is_template column to projects table.");
  }
} catch (e) {
  if (!e.message.includes('duplicate column name')) console.error("Migration error (is_template):", e.message);
}

// Migration: Add is_public column
try {
  const columns = getTableInfo();
  if (!columns.some(c => c.name === 'is_public')) {
    db.exec("ALTER TABLE projects ADD COLUMN is_public BOOLEAN DEFAULT 0");
    console.log("Added is_public column to projects table.");
  }
} catch (e) {
  if (!e.message.includes('duplicate column name')) console.error("Migration error (is_public):", e.message);
}

// Migration: Add uuid column
try {
  const columns = getTableInfo();
  if (!columns.some(c => c.name === 'uuid')) {
    db.exec("ALTER TABLE projects ADD COLUMN uuid TEXT UNIQUE");
    console.log("Added uuid column to projects table.");

    // Backfill UUIDs for existing rows
    const projectsWithoutUuid = db.prepare("SELECT id FROM projects WHERE uuid IS NULL").all();
    if (projectsWithoutUuid.length > 0) {
      console.log(`Backfilling UUIDs for ${projectsWithoutUuid.length} projects...`);
      const updateUuid = db.prepare("UPDATE projects SET uuid = ? WHERE id = ?");
      const updateTransaction = db.transaction((projects) => {
        for (const project of projects) {
          updateUuid.run(require('crypto').randomUUID(), project.id);
        }
      });
      updateTransaction(projectsWithoutUuid);
      console.log("UUID backfill complete.");
    }
  }
} catch (e) {
  if (!e.message.includes('duplicate column name')) console.error("Migration error (uuid):", e.message);
}

const createUserSettingsTable = `
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id INTEGER PRIMARY KEY,
      settings TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `;
db.exec(createUserSettingsTable);

console.log('Tables ready.');

module.exports = db;
