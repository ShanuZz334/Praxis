import axios from 'axios';

async function test() {
    try {
        const url = 'https://www.alphavantage.co/query?function=OVERVIEW&symbol=RELIANCE.BSE&apikey=YUMH8IOUCAJD79W8';
        const res = await axios.get(url);
        console.log("Alpha Vantage Keys:", Object.keys(res.data));
        console.log("Alpha Vantage Name:", res.data.Name);
        console.log("Alpha Vantage Industry:", res.data.Industry);
        
        const faceKeys = Object.keys(res.data).filter(k => k.toLowerCase().includes('face') || k.toLowerCase().includes('par'));
        console.log("Face keys:", faceKeys);
    } catch (e) {
        console.error(e.message);
    }
}
test();
