const Database = require('better-sqlite3');
const fs = require('fs');
const db = new Database('./local_data/praxis_market.db');

const rows = db.prepare(`
    SELECT DISTINCT underlying_symbol, underlying_key 
    FROM instruments 
    WHERE segment='NSE_FO' 
    AND instrument_type='CE'
    AND underlying_symbol IS NOT NULL 
    AND underlying_key IS NOT NULL
`).all();

console.log('Found', rows.length, 'FO underlyings');

const indices = rows.filter(r => r.underlying_key.startsWith('NSE_INDEX')).map(r => ({ label: r.underlying_symbol, value: r.underlying_key }));
const equities = rows.filter(r => r.underlying_key.startsWith('NSE_EQ')).map(r => ({ label: r.underlying_symbol, value: r.underlying_key }));

// Sort alphabetically
indices.sort((a,b) => a.label.localeCompare(b.label));
equities.sort((a,b) => a.label.localeCompare(b.label));

const content = 'export const FO_INDICES = ' + JSON.stringify(indices, null, 2) + ';\n\nexport const FO_EQUITIES = ' + JSON.stringify(equities, null, 2) + ';\n';

fs.writeFileSync('../frontend/stock-look/src/shared/utils/foInstruments.js', content);
console.log('Saved to frontend');
