import Database from 'better-sqlite3';

const db = new Database('./local_data/praxis_market.db', { readonly: true });
const r = db.prepare(`SELECT instrument_key, trading_symbol, name, exchange FROM instruments WHERE name LIKE '%RELIANCE INDUSTRIES%' LIMIT 10`).all();
console.log('RELIANCE matches:', r);

const tcs = db.prepare(`SELECT instrument_key, trading_symbol, name, exchange FROM instruments WHERE name LIKE '%TATA CONSULTANCY%' LIMIT 10`).all();
console.log('TCS matches:', tcs);
