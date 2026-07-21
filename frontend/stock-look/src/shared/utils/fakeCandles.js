export function generateFakeCandles(count = 100, basePrice = 1000) {
    const candles = [];
    let time = Math.floor(Date.now() / 1000) - (count * 86400); // start `count` days ago
    let open = basePrice;
    
    for (let i = 0; i < count; i++) {
        const volatility = basePrice * 0.02; // 2% daily volatility
        const drift = basePrice * 0.001; // slight upward drift
        const close = open + drift + (Math.random() - 0.5) * volatility;
        const maxPrice = Math.max(open, close);
        const minPrice = Math.min(open, close);
        const high = maxPrice + Math.random() * (volatility / 2);
        const low = minPrice - Math.random() * (volatility / 2);
        
        candles.push({
            time: time,
            open: parseFloat(open.toFixed(2)),
            high: parseFloat(high.toFixed(2)),
            low: parseFloat(low.toFixed(2)),
            close: parseFloat(close.toFixed(2))
        });
        
        open = close;
        time += 86400; // Next day
    }
    
    return candles;
}
