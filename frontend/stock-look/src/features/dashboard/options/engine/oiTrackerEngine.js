/**
 * Engine to track and compute Open Interest changes using localStorage.
 * Since WebSocket streams absolute live OI (and we might not have previous day closing OI), 
 * we use the first fetched chain of the day as the "Base OI" to calculate intraday changes against.
 */

const getTodayKey = () => {
    const now = new Date();
    // Convert to IST
    const istOffset = 5.5 * 60 * 60 * 1000; 
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const istDate = new Date(utc + istOffset);
    
    let day = istDate.getDay();
    let hours = istDate.getHours();
    let minutes = istDate.getMinutes();
    
    // Shift date back if before 9:15 AM
    if (hours < 9 || (hours === 9 && minutes < 15)) {
        istDate.setDate(istDate.getDate() - 1);
        day = istDate.getDay();
    }
    
    // If weekend, shift back to Friday
    if (day === 0) { // Sunday
        istDate.setDate(istDate.getDate() - 2);
    } else if (day === 6) { // Saturday
        istDate.setDate(istDate.getDate() - 1);
    }
    
    return istDate.toISOString().split('T')[0];
};

/**
 * Saves the base OI snapshot if it doesn't already exist for today.
 * @param {string} instrumentKey - The selected instrument (e.g., NIFTY)
 * @param {Array} chainData - The normalized options chain data from REST API
 */
export const saveDailyOISnapshot = (instrumentKey, chainData) => {
    if (!instrumentKey || !chainData || chainData.length === 0) return;
    
    const today = getTodayKey();
    const storageKey = `praxis_oi_base_${instrumentKey}_${today}`;
    
    // Do not overwrite existing baseline for the day
    if (localStorage.getItem(storageKey)) {
        return;
    }

    const baseSnapshot = {};

    chainData.forEach(row => {
        // Store the initial OI of the day based on true OI Change
        baseSnapshot[row.strike] = {
            call: (row.call?.oi || 0) - (row.call?.oiChg || 0),
            put: (row.put?.oi || 0) - (row.put?.oiChg || 0)
        };
    });

    try {
        localStorage.setItem(storageKey, JSON.stringify(baseSnapshot));
        console.log(`Saved base OI snapshot for ${instrumentKey} on ${today}`);
    } catch (e) {
        console.warn("Failed to save OI snapshot to localStorage:", e);
    }
};

/**
 * Computes the real-time OI Change based on the saved snapshot.
 * @param {string} instrumentKey - The selected instrument (e.g., NIFTY)
 * @param {number} strike - Option strike price
 * @param {string} type - 'call' or 'put'
 * @param {number} liveOi - The latest absolute OI from WebSocket or REST
 * @returns {number} The difference between live and base OI. Returns 0 if base is missing.
 */
export const computeLiveOiChange = (instrumentKey, strike, type, liveOi) => {
    if (liveOi === undefined || liveOi === null) return 0;
    
    const today = getTodayKey();
    const storageKey = `praxis_oi_base_${instrumentKey}_${today}`;
    
    const snapshotStr = localStorage.getItem(storageKey);
    if (!snapshotStr) return 0; // No baseline available

    try {
        const snapshot = JSON.parse(snapshotStr);
        const baseOi = snapshot[strike]?.[type] || 0;
        
        // If base is zero, we might assume the live OI IS the change (brand new strike). 
        // But for safety, if base is exactly 0, we can just return liveOi or 0. 
        // Returning liveOi makes sense if a new strike is added mid-day.
        if (baseOi === 0) return liveOi;

        return liveOi - baseOi;
    } catch (e) {
        return 0;
    }
};
