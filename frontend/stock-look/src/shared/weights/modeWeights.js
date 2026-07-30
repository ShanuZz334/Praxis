/**
 * @file modeWeights.js
 * @purpose 3 separate weight profiles for Positional / Swing / Intraday trading modes.
 *
 * Swing = the original FUNDAMENTAL_WEIGHTS baseline (most balanced).
 * Positional = heavier on valuation, earnings quality, financial health.
 * Intraday = heavier on liquidity flows, market breadth, global risk (VIX).
 *
 * getWeightsForMode(mode) returns the correct set for the active toggle.
 */

import { FUNDAMENTAL_WEIGHTS } from './fundamentalWeights.js';

// ─── POSITIONAL ───────────────────────────────────────────────────────────────
// Focus: Long-term fundamental quality. Entry-point valuation and balance
// sheet strength dominate. Holding period: weeks to months.
export const POSITIONAL_WEIGHTS = {
    company: {
        sections: {
            valuation: {
                pe_ratio:           0.25,
                forward_pe:         0.20,
                ev_ebitda:          0.15,
                pb_ratio:           0.15,
                earnings_yield:     0.10,
                relative_valuation: 0.10,
                analyst_consensus:  0.05,
            },
            earnings: {
                eps_growth:         0.45,
                revenue_growth:     0.35,
                profit_growth:      0.20,
            },
            macro: {
                gdp_growth:         1.00,
            },
            liquidity: {
                fii_dii_flow:       0.30,
                dividend_yield:     0.70,
            },
            ownership: {
                promoter_holding:   0.40,
                smart_money_flow:   0.25,
                earnings_quality:   0.20,
                corporate_actions:  0.15,
            },
            sector: {
                earnings_trend:     1.00,
            },
            corporate: {
                roe:                0.25,
                roce:               0.25,
                roa:                0.10,
                net_margin:         0.15,
                operating_margin:   0.15,
                cash_conversion:    0.10,
            },
            financial_health: {
                debt_to_equity:     0.30,
                interest_coverage:  0.30,
                free_cash_flow:     0.25,
                current_ratio:      0.15,
            },
        },
        composite: {
            valuation:  0.25,
            earnings:   0.25,
            corporate:  0.20,
            global:     0.12,
            ownership:  0.08,
            macro:      0.05,
            liquidity:  0.03,
            sector:     0.02,
        },
        penalties: {
            corporate_quality_gate: {
                thresholds: [
                    { below: 20, multiplier: 0.45 },
                    { below: 30, multiplier: 0.68 },
                    { below: 40, multiplier: 0.85 },
                ],
            },
        },
    },
    index: {
        sections: {
            valuation: {
                nifty_pe:       0.35,
                nifty_pb:       0.25,
                mcap_gdp:       0.20,
                earnings_yield: 0.15,
                dividend_yield: 0.05,
            },
            earnings: {
                eps_yoy:        0.35,
                forward_eps:    0.40,
                profit_margin:  0.25,
            },
            macro: {
                gdp:            0.40,
                cpi:            0.30,
                repo:           0.20,
                fiscal_deficit: 0.10,
            },
            liquidity: {
                fii:            0.20,
                dii:            0.15,
                fii_trend:      0.25,
                system_liquidity: 0.20,
                mf_flows:       0.20,
            },
            sector: {
                advance_decline:    0.25,
                sector_dashboard:   0.75,
            },
            corporate: {
                credit_growth:      0.50,
                corp_debt:          0.30,
                policy_tailwinds:   0.20,
            },
            global: {
                india_vix:          0.30,
                crude:              0.35,
                global_liq:         0.35,
            },
        },
        composite: {
            valuation:  0.28,
            earnings:   0.25,
            macro:      0.20,
            liquidity:  0.12,
            sector:     0.08,
            corporate:  0.05,
            global:     0.02,
        },
        caps: {
            vix_distress: {
                sectionId:      'global',
                triggerBelow:   15,
                maxComposite:   50,
            },
        },
    },
};

// ─── SWING (current baseline) ─────────────────────────────────────────────────
// Re-uses the existing calibrated defaults — no changes.
export const SWING_WEIGHTS = FUNDAMENTAL_WEIGHTS;

// ─── INTRADAY ─────────────────────────────────────────────────────────────────
// Focus: Same-day price action. Institutional flows, VIX, and market breadth
// dominate. Trailing valuation metrics (PE/PB) are irrelevant.
export const INTRADAY_WEIGHTS = {
    company: {
        sections: {
            valuation: {
                pe_ratio:           0.05,
                forward_pe:         0.35,
                ev_ebitda:          0.10,
                pb_ratio:           0.05,
                earnings_yield:     0.15,
                relative_valuation: 0.15,
                analyst_consensus:  0.15,
            },
            earnings: {
                eps_growth:         0.30,
                revenue_growth:     0.30,
                profit_growth:      0.40,
            },
            macro: {
                gdp_growth:         1.00,
            },
            liquidity: {
                fii_dii_flow:       0.75,
                dividend_yield:     0.25,
            },
            ownership: {
                promoter_holding:   0.15,
                smart_money_flow:   0.55,
                earnings_quality:   0.15,
                corporate_actions:  0.15,
            },
            sector: {
                earnings_trend:     1.00,
            },
            corporate: {
                roe:                0.15,
                roce:               0.15,
                roa:                0.10,
                net_margin:         0.20,
                operating_margin:   0.20,
                cash_conversion:    0.20,
            },
            financial_health: {
                debt_to_equity:     0.20,
                interest_coverage:  0.20,
                free_cash_flow:     0.35,
                current_ratio:      0.25,
            },
        },
        composite: {
            liquidity:  0.25,
            sector:     0.18,
            corporate:  0.12,
            ownership:  0.12,
            global:     0.12,
            valuation:  0.10,
            earnings:   0.07,
            macro:      0.04,
        },
        penalties: {
            corporate_quality_gate: {
                thresholds: [
                    { below: 10, multiplier: 0.60 },
                    { below: 20, multiplier: 0.80 },
                    { below: 30, multiplier: 0.93 },
                ],
            },
        },
    },
    index: {
        sections: {
            valuation: {
                nifty_pe:       0.15,
                nifty_pb:       0.10,
                mcap_gdp:       0.20,
                earnings_yield: 0.30,
                dividend_yield: 0.25,
            },
            earnings: {
                eps_yoy:        0.30,
                forward_eps:    0.50,
                profit_margin:  0.20,
            },
            macro: {
                gdp:            0.20,
                cpi:            0.40,
                repo:           0.30,
                fiscal_deficit: 0.10,
            },
            liquidity: {
                fii:            0.30,
                dii:            0.25,
                fii_trend:      0.25,
                system_liquidity: 0.15,
                mf_flows:       0.05,
            },
            sector: {
                advance_decline:    0.55,
                sector_dashboard:   0.45,
            },
            corporate: {
                credit_growth:      0.40,
                corp_debt:          0.25,
                policy_tailwinds:   0.35,
            },
            global: {
                india_vix:          0.65,
                crude:              0.20,
                global_liq:         0.15,
            },
        },
        composite: {
            liquidity:  0.30,
            global:     0.20,
            sector:     0.18,
            macro:      0.12,
            valuation:  0.08,
            earnings:   0.07,
            corporate:  0.05,
        },
        caps: {
            vix_distress: {
                sectionId:      'global',
                triggerBelow:   25,
                maxComposite:   40,
            },
        },
    },
};

// ─── Selector ─────────────────────────────────────────────────────────────────
/**
 * Returns the correct weight set for the given trading mode.
 * @param {'positional'|'swing'|'intraday'} mode
 * @returns {Object} FUNDAMENTAL_WEIGHTS-shaped object
 */
export function getWeightsForMode(mode = 'swing') {
    switch (mode) {
        case 'positional': return POSITIONAL_WEIGHTS;
        case 'intraday':   return INTRADAY_WEIGHTS;
        case 'swing':
        default:           return SWING_WEIGHTS;
    }
}
