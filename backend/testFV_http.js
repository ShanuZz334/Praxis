const http = require("http");

// Create a fake 25000 character string
const payload = "A".repeat(25000);

const data = JSON.stringify({
    contextPayload: payload,
    instrumentKey: "NSE_EQ|INE123",
    horizonBars: 7
});

const req = http.request({
    hostname: "localhost",
    port: 5000,
    path: "/api/v1/future-vision/predict",
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data)
    }
}, (res) => {
    let body = "";
    res.on("data", chunk => body += chunk);
    res.on("end", () => console.log(res.statusCode, body));
});
req.on("error", console.error);
req.write(data);
req.end();
