/**
 * Engine to track and compute Open Interest changes.
 * Now backed by SQLite via /api/v1/overrides path — replaces praxis_oi_base_* localStorage.
 * The "base OI" snapshot is saved once per trading day per instrument.
 */

const getTodayKey = () => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const istDate = new Date(utc + istOffset);

    let day = istDate.getDay();
    const hours = istDate.getHours();
    const minutes = istDate.getMinutes();

    // Shift date back if before 9:15 AM IST
    if (hours < 9 || (hours === 9 && minutes < 15)) istDate.setDate(istDate.getDate() - 1);
    day = istDate.getDay();
    if (day === 0) istDate.setDate(istDate.getDate() - 2); // Sunday -> Friday
    else if (day === 6) istDate.setDate(istDate.getDate() - 1); // Saturday -> Friday

    return istDate.toISOString().split('T')[0];
};

// In-memory snapshot cache — hydrated from SQLite on first access per instrument
const inMemorySnapshots = {};

/**
 * Saves the base OI snapshot for today if it doesn't already exist.
 * Writes to /api/v1/overrides using module_key='oi_base' + instrument_key + snapshot_date as field_key.
 */
export const saveDailyOISnapshot = async (instrumentKey, chainData) => {
    if (!instrumentKey || !chainData || chainData.length === 0) return;

    const today = getTodayKey();
    const memKey = `${instrumentKey}_${today}`;

    // Skip if already saved today (in-memory check first)
    if (inMemorySnapshots[memKey]) return;

    // Check SQLite via API
    try {
        const res = await fetch(`/api/v1/overrides/oi_base/${encodeURIComponent(instrumentKey)}`);
        const json = await res.json();
        if (json.status === 'success' && json.data?.[today]) {
            // Already exists in SQLite — populate in-memory cache and return
            try { inMemorySnapshots[memKey] = JSON.parse(json.data[today].value); } catch {}
            return;
        }
    } catch {}

    // Build the snapshot
    const baseSnapshot = {};
    chainData.forEach(row => {
        baseSnapshot[row.strike] = {
            call: (row.call?.oi || 0) - (row.call?.oiChg || 0),
            put:  (row.put?.oi  || 0) - (row.put?.oiChg  || 0)
        };
    });

    inMemorySnapshots[memKey] = baseSnapshot;

    // Persist to SQLite (fire and forget)
    fetch('/api/v1/overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            module_key: 'oi_base',
            instrument_key: instrumentKey,
            field_key: today,
            value: JSON.stringify(baseSnapshot)
        })
    }).catch(e => console.warn('[oiTrackerEngine] Failed to persist OI snapshot:', e.message));

    console.log(`Saved base OI snapshot for ${instrumentKey} on ${today}`);
};

/**
 * Computes the real-time OI Change based on the saved snapshot.
 * Reads from in-memory cache (populated by saveDailyOISnapshot).
 * Synchronous — returns 0 immediately if no base is loaded yet.
 */
export const computeLiveOiChange = (instrumentKey, strike, type, liveOi) => {
    if (liveOi === undefined || liveOi === null) return 0;

    const today = getTodayKey();
    const memKey = `${instrumentKey}_${today}`;
    const snapshot = inMemorySnapshots[memKey];

    if (!snapshot) return 0; // No baseline available yet

    const baseOi = snapshot[strike]?.[type] || 0;
    if (baseOi === 0) return liveOi; // New strike added mid-day
    return liveOi - baseOi;
};
