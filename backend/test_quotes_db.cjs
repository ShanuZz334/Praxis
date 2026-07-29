const Database = require('better-sqlite3');

const db = new Database('c:/project/ALLBACKUP/Praxis/backend/local_data/praxis_market.db');

try {
    const row = db.prepare("SELECT instrument_key, ltp, open, high, low, close, volume, lower_circuit, upper_circuit, yearly_high, yearly_low, market_depth, updated_at FROM quotes WHERE instrument_key LIKE 'NSE_EQ|%' LIMIT 1").get();
    if (row) {
        console.log("Quote:", row);
    } else {
        console.log("No data found");
    }
} catch (e) {
    console.error(e);
}
