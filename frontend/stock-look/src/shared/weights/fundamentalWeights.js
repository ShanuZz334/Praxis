/**
 * @file fundamentalWeights.js
 * @purpose Single source of truth for ALL weight values in the Fundamentals engine.
 *
 * @structure
 *   FUNDAMENTAL_WEIGHTS
 *     .company
 *       .sections.<sectionName>.<cardId>  — card weight within the section
 *       .composite.<sectionId>            — section weight in the final composite
 *       .penalties                        — special penalty gates
 *     .index
 *       .sections.<sectionName>.<cardId>
 *       .composite.<sectionId>
 *       .caps                             — composite caps (e.g. VIX distress cap)
 *
 * HOW TO TUNE:
 *   - Increase a card's section weight to give it more influence in its section.
 *   - Increase a section's composite weight to boost that section's pull on the final score.
 *   - Weights within a section do NOT need to sum to 1.0 (engine normalises them).
 *   - Composite section weights ARE normalised by the engine — but keeping them summing
 *     to ~1.0 makes the numbers intuitive.
 */

export const FUNDAMENTAL_WEIGHTS = {

    // ═══════════════════════════════════════════════════════════════════════════
    // COMPANY MODE
    // ═══════════════════════════════════════════════════════════════════════════
    company: {

        /**
         * Card weights WITHIN each section.
         * Key = card id (matches CARD_REGISTRY.xxx.id)
         * Value = relative weight (engine normalises, so ratios matter, not absolute sum)
         */
        sections: {

            valuation: {
                pe_ratio:           0.20,
                forward_pe:         0.20,
                ev_ebitda:          0.15,
                pb_ratio:           0.10,
                earnings_yield:     0.10,
                relative_valuation: 0.10,
                analyst_consensus:  0.15,
            },

            earnings: {
                eps_growth:         0.40,
                revenue_growth:     0.35,
                profit_growth:      0.25,
            },

            macro: {
                gdp_growth:         1.00,
            },

            liquidity: {
                fii_dii_flow:       0.50,
                dividend_yield:     0.50,
            },

            ownership: {
                promoter_holding:   0.35,
                smart_money_flow:   0.35,
                earnings_quality:   0.15,
                corporate_actions:  0.15,
            },

            sector: {
                earnings_trend:     1.00,
            },

            corporate: {
                roe:                0.20,
                roce:               0.20,
                roa:                0.10,
                net_margin:         0.15,
                operating_margin:   0.15,
                cash_conversion:    0.20,
            },

            // "Financial Health" — maps to the 'global' section id in the engine
            financial_health: {
                debt_to_equity:     0.25,
                interest_coverage:  0.25,
                free_cash_flow:     0.20,
                current_ratio:      0.10,
            },
        },

        /**
         * Section weights in the COMPOSITE score.
         * These drive how much each section pulls on the final 0–100 composite.
         */
        composite: {
            valuation:        0.20,
            earnings:         0.22,
            macro:            0.05,
            liquidity:        0.07,
            ownership:        0.10,
            sector:           0.08,
            corporate:        0.18,
            global:           0.10,   // 'global' id = Financial Health section
        },

        /**
         * Penalty gates — special multipliers applied to a section's score
         * based on a "quality floor" metric.
         * Format: { metric, thresholds: [{ below, multiplier }] }
         * Applied to: corporate section, using min(ROE score, ROCE score)
         */
        penalties: {
            corporate_quality_gate: {
                // metric: the section minimum quality score (min of ROE, ROCE)
                thresholds: [
                    { below: 15, multiplier: 0.50 },
                    { below: 25, multiplier: 0.72 },
                    { below: 35, multiplier: 0.88 },
                ],
            },
        },
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // INDEX MODE
    // ═══════════════════════════════════════════════════════════════════════════
    index: {

        sections: {

            valuation: {
                nifty_pe:           0.30,
                nifty_pb:           0.20,
                mcap_gdp:           0.20,
                earnings_yield:     0.20,
                dividend_yield:     0.10,
            },

            earnings: {
                eps_yoy:            0.40,
                forward_eps:        0.40,
                profit_margin:      0.20,
            },

            macro: {
                gdp:                0.35,
                cpi:                0.35,
                repo:               0.15,
                fiscal_deficit:     0.15,
            },

            liquidity: {
                fii:                0.25,
                dii:                0.20,
                fii_trend:          0.25,
                system_liquidity:   0.15,
                mf_flows:           0.15,
            },

            sector: {
                advance_decline:    0.30,
                sector_dashboard:   0.70,
            },

            corporate: {
                credit_growth:      0.50,
                corp_debt:          0.25,
                policy_tailwinds:   0.25,
            },

            global: {
                india_vix:          0.50,
                crude:              0.25,
                global_liq:         0.25,
            },
        },

        /**
         * Section weights in the COMPOSITE score for Index mode.
         */
        composite: {
            valuation:  0.20,
            earnings:   0.20,
            macro:      0.15,
            liquidity:  0.20,
            sector:     0.10,
            corporate:  0.05,
            global:     0.05,    // VIX-dominated section
        },

        /**
         * Composite caps — override the composite ceiling when a trigger section
         * falls into extreme distress.
         */
        caps: {
            vix_distress: {
                // If the 'global' section score drops below triggerBelow,
                // the entire composite is capped at maxComposite.
                sectionId:      'global',
                triggerBelow:   20,
                maxComposite:   45,
            },
        },
    },
};
