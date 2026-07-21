const db = require('better-sqlite3')('local_data/praxis_market.db');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log("Tables:", tables.map(t => t.name));

const checkTable = (tableName) => {
    try {
        const rows = db.prepare(`SELECT * FROM ${tableName} LIMIT 5`).all();
        console.log(`\nTable ${tableName}:`, rows);
    } catch(e) {
        // console.log(`Table ${tableName} not found or error:`, e.message);
    }
}

tables.forEach(t => checkTable(t.name));
