const sqlite3 = require('better-sqlite3');
const db = sqlite3('local_data/praxis_market.db');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tables.map(t => t.name));
