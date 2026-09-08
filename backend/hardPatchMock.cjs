const fs = require('fs');
const path = 'c:/project/ALLBACKUP/Praxis/frontend/stock-look/src/shared/components/charts/AdvancedCandlestickChart.jsx';
let code = fs.readFileSync(path, 'utf8');

const regex = /<button[\s\S]*?Inject 7 Mock Candles[\s\S]*?<\/button>/;

const buttonCode = `<button 
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!fvSessionRef.current || !fvSessionRef.current.candles) return;
                            
                            const { instrumentKey, timeframe, candles, times } = fvSessionRef.current;
                            
                            const _toSec = (t) => {
                                if (typeof t === 'number') return t;
                                if (typeof t === 'string') return new Date(t).getTime() / 1000;
                                if (t?.year) return new Date(t.year, t.month - 1, t.day).getTime() / 1000;
                                return 0;
                            };

                            // Generate 7 mock real candles
                            candles.forEach((c, i) => {
                                const fakeClose = c.close + (Math.random() * 8 - 4);
                                const fakeCandle = {
                                    time: Math.round(_toSec(times[i])),
                                    open: c.open,
                                    high: Math.max(c.high, fakeClose, c.open) + Math.random() * 2,
                                    low: Math.min(c.low, fakeClose, c.open) - Math.random() * 2,
                                    close: fakeClose,
                                    volume: 1000 + Math.random() * 5000
                                };
                                
                                // 1. Score it and save to PAE database
                                scoreClosedCandle(instrumentKey, timeframe, i, fakeCandle);
                                
                                // 2. Plot it visually on the chart
                                if (candleSeriesRef.current) {
                                    candleSeriesRef.current.update(fakeCandle);
                                }
                            });
                            
                            // 3. Force markers to draw!
                            const paeSession = getPAESession(instrumentKey, timeframe);
                            if (candleSeriesRef.current && paeSession && paeSession.scores) {
                                const allMarkers = paeSession.scores.map(s => {
                                    const acc = Math.round(s.compositeScore || (s.da === 1 ? 80 : 30));
                                    return {
                                        time: Math.round(_toSec(times[s.barIndex])),
                                        position: 'belowBar',
                                        color: acc >= 75 ? '#10b981' : acc >= 45 ? '#f59e0b' : '#ef4444',
                                        shape: 'arrowUp',
                                        text: acc + '%',
                                        size: 1
                                    };
                                });
                                
                                // CRITICAL: TradingView absolutely requires markers to be sorted by time
                                allMarkers.sort((a, b) => a.time - b.time);
                                
                                // Direct native API application (bypasses any wrapper plugins)
                                candleSeriesRef.current.setMarkers(allMarkers);
                                
                                // Update React state for good measure
                                setFvPAE(paeSession);
                            }
                        }}
                        className="absolute bottom-16 right-4 z-[999] bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded text-[11px] font-bold shadow-lg border border-indigo-400/50 cursor-pointer"
                    >
                        Inject 7 Mock Candles
                    </button>`;

if (code.match(regex)) {
    code = code.replace(regex, buttonCode);
    fs.writeFileSync(path, code);
    console.log("Hard-patched mock button!");
} else {
    console.log("Regex failed!");
}
