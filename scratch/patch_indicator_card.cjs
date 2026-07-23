const fs = require('fs');
const file = 'C:\\project\\ALLBACKUP\\Praxis\\frontend\\stock-look\\src\\shared\\components\\ui\\IndicatorCard\\IndicatorCard.jsx';
let content = fs.readFileSync(file, 'utf8');

const target = "{details?.filter(d => d && d.value !== '--' && d.value !== null && d.value !== undefined).map((d, i) => (";
const replace = "{details?.filter(d => d && (d.isManual || (d.value !== '--' && d.value !== null && d.value !== undefined))).map((d, i) => (";

if (content.includes(target)) {
    content = content.replace(target, replace);
} else {
    console.log("Could not find target block");
    process.exit(1);
}

fs.writeFileSync(file, content);
console.log('Fixed IndicatorCard details filter successfully!');
