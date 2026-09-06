import fs from 'fs';
import { assembleContext } from './frontend/stock-look/src/shared/utils/futureVisionContextAssembler.js';

// mock data
const ohlcv = [];
for(let i=0; i<100; i++) {
    ohlcv.push({ time: Date.now()/1000 - (100-i)*60, open: 1250, high: 1260, low: 1240, close: 1255, volume: 100000 });
}
const payload = assembleContext({
    ohlcv,
    instrumentKey: "NSE_EQ|INE238A01034",
    symbol: "AXISBANK",
    timeframe: "15m",
    tradingMode: "swing",
    indicators: { ema_20: { value: 1250 }, rsi: { value: 60 } },
    events: [],
    fundamentals: {}
});
console.log("Chars:", payload.length);
console.log("Tokens approx:", Math.round(payload.length / 4));
