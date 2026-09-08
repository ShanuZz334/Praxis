const fs = require('fs');

const data = [
    { time: 1710000000, close: 100 },
    { time: 1710000300, close: 101 }
];

const candles = [{},{},{},{},{},{},{}];

const lastCandle = data[data.length - 1];
const times = candles.map((_, i) => {
    const timeDiff = data.length > 1 ? lastCandle.time - data[data.length - 2].time : 86400;
    
    let currentTime = lastCandle.time;
    for (let step = 0; step <= i; step++) {
        currentTime += timeDiff;
        if (timeDiff < 86400) {
            const dateObj = new Date(currentTime * 1000);
            const utc = dateObj.getTime() + (dateObj.getTimezoneOffset() * 60000);
            const istDate = new Date(utc + (3600000 * 5.5));
            
            const hours = istDate.getHours();
            const mins = istDate.getMinutes();
            const timeVal = hours * 100 + mins; // e.g. 1530 for 15:30
            
            if (timeVal > 1530 || timeVal < 915) {
                istDate.setDate(istDate.getDate() + (timeVal > 1530 ? 1 : 0));
                if (istDate.getDay() === 6) istDate.setDate(istDate.getDate() + 2);
                if (istDate.getDay() === 0) istDate.setDate(istDate.getDate() + 1);
                
                istDate.setHours(9, 15, 0, 0);
                currentTime = Math.floor((istDate.getTime() - (3600000 * 5.5) - (dateObj.getTimezoneOffset() * 60000)) / 1000);
            }
        }
    }
    return currentTime;
});

console.log(times);
