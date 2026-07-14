import { io } from "socket.io-client";

console.log("Connecting to local backend...");
const socket = io("http://localhost:5000", { transports: ["websocket"] });

socket.on("connect", () => {
    console.log("Connected to backend socket.io");
    socket.emit("subscribe:instruments", { keys: ["NSE_INDEX|Nifty 50", "NSE_INDEX|Nifty Bank", "NSE_EQ|RELIANCE"], mode: "full" });
});

socket.on("market:update", (data) => {
    console.log("Received update:", data.instrumentKey, data.data.ltp);
});

socket.on("connect_error", (err) => {
    console.error("Connection error:", err);
});

setTimeout(() => {
    console.log("Timeout 10s");
    process.exit(0);
}, 10000);
