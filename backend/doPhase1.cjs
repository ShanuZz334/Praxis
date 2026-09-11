const fs = require('fs');
let code = fs.readFileSync('c:/project/ALLBACKUP/Praxis/frontend/stock-look/src/shared/components/charts/AdvancedCandlestickChart.jsx', 'utf8');

// 1. Remove state
code = code.replace(/const \[crosshairData, setCrosshairData\] = useState\(null\);\n/g, '');

// 2. Remove handleCrosshairMove and subscription
code = code.replace(/const handleCrosshairMove = \(param\) => \{[\s\S]*?chart\.subscribeCrosshairMove\(handleCrosshairMove\);\n/m, '');
code = code.replace(/chart\.unsubscribeCrosshairMove\(handleCrosshairMove\);\n/g, '');

// 3. Import OHLCLegend
code = code.replace(/import DrawingCanvas from '\.\/drawing\/DrawingCanvas';/, "import DrawingCanvas from './drawing/DrawingCanvas';\nimport OHLCLegend from './OHLCLegend';");

// 4. Replace inline legend
const legendRegex = /<div className="pointer-events-none flex items-center gap-1\.5 text-\[11px\] font-mono drop-shadow-md bg-black\/5 dark:bg-black\/20 border border-black\/5 dark:border-white\/5 px-1\.5 py-0\.5 rounded backdrop-blur-sm ml-1">[\s\S]*?<\/div>/;
code = code.replace(legendRegex, '<OHLCLegend chartRef={chartRef} candleSeriesRef={candleSeriesRef} data={data} />');

// 5. Add custom React.memo equality function to ignore liveCandle changes
const endRegex = /\}\);\n\nfunction FundamentalTimeline/;
const customEquality = `}, (prev, next) => {
    return prev.data === next.data && prev.timeframe === next.timeframe && prev.instrumentKey === next.instrumentKey && prev.theme === next.theme;
});\n\nfunction FundamentalTimeline`;
code = code.replace(endRegex, customEquality);

// 6. Inject the CustomEvent listener for liveCandle directly inside AdvancedCandlestickChart
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

fs.writeFileSync('c:/project/ALLBACKUP/Praxis/frontend/stock-look/src/shared/components/charts/AdvancedCandlestickChart.jsx', code);
console.log('Phase 1 patched successfully');
