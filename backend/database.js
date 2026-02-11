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
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `;
  db.exec(createProjectsTable);

  // Migration: Add is_template column if it doesn't exist (for existing DBs)
  try {
    db.exec("ALTER TABLE projects ADD COLUMN is_template BOOLEAN DEFAULT 0");
    console.log("Added is_template column to projects table.");
  } catch (e) {
    // Column likely exists, ignore
  }

  // Migration: Add is_public column
  try {
    db.exec("ALTER TABLE projects ADD COLUMN is_public BOOLEAN DEFAULT 0");
    console.log("Added is_public column to projects table.");
  } catch (e) {
    // Column likely exists, ignore
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
} catch (err) {
  console.error('Error creating table:', err.message);
}

module.exports = db;
