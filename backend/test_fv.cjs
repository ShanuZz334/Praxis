const axios = require("axios");

async function run() {
    try {
        const res = await axios.post("http://127.0.0.1:5000/api/v1/future-vision/predict", {
            instrumentKey: "NSE_EQ|INE002A01018",
            horizonBars: 7,
            contextPayload: "Test context"
        });
        console.log("SUCCESS:", res.data);
    } catch(e) {
        console.log("ERROR:", e.response ? e.response.data : e.message);
    }
}
run();
