import axios from 'axios';

async function test() {
    try {
        const url = 'https://www.alphavantage.co/query?function=OVERVIEW&symbol=TCS.BSE&apikey=YUMH8IOUCAJD79W8';
        const res = await axios.get(url);
        console.log("Alpha Vantage Keys:", Object.keys(res.data));
        console.log("Alpha Vantage BookValue:", res.data.BookValue);
        // Is Face Value there? 
        const faceKeys = Object.keys(res.data).filter(k => k.toLowerCase().includes('face'));
        console.log("Face keys:", faceKeys);
    } catch (e) {
        console.error(e);
    }
}
test();
