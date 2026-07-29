const Database = require('better-sqlite3');

const db = new Database('c:/project/ALLBACKUP/Praxis/backend/local_data/praxis_market.db');

try {
    const row = db.prepare("SELECT instrument_key, raw_json FROM fundamentals_data WHERE instrument_key = 'NSE_EQ|INE467B01029'").get();
    if (row) {
        const data = JSON.parse(row.raw_json);
        const equityCapital = data.balanceSheet.full_statement.find(p => p.particular === 'Equity Capital');
        console.log("Equity Capital:", equityCapital);
    } else {
        console.log("No TCS data found");
    }
} catch (e) {
    console.error(e);
}
