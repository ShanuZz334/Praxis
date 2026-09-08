const fs = require('fs');
const path = 'c:\\project\\ALLBACKUP\\Praxis\\frontend\\stock-look\\src\\shared\\components\\charts\\AdvancedCandlestickChart.jsx';
let content = fs.readFileSync(path, 'utf8');

const anchor = 'const _renderGhostCandles = (candles, times, withPAEDimming) => {';
const insertion = `// ──────────────── History Renderer ──────────────────────────────────────────
    useEffect(() => {
        if (!chartRef.current) return;
        const chart = chartRef.current;

        // Clear existing
        pastGhostSeriesRefs.current.forEach(s => chart.removeSeries(s));
        pastGhostSeriesRefs.current = [];

        if (!showPastPredictions) return;

        const sessions = getAllPAESessions(instrumentKey, timeframe);
        if (!sessions || sessions.length === 0) return;

        sessions.forEach((session, idx) => {
            if (!session.candles || !session.times) return;
            
            const series = chart.addSeries(CandlestickSeries, {
                upColor:         'rgba(167,139,250,0.15)', 
                downColor:       'transparent',
                borderVisible:   true,
                borderUpColor:   'rgba(167,139,250,0.4)',
                borderDownColor: 'rgba(167,139,250,0.2)',
                wickUpColor:     'rgba(167,139,250,0.3)',
                wickDownColor:   'rgba(167,139,250,0.15)',
                priceLineVisible:      false,
                lastValueVisible:      false,
                crosshairMarkerVisible: false,
            });

            let ghostData = session.candles.map((c, i) => ({
                time: session.times[i],
                open: Number(c.open) || 0,
                high: Number(c.high) || 0,
                low:  Number(c.low)  || 0,
                close:Number(c.close)|| 0
            })).filter(c => c.time);

            if (ghostData.length === 0) return;
            
            series.setData(ghostData);
            pastGhostSeriesRefs.current.push(series);

            // Calculate overall Directional Accuracy for this set
            if (session.scores && session.scores.length > 0) {
                const validScores = session.scores.filter(Boolean);
                if (validScores.length > 0) {
                    const daSum = validScores.reduce((sum, s) => sum + (s.da || 0), 0);
                    const daPercent = Math.round((daSum / validScores.length) * 100);
                    
                    series.setMarkers([
                        {
                            time: ghostData[ghostData.length - 1].time,
                            position: 'belowBar',
                            color: 'rgba(167,139,250,0.8)',
                            shape: 'arrowUp',
                            text: \`\${ghostData.length} bars\nDA: \${daPercent}%\`,
                            size: 1
                        }
                    ]);
                }
            }
        });
    }, [showPastPredictions, instrumentKey, timeframe]);

    `;

content = content.replace(anchor, insertion + anchor);
fs.writeFileSync(path, content);
