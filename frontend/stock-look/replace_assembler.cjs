const fs = require('fs');
const path = 'c:\\project\\ALLBACKUP\\Praxis\\frontend\\stock-look\\src\\shared\\utils\\futureVisionContextAssembler.js';
let content = fs.readFileSync(path, 'utf8');

// Replace the function signature
content = content.replace(
    /export function assembleContext\(\{\s*ohlcv,\s*instrumentKey,\s*symbol,\s*timeframe,\s*tradingMode,[\s\S]*?horizonBars = 7,\s*\}\) \{/,
    `export function assembleContext({
    ohlcv,
    instrumentKey,
    symbol,
    timeframe,
    tradingMode,
    horizonBars = 7,
    aiNarratives = {}
}) {`
);

// Replace the block computers
content = content.replace(
    /const technicalBlock = _computeTechnicalBlock\(.*?\);\s*const fundamentalBlock = _computeFundamentalBlock\(.*?\);\s*const eventBlock = _computeEventBlock\(.*?\);\s*const sessionBlock = _computeSessionBlock\(.*?\);/,
    `// Pre-digested AI Narratives replacing raw indicator/fundamental data
    const technicalBlock = aiNarratives['Technical'] || 'N/A';
    const fundamentalBlock = aiNarratives['Fundamentals'] || 'N/A';
    const eventBlock = aiNarratives['Events'] || 'N/A';
    const optionsBlock = aiNarratives['Options'] || 'N/A';
    const globalBlock = aiNarratives['Global'] || 'N/A';
    const sessionBlock = _computeSessionBlock(tradingMode, timeframe, horizonBars);`
);

fs.writeFileSync(path, content);
