import Database from 'better-sqlite3';
const db = new Database('local_data/praxis_market.db');
console.log(db.prepare('SELECT instrument_key, trading_symbol, isin FROM instruments WHERE trading_symbol = ?').get('HDFCBANK'));
