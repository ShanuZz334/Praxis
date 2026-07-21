export function calculateSMA(data, period, source = 'close') {
    const sma = [];
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
        sum += data[i][source];
        if (i >= period) {
            sum -= data[i - period][source];
            sma.push({ time: data[i].time, value: sum / period });
        } else if (i === period - 1) {
            sma.push({ time: data[i].time, value: sum / period });
        } else {
            sma.push({ time: data[i].time, value: null }); // padding
        }
    }
    return sma;
}

export function calculateATR(data, period) {
    if (data.length < period) return [];
    const tr = [0];
    for (let i = 1; i < data.length; i++) {
        const high = data[i].high;
        const low = data[i].low;
        const prevClose = data[i-1].close;
        tr.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)));
    }
    const atr = [];
    let sum = 0;
    for (let i = 1; i <= period; i++) sum += tr[i];
    let currentAtr = sum / period;
    
    // Fill initial padding
    for (let i = 0; i < period; i++) atr.push({ time: data[i].time, value: null });
    atr.push({ time: data[period].time, value: currentAtr });

    for (let i = period + 1; i < data.length; i++) {
        currentAtr = (currentAtr * (period - 1) + tr[i]) / period; // RMA smoothing (Wilder)
        atr.push({ time: data[i].time, value: currentAtr });
    }
    return atr;
}

export function calculateBollingerBands(data, period = 20, multiplier = 2) {
    if (data.length < period) return { upper: [], middle: [], lower: [] };
    const middle = [];
    const upper = [];
    const lower = [];
    
    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) continue;
        
        let sum = 0;
        for (let j = 0; j < period; j++) sum += data[i - j].close;
        const sma = sum / period;
        
        let squaredDiffs = 0;
        for (let j = 0; j < period; j++) squaredDiffs += Math.pow(data[i - j].close - sma, 2);
        const stdDev = Math.sqrt(squaredDiffs / period);
        
        const time = data[i].time;
        middle.push({ time, value: sma });
        upper.push({ time, value: sma + (multiplier * stdDev) });
        lower.push({ time, value: sma - (multiplier * stdDev) });
    }
    return { upper, middle, lower };
}

export function calculateMACD(data, fast = 12, slow = 26, signal = 9) {
    const calcEma = (arr, p) => {
        const k = 2 / (p + 1);
        let ema = arr[0];
        const res = [ema];
        for(let i=1; i<arr.length; i++) {
            ema = (arr[i] - ema) * k + ema;
            res.push(ema);
        }
        return res;
    };
    
    if (data.length < slow) return { macd: [], signal: [], histogram: [] };
    const closes = data.map(d => d.close);
    const fastEma = calcEma(closes, fast);
    const slowEma = calcEma(closes, slow);
    
    const macdLineRaw = [];
    for(let i=0; i<data.length; i++) macdLineRaw.push(fastEma[i] - slowEma[i]);
    
    const signalLineRaw = calcEma(macdLineRaw, signal);
    
    const macdSeries = [];
    const signalSeries = [];
    const histSeries = [];
    
    for(let i=slow; i<data.length; i++) {
        const time = data[i].time;
        const m = macdLineRaw[i];
        const s = signalLineRaw[i];
        const h = m - s;
        macdSeries.push({ time, value: m });
        signalSeries.push({ time, value: s });
        histSeries.push({ time, value: h, color: h >= 0 ? (h > (macdLineRaw[i-1]-signalLineRaw[i-1]) ? '#26a69a' : '#b2dfdb') : (h < (macdLineRaw[i-1]-signalLineRaw[i-1]) ? '#ef5350' : '#ffcdd2') });
    }
    return { macd: macdSeries, signal: signalSeries, histogram: histSeries };
}

export function calculateKeltnerChannels(data, period = 20, multiplier = 2) {
    const atrSeries = calculateATR(data, period);
    const middle = [];
    const upper = [];
    const lower = [];
    
    const k = 2 / (period + 1);
    let ema = data[0].close;
    
    for(let i=0; i<data.length; i++) {
        ema = (data[i].close - ema) * k + ema;
        if (i >= period) {
            const atr = atrSeries[i].value;
            const time = data[i].time;
            middle.push({ time, value: ema });
            upper.push({ time, value: ema + (multiplier * atr) });
            lower.push({ time, value: ema - (multiplier * atr) });
        }
    }
    return { upper, middle, lower };
}

export function calculateDonchianChannels(data, period = 20) {
    const upper = [];
    const lower = [];
    const middle = [];
    
    for (let i = period; i < data.length; i++) {
        let highest = -Infinity;
        let lowest = Infinity;
        for (let j = 1; j <= period; j++) {
            if (data[i - j].high > highest) highest = data[i - j].high;
            if (data[i - j].low < lowest) lowest = data[i - j].low;
        }
        const time = data[i].time;
        upper.push({ time, value: highest });
        lower.push({ time, value: lowest });
        middle.push({ time, value: (highest + lowest) / 2 });
    }
    return { upper, middle, lower };
}

export function calculatePSAR(data, step = 0.02, maxStep = 0.2) {
    if (data.length < 2) return [];
    const sar = [];
    let isLong = true;
    let currentSar = data[0].low;
    let extremePoint = data[0].high;
    let af = step;
    
    for (let i = 1; i < data.length; i++) {
        sar.push({ time: data[i].time, value: currentSar });
        
        if (isLong) {
            currentSar = currentSar + af * (extremePoint - currentSar);
            if (data[i].low < currentSar) {
                isLong = false;
                currentSar = extremePoint;
                extremePoint = data[i].low;
                af = step;
            } else {
                if (data[i].high > extremePoint) {
                    extremePoint = data[i].high;
                    af = Math.min(af + step, maxStep);
                }
            }
        } else {
            currentSar = currentSar + af * (extremePoint - currentSar);
            if (data[i].high > currentSar) {
                isLong = true;
                currentSar = extremePoint;
                extremePoint = data[i].high;
                af = step;
            } else {
                if (data[i].low < extremePoint) {
                    extremePoint = data[i].low;
                    af = Math.min(af + step, maxStep);
                }
            }
        }
    }
    return sar;
}

export function calculateIchimoku(data, conversionPeriod = 9, basePeriod = 26, spanPeriod = 52, displacement = 26) {
    const tenkan = []; 
    const kijun = [];  
    const spanA = [];
    const spanB = [];
    
    const getHighLowAvg = (index, period) => {
        let h = -Infinity;
        let l = Infinity;
        for(let i=0; i<period; i++) {
            if (data[index-i].high > h) h = data[index-i].high;
            if (data[index-i].low < l) l = data[index-i].low;
        }
        return (h + l) / 2;
    };
    
    for (let i = 0; i < data.length; i++) {
        const time = data[i].time;
        let t = null, k = null;
        
        if (i >= conversionPeriod - 1) {
            t = getHighLowAvg(i, conversionPeriod);
            tenkan.push({ time, value: t });
        }
        if (i >= basePeriod - 1) {
            k = getHighLowAvg(i, basePeriod);
            kijun.push({ time, value: k });
        }
        
        if (t !== null && k !== null) {
            const sa = (t + k) / 2;
            spanA.push({ index: i + displacement, value: sa }); 
        }
        
        if (i >= spanPeriod - 1) {
            const sb = getHighLowAvg(i, spanPeriod);
            spanB.push({ index: i + displacement, value: sb });
        }
    }
    
    const finalSpanA = [];
    const finalSpanB = [];
    
    for (const item of spanA) {
        if (item.index < data.length) {
            finalSpanA.push({ time: data[item.index].time, value: item.value });
        }
    }
    for (const item of spanB) {
        if (item.index < data.length) {
            finalSpanB.push({ time: data[item.index].time, value: item.value });
        }
    }
    
    return { tenkan, kijun, spanA: finalSpanA, spanB: finalSpanB };
}

export function calculateAnchoredVWAP(data) {
    if (data.length === 0) return [];
    
    let maxVol = 0;
    let anchorIdx = 0;
    for(let i=0; i<data.length; i++) {
        if (data[i].volume > maxVol) {
            maxVol = data[i].volume;
            anchorIdx = i;
        }
    }
    
    const vwap = [];
    let cumVol = 0;
    let cumVolPrice = 0;
    
    for(let i = anchorIdx; i < data.length; i++) {
        const typicalPrice = (data[i].high + data[i].low + data[i].close) / 3;
        const vol = data[i].volume || 1;
        cumVol += vol;
        cumVolPrice += typicalPrice * vol;
        vwap.push({ time: data[i].time, value: cumVolPrice / cumVol });
    }
    return vwap;
}

export function calculateAutoFib(data) {
    if (data.length === 0) return null;
    let high = -Infinity;
    let low = Infinity;
    
    for (const d of data) {
        if (d.high > high) high = d.high;
        if (d.low < low) low = d.low;
    }
    
    const diff = high - low;
    return {
        levels: [
            { price: high, label: '0%' },
            { price: high - diff * 0.236, label: '23.6%' },
            { price: high - diff * 0.382, label: '38.2%' },
            { price: high - diff * 0.5, label: '50%' },
            { price: high - diff * 0.618, label: '61.8%' },
            { price: high - diff * 0.786, label: '78.6%' },
            { price: low, label: '100%' }
        ]
    };
}

export function calculateRSIDivergence(data, period = 14) {
    const rsiSeries = [];
    if (data.length < period + 1) return { rsi: [], markers: [] };
    
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i <= period; i++) {
        const diff = data[i].close - data[i-1].close;
        if (diff >= 0) gains += diff;
        else losses -= diff;
    }
    
    let avgGain = gains / period;
    let avgLoss = losses / period;
    
    for (let i = period + 1; i < data.length; i++) {
        const diff = data[i].close - data[i-1].close;
        let gain = diff >= 0 ? diff : 0;
        let loss = diff < 0 ? -diff : 0;
        
        avgGain = (avgGain * 13 + gain) / 14;
        avgLoss = (avgLoss * 13 + loss) / 14;
        
        let rs = avgGain / (avgLoss === 0 ? 1 : avgLoss);
        let rsi = 100 - (100 / (1 + rs));
        
        rsiSeries.push({ time: data[i].time, value: rsi });
    }
    
    return { rsi: rsiSeries, markers: [] };
}
