const fs = require('fs');
const path = 'c:\\project\\ALLBACKUP\\Praxis\\frontend\\stock-look\\src\\shared\\utils\\futureVisionContextAssembler.js';
let content = fs.readFileSync(path, 'utf8');

// The file got mangled between priceAnalytics and the return statement.
// We need to fix it.

content = content.replace(
    /const priceAnalytics = _computePriceAnalytics\(window50, window20, window5, last, prev, indicators\);[\s\S]*?BLOCK 6.*PAE REPORT/i,
    `const priceAnalytics = _computePriceAnalytics(window50, window20, window5, last, prev, indicators);

    const technicalBlock = aiNarratives['Technical'] || 'N/A';
    const fundamentalBlock = aiNarratives['Fundamentals'] || 'N/A';
    const eventBlock = aiNarratives['Events'] || 'N/A';
    const optionsBlock = aiNarratives['Options'] || 'N/A';
    const globalBlock = aiNarratives['Global'] || 'N/A';
    const sessionBlock = _computeSessionBlock(tradingMode, timeframe, horizonBars);
    const paeReport = getPAEReport(instrumentKey, timeframe);

    return \`
  ================================================================================
  PRAXIS FUTURE VISION - PREDICTION BRIEF
  ================================================================================
  
  INSTRUMENT : \${symbol}
  KEY        : \${instrumentKey}
  TIMEFRAME  : \${timeframe}
  MODE       : \${tradingMode.toUpperCase()}
  LAST_CLOSE : ₹\${_f2(lastClose)}
  HORIZON    : \${horizonBars} candles forward
  REQUESTED  : \${new Date().toISOString()} (UTC)
  
  ================================================================================
  BLOCK 1 - PRICE ACTION
  ================================================================================
  
  A 1.1 RAW OHLCV - Last \${window50.length} bars (format: time,O,H,L,C,V)
  Note: Most recent bar at the bottom. Analyse recency-weighted.
  \${ohlcvCsv}
  
  A 1.2 DERIVED PRICE ANALYTICS (pre-computed for you)
  \${priceAnalytics}
  
  ================================================================================
  BLOCK 2 - TECHNICAL NARRATIVE
  ================================================================================
  \${technicalBlock}
  
  ================================================================================
  BLOCK 3 - FUNDAMENTAL NARRATIVE
  ================================================================================
  \${fundamentalBlock}
  
  ================================================================================
  BLOCK 4 - EVENTS NARRATIVE
  ================================================================================
  \${eventBlock}
  
  ================================================================================
  BLOCK 4.1 - OPTIONS NARRATIVE
  ================================================================================
  \${optionsBlock}
  
  ================================================================================
  BLOCK 4.2 - GLOBAL MACRO NARRATIVE
  ================================================================================
  \${globalBlock}
  
  ================================================================================
  BLOCK 5 - SESSION & MODE CONTEXT
  ================================================================================
  \${sessionBlock}
  
  ================================================================================
  BLOCK 6 - PREDICTION ACCURACY ENGINE (PAE) REPORT`
);

fs.writeFileSync(path, content);
