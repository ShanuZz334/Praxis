const fs = require('fs');
const path = 'c:/project/ALLBACKUP/Praxis/frontend/stock-look/src/shared/components/charts/AdvancedCandlestickChart.jsx';
let code = fs.readFileSync(path, 'utf8');

const renderHook = `ghostCandleSeriesRef.current.setData(ghostData);
        ghostDataDrawnRef.current = true;
        
        // Force time scale to reveal the ghost candles!
        if (chartRef.current) {
            chartRef.current.timeScale().applyOptions({ rightOffset: ghostData.length + 5 });
            chartRef.current.timeScale().scrollToPosition(0, true);
        }`;

code = code.replace(
    /ghostCandleSeriesRef\.current\.setData\(ghostData\);\s*ghostDataDrawnRef\.current = true;/g,
    renderHook
);

fs.writeFileSync(path, code);
