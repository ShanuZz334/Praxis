import { nseDataService } from './services/nseDataService.js';
import axios from 'axios';

// Mock nseDataService internals to just call the API
const NSE_BASE_URL = 'https://www.nseindia.com';
const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.nseindia.com/'
};

async function test() {
    try {
        let nseCookies = '';
        const res1 = await axios.get(NSE_BASE_URL, { headers, timeout: 5000 });
        nseCookies = res1.headers['set-cookie'] ? res1.headers['set-cookie'].join('; ') : '';
        
        const url = `${NSE_BASE_URL}/api/quote-equity?symbol=TCS`;
        const res2 = await axios.get(url, {
            headers: { ...headers, 'Cookie': nseCookies },
            timeout: 8000
        });
        
        console.log("NSE quote equity keys:", Object.keys(res2.data));
        if (res2.data.securityInfo) {
            console.log("securityInfo:", res2.data.securityInfo);
        }
    } catch(e) {
        console.error("error:", e.message);
    }
}
test();
