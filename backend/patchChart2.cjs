const fs = require('fs');
const path = 'c:/project/ALLBACKUP/Praxis/frontend/stock-look/src/shared/components/charts/AdvancedCandlestickChart.jsx';
let code = fs.readFileSync(path, 'utf8');

const newLogic = `const maxRealSec = Math.max(currentLiveSec, lastDataSec);
        
        let validTime = maxRealSec;
        let timeStep = data.length > 1 ? _toSec(data[data.length-1].time) - _toSec(data[data.length-2].time) : 300;
        if (timeStep <= 0) timeStep = 300;

        let ghostData = candles
            .map((c, i) => {
                validTime += timeStep;
                return {
                    time: Math.round(validTime),
                    open:  Number(c.open)  || 0,
                    high:  Number(c.high)  || 0,
                    low:   Number(c.low)   || 0,
                    close: Number(c.close) || 0,
                }
            })
            .filter(c => c.time > maxRealSec && c.open > 0);

        if (!ghostData.length) {
            ghostCandleSeriesRef.current.setData([]);
            return;
        }

        ghostCandleSeriesRef.current.applyOptions({
            upColor: 'rgba(167,139,250,1)',
            downColor: 'rgba(167,139,250,1)',
            wickUpColor: 'rgba(167,139,250,1)',
            wickDownColor: 'rgba(167,139,250,1)',
            borderVisible: true,
            borderUpColor: 'rgba(167,139,250,1)',
            borderDownColor: 'rgba(167,139,250,1)',
        });

        console.log('[FutureVision] Drawing', ghostData.length, 'candles. Times:', ghostData[0].time, 'to', ghostData[ghostData.length-1].time);
        ghostCandleSeriesRef.current.setData(ghostData);
        ghostDataDrawnRef.current = true;
        
        // Force time scale to reveal the ghost candles!
        if (chartRef.current) {
            chartRef.current.timeScale().applyOptions({ rightOffset: ghostData.length + 5 });
            chartRef.current.timeScale().scrollToPosition(0, true);
        }`;

const startToken = `const maxRealSec = Math.max(currentLiveSec, lastDataSec);`;
const endToken = `chartRef.current.timeScale().scrollToPosition(0, true);\n        }`;

const startIndex = code.indexOf(startToken);
const endIndex = code.indexOf(endToken) + endToken.length;

if (startIndex > -1 && endIndex > -1) {
    code = code.substring(0, startIndex) + newLogic + code.substring(endIndex);
    fs.writeFileSync(path, code);
    console.log("Patched successfully!");
} else {
    console.log("Could not find tokens! Start:", startIndex, "End:", endIndex);
}
