async function run() {
    try {
        const payload = {
            instrumentKey: "NSE_EQ|INE238A01034",
            timeframe: "1m",
            horizonBars: 7,
            contextPayload: JSON.stringify({
                instrumentKey: "NSE_EQ|INE238A01034",
                timeframe: "1m",
                currentPrice: 1253.90,
                ohlcv: [
                    { time: 1788393600, open: 1250, high: 1260, low: 1240, close: 1253.90, volume: 1000000 }
                ]
            })
        };
        const res = await fetch("http://localhost:5000/api/v1/future-vision/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        console.log("SUCCESS:");
        console.log(JSON.stringify(data.candles, null, 2));
    } catch (e) {
        console.error("ERROR:", e.message);
    }
}
run();
