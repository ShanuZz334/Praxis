const fs = require('fs');
const path = 'c:/project/ALLBACKUP/Praxis/frontend/stock-look/src/shared/components/charts/AdvancedCandlestickChart.jsx';
let code = fs.readFileSync(path, 'utf8');

// First, fix _renderGhostCandles so it DOES NOT slide forward!
// We will use the exact `times` array provided, without re-anchoring to maxRealSec.
const renderGhostRegex = /let validTime = maxRealSec;[\s\S]*?\}\)/;
const correctRenderGhost = `let ghostData = candles
            .map((c, i) => {
                const isBull = Number(c.close) >= Number(c.open);
                const bodyColor = isBull ? 'rgba(139, 92, 246, 0.3)' : 'rgba(236, 72, 153, 0.3)';
                const borderColor = isBull ? 'rgba(139, 92, 246, 0.7)' : 'rgba(236, 72, 153, 0.7)';

                return {
                    time: Math.round(_toSec(times[i])), // strictly use the original generated times!
                    open:  Number(c.open)  || 0,
                    high:  Number(c.high)  || 0,
                    low:   Number(c.low)   || 0,
                    close: Number(c.close) || 0,
                    color: bodyColor,
                    borderColor: borderColor,
                    wickColor: borderColor
                }
            })`;

code = code.replace(renderGhostRegex, correctRenderGhost);

// Second, fix generateFV's blind time addition to skip NSE overnight hours (15:30 to 09:15).
const generateRegex = /const times = candles\.map\(\(\_, i\) => \{[\s\S]*?return lastCandle\\.time;[\\s\\S]*?\\}\\);/;
const correctGenerate = `const times = candles.map((_, i) => {
                if (typeof lastCandle.time === 'number') {
                    const timeDiff = data.length > 1 ? lastCandle.time - data[data.length - 2].time : 86400;
                    
                    // Add timeDiff iteratively and skip overnight hours for Indian Markets (15:30 to 09:15)
                    let currentTime = lastCandle.time;
                    for (let step = 0; step <= i; step++) {
                        currentTime += timeDiff;
                        
                        // If it's an intraday timeframe (timeDiff < 86400)
                        if (timeDiff < 86400) {
                            // Check if currentTime falls outside 09:15 - 15:30 IST
                            // Convert unix timestamp to IST Date
                            const dateObj = new Date(currentTime * 1000);
                            // We need IST (+5:30)
                            const utc = dateObj.getTime() + (dateObj.getTimezoneOffset() * 60000);
                            const istDate = new Date(utc + (3600000 * 5.5));
                            
                            const hours = istDate.getHours();
                            const mins = istDate.getMinutes();
                            const timeVal = hours * 100 + mins; // e.g. 1530 for 15:30
                            
                            // If it crossed 15:30, jump to next day 09:15
                            if (timeVal > 1530 || timeVal < 915) {
                                // Jump to 09:15 next day
                                istDate.setDate(istDate.getDate() + (timeVal >= 1530 ? 1 : 0));
                                // Skip weekends
                                if (istDate.getDay() === 6) istDate.setDate(istDate.getDate() + 2); // Sat -> Mon
                                if (istDate.getDay() === 0) istDate.setDate(istDate.getDate() + 1); // Sun -> Mon
                                
                                istDate.setHours(9, 15, 0, 0);
                                // Convert back to UTC unix timestamp
                                currentTime = Math.floor((istDate.getTime() - (3600000 * 5.5) - (dateObj.getTimezoneOffset() * 60000)) / 1000);
                            }
                        }
                    }
                    return currentTime;
                } else if (typeof lastCandle.time === 'string') {
                    const timeDiffMs = data.length > 1
                        ? new Date(lastCandle.time).getTime() - new Date(data[data.length - 2].time).getTime()
                        : 86400000;
                    return new Date(new Date(lastCandle.time).getTime() + timeDiffMs * (i + 1)).toISOString().split('T')[0];
                } else if (lastCandle.time?.year) {
                    const date = new Date(lastCandle.time.year, lastCandle.time.month - 1, lastCandle.time.day);
                    date.setDate(date.getDate() + (i + 1));
                    // skip weekends for daily
                    if (date.getDay() === 6) date.setDate(date.getDate() + 2);
                    if (date.getDay() === 0) date.setDate(date.getDate() + 1);
                    return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
                }
                return lastCandle.time;
            });`;

if (code.match(generateRegex)) {
    code = code.replace(generateRegex, correctGenerate);
    fs.writeFileSync(path, code);
    console.log("Fixed sliding prediction and 3AM overnight candles!");
} else {
    console.log("Could not find generateRegex!");
}
