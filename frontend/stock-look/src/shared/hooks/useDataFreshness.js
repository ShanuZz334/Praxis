import { useMemo } from 'react';

/**
 * Universal Sync Timer & Freshness Resolver
 * Decouples the UI timers from deep data diffs.
 * - AUTO: Displays clean intervals (e.g., 'Realtime (1s)').
 * - MANUAL: Displays the precise timestamp the user last edited the value.
 */
export function useDataFreshness(liveData, manualOverrides, manualOverrideTimes, isMarketOpen, formatTime, fetchFrequency = "1s") {
    
    const resolveTime = useMemo(() => (hasData, overrideKey) => {
        // 1. Check if the card is actively using a manual override
        const isManual = overrideKey && manualOverrides && manualOverrides[overrideKey] !== undefined && manualOverrides[overrideKey] !== null;
        
        if (isManual) {
            const manualTs = manualOverrideTimes && manualOverrideTimes[overrideKey];
            if (manualTs) {
                // Handle legacy string timestamps
                if (typeof manualTs === 'string' && manualTs.includes(':') && !manualTs.includes('T')) {
                    return `Manual Sync (${manualTs})`;
                }
                const parsedTs = typeof manualTs === 'string' ? new Date(manualTs).getTime() : manualTs;
                return `Manual Sync (${formatTime(parsedTs)})`;
            }
            return "Manual Sync";
        }

        // 2. If data is genuinely missing and no override exists
        if (!hasData) return null;

        // 3. AUTO Mode: Clean intervals based on Market Status
        if (typeof isMarketOpen === 'function' && isMarketOpen()) {
            return `Realtime (${fetchFrequency})`;
        }

        return `Offline Sync`;

    }, [manualOverrides, manualOverrideTimes, isMarketOpen, fetchFrequency, formatTime]);

    return resolveTime;
}
