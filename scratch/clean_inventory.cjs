const fs = require('fs');
const file = 'C:\\project\\ALLBACKUP\\Praxis\\frontend\\stock-look\\src\\shared\\constants\\cardInventory.json';
let content = fs.readFileSync(file, 'utf8');

// Parse, filter, stringify
const data = JSON.parse(content);
const filtered = data.filter(d => d.targetId !== 'fno_ban');

fs.writeFileSync(file, JSON.stringify(filtered, null, 2), 'utf8');
console.log('cardInventory.json updated');
