import UpstoxAuth from "../models/UpstoxAuth.js";

/**
 * Gets the active Upstox token for LIVE market data feeds, quotes, technicals, fundamentals, options, etc.
 * STRICTLY requires 'live' mode. Sandbox tokens do not support live market data feeds.
 */
export const getUpstoxLiveToken = async () => {
    const liveAuth = await UpstoxAuth.findOne({ mode: 'live' }).sort({ createdAt: -1 });
    if (liveAuth && liveAuth.accessToken) return liveAuth.accessToken;
    
    throw new Error("Upstox is not authenticated for live market data");
};

/**
 * Gets the auth record for the specified mode ('live' or 'sandbox')
 * Strictly adheres to the requested mode to prevent accidental sandbox bleeding.
 */
export const getUpstoxAuthForMode = async (mode = 'live') => {
    if (mode === 'sandbox') {
        const sandboxAuth = await UpstoxAuth.findOne({ mode: 'sandbox' }).sort({ createdAt: -1 });
        if (sandboxAuth && sandboxAuth.accessToken) return sandboxAuth;
        return null;
    }
    
    const liveAuth = await UpstoxAuth.findOne({ mode: 'live' }).sort({ createdAt: -1 });
    if (liveAuth && liveAuth.accessToken) return liveAuth;

    return null;
};

// Global execution mode state. Defaults to 'live'.
// Resets to 'live' when the server restarts (session ends).
// Only switches to 'sandbox' if the user explicitly triggers a sandbox login.
let currentExecutionMode = 'live';

export const setExecutionMode = (mode) => {
    currentExecutionMode = mode === 'sandbox' ? 'sandbox' : 'live';
    console.log(`[Upstox] Global execution mode set to: ${currentExecutionMode}`);
};

export const getExecutionMode = () => currentExecutionMode;
