const fs = require('fs');
const file = 'C:\\project\\ALLBACKUP\\Praxis\\backend\\engine\\fundamentalsEngine.js';
let content = fs.readFileSync(file, 'utf8');

const regexReplace = /\s*\{\s*id:\s*'index_pcr'[\s\S]*?\},?/m;

content = content.replace(regexReplace, "");
fs.writeFileSync(file, content);
console.log("Successfully removed index_pcr from fundamentalsEngine.js!");
