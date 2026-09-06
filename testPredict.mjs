import axios from "axios";

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
        const res = await axios.post("http://localhost:5000/api/v1/future-vision/predict", payload);
        console.log("SUCCESS:");
        console.log(JSON.stringify(res.data.candles, null, 2));
    } catch (e) {
        console.error("ERROR:", e.response?.data || e.message);
    }
}
run();
