import axios from "axios";
import zlib from "zlib";

async function checkInstruments() {
    try {
        const response = await axios({
            method: "get",
            url: "https://assets.upstox.com/market-quote/instruments/exchange/NSE.json.gz",
            responseType: "arraybuffer",
        });

        const unzipped = zlib.gunzipSync(response.data);
        const jsonString = unzipped.toString("utf-8");
        const instrumentsMap = JSON.parse(jsonString);

        // check first 10 equity instruments
        let eqCount = 0;
        for (const key in instrumentsMap) {
            const data = instrumentsMap[key];
            if (data.segment === "NSE_EQ") {
                console.log(`Keys for ${data.name}:`, Object.keys(data));
                eqCount++;
                if (eqCount > 2) break;
            }
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
}
checkInstruments();
