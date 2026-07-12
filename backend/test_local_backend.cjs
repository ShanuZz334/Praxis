const axios = require('axios');

axios.get('http://localhost:5000/api/v1/upstox/fundamentals?instrument_key=NSE_EQ%7CINE467B01029')
.then(r => {
    console.log(JSON.stringify(r.data.data, null, 2));
}).catch(e => {
    console.log(e.response ? e.response.data : e.message);
});
