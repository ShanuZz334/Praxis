const fs = require('fs');
const path = 'c:/project/ALLBACKUP/Praxis/frontend/stock-look/src/shared/components/charts/AdvancedCandlestickChart.jsx';
let code = fs.readFileSync(path, 'utf8');

// TASK 1 & 2: Hide markers on Zoom out AND on fvVisible = false
const hideRegex = /\/\/ 3\. Render all markers[\s\S]*?if \(fvAccuracyMarkersRef\.current\) \{/;
const hideLogic = `// 3. Render all markers
                    if (allMarkers.length > 0) {
                        allMarkers.sort((a, b) => a.time - b.time);
                        // Task 1 & 2: Only show if fvVisible is true, and zoom isn't too far out
                        let isZoomedOut = false;
                        if (chartRef.current) {
                            const range = chartRef.current.timeScale().getVisibleLogicalRange();
                            if (range && (range.to - range.from) > 120) { // threshold for hiding text
                                isZoomedOut = true;
                            }
                        }
                        
                        if (!fvVisible || isZoomedOut) {
                            allMarkers.length = 0; // Clear them visually!
                        }
                        
                        if (fvAccuracyMarkersRef.current) {`;

code = code.replace(hideRegex, hideLogic);


// TASK 3: Institutional Smoothing
const destructureRegex = /const \{ candles, overall_bias, key_risk \} = res\.data;/;
const smoothLogic = `let { candles, overall_bias, key_risk } = res.data;
            
            // INSTITUTIONAL AUTO-MODE SMOOTHING
            if (priorGhostCandles && priorGhostCandles.length > 0) {
                const blendedCandles = [];
                // 60% confidence in previous structural prediction, 40% adaptation to new tick momentum
                const wOld = 0.6; 
                const wNew = 0.4;
                
                for (let i = 0; i < Math.min(priorGhostCandles.length, candles.length); i++) {
                    const oldC = priorGhostCandles[i];
                    const newC = candles[i];
                    blendedCandles.push({
                        open: (oldC.open * wOld) + (newC.open * wNew),
                        high: (oldC.high * wOld) + (newC.high * wNew),
                        low: (oldC.low * wOld) + (newC.low * wNew),
                        close: (oldC.close * wOld) + (newC.close * wNew)
                    });
                }
                
                // Directly append any new tail candles (e.g., the 7th new candle)
                for (let i = priorGhostCandles.length; i < candles.length; i++) {
                    blendedCandles.push(candles[i]);
                }
                
                candles = blendedCandles; // override raw AI output with mathematically smoothed projection
            }`;

if (code.match(destructureRegex)) {
    code = code.replace(destructureRegex, smoothLogic);
} else {
    console.log("Could not find res.data destructure regex!");
}

// Add state trigger for zoom
const stateRegex = /const \[fvModel, setFvModel\]       = useState\(null\);/;
const stateLogic = `const [fvModel, setFvModel]       = useState(null);
    const [zoomTrigger, setZoomTrigger] = useState(0);`;
code = code.replace(stateRegex, stateLogic);

const effectRegex = /\}, \[liveCandle, fvVisible\]\);/;
const effectLogic = `}, [liveCandle, fvVisible, zoomTrigger]);`;
code = code.replace(effectRegex, effectLogic);

const zoomEventRegex = /volumeSeriesRef\.current\.setData\(volumeData\);/;
const zoomEventLogic = `volumeSeriesRef.current.setData(volumeData);
        chartRef.current.timeScale().subscribeVisibleLogicalRangeChange(() => {
            setZoomTrigger(z => z + 1);
        });`;
code = code.replace(zoomEventRegex, zoomEventLogic);


fs.writeFileSync(path, code);
console.log("Patched hide and smooth logic!");
