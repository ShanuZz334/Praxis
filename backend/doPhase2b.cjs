const fs = require('fs');
let code = fs.readFileSync('c:/project/ALLBACKUP/Praxis/frontend/stock-look/src/shared/components/charts/AdvancedCandlestickChart.jsx', 'utf8');

const wrapperRegex = /<div className="flex-1 w-full relative min-h-0" ref=\{chartWrapperRef\}>/;
const wrapperReplacement = `<div className="flex-1 w-full relative min-h-0" ref={chartWrapperRef} onContextMenu={(e) => {
                if (fvActive) {
                    e.preventDefault();
                    if (window.confirm("Delete the current Future Vision prediction?")) {
                        clearFutureVision();
                        setHoveredIndicator(null);
                    }
                }
            }}>`;

code = code.replace(wrapperRegex, wrapperReplacement);
fs.writeFileSync('c:/project/ALLBACKUP/Praxis/frontend/stock-look/src/shared/components/charts/AdvancedCandlestickChart.jsx', code);
console.log("Chart wrapper context menu patched");
