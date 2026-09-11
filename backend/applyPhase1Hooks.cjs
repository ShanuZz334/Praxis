const fs = require('fs');
const path = 'c:/project/ALLBACKUP/Praxis/frontend/stock-look/src/shared/hooks/useHistoricalCandles.js';
let code = fs.readFileSync(path, 'utf8');

const regex = /setLiveCandle\(prevLive => \{/;
const replacement = `setLiveCandle(prevLive => {
            const emitTick = (tick) => {
                window.dispatchEvent(new CustomEvent(\`liveCandleUpdate_\${instrumentKey}\`, { detail: tick }));
                return tick;
            };
`;
code = code.replace(regex, replacement);

code = code.replace(/return \{\n\s*time: currentCandleStartSec,/g, 'return emitTick({\n                            time: currentCandleStartSec,');
code = code.replace(/return \{\n\s*\.\.\.prevLive,/g, 'return emitTick({\n                            ...prevLive,');
code = code.replace(/return \{\n\s*time: lastHistoricalTimeSec,/g, 'return emitTick({\n                            time: lastHistoricalTimeSec,');
code = code.replace(/return prevLive;/g, 'return prevLive;'); // do nothing on same tick

fs.writeFileSync(path, code);
console.log("Phase 1 patches applied successfully to useHistoricalCandles.js");
