const axios = require('axios');
const db = require('better-sqlite3')('C:/project/ALLBACKUP/Praxis/backend/praxis_market.db');

const row = db.prepare("SELECT accessToken FROM UpstoxAuths ORDER BY createdAt DESC LIMIT 1").get();
if (!row) {
    console.log("No token found");
    process.exit(1);
}

axios.get('https://api.upstox.com/v2/fundamentals/INE467B01029/key-ratios', {
    headers: {
        'Authorization': 'Bearer ' + row.accessToken,
        'Accept': 'application/json'
    }
}).then(r => {
    console.log(JSON.stringify(r.data, null, 2));
}).catch(e => {
    console.log(e.response ? e.response.data : e.message);
});
