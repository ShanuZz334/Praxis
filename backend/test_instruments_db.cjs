const Database = require('better-sqlite3');

const db = new Database('c:/project/ALLBACKUP/Praxis/backend/local_data/praxis_market.db');

try {
    const row = db.prepare("SELECT * FROM instruments WHERE instrument_key LIKE 'NSE_EQ|%' LIMIT 1").get();
    if (row) {
        console.log("Instrument:", row);
    } else {
        console.log("No data found");
    }
} catch (e) {
    console.error(e);
}
