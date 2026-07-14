import { io } from "socket.io-client";

const socket = io("http://localhost:5000", { transports: ["websocket"] });

socket.on("connect", () => {
    console.log("Connected to backend socket.io");
    socket.emit("subscribe:instruments", { keys: ["NSE_INDEX|Nifty 50", "NSE_INDEX|Nifty Bank"], mode: "full" });
});

socket.on("market:update", (data) => {
    console.log("Received update:", data);
});

setTimeout(() => {
    console.log("Timeout");
    process.exit(0);
}, 5000);
