import axios from 'axios';
import zlib from 'zlib';

const UPSTOX_INSTRUMENT_URL = "https://assets.upstox.com/market-quote/instruments/exchange/complete.json.gz";

async function checkMissing() {
    const response = await axios({ method: "get", url: UPSTOX_INSTRUMENT_URL, responseType: "arraybuffer" });
    const unzipped = zlib.gunzipSync(response.data);
    const instrumentsMap = JSON.parse(unzipped.toString("utf-8"));
    const keys = Object.keys(instrumentsMap);
    
    console.log("LTIM matches:", keys.filter(k => instrumentsMap[k].segment === 'NSE_EQ' && instrumentsMap[k].name && instrumentsMap[k].name.includes('LTIMINDTREE')).map(k => instrumentsMap[k].trading_symbol));
}
checkMissing();
