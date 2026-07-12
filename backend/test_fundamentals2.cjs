const axios = require('axios');
const db = require('better-sqlite3')('C:/project/ALLBACKUP/Praxis/backend/local_data/praxis_market.db');

const row = db.prepare("SELECT * FROM instruments WHERE instrument_key = 'NSE_EQ|INE467B01029'").get();
if (!row || !row.isin) {
    console.log("No ISIN found for instrument");
    process.exit(1);
}

console.log("Found ISIN:", row.isin);

// Just hit Upstox API directly since we don't have UpstoxAuth in sqlite
// Wait, I can't hit it directly without a token. I'll just query the backend API since it works!
// Wait, when I queried the backend API earlier, it returned `[]`. Let's test again!
axios.get('http://localhost:5000/api/v1/upstox/fundamentals?instrument_key=NSE_EQ%7CINE467B01029')
.then(r => {
    console.log(JSON.stringify(r.data.data.ratios, null, 2));
}).catch(e => {
    console.log(e.response ? e.response.data : e.message);
});
