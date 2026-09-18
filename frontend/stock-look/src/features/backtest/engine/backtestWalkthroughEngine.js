/**
 * @file backtestWalkthroughEngine.js
 * @purpose Pure JS deterministic quantitative diagnosis & walk-through engine.
 *          Analyzes complete scorecard telemetry and test configs to produce
 *          an institutional-grade strategic assessment (Edge, Leaks, Style, Risk, Prescriptions).
 */

/**
 * Calculates recovery return needed to break even from a peak-to-trough drawdown.
 */
export function calculateDrawdownRecoveryPct(drawdownPct) {
    const dd = Math.abs(drawdownPct || 0);
    if (dd >= 100) return 9999;
    if (dd <= 0) return 0;
    const factor = (1 / (1 - dd / 100)) - 1;
    return Math.round(factor * 100 * 10) / 10;
}

/**
 * Calculates theoretical break-even win rate given a realized Risk-Reward ratio.
 * Formula: WR_be = 1 / (1 + RR)
 */
export function calculateBreakEvenWinRate(realizedRR) {
    const rr = Math.max(0.01, realizedRR || 1);
    const be = (1 / (1 + rr)) * 100;
    return Math.round(be * 10) / 10;
}

/**
 * Evaluates the trading style suitability of the configuration & duration.
 */
export function evaluateStyleSuitability(summary = {}, config = {}) {
    const duration = summary.avgBarsHeld || summary.avgTradeDurationCandles || 0;
    const tf = (config.timeframe || '1d').toLowerCase();
    const mode = (config.mode || 'SWING').toUpperCase();
    const pf = summary.profitFactor || 0;
    const netRet = summary.netReturnPct || 0;
    const exp = summary.expectancy || 0;

    let detectedStyle = 'Swing Trading';
    let holdMetric = `${duration} Bars`;
    let holdHorizon = '';

    if (tf.includes('1m') || tf.includes('3m') || tf.includes('5m')) {
        const mins = duration * (parseInt(tf) || 5);
        if (duration <= 6) {
            detectedStyle = 'Ultra-Fast Scalping';
            holdMetric = `${duration} Bars (${tf.toUpperCase()})`;
            holdHorizon = `~${mins}m average holding period`;
        } else {
            detectedStyle = 'Intraday Day Trading';
            holdMetric = `${duration} Bars (${tf.toUpperCase()})`;
            holdHorizon = `Within-session day trade hold`;
        }
    } else if (tf.includes('15m') || tf.includes('30m') || tf.includes('1h')) {
        detectedStyle = duration <= 12 ? 'Short-Horizon Swing' : 'Multi-Day Swing';
        holdMetric = `${duration} Bars (${tf.toUpperCase()})`;
        holdHorizon = `${duration <= 12 ? 'Intra-week' : 'Multi-day'} holding horizon`;
    } else {
        // Daily / Weekly
        if (duration <= 5) {
            detectedStyle = 'Short Swing (Multi-Day)';
            holdMetric = `${duration} Daily Bars`;
            holdHorizon = `~1 trading week horizon`;
        } else if (duration <= 25) {
            detectedStyle = 'Medium Swing (Multi-Week)';
            holdMetric = `${duration} Daily Bars`;
            const weeks = Math.max(1, Math.round(duration / 5));
            holdHorizon = `~${weeks} ${weeks === 1 ? 'week' : 'weeks'} horizon`;
        } else {
            detectedStyle = 'Positional Trend Following';
            holdMetric = `${duration} Daily Bars`;
            holdHorizon = `Multi-month trend hold`;
        }
    }

    const styleDescription = holdHorizon ? `${holdMetric} • ${holdHorizon}` : holdMetric;

    let viabilityStatus = 'TOXIC';
    let viabilityVerdict = '';
    let viabilityColor = 'rose';

    if (pf >= 1.6 && exp > 0.5 && summary.maxDrawdownPct < 25) {
        viabilityStatus = 'HIGHLY_SUITABLE';
        viabilityVerdict = `Excellent vehicle for ${detectedStyle}. The statistical edge is robust with controlled variance.`;
        viabilityColor = 'emerald';
    } else if (pf >= 1.15 && exp > 0 && summary.maxDrawdownPct < 40) {
        viabilityStatus = 'MODERATELY_SUITABLE';
        viabilityVerdict = `Viable for ${detectedStyle} with positive expectancy, though drawdown volatility requires strict capital caps.`;
        viabilityColor = 'blue';
    } else if (pf >= 0.95 && pf < 1.15) {
        viabilityStatus = 'MARGINAL_BLEED';
        viabilityVerdict = `Barely breaking even in ${detectedStyle}. Slippage, exchange friction, or market chop will erode real-world equity.`;
        viabilityColor = 'amber';
    } else {
        viabilityStatus = 'TOXIC';
        viabilityVerdict = `Severely unviable for ${detectedStyle}. The setup experiences systemic capital bleed (${netRet}% Net) and cannot be traded live in this configuration.`;
        viabilityColor = 'rose';
    }

    return {
        detectedStyle,
        styleDescription,
        holdMetric,
        holdHorizon,
        avgDurationBars: duration,
        configuredMode: mode,
        viabilityStatus,
        viabilityVerdict,
        viabilityColor
    };
}

/**
 * Computes the primary Executive Verdict and Health Grade.
 */
export function computeExecutiveVerdict(summary = {}, config = {}) {
    const pf = summary.profitFactor ?? 0;
    const wr = summary.winRate ?? 0;
    const dd = Math.abs(summary.maxDrawdownPct ?? 0);
    const exp = summary.expectancy ?? 0;
    const netRet = summary.netReturnPct ?? 0;
    const tradesCount = summary.totalTrades ?? 0;

    let grade = 'CRITICAL_LEAK';
    let badgeText = 'CRITICAL LEAK — UNVIABLE FOR LIVE';
    let headline = 'Fatal Negative Expectancy Drain';
    let color = 'rose';
    let summaryText = '';

    if (tradesCount < 20) {
        grade = 'INSUFFICIENT_DATA';
        badgeText = 'INSUFFICIENT SAMPLE SIZE';
        headline = 'Sample Size Too Small for Statistical Significance';
        color = 'amber';
        summaryText = `Only ${tradesCount} trades simulated. Quantitative models require at least 30-50 trades across diverse market regimes before drawing conclusions.`;
    } else if (dd >= 65 || pf < 0.85 || exp <= -0.2) {
        grade = 'CRITICAL_LEAK';
        badgeText = 'CRITICAL CAPITAL BLEED';
        headline = `Catastrophic Drawdown (-${dd}%) & Negative Edge`;
        color = 'rose';
        summaryText = `This strategy currently has a negative mathematical expectancy of ${exp >= 0 ? '+' : ''}${exp}% per trade. Over ${tradesCount} executions, capital decayed by ${netRet}%. Live execution would result in rapid account destruction.`;
    } else if (pf < 1.05 || netRet <= 0) {
        grade = 'UNVIABLE';
        badgeText = 'UNVIABLE (SUB-BREAKEVEN)';
        headline = 'Net Negative Return After Market Friction';
        color = 'rose';
        summaryText = `With a Profit Factor of ${pf} and Win Rate of ${wr}%, gross gains are completely cancelled out by losses. Even minor execution slippage will compound losses.`;
    } else if (pf < 1.35 || dd >= 35) {
        grade = 'MARGINAL_EDGE';
        badgeText = 'MARGINAL EDGE — HIGH VOLATILITY';
        headline = 'Positive Returns Subject to Heavy Drawdowns';
        color = 'amber';
        summaryText = `The system produces net gains (${netRet}%), but an uncomfortable drawdown of -${dd}% exposes the account to significant tail risk. Requires tighter risk filters.`;
    } else if (pf < 1.8) {
        grade = 'ROBUST_EDGE';
        badgeText = 'ROBUST STATISTICAL EDGE';
        headline = 'Solid Risk-Reward & Consistent Growth';
        color = 'emerald';
        summaryText = `Profit Factor of ${pf} and healthy Sharpe ratio demonstrate a reliable edge across market cycles. Ready for paper testing or small pilot sizing.`;
    } else {
        grade = 'INSTITUTIONAL_GRADE';
        badgeText = 'INSTITUTIONAL GRADE EDGE';
        headline = 'Elite Quantitative Performance';
        color = 'emerald';
        summaryText = `Exceptional edge (PF: ${pf}, Expectancy: +${exp}%, DD: -${dd}%). Sizing can be scaled according to fractional Kelly recommendations.`;
    }

    return {
        grade,
        badgeText,
        headline,
        color,
        summaryText
    };
}

/**
 * Diagnoses the specific mathematical leaks and friction points.
 */
export function diagnoseMathematicalLeaks(summary = {}, config = {}, trades = []) {
    const wr = summary.winRate ?? 0;
    const rr = summary.realizedRR ?? 1;
    const exp = summary.expectancy ?? 0;
    const breakEvenWr = calculateBreakEvenWinRate(rr);
    const wrDeficit = Math.round((breakEvenWr - wr) * 10) / 10;
    const maxConsecLosses = summary.maxConsecutiveLosses ?? 0;
    const duration = summary.avgBarsHeld || summary.avgTradeDurationCandles || 0;

    const leaks = [];

    // Leak 1: Win Rate vs R:R Asymmetry
    if (wr < breakEvenWr) {
        leaks.push({
            id: 'WR_RR_DEFICIT',
            title: 'Asymmetrical Risk-Reward Mismatch',
            severity: 'CRITICAL',
            icon: 'AlertTriangle',
            metric: `Win Rate: ${wr}% vs Required: ${breakEvenWr}%`,
            description: `With a realized Risk-Reward of ${rr}x, the mathematical break-even threshold is ${breakEvenWr}%. At ${wr}%, your win rate is ${wrDeficit}% below survival level, guaranteeing steady account decay.`
        });
    }

    // Leak 2: Negative Expectancy
    if (exp < 0) {
        leaks.push({
            id: 'NEGATIVE_EXPECTANCY',
            title: 'Negative Expectancy Per Execution',
            severity: 'CRITICAL',
            icon: 'TrendingDown',
            metric: `${exp}% / trade`,
            description: `Each executed trade bleeds an average of ${Math.abs(exp)}% from the active allocation. Compounding this negative drift over hundreds of trades causes parabolic downward equity decay.`
        });
    }

    // Leak 3: Exit Model Pathology (Fixed Horizon vs Stop Loss)
    const targetCount = trades.filter(t => t.exitReason === 'TARGET').length;
    const stopCount = trades.filter(t => t.exitReason === 'STOP').length;
    const horizonCount = trades.filter(t => t.exitReason === 'HORIZON_EXPIRY').length;
    const totalExits = trades.length || 1;

    const horizonPct = Math.round((horizonCount / totalExits) * 100);
    const exitType = config.exitRule?.type || config.targetStopMode || 'TARGET_STOP';
    const isIntentionalHorizon = exitType === 'HORIZON';
    const horizonBars = config.exitRule?.horizonBars || config.maxHorizonCandles || duration || 14;

    // Only flag as a leak if NOT in intentional pure HORIZON mode, or if premature timeout is active
    if (!isIntentionalHorizon && (horizonPct >= 35 || (config.exitRule?.enableHorizonTimeout && horizonPct >= 20))) {
        leaks.push({
            id: 'HORIZON_FORCED_LIQUIDATION',
            title: 'Premature Horizon Expiry Liquidations',
            severity: horizonPct >= 50 ? 'CRITICAL' : 'HIGH',
            icon: 'Clock',
            metric: `${horizonPct}% of trades closed by time`,
            description: `${horizonPct}% of positions were forced shut by the ${horizonBars}-candle time horizon rather than an analytical target or stop, cutting off winners prematurely or exiting losers at unfavorable points.`
        });
    }

    // Leak 4: Streak Vulnerability & Over-Sizing
    if (maxConsecLosses >= 5 && Math.abs(summary.maxDrawdownPct) > 50) {
        leaks.push({
            id: 'STREAK_RUIN_EXPOSURE',
            title: "Gambler's Ruin Under Streak Clustering",
            severity: 'CRITICAL',
            icon: 'ShieldAlert',
            metric: `Max Streak: ${maxConsecLosses} consecutive losses`,
            description: `Encountered a cluster of ${maxConsecLosses} consecutive losses. Without dynamic volatility-adjusted sizing, clustered drawdown runs caused deep capital impairment (-${summary.maxDrawdownPct}%).`
        });
    }

    // Leak 5: Friction & Slippage Drag
    const isIndianRealistic = config.costModel === 'INDIAN_REALISTIC';
    let frictionValue = 0;
    if (isIndianRealistic) {
        frictionValue = 0.08 + Number(config.slippagePct || 0) + Number(config.brokeragePerTrade || 0);
    } else if (config.costModel && typeof config.costModel === 'object') {
        const fee = Number(config.costModel.feePerOrderPct || config.costModel.brokeragePerTrade || config.costModel.fee || 0);
        const slip = Number(config.costModel.slippagePct || config.costModel.slippage || 0);
        frictionValue = (fee + slip) * 2;
    } else {
        frictionValue = Number(config.slippagePct || 0) + Number(config.brokeragePerTrade || 0);
    }
    if (frictionValue > 0) {
        const totalTrades = summary.totalTrades || 0;
        leaks.push({
            id: 'FRICTION_DRAG',
            title: 'Friction Drag & Turnover Overhead',
            severity: 'MEDIUM',
            icon: 'Percent',
            metric: `${totalTrades} round-trips`,
            description: `High turnover across ${totalTrades} trades magnifies exchange brokerage and bid-ask slippage. Strategies with thin expectancy are quickly eroded by execution friction.`
        });
    }

    return leaks;
}

/**
 * Analyzes annual returns consistency and market regime resilience.
 */
export function analyzeAnnualConsistency(summary = {}) {
    const matrix = summary.yearlyBreakdown || summary.annualMatrix || [];
    if (!matrix.length) return null;

    const sortedByReturn = [...matrix].sort((a, b) => (b.returnPct ?? 0) - (a.returnPct ?? 0));
    const bestYear = sortedByReturn[0];
    const worstYear = sortedByReturn[sortedByReturn.length - 1];

    const positiveYears = matrix.filter(m => (m.returnPct ?? 0) > 0).length;
    const negativeYears = matrix.filter(m => (m.returnPct ?? 0) < 0).length;
    const winRateAnnualPct = Math.round((positiveYears / matrix.length) * 100);

    const isRegimeFragile = negativeYears > positiveYears || (worstYear?.returnPct ?? 0) < -35;

    return {
        totalYears: matrix.length,
        positiveYears,
        negativeYears,
        winRateAnnualPct,
        bestYear,
        worstYear,
        isRegimeFragile,
        commentary: isRegimeFragile
            ? `Extremely fragile across cyclical regimes. The strategy collapsed during adverse market years (e.g. ${worstYear?.year} with ${worstYear?.returnPct}%), indicating lack of regime-filtering.`
            : `Demonstrates resilient multi-year survival with ${positiveYears} out of ${matrix.length} profitable years.`
    };
}

/**
 * Generates concrete, prescriptive configuration actions to fix leaks.
 */
export function generatePrescriptiveActions(summary = {}, config = {}) {
    const actions = [];
    const rr = summary.realizedRR ?? 1;
    const wr = summary.winRate ?? 0;
    const dd = Math.abs(summary.maxDrawdownPct ?? 0);

    // Prescription 1: Exit Mechanics
    const exitType = config.exitRule?.type || config.targetStopMode || 'TARGET_STOP';
    if (exitType === 'HORIZON' || (summary.expectancy ?? 0) < 0) {
        actions.push({
            title: 'Replace Fixed Horizon with Dynamic Volatility Trailing Stop',
            action: 'Switch Target/Stop mode to TARGET_STOP or ATR_TRAILING',
            impact: 'Prevents forced time-based liquidation; allows trends to develop while clamping risk.',
            recommendedValue: '1.5x - 2.0x ATR Trailing Stop'
        });
    }

    // Prescription 2: Risk-Reward Threshold
    if (rr < 1.4) {
        actions.push({
            title: 'Widen Risk-to-Reward Ratio to >= 1.5:1',
            action: 'Increase profit target or implement tighter technical structural invalidation stops',
            impact: `Lowers required win rate from current ${calculateBreakEvenWinRate(rr)}% down to 40.0%, creating positive buffer.`,
            recommendedValue: 'Target 2.0x / Stop 1.0x (2:1 R:R)'
        });
    }

    // Prescription 3: Capital Sizing & Ruin Protection
    if (dd > 30) {
        actions.push({
            title: 'Enforce Strict 1.0% Capital Risk Guardrail',
            action: 'Cap per-trade exposure to avoid catastrophic compounding during 5+ loss streaks',
            impact: 'Limits peak drawdown to mathematically manageable levels, preventing gambler\'s ruin.',
            recommendedValue: 'Max 1.0% Equity at Risk per trade'
        });
    }

    // Prescription 4: Quality & Confidence Filtering
    if (wr < 50) {
        actions.push({
            title: 'Raise Predictor / Indicator Confidence Threshold',
            action: 'Filter out low-probability marginal signals',
            impact: 'Prunes the bottom 25% of noisy trades, immediately lifting net win rate and profit factor.',
            recommendedValue: 'Min Confidence: 65% - 70%'
        });
    }

    return actions;
}

/**
 * Compiles a comprehensive institutional report string (for AI prompting or clipboard copy).
 */
export function compileFullWalkthroughText(summary = {}, config = {}, trades = []) {
    const verdict = computeExecutiveVerdict(summary, config);
    const style = evaluateStyleSuitability(summary, config);
    const leaks = diagnoseMathematicalLeaks(summary, config, trades);
    const recoveryPct = calculateDrawdownRecoveryPct(summary.maxDrawdownPct);
    const annual = analyzeAnnualConsistency(summary);
    const actions = generatePrescriptiveActions(summary, config);

    let report = `=== PRAXIS BACKTEST DIAGNOSTIC WALKTHROUGH ===\n`;
    report += `Instrument: ${config.instrument || 'N/A'} | Timeframe: ${config.timeframe || '1d'} | Unit: ${config.unit || 'PREDICTOR'}\n`;
    report += `Executive Verdict: [${verdict.badgeText}]\n`;
    report += `Headline: ${verdict.headline}\n`;
    report += `Summary: ${verdict.summaryText}\n\n`;

    report += `--- TRADING STYLE SUITABILITY ---\n`;
    report += `Style Category: ${style.detectedStyle} (${style.styleDescription})\n`;
    report += `Viability: ${style.viabilityStatus} - ${style.viabilityVerdict}\n\n`;

    report += `--- PERFORMANCE & TELEMETRY AUDIT ---\n`;
    report += `Win Rate: ${summary.winRate}% (${summary.wins}W / ${summary.losses}L)\n`;
    report += `Realized Risk:Reward: ${summary.realizedRR}x (Break-Even Win Rate Required: ${calculateBreakEvenWinRate(summary.realizedRR)}%)\n`;
    report += `Profit Factor: ${summary.profitFactor}\n`;
    report += `Expectancy: ${summary.expectancy}% per trade\n`;
    report += `Net Cumulative Return: ${summary.netReturnPct}%\n`;
    report += `Max Drawdown: -${summary.maxDrawdownPct}% (Requires +${recoveryPct}% gain to recover)\n`;
    report += `Max Consecutive Losses: ${summary.maxConsecutiveLosses}L\n\n`;

    if (leaks.length > 0) {
        report += `--- CORE MATHEMATICAL LEAKS IDENTIFIED ---\n`;
        leaks.forEach((l, idx) => {
            report += `${idx + 1}. [${l.severity}] ${l.title} (${l.metric})\n   -> ${l.description}\n`;
        });
        report += `\n`;
    }

    if (annual) {
        report += `--- REGIME & MULTI-YEAR CONSISTENCY ---\n`;
        report += `${annual.commentary}\n`;
        if (annual.bestYear) report += `Best Year: ${annual.bestYear.year} (${annual.bestYear.returnPct}%, ${annual.bestYear.trades} trades, ${annual.bestYear.winRate}% WR)\n`;
        if (annual.worstYear) report += `Worst Year: ${annual.worstYear.year} (${annual.worstYear.returnPct}%, ${annual.worstYear.trades} trades, ${annual.worstYear.winRate}% WR)\n\n`;
    }

    if (actions.length > 0) {
        report += `--- PRESCRIPTIVE OPTIMIZATION ROADMAP ---\n`;
        actions.forEach((a, idx) => {
            report += `${idx + 1}. ${a.title}\n   Action: ${a.action}\n   Target: ${a.recommendedValue}\n   Impact: ${a.impact}\n`;
        });
    }

    return report;
}
