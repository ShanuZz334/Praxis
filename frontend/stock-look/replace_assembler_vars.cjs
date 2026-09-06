const fs = require('fs');
const path = 'c:\\project\\ALLBACKUP\\Praxis\\frontend\\stock-look\\src\\shared\\utils\\futureVisionContextAssembler.js';
let content = fs.readFileSync(path, 'utf8');

// Replace the block computers
content = content.replace(
    /const technicalBlock = [\s\S]*?const paeReport = getPAEReport/,
    `const technicalBlock = aiNarratives['Technical'] || 'N/A';
    const fundamentalBlock = aiNarratives['Fundamentals'] || 'N/A';
    const eventBlock = aiNarratives['Events'] || 'N/A';
    const optionsBlock = aiNarratives['Options'] || 'N/A';
    const globalBlock = aiNarratives['Global'] || 'N/A';
    const sessionBlock = _computeSessionBlock(tradingMode, timeframe, horizonBars);
    const paeReport = getPAEReport`
);

fs.writeFileSync(path, content);
