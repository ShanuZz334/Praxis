const fs = require('fs');
const file = 'C:\\project\\ALLBACKUP\\Praxis\\frontend\\stock-look\\src\\shared\\config\\indicatorConfig.js';
let content = fs.readFileSync(file, 'utf8');

const regexReplace = /\s*index_pcr:\s*\{[\s\S]*?\},/m;

content = content.replace(regexReplace, "");
fs.writeFileSync(file, content);
console.log("Successfully removed index_pcr from indicatorConfig!");
