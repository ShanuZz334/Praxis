// ==========================================
// Centralized Socket.io Broadcasting Service
// ==========================================

let ioInstance = null;

export const initSocketBroadcaster = (io) => {
    ioInstance = io;
    console.log("Socket Broadcaster initialized");
};

/**
 * Standardized method to broadcast events to ALL clients.
 * @param {string} eventName - e.g. "market:update", "portfolio:update"
 * @param {any} data - The payload to send
 */
export const broadcast = (eventName, data) => {
    if (ioInstance) {
        ioInstance.emit(eventName, data);
    } else {
        console.warn(`Attempted to broadcast '${eventName}' but ioInstance is not set.`);
    }
};

/**
 * Standardized method to broadcast events to a specific ROOM (e.g. subscribed instruments).
 * @param {string} roomName - The Socket.io room name (usually the instrumentKey)
 * @param {string} eventName - The event name
 * @param {any} data - The payload to send
 */
export const broadcastToRoom = (roomName, eventName, data) => {
    if (ioInstance) {
        ioInstance.to(roomName).emit(eventName, data);
    }
};
