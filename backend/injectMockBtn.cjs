const fs = require('fs');
const path = 'c:/project/ALLBACKUP/Praxis/frontend/stock-look/src/shared/components/charts/AdvancedCandlestickChart.jsx';
let code = fs.readFileSync(path, 'utf8');

const regex = /<div className="flex-1 w-full relative min-h-0" ref=\{chartWrapperRef\} onContextMenu=\{handleContextMenu\}>/;

const buttonCode = `<div className="flex-1 w-full relative min-h-0" ref={chartWrapperRef} onContextMenu={handleContextMenu}>
                {fvSessionRef.current?.candles?.length > 0 && (
                    <button 
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const { instrumentKey, timeframe, candles, times } = fvSessionRef.current;
                            candles.forEach((c, i) => {
                                const fakeClose = c.close + (Math.random() * 8 - 4); // +/- 4 points noise
                                
                                let t = times[i];
                                if (typeof t === 'string') t = new Date(t).getTime() / 1000;
                                else if (t?.year) t = new Date(t.year, t.month-1, t.day).getTime() / 1000;
                                
                                const fakeCandle = {
                                    time: Math.round(t),
                                    open: c.open,
                                    high: Math.max(c.high, fakeClose, c.open) + Math.random() * 2,
                                    low: Math.min(c.low, fakeClose, c.open) - Math.random() * 2,
                                    close: fakeClose,
                                    volume: 1000 + Math.random() * 5000
                                };
                                
                                scoreClosedCandle(instrumentKey, timeframe, i, fakeCandle);
                                
                                if (candleSeriesRef.current) candleSeriesRef.current.update(fakeCandle);
                                if (volumeSeriesRef.current) volumeSeriesRef.current.update({ time: fakeCandle.time, value: fakeCandle.volume, color: fakeCandle.close >= fakeCandle.open ? 'rgba(38,166,154,0.5)' : 'rgba(239,83,80,0.5)' });
                            });
                            
                            const paeSession = getPAESession(instrumentKey, timeframe);
                            setFvPAE(paeSession);
                            
                            // Re-run the marker logic manually
                            if (candleSeriesRef.current && paeSession?.scores?.length) {
                                const _toSec = (t) => {
                                    if (typeof t === 'number') return t;
                                    if (typeof t === 'string') return new Date(t).getTime() / 1000;
                                    if (t?.year) return new Date(t.year, t.month - 1, t.day).getTime() / 1000;
                                    return 0;
                                };
                                const markers = paeSession.scores.map(s => {
                                    const acc = Math.round(s.compositeScore || (s.da === 1 ? 80 : 30));
                                    return {
                                        time: Math.round(_toSec(fvSessionRef.current.times[s.barIndex])),
                                        position: 'belowBar',
                                        color: acc >= 75 ? '#10b981' : acc >= 45 ? '#f59e0b' : '#ef4444',
                                        shape: 'arrowUp',
                                        text: acc + '%',
                                        size: 1
                                    };
                                }).filter(m => m.time > 0);
                                if (fvAccuracyMarkersRef.current) {
                                    try { fvAccuracyMarkersRef.current.detach?.(); } catch {}
                                }
                                fvAccuracyMarkersRef.current = createSeriesMarkers(candleSeriesRef.current, markers);
                            }
                        }}
                        className="absolute bottom-16 right-4 z-[999] bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded text-[11px] font-bold shadow-lg border border-indigo-400/50 cursor-pointer"
                    >
                        Inject 7 Mock Candles
                    </button>
                )}`;

if (code.match(regex)) {
    code = code.replace(regex, buttonCode);
    fs.writeFileSync(path, code);
    console.log("Injected button!");
} else {
    console.log("Could not find wrapper div!");
}
