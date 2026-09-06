const fs = require('fs');
const orig = fs.readFileSync('temp_orig.js', 'utf8');

const startStr = 'function weightedHarmonicMean(items) {';
const endStr = 'export const useGlobalComposite = ';

const startIdx = orig.indexOf(startStr);
const endIdx = orig.indexOf(endStr);

if (startIdx !== -1 && endIdx !== -1) {
    const mathCode = orig.substring(startIdx, endIdx);
    
    // Create the full valid file content
    const fullContent = 'import { getCompositeColor, getIndicatorColor } from \'../../../../shared/config/scoreColors.js\';\n' +
'import { FOREIGN_WEIGHTS } from \'../../../../config/weights/foreignWeights.js\';\n' +
'import { getIndicatorConfig } from \'../../../../shared/config/indicatorConfig.js\';\n\n' +
'export const ID_TO_TITLE_GLOBAL = {\n' +
'    dxy: "US Dollar Index", usd_inr: "USD/INR", crude: "Brent Crude", gold: "Gold", silver: "Silver",\n' +
'    us_10y_yield: "US 10Y Yield", sp_futures: "S&P 500 Futures", nasdaq_futures: "Nasdaq Futures", dow_futures: "Dow Jones Futures",\n' +
'    vix: "CBOE VIX", bitcoin: "Bitcoin", eurusd: "EUR/USD", usdjpy: "USD/JPY", nikkei: "Nikkei 225", ftse: "FTSE 100",\n' +
'    dax: "DAX", hangseng: "Hang Seng", shanghai: "Shanghai Composite", cac40: "CAC 40", eurostoxx: "Euro Stoxx 50",\n' +
'    copper: "Copper", natgas: "Natural Gas", wheat: "Wheat", aluminum: "Aluminum", move: "MOVE Index"\n' +
'};\n\n' + mathCode;

    fs.writeFileSync('frontend/stock-look/src/features/dashboard/foreign/engine/globalCompositeMath.js', fullContent);
    console.log('Restored perfectly!');
} else {
    console.log('Markers not found', startIdx, endIdx);
}
