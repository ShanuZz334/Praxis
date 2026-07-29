const Database = require('better-sqlite3');

const db = new Database('c:/project/ALLBACKUP/Praxis/backend/local_data/praxis_market.db');

try {
    const row = db.prepare("SELECT instrument_key, raw_json FROM fundamentals_data WHERE instrument_key LIKE 'NSE_EQ|%' LIMIT 1").get();
    if (row) {
        console.log("Instrument:", row.instrument_key);
        const data = JSON.parse(row.raw_json);
        console.log("Company Profile keys:", Object.keys(data.company_profile || {}));
        console.log("Company Profile content:", data.company_profile);
    } else {
        console.log("No data found");
    }
} catch (e) {
    console.error(e);
}
