/**
 * @file EarningsYieldCard.jsx
 * @purpose Displays the Earnings Yield fundamental indicator.
 *
 * DATA SOURCES:
 *  - currentYield    → LIVE: Upstox key-ratios API (if available), derived from Upstox P/E, or MANUAL (earnings_yield)
 *  - sectorYield     → LIVE: Upstox key-ratios API (derived from sector P/E)
 *  - bondYield       → MANUAL: 10Y Government Bond Yield for Equity Risk Premium (bond_yield)
 *
 * SCORING ENGINE:
 *  Compares current yield against historical averages and the risk-free rate (bond yield).
 */
import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

/**
 * Robust scoring engine for Earnings Yield.
 * 
 * Returns: { score: number, bias: string, confidence: string }
 */
function scoreEarningsYield(currentYield, historicalYield, bondYield) {
    if (!currentYield) {
        return { score: 0, bias: "Unknown", confidence: "0%" };
    }

    let score = 50;
    let bias = "Neutral";
    let confidence = "50%";
    let conditionsMet = 0;

    // 1. Compare vs Historical Average (Primary Weight)
    if (historicalYield) {
        conditionsMet++;
        if (currentYield >= historicalYield * 1.3) {
            score += 30; // Exceptionally high yield relative to history
        } else if (currentYield > historicalYield * 1.1) {
            score += 15; // Good yield
        } else if (currentYield <= historicalYield * 0.7) {
            score -= 30; // Very poor yield
        } else if (currentYield < historicalYield * 0.9) {
            score -= 15; // Poor yield
        }
    }

    // 2. Equity Risk Premium vs Bond Yield (Secondary Weight)
    if (bondYield) {
        conditionsMet++;
        const equityRiskPremium = currentYield - bondYield;
        
        if (equityRiskPremium >= 4.0) {
            score += 20; // Excellent premium over risk-free rate
        } else if (equityRiskPremium >= 2.0) {
            score += 10;
        } else if (equityRiskPremium < 0) {
            score -= 20; // Negative risk premium (bonds yield more than equities)
        } else if (equityRiskPremium < 1.0) {
            score -= 10; // Weak premium
        }
    }

    // Normalize Score
    score = Math.max(0, Math.min(100, score));

    // Determine Bias
    if (score >= 80) bias = "Strong Bullish";
    else if (score >= 60) bias = "Bullish";
    else if (score <= 20) bias = "Strong Bearish";
    else if (score <= 40) bias = "Bearish";
    else bias = "Neutral";

    // Determine Confidence
    if (conditionsMet === 2) confidence = "90%";
    else if (conditionsMet === 1) confidence = "70%";
    else confidence = "40%"; // Only have current Yield

    return { score, bias, confidence };
}

/**
 * Generates dynamic human-readable insights based on the mathematical relationships.
 */
function generateAiInsight(currentYield, historicalYield, bondYield) {
    if (!currentYield) {
        return "Insufficient data to analyze Earnings Yield. Waiting for Upstox feed or manual override.";
    }

    if (historicalYield && bondYield) {
        const erp = (currentYield - bondYield).toFixed(2);
        if (currentYield > historicalYield && currentYield > bondYield + 3) {
            return `Exceptionally attractive valuation. The stock is generating a yield above its historical norm and offers a robust Equity Risk Premium of ${erp}% over the risk-free rate.`;
        } else if (currentYield < historicalYield && currentYield < bondYield) {
            return `Severe valuation warning. The earnings yield has compressed below historical norms and is actually lower than the 10Y risk-free bond yield (${bondYield}%). Investors are not being compensated for equity risk.`;
        } else if (currentYield > bondYield) {
            return `Valuation is reasonable, offering an Equity Risk Premium of ${erp}%. However, compare this against historical norms to confirm structural attractiveness.`;
        } else {
            return `The earnings yield is struggling to keep pace with the risk-free rate, compressing the Equity Risk Premium.`;
        }
    }

    if (historicalYield) {
        if (currentYield > historicalYield * 1.1) return `The current earnings yield is expanding beyond historical averages, signaling potential undervaluation assuming earnings quality is stable.`;
        if (currentYield < historicalYield * 0.9) return `Yield compression relative to history suggests the stock is becoming expensive unless future growth accelerates significantly.`;
        return `Earnings yield is tracking closely with its historical average.`;
    }

    if (bondYield) {
        const erp = (currentYield - bondYield).toFixed(2);
        if (currentYield < bondYield) return `Negative Equity Risk Premium (${erp}%). Risk-free bonds currently offer a better yield than this equity.`;
        if (currentYield > bondYield + 4) return `Strong Equity Risk Premium (${erp}%). The stock offers significant compensation for equity risk compared to government bonds.`;
        return `Moderate Equity Risk Premium (${erp}%).`;
    }

    return `Current Earnings Yield is ${currentYield}%. Add 10Y Bond Yield in manual overrides to unlock Equity Risk Premium (ERP) analysis.`;
}

export default function EarningsYieldCard({ data = null, manualOverride, lastUpdated }) {
    // 1. Live Data Extraction (Upstox)
    const upstoxYieldObj = (Array.isArray(data?.ratios) ? data.ratios : []).find(r => r.name?.toLowerCase().includes("earning yield") || r.name?.toLowerCase().includes("earnings yield"));
    let parsedUpstoxYield = upstoxYieldObj?.company_value ? parseFloat(upstoxYieldObj.company_value) : null;
    let parsedSectorYield = upstoxYieldObj?.sector_value ? parseFloat(upstoxYieldObj.sector_value) : null;
    
    // If upstox doesn't provide Yield directly, derive it from P/E
    if (parsedUpstoxYield === null || isNaN(parsedUpstoxYield)) {
        const upstoxPEObj = (Array.isArray(data?.ratios) ? data.ratios : []).find(r => r.name === "P/E" || r.name === "PE" || r.name?.toLowerCase().includes("pe ratio"));
        const parsedPE = upstoxPEObj?.company_value ? parseFloat(upstoxPEObj.company_value) : null;
        if (parsedPE !== null && !isNaN(parsedPE) && parsedPE > 0) {
            parsedUpstoxYield = parseFloat(((1 / parsedPE) * 100).toFixed(2));
        }
        
        const parsedSectorPE = upstoxPEObj?.sector_value ? parseFloat(upstoxPEObj.sector_value) : null;
        if (parsedSectorPE !== null && !isNaN(parsedSectorPE) && parsedSectorPE > 0) {
            parsedSectorYield = parseFloat(((1 / parsedSectorPE) * 100).toFixed(2));
        }
    }

    // 2. Data Resolution
    const isLiveData = parsedUpstoxYield !== null && !isNaN(parsedUpstoxYield);
    const currentYield = isLiveData ? parsedUpstoxYield : (manualOverride ? parseFloat(manualOverride) : null);
    
    const historicalYield = null; // Removed to comply with Zero Clutter Rule
    const sectorYield = isLiveData ? parsedSectorYield : null;
    const bondYield = data?.manualBondYield ? parseFloat(data.manualBondYield) : null;

    // 3. Calculation Engine
    const { score, bias, confidence } = scoreEarningsYield(currentYield, historicalYield, bondYield);
    const aiInsightText = generateAiInsight(currentYield, historicalYield, bondYield);

    // 4. Configuration
    const configData = getIndicatorConfig('earnings_yield');

    return (
        <IndicatorCard
            config={{
                title: 'Earnings Yield',
                category: 'Valuation',
                mode: isLiveData ? 'AUTO' : 'MANUAL',
                creditScore: configData?.creditScore || 5,
                updateTime: lastUpdated || '--:--',
                source: isLiveData ? 'Upstox API' : 'Manual Override',
                aiModel: configData?.aiModel || 'Qwen3 8B'
            }}
            data={{
                currentValueObj: { 
                    label: 'Current Yield', 
                    value: currentYield !== null ? `${currentYield}%` : '--' 
                },
                details: [
                    sectorYield !== null && {
                        label: 'Sector Yield',
                        value: `${parseFloat(sectorYield).toFixed(2)}%`,
                        isManual: false,
                    },
                    bondYield !== null && {
                        label: '10Y Bond Yield',
                        value: `${parseFloat(bondYield).toFixed(2)}%`,
                        isManual: true,
                    }
                ].filter(Boolean),
                score: score || 0,
                bias: bias || 'Neutral',
                confidence: confidence || '0%',
                impactWeight: configData?.impactWeight || 5.0
            }}
            chartData={{
                points: [],
                valueKey: 'value',
                valueName: 'Yield (%)'
            }}
            insights={{
                aiInsight: aiInsightText,
                whyItMatters: [
                    'Inverts the P/E ratio for easier comparison to bond yields.',
                    'Helps calculate the Equity Risk Premium (ERP).',
                    'A yield lower than the risk-free rate indicates severe overvaluation.'
                ]
            }}
        />
    );
}
