const mongoose = require('mongoose');
const WebSocket = require('ws');
const protobuf = require('protobufjs');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: '.env' });

async function test() {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.useDb('praxis');
    const auths = await db.collection('upstoxauths').find().sort({createdAt: -1}).toArray();
    if (!auths || auths.length === 0) {
        console.log("No auth token");
        process.exit(1);
    }
    const token = auths[0].accessToken;

    const root = await protobuf.load(path.join(__dirname, "config", "MarketDataFeedV3.proto"));
    const FeedResponse = root.lookupType("com.upstox.marketdatafeederv3udapi.rpc.proto.FeedResponse");

    const apiUrl = "https://api.upstox.com/v3/feed/market-data-feed/authorize";
    const authHeaders = { "Accept": "application/json", "Authorization": `Bearer ${token}` };
    const response = await axios.get(apiUrl, { headers: authHeaders });
    const wsUrl = response.data.data.authorized_redirect_uri;

    console.log("Connecting to WS...");
    const upstoxWs = new WebSocket(wsUrl, {
        headers: { "Api-Version": "2.0", "Authorization": `Bearer ${token}` },
        followRedirects: true
    });

    upstoxWs.on("open", async () => {
        console.log("Connected!");
        
        let keys = ["NSE_FO|39385", "NSE_FO|39386", "NSE_FO|55468"]; // Random Nifty options

        console.log("Subscribing to option_greeks for", keys);
        const request = {
            guid: "test_" + Date.now(),
            method: "sub",
            data: { mode: "option_greeks", instrumentKeys: keys }
        };
        upstoxWs.send(Buffer.from(JSON.stringify(request)));
    });

    let msgCount = 0;
    upstoxWs.on("message", (data) => {
        const decodedMessage = FeedResponse.decode(data);
        const decoded = FeedResponse.toObject(decodedMessage, { longs: String, enums: String, bytes: String });
        
        if (decoded.type === "live_feed" || decoded.type === "snapshot") {
            console.log(JSON.stringify(decoded, null, 2));
            msgCount++;
            if (msgCount >= 3) {
                console.log("Got enough messages. Exiting.");
                process.exit(0);
            }
        }
    });

    setTimeout(() => {
        console.log("Timeout.");
        process.exit(1);
    }, 10000);
}
test();
