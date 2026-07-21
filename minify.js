const fs = require('fs');
const data = JSON.parse(fs.readFileSync('c:\\project\\ALLBACKUP\\Praxis\\inventory.json', 'utf8'));
const compactJson = JSON.stringify(data);
fs.writeFileSync('c:\\project\\ALLBACKUP\\Praxis\\compact.json', compactJson);
console.log("Done");
