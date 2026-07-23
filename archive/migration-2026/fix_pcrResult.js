const fs = require('fs');
const file = 'C:\\project\\ALLBACKUP\\Praxis\\backend\\engine\\fundamentalsEngine.js';
let content = fs.readFileSync(file, 'utf8');

const regexReplace = /\s*const pcrResult = scorers\.scorePCR\(null\);/m;

content = content.replace(regexReplace, "");
fs.writeFileSync(file, content);
console.log("Successfully removed pcrResult from fundamentalsEngine.js!");
