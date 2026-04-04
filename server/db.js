const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'database.sqlite');
const db = new DatabaseSync(dbPath);

db.exec(`PRAGMA journal_mode = WAL`);
db.exec(`PRAGMA foreign_keys = ON`);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL DEFAULT 'Untitled Document',
    content TEXT DEFAULT '',
    owner_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS document_shares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL,
    shared_with_id INTEGER NOT NULL,
    permission TEXT NOT NULL DEFAULT 'edit',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (shared_with_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(document_id, shared_with_id)
  );
`);

// Seed demo users
const seedUsers = [
  { email: 'alice@ajaia.com', password: 'password123', name: 'Alice Johnson' },
  { email: 'bob@ajaia.com',   password: 'password123', name: 'Bob Smith' },
  { email: 'carol@ajaia.com', password: 'password123', name: 'Carol White' },
];

const insertUser = db.prepare(
  'INSERT OR IGNORE INTO users (email, password, name) VALUES (?, ?, ?)'
);

for (const u of seedUsers) {
  const hashed = bcrypt.hashSync(u.password, 10);
  insertUser.run(u.email, hashed, u.name);
}

module.exports = db;
