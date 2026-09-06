import Database from 'better-sqlite3';
const db = new Database('local_data/praxis_market.db');
console.log(db.prepare('SELECT category, counts_json FROM header_data WHERE instrument_key = ?').all('NSE_INDEX|Nifty 50'));
