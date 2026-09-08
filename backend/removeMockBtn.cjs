const fs = require('fs');
const path = 'c:/project/ALLBACKUP/Praxis/frontend/stock-look/src/shared/components/charts/AdvancedCandlestickChart.jsx';
let code = fs.readFileSync(path, 'utf8');

// Match the conditional rendering block and the button
const regex = /\{fvSessionRef\.current\?\.candles\?\.length > 0 && \([\s\S]*?Inject 7 Mock Candles[\s\S]*?<\/button>\s*\)\}/;

if (code.match(regex)) {
    code = code.replace(regex, '');
    fs.writeFileSync(path, code);
    console.log("Removed mock button successfully!");
} else {
    // Try a looser match just in case
    const looseRegex = /<button[\s\S]*?Inject 7 Mock Candles[\s\S]*?<\/button>/;
    if (code.match(looseRegex)) {
        code = code.replace(looseRegex, '');
        fs.writeFileSync(path, code);
        console.log("Removed mock button (loose match)!");
    } else {
        console.log("Could not find the mock button to remove.");
    }
}
