const fs = require('fs');
const path = 'c:/project/ALLBACKUP/Praxis/frontend/stock-look/src/shared/components/charts/AdvancedCandlestickChart.jsx';
let code = fs.readFileSync(path, 'utf8');

const regex = /\/\/ Update per-candle accuracy markers on the MAIN series so they appear prominently[\s\S]*?patchFVState/;

const newLogic = `// --- REAL-TIME PAE SCORING ---
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

                    // 1. Gather confirmed closed markers from PAE Session
                    if (paeSession && paeSession.scores) {
                        paeSession.scores.forEach(s => {
                            const sTime = Math.round(_toSec(times[s.barIndex]));
                            // Ensure we don't duplicate a closed score if it's the exact same timestamp as the live forming candle
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

                    // 2. Compute LIVE real-time marker for the currently forming candle
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
                        
                        // Live institutional accuracy math
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

                    // 3. Render all markers
                    if (allMarkers.length > 0) {
                        allMarkers.sort((a, b) => a.time - b.time);
                        if (fvAccuracyMarkersRef.current) {
                            try { fvAccuracyMarkersRef.current.detach?.(); } catch {}
                        }
                        fvAccuracyMarkersRef.current = createSeriesMarkers(candleSeriesRef.current, allMarkers);
                    }
                }

                // Persist updated scores
                patchFVState`;

if (code.match(regex)) {
    code = code.replace(regex, newLogic);
    fs.writeFileSync(path, code);
    console.log("Patched live PAE!");
} else {
    console.log("Could not find regex!");
}
