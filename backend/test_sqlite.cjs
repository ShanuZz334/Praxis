const db = require('better-sqlite3')('C:/project/ALLBACKUP/Praxis/backend/praxis_market.db');
const row = db.prepare("SELECT * FROM instruments WHERE instrument_key = 'NSE_EQ|INE467B01029'").get();
console.log(row);
