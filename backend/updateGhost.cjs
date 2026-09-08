const fs = require('fs');
const path = 'c:/project/ALLBACKUP/Praxis/frontend/stock-look/src/shared/components/charts/AdvancedCandlestickChart.jsx';
let code = fs.readFileSync(path, 'utf8');

const regex = /const _renderGhostCandles = \(candles, times, withPAEDimming\) => \{[\s\S]*?\}\s*;\s*\/\//;

const newBody = `const _renderGhostCandles = (candles, times, withPAEDimming) => {
        if (!ghostCandleSeriesRef.current) return;
        if (!candles?.length || !times?.length) return;

        const _toSec = (t) => {
            if (typeof t === 'number') return t;
            if (typeof t === 'string') return new Date(t).getTime() / 1000;
            if (t?.year) return new Date(t.year, t.month - 1, t.day).getTime() / 1000;
            return 0;
        };

        // We DO NOT filter by maxRealSec anymore because the user wants ghost candles 
        // to remain in the background underneath the real live candles!
        let ghostData = candles
            .map((c, i) => {
                const isBull = Number(c.close) >= Number(c.open);
                // Bull: translucent violet, Bear: translucent pink
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

if (regex.test(code)) {
    code = code.replace(regex, newBody);
    fs.writeFileSync(path, code);
    console.log("Fixed _renderGhostCandles!");
} else {
    console.log("Could not find regex!");
}
