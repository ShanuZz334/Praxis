const fs = require('fs');
const path = 'c:/project/ALLBACKUP/Praxis/frontend/stock-look/src/shared/components/charts/AdvancedCandlestickChart.jsx';
let code = fs.readFileSync(path, 'utf8');

const regex = /\{fvSessionRef\.current\?\.candles\?\.length > 0 && \([\s\n]*\)\}/;

if (code.match(regex)) {
    code = code.replace(regex, '');
    fs.writeFileSync(path, code);
    console.log("Fixed dangling syntax!");
} else {
    console.log("Could not find dangling syntax.");
}
