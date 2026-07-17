import axios from 'axios';
import zlib from 'zlib';

const UPSTOX_INSTRUMENT_URL = "https://assets.upstox.com/market-quote/instruments/exchange/complete.json.gz";

async function run() {
    const response = await axios({ method: "get", url: UPSTOX_INSTRUMENT_URL, responseType: "arraybuffer" });
    const unzipped = zlib.gunzipSync(response.data);
    const instrumentsMap = JSON.parse(unzipped.toString("utf-8"));
    const keys = Object.keys(instrumentsMap);
    
    // Find Nifty 50
    const nifty = keys.find(k => instrumentsMap[k].name === 'Nifty 50');
    console.log('Nifty 50 data:', instrumentsMap[nifty]);
}
run();
