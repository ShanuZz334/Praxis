const Database = require('better-sqlite3');

const db = new Database('c:/project/ALLBACKUP/Praxis/backend/local_data/praxis_market.db');

try {
    const row = db.prepare("SELECT instrument_key, raw_json FROM fundamentals_data WHERE instrument_key = 'NSE_EQ|INE467B01029'").get();
    if (row) {
        const data = JSON.parse(row.raw_json);
        console.log("TCS Company Profile keys:", Object.keys(data.company_profile || {}));
        console.log("TCS Company Profile:", data.company_profile);
    } else {
        console.log("No TCS data found");
    }
} catch (e) {
    console.error(e);
}
