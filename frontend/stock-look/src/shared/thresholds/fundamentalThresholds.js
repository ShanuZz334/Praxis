/**
 * @file fundamentalThresholds.js
 * @purpose Single source of truth for ALL scoring thresholds in the Fundamentals engine.
 *
 * @structure
 *   FUNDAMENTAL_THRESHOLDS.<card_id>
 *     .bands[]          — Array of { max?, min?, score } — ordered from best to worst
 *     .factorWeights    — How factors blend: { withSector, withoutSector }
 *     .biasMap[]        — Maps finalScore → bias label
 *     .confidence       — Confidence values under different data conditions
 *
 * HOW TO TUNE:
 *   - Change a band's `score` value to shift what score a given PE/ratio produces.
 *   - Change `biasMap` thresholds to shift when "Bullish" vs "Neutral" label fires.
 *   - Change `factorWeights` to give more/less weight to Sector comparison vs Absolute.
 *
 * NOTE: Not every card can be fully expressed as simple bands. Cards with complex
 * algorithmic logic (CAGR, dynamic momentum, time-series) are documented here for
 * reference but remain in scoringEngine.js. The tunable numbers for those cards
 * are extracted into the `algo` key.
 */

// ─── Universal Bias Map (used by most cards) ─────────────────────────────────
// Applied to the FINAL blended score (0–100) to produce a bias label.
export const DEFAULT_BIAS_MAP = [
    { atLeast: 80, bias: 'Strong Bullish' },
    { atLeast: 62, bias: 'Bullish' },
    { atLeast: 42, bias: 'Neutral' },
    { atLeast: 25, bias: 'Bearish' },
    { atLeast: 0,  bias: 'Strong Bearish' },
];

// Helper: apply a bias map to a score
export function applyBiasMap(score, biasMap = DEFAULT_BIAS_MAP) {
    for (const tier of biasMap) {
        if (score >= tier.atLeast) return tier.bias;
    }
    return 'Strong Bearish';
}

// ─── CARD THRESHOLDS ─────────────────────────────────────────────────────────

export const FUNDAMENTAL_THRESHOLDS = {

    // ═══════════════════════════════════════════════════════════════════════
    // VALUATION CARDS
    // ═══════════════════════════════════════════════════════════════════════

    pe_ratio: {
        // Factor 1: Absolute fallback bands (used when no historicalAvg provided)
        absoluteBands: [
            { below: 10,  score: 95 },  // Extremely cheap
            { below: 15,  score: 80 },  // Cheap
            { below: 20,  score: 65 },  // Fair value
            { below: 25,  score: 50 },  // Slightly stretched
            { below: 30,  score: 35 },  // Expensive
            { below: 40,  score: 20 },  // Very expensive
            { else: true, score: 5  },  // Bubble
        ],
        // Factor 2: Sector Comparison (ratio = current / sector)
        sectorRatioBands: [
            { below: 0.60, score: 95 }, // 40%+ discount to sector
            { below: 0.85, score: 80 }, // 15%+ discount
            { below: 1.05, score: 60 }, // Parity / in-line
            { below: 1.25, score: 45 }, // Up to 25% premium (acceptable for leaders)
            { below: 1.50, score: 30 }, // 50% premium (expensive)
            { below: 2.00, score: 15 }, // 100% premium (very expensive)
            { else: true,  score: 5  }, // Bubble
        ],
        safetyBands: [
            { below: 10,  score: 95 },
            { below: 15,  score: 82 },
            { below: 22,  score: 65 },
            { below: 28,  score: 45 },
            { below: 35,  score: 28 },
            { below: 50,  score: 15 },
            { else: true, score: 5  },
        ],
        // Factor blend weights
        factorWeights: {
            withSector:    { f1: 0.50, f2: 0.30, f3: 0.20 },
            withoutSector: { f1: 0.60, f3: 0.40 },
        },
        // Confidence levels
        confidence: {
            withSector:       90,
            withHistorical:   82,
            absoluteOnly:     70,
        },
        biasMap: DEFAULT_BIAS_MAP,
    },

    forward_pe: {
        // Factor 1: Absolute bands
        absoluteBands: [
            { below: 10,  score: 95 },
            { below: 15,  score: 82 },
            { below: 20,  score: 65 },
            { below: 25,  score: 50 },
            { below: 35,  score: 30 },
            { below: 50,  score: 15 },
            { else: true, score: 5  },
        ],
        // Factor 2: Trailing vs Forward spread scoring
        // (forwardPE - trailingPE) > 0 → earnings declining, negative signal
        spreadBands: [
            { spreadBelow: -0.30, score: 90 }, // Forward < Trailing by 30%+ = strong growth
            { spreadBelow: -0.10, score: 75 },
            { spreadBelow:  0.10, score: 55 },
            { spreadBelow:  0.25, score: 35 },
            { else: true,         score: 20 }, // Forward much higher = earnings declining
        ],
        factorWeights: {
            withTrailing:    { f1: 0.40, f2: 0.40, f3: 0.20 },
            withoutTrailing: { f1: 0.70, f3: 0.30 },
        },
        confidence: {
            withTrailing:   90,
            absoluteOnly:   75,
        },
        biasMap: DEFAULT_BIAS_MAP,
    },

    pb_ratio: {
        absoluteBands: [
            { below: 0.5, score: 95 }, // Deep value
            { below: 1.0, score: 82 }, // Undervalued
            { below: 1.5, score: 70 }, // Fair to cheap
            { below: 2.5, score: 55 }, // Fair value
            { below: 4.0, score: 38 }, // Slight premium
            { below: 6.0, score: 20 }, // Overvalued
            { else: true, score: 8  }, // Extremely overvalued
        ],
        // Sector comparison: ratio = currentPB / sectorPB
        sectorRatioBands: [
            { below: 0.60, score: 90 }, // Far cheaper than sector
            { below: 0.80, score: 75 },
            { below: 0.95, score: 60 },
            { below: 1.10, score: 50 },
            { below: 1.30, score: 35 },
            { below: 1.60, score: 20 },
            { else: true,  score: 8  },
        ],
        factorWeights: {
            withSector:    { f1: 0.55, f2: 0.45 },
            withoutSector: { f1: 1.00 },
        },
        confidence: {
            withSector:   88,
            absoluteOnly: 72,
        },
        biasMap: DEFAULT_BIAS_MAP,
    },

    ev_ebitda: {
        absoluteBands: [
            { below: 5,   score: 95 },
            { below: 8,   score: 80 },
            { below: 12,  score: 65 },
            { below: 16,  score: 50 },
            { below: 22,  score: 32 },
            { below: 30,  score: 18 },
            { else: true, score: 5  },
        ],
        sectorRatioBands: [
            { below: 0.60, score: 95 }, // Deep discount
            { below: 0.85, score: 80 }, // Cheap vs sector
            { below: 1.05, score: 60 }, // Parity
            { below: 1.25, score: 45 }, // Slight premium
            { below: 1.50, score: 30 }, // High premium
            { below: 2.00, score: 15 }, // Very expensive
            { else: true,  score: 5  },
        ],
        factorWeights: {
            withSector:    { f1: 0.55, f2: 0.45 },
            withoutSector: { f1: 1.00 },
        },
        confidence: {
            withSector:   88,
            absoluteOnly: 72,
        },
        biasMap: DEFAULT_BIAS_MAP,
    },

    earnings_yield: {
        // vs Historical: Score adjustments (added to base 50)
        historicalAdjustments: {
            veryHigh:    { multiplier: 1.30, add: 30 }, // >= historical * 1.30
            high:        { multiplier: 1.10, add: 15 }, // >= historical * 1.10
            veryLow:     { multiplier: 0.70, sub: 30 }, // <= historical * 0.70
            low:         { multiplier: 0.90, sub: 15 }, // <= historical * 0.90
        },
        // vs Bond Yield (equity risk premium)
        erpBands: [
            { atLeast: 4.0, add: 20 },
            { atLeast: 2.0, add: 10 },
            { below:   0,   sub: 20 }, // Negative ERP
            { else: true,   sub:  5 },
        ],
        biasMap: [
            { atLeast: 80, bias: 'Strong Bullish' },
            { atLeast: 65, bias: 'Bullish' },
            { atLeast: 45, bias: 'Neutral' },
            { atLeast: 30, bias: 'Bearish' },
            { atLeast: 0,  bias: 'Strong Bearish' },
        ],
    },

    dividend_yield: {
        // Spread vs bond yield scoring (added to base 50)
        spreadAdjustments: [
            { spreadAbove: 2.0, add: 20 }, // Yielding much more than bonds
            { spreadAbove: 0,   add: 10 }, // Yielding more than bonds
        ],
        // Absolute fallback (when no bond yield)
        absoluteAdjustments: [
            { above: 5.0, add: 20 },
            { above: 3.0, add: 10 },
            { exactly: 0, sub: 10 }, // No dividend
        ],
        biasMap: [
            { atLeast: 80, bias: 'Strong Bullish' },
            { atLeast: 65, bias: 'Bullish' },
            { atLeast: 35, bias: 'Neutral' },
            { atLeast: 20, bias: 'Bearish' },
            { atLeast: 0,  bias: 'Strong Bearish' },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // PROFITABILITY CARDS
    // ═══════════════════════════════════════════════════════════════════════

    roe: {
        absoluteBands: [
            { above: 30, score: 98, label: 'Elite Compounder' },
            { above: 25, score: 92, label: 'Exceptional Returns' },
            { above: 20, score: 85, label: 'High Return on Capital' },
            { above: 15, score: 72, label: 'Solid Returns' },
            { above: 12, score: 60, label: 'Above Cost of Capital' },
            { above: 10, score: 48, label: 'At Cost of Capital' },
            { above: 6,  score: 32, label: 'Sub-par Returns' },
            { above: 0,  score: 18, label: 'Weak Returns' },
            { else: true,score: 6,  label: 'Value Destroyer' },
        ],
        comparativeBands: [
            { above: 25, spreadAbove: 10, score: 98, label: 'Elite Compounder — Far Above Sector' },
            { above: 20, spreadAbove: 5,  score: 92, label: 'Exceptional Compounder' },
            { above: 15, spreadAbove: 2,  score: 80, label: 'Outperforming Sector' },
            { above: 12, spreadAbove: 0,  score: 65, label: 'Beating Sector Average' },
            { above: 10, spreadAbove: -2, score: 52, label: 'In-line with Sector' },
            { above: 6,  score: 35, label: 'Underperforming' },
            { above: 0,  score: 20, label: 'Weak Vs Sector' },
            { else: true,score: 6,  label: 'Value Destroyer' },
        ],
        factorWeights: {
            withSector:    { f1: 0.55, f2: 0.45 },
            withoutSector: { f1: 1.00 },
        },
        confidence: { withSector: 90, absoluteOnly: 75, high: 80, base: 72 },
        biasMap: DEFAULT_BIAS_MAP,
    },

    roce: {
        absoluteBands: [
            { above: 35, score: 98, label: 'Elite Capital Allocator' },
            { above: 28, score: 92, label: 'Exceptional Efficiency' },
            { above: 22, score: 85, label: 'High Capital Efficiency' },
            { above: 16, score: 72, label: 'Solid Efficiency' },
            { above: 12, score: 58, label: 'Above Average' },
            { above: 10, score: 45, label: 'Acceptable Efficiency' },
            { above: 6,  score: 30, label: 'Sub-par Efficiency' },
            { above: 0,  score: 18, label: 'Weak Efficiency' },
            { else: true,score: 6,  label: 'Capital Destroyer' },
        ],
        comparativeBands: [
            { above: 30, spreadAbove: 10, score: 98, label: 'Elite Capital Allocator — Far Above Sector' },
            { above: 25, spreadAbove: 5,  score: 92, label: 'Exceptional Capital Allocator' },
            { above: 18, spreadAbove: 2,  score: 80, label: 'Outperforming Sector' },
            { above: 13, spreadAbove: 0,  score: 65, label: 'Beating Sector Average' },
            { above: 10, spreadAbove: -2, score: 52, label: 'In-line with Sector' },
            { above: 6,  score: 33, label: 'Underperforming' },
            { above: 0,  score: 18, label: 'Weak vs Sector' },
            { else: true,score: 6,  label: 'Capital Destroyer' },
        ],
        factorWeights: {
            withSector:    { f1: 0.55, f2: 0.45 },
            withoutSector: { f1: 1.00 },
        },
        confidence: { withSector: 90, absoluteOnly: 75, high: 80, base: 72 },
        biasMap: DEFAULT_BIAS_MAP,
    },

    roa: {
        absoluteBands: [
            { above: 15,  score: 95, zone: 'Elite Efficiency' },
            { above: 10,  score: 80, zone: 'High Efficiency' },
            { above: 6,   score: 65, zone: 'Above Average' },
            { above: 3,   score: 50, zone: 'Average Efficiency' },
            { above: 1,   score: 35, zone: 'Low Efficiency' },
            { above: 0,   score: 20, zone: 'Low Efficiency' },
            { else: true, score: 5,  zone: 'Asset Destroyer' },
        ],
        factorWeights: {
            withSector:    { f1: 0.50, f2: 0.50 },
            withoutSector: { f1: 1.00 },
        },
        biasMap: DEFAULT_BIAS_MAP,
        confidence: { always: 78 },
    },

    net_margin: {
        absoluteBands: [
            { above: 25,  score: 95 },
            { above: 18,  score: 82 },
            { above: 12,  score: 68 },
            { above: 7,   score: 52 },
            { above: 3,   score: 35 },
            { above: 0,   score: 20 },
            { else: true, score: 5  },
        ],
        sectorRatioBands: [
            { below: 0.60, score: 8  },
            { below: 0.80, score: 28 },
            { below: 0.95, score: 50 },
            { below: 1.10, score: 65 },
            { below: 1.30, score: 80 },
            { else: true,  score: 92 },
        ],
        factorWeights: {
            withSector:    { f1: 0.55, f2: 0.45 },
            withoutSector: { f1: 1.00 },
        },
        confidence: { withSector: 88, absoluteOnly: 72 },
        biasMap: DEFAULT_BIAS_MAP,
    },

    operating_margin: {
        absoluteBands: [
            { above: 30,  score: 95 },
            { above: 22,  score: 82 },
            { above: 15,  score: 68 },
            { above: 8,   score: 52 },
            { above: 3,   score: 32 },
            { above: 0,   score: 18 },
            { else: true, score: 5  },
        ],
        sectorRatioBands: [
            { below: 0.60, score: 8  },
            { below: 0.80, score: 28 },
            { below: 0.95, score: 50 },
            { below: 1.10, score: 65 },
            { below: 1.30, score: 80 },
            { else: true,  score: 92 },
        ],
        factorWeights: {
            withSector:    { f1: 0.55, f2: 0.45 },
            withoutSector: { f1: 1.00 },
        },
        confidence: { withSector: 88, absoluteOnly: 72 },
        biasMap: DEFAULT_BIAS_MAP,
    },

    // ═══════════════════════════════════════════════════════════════════════
    // FINANCIAL HEALTH CARDS
    // ═══════════════════════════════════════════════════════════════════════

    debt_to_equity: {
        absoluteBands: [
            { below: 0.10, score: 98, zone: 'Debt Free' },
            { below: 0.30, score: 90, zone: 'Very Low Leverage' },
            { below: 0.60, score: 78, zone: 'Conservative' },
            { below: 1.00, score: 60, zone: 'Moderate Leverage' },
            { below: 1.50, score: 42, zone: 'Elevated Leverage' },
            { below: 2.50, score: 22, zone: 'High Leverage' },
            { else: true,  score: 5,  zone: 'Dangerously Leveraged' },
        ],
        sectorRatioBands: [
            { below: 0.50, score: 95 }, // Far below sector
            { below: 0.80, score: 80 },
            { below: 1.00, score: 65 },
            { below: 1.20, score: 50 },
            { below: 1.50, score: 32 },
            { else: true,  score: 12 },
        ],
        riskBands: [
            { below: 0.30, score: 95 },
            { below: 0.70, score: 75 },
            { below: 1.20, score: 50 },
            { below: 2.00, score: 25 },
            { else: true,  score: 5  },
        ],
        factorWeights: {
            withSector:    { f1: 0.50, f2: 0.30, f3: 0.20 },
            withoutSector: { f1: 0.65, f3: 0.35 },
        },
        confidence: {
            withSector:       90,
            extremeNoSector:  82,
            normal:           72,
        },
        biasMap: DEFAULT_BIAS_MAP,
    },

    interest_coverage: {
        absoluteBands: [
            { above: 10,  score: 95 }, // Very safe
            { above: 5,   score: 78 }, // Safe
            { above: 3,   score: 60 }, // Adequate
            { above: 1.5, score: 40 }, // Watch zone
            { above: 1,   score: 22 }, // Danger zone
            { else: true, score: 5  }, // Cannot service debt
        ],
        biasMap: DEFAULT_BIAS_MAP,
        confidence: { always: 82 },
    },

    current_ratio: {
        absoluteBands: [
            { above: 3.0, score: 75 },  // High (possibly hoarding cash)
            { above: 2.0, score: 88 },  // Excellent
            { above: 1.5, score: 78 },  // Good
            { above: 1.2, score: 62 },  // Adequate
            { above: 1.0, score: 48 },  // Tight but manageable
            { above: 0.8, score: 28 },  // Stressed
            { else: true, score: 8  },  // Severe liquidity risk
        ],
        biasMap: DEFAULT_BIAS_MAP,
        confidence: { always: 78 },
    },

    free_cash_flow: {
        // FCF Yield = FCF / Market Cap (%)
        absoluteBands: [
            { above: 8,   score: 95 }, // Exceptional generator
            { above: 5,   score: 80 }, // Strong
            { above: 2,   score: 62 }, // Healthy
            { above: 0,   score: 48 }, // Positive
            { above: -3,  score: 28 }, // Burning cash
            { else: true, score: 8  }, // Severe burn
        ],
        biasMap: DEFAULT_BIAS_MAP,
        confidence: { always: 78 },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // INDEX VALUATION CARDS
    // ═══════════════════════════════════════════════════════════════════════

    nifty_pe: {
        absoluteBands: [
            { below: 14,  score: 95, zone: 'Deep Value' },
            { below: 18,  score: 80, zone: 'Undervalued' },
            { below: 22,  score: 65, zone: 'Fair Value' },
            { below: 26,  score: 50, zone: 'Fairly Valued' },
            { below: 30,  score: 35, zone: 'Stretched' },
            { below: 35,  score: 20, zone: 'Expensive' },
            { else: true, score: 5,  zone: 'Bubble Territory' },
        ],
        // Historical mean reversion: score += adjustment based on deviation from 20yr avg (~22x)
        historicalAvg:          22,
        histDevMultiplier:      200, // score = 50 - (deviation * 200)
        biasMap: DEFAULT_BIAS_MAP,
        confidence: { always: 88 },
    },

    nifty_pb: {
        absoluteBands: [
            { below: 2.0, score: 92 },
            { below: 3.0, score: 75 },
            { below: 4.0, score: 58 },
            { below: 5.0, score: 40 },
            { below: 6.5, score: 22 },
            { else: true, score: 8  },
        ],
        biasMap: DEFAULT_BIAS_MAP,
        confidence: { always: 85 },
    },

    mcap_gdp: {
        // Buffett Indicator zones
        absoluteBands: [
            { below: 50,  score: 95, zone: 'Deep Undervalue' },
            { below: 75,  score: 80, zone: 'Undervalued' },
            { below: 100, score: 62, zone: 'Fair Value' },
            { below: 130, score: 40, zone: 'Slightly Overvalued' },
            { below: 160, score: 22, zone: 'Overvalued' },
            { else: true, score: 5,  zone: 'Bubble' },
        ],
        biasMap: DEFAULT_BIAS_MAP,
        confidence: { always: 82 },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // MACRO / POLICY CARDS
    // ═══════════════════════════════════════════════════════════════════════

    gdp: {  // Index GDP Growth
        absoluteBands: [
            { above: 8.0, score: 95 },
            { above: 6.0, score: 80 },
            { above: 4.0, score: 62 },
            { above: 2.0, score: 45 },
            { above: 0,   score: 28 },
            { else: true, score: 8  },
        ],
        biasMap: DEFAULT_BIAS_MAP,
        confidence: { always: 80 },
    },

    gdp_growth: {  // Company GDP Growth (same logic)
        absoluteBands: [
            { above: 8.0, score: 95, label: 'Rapid Expansion' },
            { above: 6.0, score: 80, label: 'Healthy Expansion' },
            { above: 4.0, score: 62, label: 'Moderate Growth' },
            { above: 2.0, score: 45, label: 'Slow Growth' },
            { above: 0,   score: 28, label: 'Economic Slowdown' },
            { else: true, score: 8,  label: 'Contraction (Recession)' },
        ],
        biasMap: DEFAULT_BIAS_MAP,
        confidence: { extreme: 88, normal: 78 },
    },

    cpi: {
        // Inverse scoring: lower CPI = higher score
        // RBI target = 4% (within 2–6% band)
        absoluteBands: [
            { below: 2.0, score: 65, zone: 'Below target (risk of deflation)' },
            { below: 4.0, score: 88, zone: 'In target zone' },
            { below: 5.5, score: 70, zone: 'Slightly above target' },
            { below: 7.0, score: 40, zone: 'Elevated' },
            { below: 9.0, score: 18, zone: 'High' },
            { else: true, score: 5,  zone: 'Runaway Inflation' },
        ],
        rbiTarget:  4.0,
        rbiUpperBand: 6.0,
        biasMap: DEFAULT_BIAS_MAP,
        confidence: { always: 85 },
    },

    repo: {
        // Context: Lower rates = easier credit = bullish (generally)
        absoluteBands: [
            { below: 4.5, score: 88 }, // Accommodative
            { below: 5.5, score: 72 }, // Neutral-easy
            { below: 6.5, score: 55 }, // Neutral
            { below: 7.0, score: 38 }, // Tightening
            { else: true, score: 20 }, // Restrictive
        ],
        biasMap: DEFAULT_BIAS_MAP,
        confidence: { always: 82 },
    },

    fiscal_deficit: {
        // % of GDP — lower = better
        absoluteBands: [
            { below: 2.5, score: 90 },
            { below: 3.5, score: 72 }, // FRBM target = 3%
            { below: 4.5, score: 52 },
            { below: 6.0, score: 30 },
            { else: true, score: 10 },
        ],
        frbmTarget: 3.0,
        biasMap: DEFAULT_BIAS_MAP,
        confidence: { always: 78 },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // BREADTH / RISK CARDS
    // ═══════════════════════════════════════════════════════════════════════

    advance_decline: {
        absoluteBands: [
            { above: 2.5, score: 70, signalType: 'Exhaustion Risk' },   // Extreme breadth = contrarian caution
            { above: 1.5, score: 90, signalType: 'Broad Buying' },
            { above: 1.2, score: 78, signalType: 'Trending' },
            { above: 0.9, score: 52, signalType: 'Mixed Breadth' },
            { above: 0.7, score: 32, signalType: 'Broad Selling' },
            { above: 0.5, score: 18, signalType: 'Broad Selling' },
            { else: true, score: 8,  signalType: 'Contrarian Reversal Signal' },
        ],
        safetyBands: [
            { above: 2.0, score: 70 },
            { above: 1.2, score: 82 },
            { above: 0.8, score: 50 },
            { above: 0.5, score: 25 },
            { else: true, score: 10 },
        ],
        factorWeights: { f2: 0.50, f2b: 0.30, f3: 0.20 },
        biasMap: DEFAULT_BIAS_MAP,
        confidence: {
            extreme:  88,   // adRatio > 2.0 or < 0.5
            nearExtreme: 80,
            neutral:  65,
        },
    },

    india_vix: {
        // Inverse: high VIX = bearish
        absoluteBands: [
            { below: 12,  score: 88, zone: 'Extreme Complacency' },
            { below: 16,  score: 78, zone: 'Low Volatility' },
            { below: 20,  score: 62, zone: 'Normal' },
            { below: 25,  score: 42, zone: 'Elevated Concern' },
            { below: 35,  score: 22, zone: 'High Fear' },
            { else: true, score: 5,  zone: 'Extreme Fear' },
        ],
        biasMap: DEFAULT_BIAS_MAP,
        confidence: { always: 85 },
    },

    // VIX used by scoreVIX (multi-factor blend — factorWeights required)
    vix: {
        // Factor weights for 3-factor blend
        factorWeights: { f1: 0.50, f2: 0.30, f3: 0.20 },
        biasMap: DEFAULT_BIAS_MAP,
        confidence: {
            extreme:  92,   // vixValue > 28 or < 11 — highest signal quality
            elevated: 84,   // vixValue > 22 or < 13
            neutral:  72,   // mid-range VIX
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // ALGORITHMIC CARDS (complex time-series — key tunable params only)
    // ═══════════════════════════════════════════════════════════════════════

    earnings_trend: {
        // EPS CAGR-based labels/scores
        algo: {
            consistentGrowthScore:  90,
            improvingScore:         75,
            volatileFlatScore:      50,
            weakeningScore:         30,
            consistentDeclineScore: 10,
            // Manual CAGR fallback
            manualCagrBands: [
                { above: 15, score: 90, label: 'Consistent Growth' },
                { above: 5,  score: 75, label: 'Improving' },
                { above: -5, score: 50, label: 'Stable / Flat' },
                { above: -15,score: 30, label: 'Weakening' },
                { else: true,score: 10, label: 'Consistent Decline' },
            ],
        },
        biasMap: [
            { atLeast: 80, bias: 'Strong Bullish' },
            { atLeast: 60, bias: 'Bullish' },
            { atLeast: 40, bias: 'Neutral' },
            { atLeast: 20, bias: 'Bearish' },
            { atLeast: 0,  bias: 'Strong Bearish' },
        ],
    },

    eps_growth: {
        algo: {
            cagrBands: [
                { above: 25,  score: 95 },
                { above: 15,  score: 80 },
                { above: 8,   score: 65 },
                { above: 0,   score: 48 },
                { above: -10, score: 28 },
                { else: true, score: 8  },
            ],
        },
        biasMap: DEFAULT_BIAS_MAP,
    },

    revenue_growth: {
        algo: {
            cagrBands: [
                { above: 20,  score: 95 },
                { above: 12,  score: 80 },
                { above: 6,   score: 65 },
                { above: 0,   score: 48 },
                { above: -8,  score: 28 },
                { else: true, score: 8  },
            ],
        },
        biasMap: DEFAULT_BIAS_MAP,
    },

    profit_growth: {
        algo: {
            cagrBands: [
                { above: 25,  score: 95 },
                { above: 15,  score: 80 },
                { above: 8,   score: 65 },
                { above: 0,   score: 48 },
                { above: -10, score: 28 },
                { else: true, score: 8  },
            ],
        },
        biasMap: DEFAULT_BIAS_MAP,
    },

    eps_yoy: {
        algo: {
            growthBands: [
                { above: 25,  score: 95 },
                { above: 15,  score: 80 },
                { above: 5,   score: 65 },
                { above: 0,   score: 50 },
                { above: -10, score: 30 },
                { else: true, score: 10 },
            ],
        },
        biasMap: DEFAULT_BIAS_MAP,
    },

    forward_eps: {
        algo: {
            growthBands: [
                { above: 20,  score: 95 },
                { above: 10,  score: 78 },
                { above: 3,   score: 62 },
                { above: 0,   score: 50 },
                { above: -10, score: 28 },
                { else: true, score: 10 },
            ],
        },
        biasMap: DEFAULT_BIAS_MAP,
    },

    profit_margin: {  // Index profit margin card
        absoluteBands: [
            { above: 15,  score: 90 },
            { above: 10,  score: 75 },
            { above: 6,   score: 58 },
            { above: 3,   score: 42 },
            { above: 0,   score: 25 },
            { else: true, score: 8  },
        ],
        biasMap: DEFAULT_BIAS_MAP,
        confidence: { always: 75 },
    },

    promoter_holding: {
        absoluteBands: [
            { above: 65,  score: 88, zone: 'Fortress Control' },
            { above: 50,  score: 75, zone: 'Strong Commitment' },
            { above: 35,  score: 58, zone: 'Moderate Commitment' },
            { above: 25,  score: 42, zone: 'Diluted Control' },
            { above: 15,  score: 25, zone: 'Low Promoter Skin' },
            { else: true, score: 8,  zone: 'Minimal Insider Stake' },
        ],
        trendAdjust: {
            strongIncrease: +10,   // delta > 1.0%
            slightIncrease: +5,    // delta > 0.2%
            strongDecrease: -15,   // delta < -1.0%
            slightDecrease: -7,    // delta < -0.2%
        },
        factorWeights: { f1: 0.65, f2: 0.35 },
        biasMap: DEFAULT_BIAS_MAP,
        confidence: { always: 80 },
    },

    analyst_consensus: {
        ratingMap: {
            'strongBuy':   95,
            'buy':         75,
            'hold':        50,
            'underperform':28,
            'sell':        8,
        },
        targetPremiumBands: [
            { above: 30,  add: 20 },
            { above: 15,  add: 10 },
            { above: 0,   add: 0  },
            { above: -10, sub: 10 },
            { else: true, sub: 20 },
        ],
        biasMap: DEFAULT_BIAS_MAP,
        confidence: { always: 85 },
    },

    // ── INDEX: Nifty-level scorers ──────────────────────────────────────────
    nifty_dividend_yield: {
        // Nifty avg ~1.2%; higher = more value / margin of safety
        absoluteBands: [
            { above: 1.8, score: 100 },
            { above: 1.4, score: 80  },
            { above: 1.0, score: 50  },
            { above: 0.7, score: 20  },
            { else: true, score: 0   },
        ],
        biasMap: DEFAULT_BIAS_MAP,
        confidence: { always: 90 },
    },

    nifty_eps_growth: {
        // Long-term Nifty EPS CAGR ~12-14%
        absoluteBands: [
            { above: 20, score: 100 },
            { above: 15, score: 80  },
            { above: 10, score: 50  },
            { above: 5,  score: 20  },
            { else: true,score: 0   },
        ],
        biasMap: DEFAULT_BIAS_MAP,
        confidence: { always: 90 },
    },

    nifty_forward_eps: {
        absoluteBands: [
            { above: 22, score: 100 },
            { above: 16, score: 80  },
            { above: 12, score: 50  },
            { above: 6,  score: 20  },
            { else: true,score: 0   },
        ],
        biasMap: DEFAULT_BIAS_MAP,
        confidence: { always: 85 },
    },

    earnings_revision: {
        // Net % of companies with EPS upgrades minus downgrades
        absoluteBands: [
            { above: 20,  score: 100 },
            { above: 5,   score: 75  },
            { above: -5,  score: 50  },
            { above: -20, score: 25  },
            { else: true, score: 0   },
        ],
        biasMap: DEFAULT_BIAS_MAP,
        confidence: { always: 80 },
    },

    sector_earnings_breadth: {
        // % of sectors beating estimates
        absoluteBands: [
            { above: 75, score: 100 },
            { above: 60, score: 75  },
            { above: 40, score: 50  },
            { above: 25, score: 25  },
            { else: true,score: 0   },
        ],
        biasMap: DEFAULT_BIAS_MAP,
        confidence: { always: 85 },
    },

    aggregate_profit_margin: {
        absoluteBands: [
            { above: 12, score: 100 },
            { above: 10, score: 75  },
            { above: 8,  score: 50  },
            { above: 6,  score: 25  },
            { else: true,score: 0   },
        ],
        biasMap: DEFAULT_BIAS_MAP,
        confidence: { always: 90 },
    },

    // ── MACRO / FLOW scorers ────────────────────────────────────────────────
    current_account: {
        // Negative = deficit; positive = surplus
        absoluteBands: [
            { above: 0,    score: 100, label: 'Surplus' },
            { above: -1.5, score: 80,  label: 'Comfortable' },
            { above: -2.5, score: 50,  label: 'Manageable' },
            { above: -3.5, score: 20,  label: 'Stressed' },
            { else: true,  score: 0,   label: 'Crisis' },
        ],
        biasMap: DEFAULT_BIAS_MAP,
        confidence: { always: 85 },
    },

    fii_flow_trend: {
        // -10 to +10 scale (days of net buying)
        absoluteBands: [
            { above: 7,  score: 100 },
            { above: 3,  score: 75  },
            { above: -2, score: 50  },
            { above: -6, score: 25  },
            { else: true,score: 0   },
        ],
        biasMap: DEFAULT_BIAS_MAP,
        confidence: { always: 90 },
    },

    system_liquidity: {
        // In Lakh Crores; positive = surplus
        absoluteBands: [
            { above: 2.0,  score: 100 },
            { above: 0.5,  score: 75  },
            { above: -0.5, score: 50  },
            { above: -2.0, score: 25  },
            { else: true,  score: 0   },
        ],
        biasMap: DEFAULT_BIAS_MAP,
        confidence: { always: 85 },
    },

    mf_sip_flows: {
        // SIP flows in Rs Crores/month
        absoluteBands: [
            { above: 18000, score: 100 },
            { above: 15000, score: 80  },
            { above: 12000, score: 50  },
            { above: 8000,  score: 20  },
            { else: true,   score: 0   },
        ],
        biasMap: DEFAULT_BIAS_MAP,
        confidence: { always: 95 },
    },

    sector_valuation_spread: {
        // Lower spread = broader participation
        spreadBands: [
            { below: 10, score: 90, label: 'Broad Participation' },
            { below: 15, score: 50, label: 'Normal Dispersion' },
            { else: true,score: 20, label: 'Sector Concentration' },
        ],
        biasMap: DEFAULT_BIAS_MAP,
        confidence: { always: 75 },
    },

    sector_growth_differential: {
        biasMap: DEFAULT_BIAS_MAP,
        confidence: { always: 70 },
    },

    sector_concentration: {
        // % weight of top 3 sectors
        spreadBands: [
            { below: 45, score: 90, label: 'Well Diversified' },
            { below: 55, score: 50, label: 'Moderate Concentration' },
            { else: true,score: 15, label: 'Dangerously Concentrated' },
        ],
        biasMap: DEFAULT_BIAS_MAP,
        confidence: { always: 85 },
    },

    cyclical_defensive: {
        // Ratio > 1 = cyclicals leading (risk-on); < 1 = defensives (risk-off)
        absoluteBands: [
            { above: 1.2, score: 90, label: 'Risk-On' },
            { above: 0.9, score: 50, label: 'Neutral' },
            { else: true, score: 20, label: 'Risk-Off' },
        ],
        biasMap: DEFAULT_BIAS_MAP,
        confidence: { always: 80 },
    },

    bank_credit_growth: {
        absoluteBands: [
            { above: 15, score: 100 },
            { above: 12, score: 80  },
            { above: 9,  score: 50  },
            { above: 5,  score: 20  },
            { else: true,score: 0   },
        ],
        biasMap: DEFAULT_BIAS_MAP,
        confidence: { always: 90 },
    },

    aggregate_corporate_debt: {
        // % of GDP; lower = healthier
        spreadBands: [
            { below: 45, score: 90, label: 'Deleveraged' },
            { below: 55, score: 50, label: 'Moderate Leverage' },
            { else: true,score: 15, label: 'Overleveraged' },
        ],
        biasMap: DEFAULT_BIAS_MAP,
        confidence: { always: 85 },
    },

    crude_oil: {
        // Inverse: lower Brent = bullish for India
        absoluteBands: [
            { below: 65, score: 100, label: 'Very Bullish' },
            { below: 75, score: 80,  label: 'Bullish' },
            { below: 85, score: 50,  label: 'Neutral' },
            { below: 95, score: 20,  label: 'Bearish' },
            { else: true,score: 0,   label: 'Very Bearish' },
        ],
        biasMap: DEFAULT_BIAS_MAP,
        confidence: { always: 95 },
    },

    usdinr: {
        // Lower USDINR = stronger INR = more bullish
        absoluteBands: [
            { below: 81,   score: 90, label: 'Strong INR' },
            { below: 83.5, score: 50, label: 'Stable' },
            { else: true,  score: 15, label: 'Weak INR' },
        ],
        biasMap: DEFAULT_BIAS_MAP,
        confidence: { always: 85 },
    },

    npa: {
        // Gross NPA %; lower = better
        absoluteBands: [
            { below: 3.0, score: 100, label: 'Excellent Asset Quality' },
            { below: 5.0, score: 75,  label: 'Good Asset Quality' },
            { below: 7.0, score: 40,  label: 'Concerning NPA Level' },
            { else: true, score: 10,  label: 'Distressed Asset Quality' },
        ],
        biasMap: DEFAULT_BIAS_MAP,
        confidence: { always: 95 },
    },

    fii_flow: {
        // Rs Crore monthly net flow
        absoluteBands: [
            { above: 5000,  score: 90 },
            { above: 1000,  score: 75 },
            { above: 0,     score: 60 },
            { above: -1000, score: 40 },
            { above: -5000, score: 25 },
            { else: true,   score: 10 },
        ],
        biasMap: DEFAULT_BIAS_MAP,
        confidence: { always: 90 },
    },

    dii_flow: {
        absoluteBands: [
            { above: 5000,  score: 90 },
            { above: 1000,  score: 75 },
            { above: 0,     score: 60 },
            { above: -1000, score: 40 },
            { above: -5000, score: 25 },
            { else: true,   score: 10 },
        ],
        biasMap: DEFAULT_BIAS_MAP,
        confidence: { always: 90 },
    },

    earnings_quality: {
        // CFO / Net Profit ratio
        absoluteBands: [
            { above: 1.5, score: 95, label: 'Exceptional Cash Quality' },
            { above: 1.1, score: 82, label: 'High Quality Earnings' },
            { above: 0.8, score: 65, label: 'Adequate Cash Conversion' },
            { above: 0.5, score: 45, label: 'Weak Cash Conversion' },
            { above: 0,   score: 28, label: 'Poor Cash Quality' },
            { else: true, score: 10, label: 'Negative CFO — Paper Profits' },
        ],
        biasMap: DEFAULT_BIAS_MAP,
        confidence: { always: 88 },
    },

    smart_money_flow: {
        // Institutional shareholding %
        absoluteBands: [
            { above: 50, score: 90, label: 'Heavy Institutional Ownership' },
            { above: 35, score: 78, label: 'Strong Institutional Interest' },
            { above: 20, score: 62, label: 'Moderate Institutional Interest' },
            { above: 10, score: 45, label: 'Low Institutional Interest' },
            { else: true,score: 25, label: 'Retail-Dominated' },
        ],
        trendAdjust: {
            strongAccum:  +12,   // delta > 1.5%
            slightAccum:  +6,    // delta > 0.5%
            strongDistrib: -18,  // delta < -1.5%
            slightDistrib: -8,   // delta < -0.5%
        },
        factorWeights: { f1: 0.55, f2: 0.45 },
        biasMap: DEFAULT_BIAS_MAP,
        confidence: { withTrend: 90, withoutTrend: 72 },
    },

    pcr: {
        // Options Put-Call Ratio (contrarian)
        biasMap: DEFAULT_BIAS_MAP,
        confidence: { extreme: 88, moderate: 78, neutral: 60 },
    },

    current_ratio: {
        absoluteBands: [
            { above: 2.0, score: 92, label: 'Strong Liquidity' },
            { above: 1.5, score: 75, label: 'Good Liquidity' },
            { above: 1.0, score: 55, label: 'Adequate Liquidity' },
            { above: 0.8, score: 30, label: 'Below 1 — Watch' },
            { else: true, score: 10, label: 'Liquidity Risk' },
        ],
        biasMap: DEFAULT_BIAS_MAP,
        confidence: { always: 72 },
    },

    // ── FINAL 6 — completing 100% coverage ─────────────────────────────────
    earnings_yield: {
        // Earnings Yield = E/P; higher is cheaper / more attractive
        // Scoring is additive (starts at 50), so biasMap is all that's needed
        biasMap: DEFAULT_BIAS_MAP,
        confidence: { both: '90%', one: '70%', none: '40%' },
    },

    earnings_trend: {
        // EPS trend quality (Consistent Growth → Consistent Decline)
        scoreBands: [
            { label: 'Consistent Growth', score: 90 },
            { label: 'Improving',         score: 75 },
            { label: 'Volatile / Flat',   score: 50 },
            { label: 'Mixed',             score: 50 },
            { label: 'Weakening',         score: 30 },
            { label: 'Consistent Decline',score: 10 },
        ],
        biasMap: DEFAULT_BIAS_MAP,
        confidence: { base: 40, perPeriod: 15, max: 95, manual: 60 },
    },

    policy_stance: {
        // RBI monetary policy stance (string-driven)
        stanceMap: {
            accommodative: { score: 100, confidence: 90 },
            neutral:        { score: 50,  confidence: 90 },
            withdrawal:     { score: 15,  confidence: 90 },
            hawkish:        { score: 15,  confidence: 90 },
        },
        biasMap: DEFAULT_BIAS_MAP,
        confidence: { known: 90, unknown: 50 },
    },

    global_liquidity: {
        // Fed/global central bank stance (string-driven)
        stanceMap: {
            easing:     { score: 100, confidence: 90 },
            qe:         { score: 100, confidence: 90 },
            neutral:    { score: 50,  confidence: 90 },
            tightening: { score: 10,  confidence: 90 },
            qt:         { score: 10,  confidence: 90 },
        },
        biasMap: DEFAULT_BIAS_MAP,
        confidence: { known: 90, unknown: 50 },
    },

    policy_tailwinds: {
        // Manual 0–10 scale × 10 = final score 0–100
        biasMap: DEFAULT_BIAS_MAP,
        confidence: { always: 70 },
    },

    reform_momentum: {
        // Manual 0–10 scale × 10 = final score 0–100
        biasMap: DEFAULT_BIAS_MAP,
        confidence: { always: 70 },
    },

    sovereign_risk: {
        // CDS spread in basis points; lower = safer
        absoluteBands: [
            { below: 100, score: 90, label: 'Very Low Risk' },
            { below: 150, score: 50, label: 'Moderate Risk' },
            { else: true, score: 10, label: 'Elevated Risk' },
        ],
        biasMap: DEFAULT_BIAS_MAP,
        confidence: { always: 80 },
    },
};
