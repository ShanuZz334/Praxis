fetch('http://localhost:3000/api/v1/upstox/fundamentals?instrument_key=NSE_EQ|INE002A01018').then(r=>r.text()).then(console.log).catch(console.error);
