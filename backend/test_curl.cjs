const axios = require('axios');
axios.get('http://localhost:5000/api/v1/upstox/fundamentals?instrument_key=NSE_INDEX%7CNifty%20Bank')
  .then(res => console.log('STATUS:', res.status, 'DATA:', res.data))
  .catch(err => console.log('ERROR STATUS:', err.response?.status, 'DATA:', err.response?.data));
