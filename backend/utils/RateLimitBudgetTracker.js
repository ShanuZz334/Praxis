/**
 * In-memory tracker for external API rate limits (e.g., Alpha Vantage free tier: 25/day, 5/min)
 */
class RateLimitBudgetTracker {
    constructor() {
        this.budgets = new Map();
    }

    /**
     * Initialize or reset budget for a specific source.
     */
    _initBudget(sourceId, limits) {
        if (!this.budgets.has(sourceId)) {
            this.budgets.set(sourceId, {
                requestsPerDay: limits.requestsPerDay,
                requestsPerMinute: limits.requestsPerMinute,
                dailyHits: 0,
                minuteHits: 0,
                lastResetDay: new Date().getDate(),
                lastResetMinute: new Date().getMinutes(),
            });
        }
        return this.budgets.get(sourceId);
    }

    /**
     * Check if a request can proceed and consume 1 quota if allowed.
     * @param {string} sourceId - e.g., 'Alpha Vantage'
     * @param {Object} limits - { requestsPerDay, requestsPerMinute }
     * @returns {boolean} True if allowed, False if budget exhausted
     */
    consume(sourceId, limits) {
        if (!limits || (!limits.requestsPerDay && !limits.requestsPerMinute)) {
            return true; // No limits
        }

        const budget = this._initBudget(sourceId, limits);
        const now = new Date();

        // Reset daily budget
        if (budget.lastResetDay !== now.getDate()) {
            budget.dailyHits = 0;
            budget.lastResetDay = now.getDate();
        }

        // Reset minute budget
        if (budget.lastResetMinute !== now.getMinutes()) {
            budget.minuteHits = 0;
            budget.lastResetMinute = now.getMinutes();
        }

        // Check if limits exceeded
        if (limits.requestsPerDay && budget.dailyHits >= limits.requestsPerDay) {
            console.warn(`[RATE LIMIT] Daily budget exhausted for ${sourceId}`);
            return false;
        }

        if (limits.requestsPerMinute && budget.minuteHits >= limits.requestsPerMinute) {
            console.warn(`[RATE LIMIT] Minute budget exhausted for ${sourceId}`);
            return false;
        }

        // Consume quota
        budget.dailyHits++;
        budget.minuteHits++;
        return true;
    }

    /**
     * Get current status for health checks.
     */
    getStatus(sourceId) {
        return this.budgets.get(sourceId) || null;
    }
}

export default new RateLimitBudgetTracker();
