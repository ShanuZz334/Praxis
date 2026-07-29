import axios from 'axios';
import 'dotenv/config';

async function test() {
    const res = await axios.get(`https://api.stlouisfed.org/fred/series/observations?series_id=QINNAM770A&api_key=${process.env.FRED_API_KEY}&file_type=json&sort_order=desc&limit=1`);
    console.log(res.data.observations[0]);
}
test().catch(console.error);
