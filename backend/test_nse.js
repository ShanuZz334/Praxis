import axios from 'axios';

async function testNSE() {
    try {
        const res = await axios.get('https://www.nseindia.com/api/market-status', {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json'
            }
        });
        console.log('NSE Result:', res.data);
    } catch(e) {
        console.error('NSE Error:', e.message);
    }
}
testNSE();
