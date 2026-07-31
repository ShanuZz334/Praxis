/**
 * @file journalScoringEngine.js
 * @purpose Institutional-grade, pure math engine for computing all Journal KPIs.
 * @architecture Pure JS — no React, no side effects, importable by both frontend and backend.
 *
 * METRIC DEFINITIONS (Hedge Fund / Prop Firm Standard):
 *
 * 1. NET P&L (YTD)   = Σ(realized PnL for all trades in the year)
 * 2. WIN RATE        = Winning Days / Total Trading Days (day-level, not trade-level)
 * 3. PROFIT FACTOR   = Σ(GrossProfit) / Σ(|GrossLoss|) — a PF > 2.0 is institutional-grade
 * 4. EXPECTANCY (R)  = (Win Rate × Avg Win) − (Loss Rate × Avg Loss)
 *                      This is the TRUE expectancy per trade in currency units.
 *                      An institutional trader targets E > 0 with E/AvgLoss > 0.5R
 * 5. BEST DAY        = max(daily PnL)
 * 6. ACTIVE DAYS     = count of days where trades_count > 0
 */

/**
 * Computes all 6 institutional header KPIs from a sorted array of trading day records.
 *
 * @param {Array<{date: string, pnl: number, tradesCount: number}>} sortedDays
 *        Array of trading days sorted ascending by date. Only include days with actual trades
 *        (state = 'profit' | 'loss'). Days with state 'no-trade', 'holiday', 'weekend' excluded.
 * @returns {Object} All computed metrics plus chart series arrays.
 */
export function computeJournalStats(sortedDays) {
    if (!sortedDays || sortedDays.length === 0) {
        return buildEmptyStats();
    }

    // --- Accumulators ---
    let netPnl = 0;
    let grossProfit = 0;
    let grossLoss = 0;
    let winDays = 0;
    let lossDays = 0;
    let totalTradingDays = 0;
    let bestDayPnl = -Infinity;
    let worstDayPnl = Infinity;
    let totalActiveTrades = 0;

    // Streak tracking
    let currentStreak = 0;
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    let streakType = null; // 'win' | 'loss'

    // Chart series (running values per day)
    const pnlCurve = [];        // Cumulative P&L equity curve
    const winRateCurve = [];    // Rolling win rate %
    const pfCurve = [];         // Rolling profit factor
    const expectancyCurve = []; // Rolling expectancy per trade
    const bestDayCurve = [];    // Daily PnL (bar chart for context)
    const activeDayCurve = [];  // Trades per day (bar chart)

    sortedDays.forEach((day) => {
        const pnl = day.pnl ?? 0;
        const trades = day.tradesCount ?? 1; // At least 1 if the day is in our list

        totalTradingDays++;
        netPnl += pnl;
        totalActiveTrades += trades;

        if (pnl > 0) {
            winDays++;
            grossProfit += pnl;
            if (pnl > bestDayPnl) bestDayPnl = pnl;

            // Streak
            if (streakType === 'win') {
                currentStreak++;
            } else {
                currentStreak = 1;
                streakType = 'win';
            }
            if (currentStreak > maxWinStreak) maxWinStreak = currentStreak;
        } else {
            lossDays++;
            grossLoss += Math.abs(pnl);
            if (pnl < worstDayPnl) worstDayPnl = pnl;

            // Streak
            if (streakType === 'loss') {
                currentStreak++;
            } else {
                currentStreak = 1;
                streakType = 'loss';
            }
            if (currentStreak > maxLossStreak) maxLossStreak = currentStreak;
        }

        // --- Chart data points (running metrics after each day) ---
        const runningWinRate = winDays / totalTradingDays;
        const runningLossRate = lossDays / totalTradingDays;
        const avgWin = winDays > 0 ? grossProfit / winDays : 0;
        const avgLoss = lossDays > 0 ? grossLoss / lossDays : 0;

        // Expectancy = (WinRate × AvgWin) - (LossRate × AvgLoss)
        const expectancy = (runningWinRate * avgWin) - (runningLossRate * avgLoss);

        // Profit Factor — guard against division by zero
        const pf = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? 99 : 0);

        pnlCurve.push({ value: parseFloat(netPnl.toFixed(2)) });
        winRateCurve.push({ value: parseFloat((runningWinRate * 100).toFixed(2)) });
        pfCurve.push({ value: parseFloat(pf.toFixed(4)) });
        expectancyCurve.push({ value: parseFloat(expectancy.toFixed(2)) });
        bestDayCurve.push({ value: parseFloat(pnl.toFixed(2)) });
        activeDayCurve.push({ value: trades });
    });

    // --- Final scalar metrics ---
    const winRate = totalTradingDays > 0 ? (winDays / totalTradingDays * 100) : 0;
    const lossRate = 100 - winRate;
    const avgWin = winDays > 0 ? grossProfit / winDays : 0;
    const avgLoss = lossDays > 0 ? grossLoss / lossDays : 0;

    // Institutional Expectancy (per trade in ₹)
    const expectancy = (winRate / 100 * avgWin) - (lossRate / 100 * avgLoss);

    // Profit Factor
    const profitFactor = grossLoss > 0
        ? grossProfit / grossLoss
        : grossProfit > 0 ? Infinity : 0;

    // Reward/Risk Ratio (average win / average loss)
    const rrRatio = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? Infinity : 0;

    return {
        // Scalar KPIs
        netPnl: parseFloat(netPnl.toFixed(2)),
        winRate: parseFloat(winRate.toFixed(2)),
        winDays,
        lossDays,
        totalTradingDays,
        grossProfit: parseFloat(grossProfit.toFixed(2)),
        grossLoss: parseFloat(grossLoss.toFixed(2)),
        profitFactor: parseFloat(profitFactor === Infinity ? 99 : profitFactor.toFixed(4)),
        expectancy: parseFloat(expectancy.toFixed(2)),
        avgWin: parseFloat(avgWin.toFixed(2)),
        avgLoss: parseFloat(avgLoss.toFixed(2)),
        rrRatio: parseFloat(rrRatio === Infinity ? 99 : rrRatio.toFixed(2)),
        bestDayPnl: bestDayPnl === -Infinity ? 0 : parseFloat(bestDayPnl.toFixed(2)),
        worstDayPnl: worstDayPnl === Infinity ? 0 : parseFloat(worstDayPnl.toFixed(2)),
        activeDays: totalTradingDays,
        totalTrades: totalActiveTrades,
        maxWinStreak,
        maxLossStreak,

        // Chart series
        charts: {
            pnlCurve,
            winRateCurve,
            pfCurve,
            expectancyCurve,
            bestDayCurve,
            activeDayCurve,
        },
    };
}

/**
 * Returns a clean zero-state object when there is no data.
 * Returns nice wavy dummy data for charts to maintain aesthetics.
 */
function buildEmptyStats() {
    const dummyArea = [
        { value: 10 }, { value: 15 }, { value: 12 }, { value: 22 },
        { value: 18 }, { value: 28 }, { value: 24 }, { value: 35 },
        { value: 30 }, { value: 45 }, { value: 40 }, { value: 55 }
    ];
    const dummyBar = [
        { value: 2 }, { value: 4 }, { value: 3 }, { value: 6 },
        { value: 2 }, { value: 7 }, { value: 4 }, { value: 9 },
        { value: 3 }, { value: 8 }, { value: 5 }, { value: 10 }
    ];

    return {
        netPnl: 0,
        winRate: 0,
        winDays: 0,
        lossDays: 0,
        totalTradingDays: 0,
        grossProfit: 0,
        grossLoss: 0,
        profitFactor: 0,
        expectancy: 0,
        avgWin: 0,
        avgLoss: 0,
        rrRatio: 0,
        bestDayPnl: 0,
        worstDayPnl: 0,
        activeDays: 0,
        totalTrades: 0,
        maxWinStreak: 0,
        maxLossStreak: 0,
        charts: {
            pnlCurve: dummyArea,
            winRateCurve: dummyArea,
            pfCurve: dummyArea,
            expectancyCurve: dummyArea,
            bestDayCurve: dummyArea,
            activeDayCurve: dummyBar,
        },
    };
}
