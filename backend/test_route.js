import axios from 'axios';

async function testRoute() {
    try {
        console.log("Sending POST to http://localhost:5000/api/v1/intelligence/card-insight...");
        const res = await axios.post('http://localhost:5000/api/v1/intelligence/card-insight', {
            metric: "PE Ratio",
            value: 25.4,
            stockSymbol: "RELIANCE",
            module: "Fundamentals"
        });
        console.log("SUCCESS:", res.data);
    } catch (error) {
        console.error("ERROR:", error.response ? error.response.data : error.message);
    }
}

testRoute();
