const fs = require('fs');
const file = 'C:\\project\\ALLBACKUP\\Praxis\\frontend\\stock-look\\src\\features\\dashboard\\master\\engine\\useMasterComposite.js';
let content = fs.readFileSync(file, 'utf8');

const regexReplace = /if \(!activeIds\.has\(id\) && !activeTitles\.has\(title\)\) \{[\s\S]*?missingBreakdown\[\`\$\{engine\}\|\|\$\{title\}\`\] = 1;\s*\}/;

const newBlock = `if (!activeIds.has(id) && !activeTitles.has(title)) {
                let skip = false;
                // Index-specific exclusions
                if (isIndex && ['cmf', 'volume_sma', 'obv', 'vwap'].includes(id)) skip = true;
                if (!isIndex && ['breadth_ratio', 'mcclellan', 'ad_line', 'nh_nl', 'trin'].includes(id)) skip = true;
                
                if (!skip) {
                    let engine = 'MISC';
                    const cat = config.category || '';
                    const str = id.toLowerCase();
                    
                    // Exact matches for specific overrides
                    if (['bitcoin', 'brent_crude_oil', 'gold', 'silver', 'copper', 'natgas', 'wheat', 'aluminum'].includes(str)) engine = 'GLOB';
                    else if (str.includes('atm_iv') || str.includes('iv_rank') || str.includes('iv_percentile') || str.includes('pcr') || str.includes('max_pain') || str.match(/oi|delta|gamma|theta|vega/)) engine = 'OPT';
                    else if (cat.includes('Macro') || cat.includes('Global') || str.includes('vix') || str.match(/index_|move|advance_decline|gdp_growth|futures|usd|eur|jpy|cac|dax|ftse|nikkei|shanghai|hangseng/)) engine = 'GLOB';
                    else if (cat.includes('Technical') || cat.includes('Oscillator') || str.match(/sma|ema|rsi|macd|bollinger|bb_|kc|adx|atr|vwap|obv|stoch|supertrend|cmf|trendline|pivot|fibonacci|breadth|mcclellan|ad_line|nh_nl|trin/)) engine = 'TECH';
                    else engine = 'FUND'; 

                    missingBreakdown[\`\${engine}||\${title}\`] = 1;
                }
            }`;

content = content.replace(regexReplace, newBlock);
fs.writeFileSync(file, content);
console.log("Successfully added isIndex skips to missing breakdown!");
