const db = require('better-sqlite3')('local_data/praxis_market.db');
const row = db.prepare("SELECT count(*) as c FROM candles WHERE instrument_key = 'NSE_INDEX|Nifty 50'").get();
console.log('NIFTY CANDLES:', row.c);
