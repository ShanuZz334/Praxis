const fs = require('fs');
const path = 'c:/project/ALLBACKUP/Praxis/frontend/stock-look/src/shared/components/charts/AdvancedCandlestickChart.jsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Fix _renderGhostCandles
const renderGhostRegex = /const _renderGhostCandles = \(candles, times, withPAEDimming\) => \{[\s\S]*?\}\s*;\s*\/\//;
const newGhostBody = `const _renderGhostCandles = (candles, times, withPAEDimming) => {
        if (!ghostCandleSeriesRef.current) return;
        if (!candles?.length || !times?.length) return;

        const _toSec = (t) => {
            if (typeof t === 'number') return t;
            if (typeof t === 'string') return new Date(t).getTime() / 1000;
            if (t?.year) return new Date(t.year, t.month - 1, t.day).getTime() / 1000;
            return 0;
        };

        let ghostData = candles
            .map((c, i) => {
                const isBull = Number(c.close) >= Number(c.open);
                const bodyColor = isBull ? 'rgba(139, 92, 246, 0.3)' : 'rgba(236, 72, 153, 0.3)';
                const borderColor = isBull ? 'rgba(139, 92, 246, 0.7)' : 'rgba(236, 72, 153, 0.7)';
                return {
                    time: Math.round(_toSec(times[i])),
                    open:  Number(c.open)  || 0,
                    high:  Number(c.high)  || 0,
                    low:   Number(c.low)   || 0,
                    close: Number(c.close) || 0,
                    color: bodyColor,
                    borderColor: borderColor,
                    wickColor: borderColor
                }
            })
            .filter(c => c.time > 0 && c.open > 0);

        if (!ghostData.length) {
            ghostCandleSeriesRef.current.setData([]);
            return;
        }

        ghostCandleSeriesRef.current.applyOptions({
            borderVisible: true,
            wickVisible: true
        });

        ghostCandleSeriesRef.current.setData(ghostData);
        ghostDataDrawnRef.current = true;
        
        if (chartRef.current) {
            chartRef.current.timeScale().applyOptions({ rightOffset: ghostData.length + 5 });
        }
    };
    //`;
code = code.replace(renderGhostRegex, newGhostBody);


// 2. Fix generateFV timestamp array gap logic
const generateRegex = /const times = candles\.map\(\(\_, i\) => \{[\s\S]*?return lastCandle\.time;\s*\/\/\s*ultimate fallback\s*\}\);/;
const correctGenerate = `const times = candles.map((_, i) => {
                if (typeof lastCandle.time === 'number') {
                    const timeDiff = data.length > 1 ? lastCandle.time - data[data.length - 2].time : 86400;
                    
                    let currentTime = lastCandle.time;
                    for (let step = 0; step <= i; step++) {
                        currentTime += timeDiff;
                        if (timeDiff < 86400) {
                            const dateObj = new Date(currentTime * 1000);
                            const utc = dateObj.getTime() + (dateObj.getTimezoneOffset() * 60000);
                            const istDate = new Date(utc + (3600000 * 5.5));
                            const hours = istDate.getHours();
                            const mins = istDate.getMinutes();
                            const timeVal = hours * 100 + mins; 
                            
                            if (timeVal > 1530 || timeVal < 915) {
                                istDate.setDate(istDate.getDate() + (timeVal >= 1530 ? 1 : 0));
                                if (istDate.getDay() === 6) istDate.setDate(istDate.getDate() + 2);
                                if (istDate.getDay() === 0) istDate.setDate(istDate.getDate() + 1);
                                istDate.setHours(9, 15, 0, 0);
                                currentTime = Math.floor((istDate.getTime() - (3600000 * 5.5) - (dateObj.getTimezoneOffset() * 60000)) / 1000);
                            }
                        }
                    }
                    return currentTime;
                } else if (typeof lastCandle.time === 'string') {
                    const timeDiffMs = data.length > 1
                        ? new Date(lastCandle.time).getTime() - new Date(data[data.length - 2].time).getTime()
                        : 86400000;
                    return new Date(new Date(lastCandle.time).getTime() + timeDiffMs * (i + 1)).toISOString().split('T')[0];
                } else if (lastCandle.time?.year) {
                    const date = new Date(lastCandle.time.year, lastCandle.time.month - 1, lastCandle.time.day);
                    date.setDate(date.getDate() + (i + 1));
                    if (date.getDay() === 6) date.setDate(date.getDate() + 2);
                    if (date.getDay() === 0) date.setDate(date.getDate() + 1);
                    return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
                }
                return lastCandle.time;
            });`;
code = code.replace(generateRegex, correctGenerate);


// 3. Implement Live PAE scoring
const livePaeRegex = /\/\/ Update per-candle accuracy markers on the MAIN series so they appear prominently[\s\S]*?patchFVState/;
const livePaeLogic = `// --- REAL-TIME PAE SCORING ---
                if (candleSeriesRef.current && fvSessionRef.current && fvSessionRef.current.candles) {
                    const { instrumentKey, timeframe, candles, times } = fvSessionRef.current;
                    const paeSession = getPAESession(instrumentKey, timeframe);
                    
                    const _toSec = (t) => {
                        if (typeof t === 'number') return t;
                        if (typeof t === 'string') return new Date(t).getTime() / 1000;
                        if (t?.year) return new Date(t.year, t.month - 1, t.day).getTime() / 1000;
                        return 0;
                    };

                    const liveSec = Math.round(typeof liveCandle.time === 'number' ? liveCandle.time : _toSec(liveCandle.time));
                    const allMarkers = [];

                    if (paeSession && paeSession.scores) {
                        paeSession.scores.forEach(s => {
                            const sTime = Math.round(_toSec(times[s.barIndex]));
                            if (sTime !== liveSec) {
                                const acc = Math.round(s.compositeScore || (s.da === 1 ? 80 : 30));
                                allMarkers.push({
                                    time: sTime,
                                    position: 'belowBar',
                                    color: acc >= 75 ? '#10b981' : acc >= 45 ? '#f59e0b' : '#ef4444',
                                    shape: 'arrowUp',
                                    text: acc + '%',
                                    size: 1
                                });
                            }
                        });
                    }

                    let matchedIdx = -1;
                    for (let i = 0; i < times.length; i++) {
                        if (Math.round(_toSec(times[i])) === liveSec) {
                            matchedIdx = i;
                            break;
                        }
                    }

                    if (matchedIdx > -1 && candles[matchedIdx]) {
                        const pred = candles[matchedIdx];
                        const real = liveCandle;
                        const da = Math.sign(real.close - real.open) === Math.sign(pred.close - pred.open) ? 1 : 0;
                        const range = Math.max(pred.high - pred.low, real.high - real.low, 0.01);
                        const closeError = Math.abs(real.close - pred.close);
                        const precisionScore = Math.max(0, 60 - (closeError / range) * 60);
                        const liveScore = Math.round((da === 1 ? 40 : 0) + precisionScore);

                        allMarkers.push({
                            time: liveSec,
                            position: 'belowBar',
                            color: liveScore >= 75 ? '#10b981' : liveScore >= 45 ? '#f59e0b' : '#ef4444',
                            shape: 'arrowUp',
                            text: liveScore + '%',
                            size: 1
                        });
                    }

                    if (allMarkers.length > 0) {
                        allMarkers.sort((a, b) => a.time - b.time);
                        let isZoomedOut = false;
                        if (chartRef.current) {
                            const range = chartRef.current.timeScale().getVisibleLogicalRange();
                            if (range && (range.to - range.from) > 120) {
                                isZoomedOut = true;
                            }
                        }
                        
                        if (!fvVisible || isZoomedOut) {
                            allMarkers.length = 0; 
                        }
                        
                        if (fvAccuracyMarkersRef.current) {
                            try { fvAccuracyMarkersRef.current.detach?.(); } catch {}
                        }
                        fvAccuracyMarkersRef.current = createSeriesMarkers(candleSeriesRef.current, allMarkers);
                    }
                }

                patchFVState`;
code = code.replace(livePaeRegex, livePaeLogic);


// 4. Implement Institutional Auto-Mode Smoothing
const destructureRegex = /const \{ candles, overall_bias, key_risk \} = res\.data;/;
const smoothLogic = `let { candles, overall_bias, key_risk } = res.data;
            
            if (priorGhostCandles && priorGhostCandles.length > 0) {
                const blendedCandles = [];
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
                
                for (let i = priorGhostCandles.length; i < candles.length; i++) {
                    blendedCandles.push(candles[i]);
                }
                
                candles = blendedCandles; 
            }`;
code = code.replace(destructureRegex, smoothLogic);

// 5. Add state trigger for zoom
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
console.log("All patches restored cleanly to the pristine file!");
