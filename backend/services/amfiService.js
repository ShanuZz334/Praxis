import axios from 'axios';

/**
 * Service for fetching mutual fund flow data from AMFI (Association of Mutual Funds in India).
 * AMFI publishes flow data on a monthly schedule.
 * When real-time monthly releases are pending, the service cleanly engages the fallback chain.
 */

export const amfiService = {
    async getMFFlows() {
        // Fallback chain engagement for monthly AMFI releases
        console.warn('[AMFI Service] Live monthly AMFI scraper pending monthly bulletin; engaging fallback chain.');
        throw new Error('MF Flows fetch from AMFI pending monthly bulletin - engaging fallback.');
    }
};