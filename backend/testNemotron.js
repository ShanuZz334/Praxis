import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function testNemotron() {
    console.log("Testing OpenRouter 550B...");
    try {
        const start = Date.now();
        const res = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'nvidia/nemotron-3-ultra-550b-a55b:free',
            messages: [{ role: 'user', content: 'Say hello quickly' }]
        }, {
            headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}` },
            timeout: 30000 // 30s timeout
        });
        console.log("Success in", Date.now() - start, "ms:", res.data.choices[0].message.content);
    } catch (e) {
        console.log("Error:", e.message);
        if (e.response) console.log(e.response.data);
    }
    process.exit(0);
}
testNemotron();
