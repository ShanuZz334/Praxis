const Database = require('better-sqlite3');

const db = new Database('c:/project/ALLBACKUP/Praxis/backend/local_data/praxis_market.db');

try {
    const row = db.prepare("SELECT instrument_key, raw_json FROM fundamentals_data WHERE instrument_key = 'NSE_EQ|INE467B01029'").get();
    if (row) {
        const data = JSON.parse(row.raw_json);
        console.log("Root keys:", Object.keys(data));
        
        let foundKeys = [];
        function searchObj(obj, path) {
            if (obj && typeof obj === 'object') {
                for (const key in obj) {
                    const currentPath = path ? `${path}.${key}` : key;
                    if (key.toLowerCase().includes('face') || key.toLowerCase().includes('par')) {
                        foundKeys.push({path: currentPath, val: obj[key]});
                    }
                    searchObj(obj[key], currentPath);
                }
            }
        }
        searchObj(data, '');
        console.log("Found keys in DB:", foundKeys);
    } else {
        console.log("No TCS data found");
    }
} catch (e) {
    console.error(e);
}
