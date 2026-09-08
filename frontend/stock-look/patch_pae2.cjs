const fs = require('fs');
const path = 'c:\\project\\ALLBACKUP\\Praxis\\frontend\\stock-look\\src\\shared\\utils\\predictionAccuracyEngine.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
    /export function clearPAESession\(instrumentKey, timeframe\) \{\s*const db = _load\(\);\s*delete db\[_key\(instrumentKey, timeframe\)\];\s*_save\(db\);\s*\}/,
    ''
);

fs.writeFileSync(path, content);
