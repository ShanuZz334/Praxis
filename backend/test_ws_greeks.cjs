const io = require("socket.io-client");
const socket = io("http://localhost:5000");

socket.on("connect", () => {
    console.log("Connected to backend via Socket.io");
    
    // Fetch some recent options keys first
    const axios = require("axios");
    axios.get("http://localhost:3001/api/v1/upstox/option-chain?instrument_key=NSE_INDEX%7CNifty%2050")
    .then(res => {
        let chainArray = res.data.data || res.data || [];
        let keysToFetch = [];
        for (let i = 0; i < chainArray.length && keysToFetch.length < 2; i++) {
            if (chainArray[i].call_options?.instrument_key) keysToFetch.push(chainArray[i].call_options.instrument_key);
        }
        
        console.log("Subscribing to option_greeks for", keysToFetch);
        socket.emit("subscribe:instruments", { keys: keysToFetch, mode: "option_greeks" });
        
        console.log("Also subscribing to full mode for", keysToFetch);
        socket.emit("subscribe:instruments", { keys: keysToFetch, mode: "full" });
    }).catch(err => {
        console.log("Failed to get chain", err.message);
        process.exit(1);
    });
});

let msgCount = 0;
socket.on("market:update", (data) => {
    msgCount++;
    console.log("Received market:update", JSON.stringify(data));
    if (data.data && data.data.optionGreeks) {
        console.log("SUCCESS! Got Option Greeks:", data.data.optionGreeks);
        process.exit(0);
    }
    if (msgCount > 10) {
        console.log("Received 10 messages but no Greeks found.");
        process.exit(1);
    }
});

setTimeout(() => {
    console.log("Timeout. No Greeks received.");
    process.exit(1);
}, 10000);
