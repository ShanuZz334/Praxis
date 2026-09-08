const fs = require('fs');
const path = 'c:/project/ALLBACKUP/Praxis/frontend/stock-look/src/shared/hooks/useHistoricalCandles.js';
let code = fs.readFileSync(path, 'utf8');

const regex = /const _alignedCandleStart = \(nowMs, tfSec\) => \{[\s\S]*?return Math\.floor\(\(marketOpenMs \+ windowIndex \* tfSec \* 1000\) \/ 1000\);\n\s*\};/;

const newLogic = `const _alignedCandleStart = (nowMs, tfSec) => {
        const dateStr = new Date(nowMs).toISOString().split('T')[0];
        const marketOpenMs = new Date(\`\${dateStr}T03:45:00.000Z\`).getTime();
        const marketCloseMs = new Date(\`\${dateStr}T10:00:00.000Z\`).getTime();
        
        if (nowMs < marketOpenMs) return null; // pre-market
        if (nowMs >= marketCloseMs) return null; // post-market (prevent rogue after-hours candles!)
        
        const windowIndex = Math.floor((nowMs - marketOpenMs) / (tfSec * 1000));
        return Math.floor((marketOpenMs + windowIndex * tfSec * 1000) / 1000);
    };`;

if (code.match(regex)) {
    code = code.replace(regex, newLogic);
    fs.writeFileSync(path, code);
    console.log("Patched useHistoricalCandles to prevent after-hours live candles!");
} else {
    console.log("Could not find regex in useHistoricalCandles.js!");
}
