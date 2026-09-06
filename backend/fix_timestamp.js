import fs from 'fs';
let fileText = fs.readFileSync('c:/project/ALLBACKUP/Praxis/frontend/stock-look/src/shared/components/charts/AdvancedCandlestickChart.jsx', 'utf8');

const target = `
            // Generate future timestamps for ghost candles
            const lastCandle = data[data.length - 1];
            const timeDiff = data.length > 1 ? (
                typeof lastCandle.time === 'number'
                    ? lastCandle.time - data[data.length - 2].time
                    : 86400
            ) : 86400;

            const times = candles.map((_, i) => {
                if (typeof lastCandle.time === 'number') return lastCandle.time + timeDiff * (i + 1);
                return lastCandle.time; // fallback ?" chart handles string times too
            });
`.trim().replace(/\r\n/g, '\n');

const replacement = `
            // Generate future timestamps for ghost candles
            const lastCandle = data[data.length - 1];
            
            const times = candles.map((_, i) => {
                if (typeof lastCandle.time === 'number') {
                    const timeDiff = data.length > 1 ? lastCandle.time - data[data.length - 2].time : 86400;
                    return lastCandle.time + timeDiff * (i + 1);
                } else if (typeof lastCandle.time === 'string') {
                    const timeDiffMs = data.length > 1 
                        ? new Date(lastCandle.time).getTime() - new Date(data[data.length - 2].time).getTime() 
                        : 86400000;
                    const nextTimeMs = new Date(lastCandle.time).getTime() + (timeDiffMs * (i + 1));
                    return new Date(nextTimeMs).toISOString().split('T')[0];
                } else if (lastCandle.time && lastCandle.time.year) {
                    let date = new Date(lastCandle.time.year, lastCandle.time.month - 1, lastCandle.time.day);
                    date.setDate(date.getDate() + (i + 1));
                    return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
                }
                return lastCandle.time; // ultimate fallback
            });
`.trim();

// Because the target has weird unicode character ?", we'll use regex
fileText = fileText.replace(/\/\/ Generate future timestamps for ghost candles[\s\S]*?return lastCandle.time;[^\n]*\n\s*\}\);/, replacement);

fs.writeFileSync('c:/project/ALLBACKUP/Praxis/frontend/stock-look/src/shared/components/charts/AdvancedCandlestickChart.jsx', fileText);
console.log("Done fixing timestamps.");
