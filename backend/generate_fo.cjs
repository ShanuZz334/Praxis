const axios = require('axios');
const zlib = require('zlib');
const fs = require('fs');

async function run() {
    console.log("Fetching Upstox instruments...");
    const response = await axios({
        method: "get",
        url: "https://assets.upstox.com/market-quote/instruments/exchange/complete.json.gz",
        responseType: "arraybuffer"
    });
    const unzipped = zlib.gunzipSync(response.data);
    const instrumentsMap = JSON.parse(unzipped.toString("utf-8"));
    
    let equities = [];
    for (const key of Object.keys(instrumentsMap)) {
        const item = instrumentsMap[key];
        
        if (item.segment === 'NSE_EQ' && item.instrument_type === 'EQ') {
            equities.push({
                label: item.trading_symbol || item.tradingsymbol || item.name,
                name: item.name, // ADDED: include the full company name
                value: item.instrument_key
            });
        }
    }
    
    // Deduplicate by value
    const uniqueEquitiesMap = new Map();
    for (const eq of equities) {
        uniqueEquitiesMap.set(eq.value, eq);
    }
    equities = Array.from(uniqueEquitiesMap.values());
    
    // Clean up labels and remove '-EQ' suffix
    equities = equities.map(e => ({
        label: e.label.replace(/-EQ$/, '').replace(/-BE$/, '').replace(/-BZ$/, ''),
        name: e.name,
        value: e.value
    }));
    
    equities.sort((a,b) => a.label.localeCompare(b.label));
    
    console.log(`Found ${equities.length} NSE equities.`);
    
    let indices = [];
    for (const key of Object.keys(instrumentsMap)) {
        const item = instrumentsMap[key];
        if (item.segment === 'NSE_INDEX' || item.segment === 'BSE_INDEX') {
            indices.push({
                label: item.trading_symbol || item.tradingsymbol || item.name,
                name: item.name,
                value: item.instrument_key
            });
        }
    }
    // Deduplicate indices
    const uniqueIndicesMap = new Map();
    for (const idx of indices) {
        uniqueIndicesMap.set(idx.value, idx);
    }
    indices = Array.from(uniqueIndicesMap.values());
    indices.sort((a,b) => a.label.localeCompare(b.label));
    
    // Add legacy hardcoded aliases for compatibility if they don't exactly match the raw labels
    const legacyAliases = [
      { "label": "BANKNIFTY", "name": "Nifty Bank", "value": "NSE_INDEX|Nifty Bank" },
      { "label": "FINNIFTY", "name": "Nifty Fin Service", "value": "NSE_INDEX|Nifty Fin Service" },
      { "label": "MIDCPNIFTY", "name": "Nifty Midcap Select", "value": "NSE_INDEX|NIFTY MID SELECT" },
      { "label": "NIFTY", "name": "Nifty 50", "value": "NSE_INDEX|Nifty 50" },
      { "label": "NIFTYNXT50", "name": "Nifty Next 50", "value": "NSE_INDEX|Nifty Next 50" },
      { "label": "SENSEX", "name": "BSE Sensex", "value": "BSE_INDEX|SENSEX" }
    ];
    // Push them if their exact value isn't already there (or just push them and let duplicate values exist so both labels work)
    indices.push(...legacyAliases);
    
    console.log(`Found ${indices.length} indices.`);
    
    let content = `export const FO_INDICES = ${JSON.stringify(indices, null, 2)};\n\n`;
    content += `export const FO_EQUITIES = ${JSON.stringify(equities, null, 2)};\n`;
    
    fs.writeFileSync('C:/project/ALLBACKUP/Praxis/frontend/stock-look/src/shared/utils/foInstruments.js', content);
    console.log("Done updating foInstruments.js!");
}
run();
