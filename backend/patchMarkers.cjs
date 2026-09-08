const fs = require('fs');
const path = 'c:/project/ALLBACKUP/Praxis/frontend/stock-look/src/shared/components/charts/AdvancedCandlestickChart.jsx';
let code = fs.readFileSync(path, 'utf8');

const regex = /\/\/ Update per-candle accuracy markers on the ghost series[\s\S]*?patchFVState/;

const newLogic = `// Update per-candle accuracy markers on the MAIN series so they appear prominently
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
                            time:     Math.round(_toSec(session.times[s.barIndex])),
                            position: 'belowBar',
                            color:    acc >= 75 ? '#10b981' : acc >= 45 ? '#f59e0b' : '#ef4444',
                            shape:    'arrowUp',
                            text:     acc + '%',
                            size:     1
                        };
                    }).filter(m => m.time > 0);
                    
                    if (fvAccuracyMarkersRef.current) {
                        try { fvAccuracyMarkersRef.current.detach?.(); } catch {}
                    }
                    fvAccuracyMarkersRef.current = createSeriesMarkers(candleSeriesRef.current, markers);
                }

                // Persist updated scores
                patchFVState`;

if (regex.test(code)) {
    code = code.replace(regex, newLogic);
    fs.writeFileSync(path, code);
    console.log("Patched Markers!");
} else {
    console.log("Regex not found!");
}
