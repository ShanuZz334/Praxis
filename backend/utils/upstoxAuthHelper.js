import UpstoxAuth from "../models/UpstoxAuth.js";

/**
 * Gets the active Upstox token for LIVE market data feeds, quotes, technicals, fundamentals, options, etc.
 * Always prioritizes 'live' tokens so that connecting sandbox for order simulation doesn't break market feeds.
 */
export const getUpstoxLiveToken = async () => {
    // 1. Look specifically for live token first
    const liveAuth = await UpstoxAuth.findOne({ mode: 'live' }).sort({ createdAt: -1 });
    if (liveAuth && liveAuth.accessToken) return liveAuth.accessToken;
    
    // 2. Fallback to any latest token
    const anyAuth = await UpstoxAuth.findOne().sort({ createdAt: -1 });
    if (anyAuth && anyAuth.accessToken) return anyAuth.accessToken;

    throw new Error("Upstox is not authenticated for live market data");
};

/**
 * Gets the auth record for the specified mode ('live' or 'sandbox')
 */
export const getUpstoxAuthForMode = async (mode = 'live') => {
    if (mode === 'sandbox') {
        const sandboxAuth = await UpstoxAuth.findOne({ mode: 'sandbox' }).sort({ createdAt: -1 });
        if (sandboxAuth && sandboxAuth.accessToken) return sandboxAuth;
    }
    
    const liveAuth = await UpstoxAuth.findOne({ mode: 'live' }).sort({ createdAt: -1 });
    if (liveAuth && liveAuth.accessToken) return liveAuth;

    return await UpstoxAuth.findOne().sort({ createdAt: -1 });
};
