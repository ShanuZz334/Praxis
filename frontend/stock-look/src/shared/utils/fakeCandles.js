export function generate10MinCandles(startPrice, days = 5) {
    const candles = [];
    const candlesPerDay = 39; // 9:15–3:30
    let price = startPrice;

    for (let d = 0; d < days; d++) {
        for (let i = 0; i < candlesPerDay; i++) {
            const o = price;
            const c = o + (Math.random() - 0.5) * 40;
            const h = Math.max(o, c) + Math.random() * 15;
            const l = Math.min(o, c) - Math.random() * 15;

            candles.push({
                o: Math.round(o),
                h: Math.round(h),
                l: Math.round(l),
                c: Math.round(c),
            });

            price = c;
        }
    }

    return candles;
}
