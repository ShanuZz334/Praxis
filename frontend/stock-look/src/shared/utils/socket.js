import { io } from "socket.io-client";
import { BASE_URL } from "./apiPaths";

const socket = io(BASE_URL, {
    autoConnect: true,
    reconnection: true,
    transports: ["websocket", "polling"]
});

socket.on("connect", () => {
    console.log("[Socket] Connected to Praxis Backend Socket:", socket.id);
});

socket.on("disconnect", () => {
    console.log("[Socket] Disconnected from Praxis Backend Socket");
});

export default socket;
