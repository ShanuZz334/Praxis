const fs = require('fs');
const path = 'c:/project/ALLBACKUP/Praxis/frontend/stock-look/src/shared/components/charts/AdvancedCandlestickChart.jsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Remove crosshairData useState
code = code.replace(/const \[crosshairData, setCrosshairData\] = useState\(null\);\n/g, '');

// 2. Add OHLCLegend Component at the top (after imports)
const ohlcLegend = `
const OHLCLegend = React.memo(({ chartRef, candleSeriesRef, data }) => {
    const [crosshairData, setCrosshairData] = useState(null);

    useEffect(() => {
        if (!chartRef.current || !candleSeriesRef.current) return;
        const handleCrosshairMove = (param) => {
            if (param.time && param.point && param.seriesData.get(candleSeriesRef.current)) {
                const d = param.seriesData.get(candleSeriesRef.current);
                setCrosshairData({ open: d.open, high: d.high, low: d.low, close: d.close });
            } else {
                setCrosshairData(null);
            }
        };
        chartRef.current.subscribeCrosshairMove(handleCrosshairMove);
        return () => chartRef.current.unsubscribeCrosshairMove(handleCrosshairMove);
    }, [chartRef, candleSeriesRef]);

    const d = crosshairData || (data && data.length > 0 ? data[data.length - 1] : null);
    if (!d) return null;
    const isUp = d.close >= d.open;
    const chg = d.close - d.open;
    const pct = (chg / d.open) * 100;
    const cls = isUp ? 'text-[#26a69a]' : 'text-[#ef5350]';
    const sign = isUp ? '+' : '';
    return (
        <div className="pointer-events-none flex items-center gap-1.5 text-[11px] font-mono drop-shadow-md bg-black/5 dark:bg-black/20 border border-black/5 dark:border-white/5 px-1.5 py-0.5 rounded backdrop-blur-sm ml-1">
            <span className="text-slate-600 dark:text-gray-500">O<span className={cls}>{d.open.toFixed(2)}</span></span>
            <span className="text-slate-600 dark:text-gray-500">H<span className={cls}>{d.high.toFixed(2)}</span></span>
            <span className="text-slate-600 dark:text-gray-500">L<span className={cls}>{d.low.toFixed(2)}</span></span>
            <span className="text-slate-600 dark:text-gray-500">C<span className={cls}>{d.close.toFixed(2)}</span></span>
            <span className={cls}>{sign}{chg.toFixed(2)} ({sign}{pct.toFixed(2)}%)</span>
        </div>
    );
});
`;

code = code.replace(/export default React\.memo\(function AdvancedCandlestickChart\(\{/, ohlcLegend + '\nexport default React.memo(function AdvancedCandlestickChart({');

// 3. Remove inline crosshair state setting from the main component
const handleCrosshairRegex = /const handleCrosshairMove = \(param\) => \{[\s\S]*?chart\.subscribeCrosshairMove\(handleCrosshairMove\);/;
code = code.replace(handleCrosshairRegex, '');

// 4. Remove cleanup for handleCrosshairMove
code = code.replace(/chart\.unsubscribeCrosshairMove\(handleCrosshairMove\);\n/g, '');

// 5. Replace the inline OHLC legend JSX with the new component
const inlineLegendRegex = /<div className="pointer-events-none flex items-center gap-1\.5 text-\[11px\] font-mono drop-shadow-md bg-black\/5 dark:bg-black\/20 border border-black\/5 dark:border-white\/5 px-1\.5 py-0\.5 rounded backdrop-blur-sm ml-1">[\s\S]*?<\/div>/;
code = code.replace(inlineLegendRegex, '<OHLCLegend chartRef={chartRef} candleSeriesRef={candleSeriesRef} data={data} />');

// 6. Custom React.memo equality function to ignore liveCandle
const endRegex = /\}\);\n\nfunction FundamentalTimeline/;
const customEquality = `}, (prev, next) => {
    return prev.data === next.data && prev.timeframe === next.timeframe && prev.instrumentKey === next.instrumentKey && prev.theme === next.theme;
});

function FundamentalTimeline`;
code = code.replace(endRegex, customEquality);

// 7. Implement LiveCandle update via CustomEvent to bypass React render
// Add a new useEffect right after the candleSeriesRef useEffect
const candleSeriesEffectRegex = /candleSeriesRef\.current\.update\(liveCandle\);\n[\s\S]*?\}\n    \}, \[liveCandle, data, showEvents, fvActive\]\);/;

const liveCandleEventEffect = `// Listen to live ticks without re-rendering the component
    useEffect(() => {
        const handler = (e) => {
            const tick = e.detail;
            if (!candleSeriesRef.current || !tick) return;
            candleSeriesRef.current.update(tick);
            if (volumeSeriesRef.current) {
                volumeSeriesRef.current.update({
                    time: tick.time,
                    value: tick.volume,
                    color: tick.close >= tick.open ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)'
                });
            }

            // Real-Time PAE Scoring check
            if (fvActive && fvSessionRef.current) {
                const session = fvSessionRef.current;
                const barIdx = fvLiveBarIndexRef.current;
                if (barIdx < session.candles.length) {
                    const expectedTime = session.times[barIdx];
                    let isTimePassed = false;
                    if (typeof tick.time === 'number' && typeof expectedTime === 'number') {
                        isTimePassed = tick.time > expectedTime;
                    } else {
                        isTimePassed = new Date(tick.time).getTime() > new Date(expectedTime).getTime();
                    }
                    if (isTimePassed) {
                        const barScore = scoreClosedCandle(session.instrumentKey, session.timeframe, barIdx, tick);
                        if (barScore) {
                            fvLiveBarIndexRef.current = barIdx + 1;
                            setFvPAE(getPAESession(session.instrumentKey, session.timeframe));
                            if (ghostCandleSeriesRef.current && session.candles[barIdx]) {
                                _renderGhostCandles(session.candles, session.times, true);
                            }
                        }
                    }
                }
            }
        };
        const eventName = \`liveCandleUpdate_\${instrumentKey}\`;
        window.addEventListener(eventName, handler);
        return () => window.removeEventListener(eventName, handler);
    }, [instrumentKey, fvActive]);
`;

code = code.replace(candleSeriesEffectRegex, liveCandleEventEffect);

fs.writeFileSync(path, code);
console.log("Phase 1 patches applied successfully to AdvancedCandlestickChart.jsx");
