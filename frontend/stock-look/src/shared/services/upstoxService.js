import axios from "axios";
import { io } from "socket.io-client";

const API_URL = "http://localhost:5000/api/v1/upstox";
const SOCKET_URL = "http://localhost:5000";

let socket = null;

export const upstoxService = {
    // Check if connected
    checkStatus: async () => {
        try {
            const response = await axios.get(`${API_URL}/status`);
            return response.data;
        } catch (error) {
            console.error("Upstox status check failed:", error);
            return { connected: false };
        }
    },

    // Trigger OAuth Login
    login: () => {
        window.location.href = `${API_URL}/login`;
    },

    // Connect to Socket.io for Realtime data
    connectLiveFeed: (onDataReceived) => {
        if (!socket) {
            socket = io(SOCKET_URL);
            
            socket.on("connect", () => {
                console.log("🟢 Connected to Praxis Realtime Feed");
            });

            socket.on("disconnect", () => {
                console.log("🔴 Disconnected from Praxis Realtime Feed");
            });
        }

        socket.on("upstox-market-data", (data) => {
            if (onDataReceived) onDataReceived(data);
        });

        return socket;
    },

    // Disconnect socket
    disconnectLiveFeed: () => {
        if (socket) {
            socket.disconnect();
            socket = null;
        }
    }
};
