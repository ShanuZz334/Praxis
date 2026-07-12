/**
 * Real-time Options Engine
 * Computes high-level actionable cards from live options chain data.
 */

export function generateLiveCards(chain, spotPrice, metrics) {
    if (!chain || chain.length === 0) return [];
    
    const cards = [];
    
    // 1. PCR Sentiment
    const pcr = metrics?.pcr || 1;
    const pcrValue = pcr.toFixed(2);
    let pcrStatus, pcrDesc, pcrNorm;
    if (pcr > 1.2) {
        pcrStatus = "Bullish";
        pcrDesc = "Heavy put writing indicates strong floor support.";
        pcrNorm = 0.8;
    } else if (pcr < 0.7) {
        pcrStatus = "Bearish";
        pcrDesc = "Call writers dominate, indicating overhead resistance.";
        pcrNorm = -0.8;
    } else {
        pcrStatus = "Neutral";
        pcrDesc = "Balanced put/call open interest.";
        pcrNorm = 0.1;
    }
    cards.push({
        id: "pcr_sentiment",
        label: "PCR Momentum",
        category: "sentiment",
        value: pcrValue,
        status: pcrStatus,
        description: pcrDesc,
        normalized: pcrNorm,
        weight: 1.5,
        type: "metric"
    });

    // 2. Call Wall Resistance
    let highestCallOi = 0;
    let callWallStrike = 0;
    chain.forEach(row => {
        if (row.call && row.call.oi > highestCallOi) {
            highestCallOi = row.call.oi;
            callWallStrike = row.strike;
        }
    });
    
    if (callWallStrike > 0) {
        const dist = ((callWallStrike - spotPrice) / spotPrice * 100).toFixed(1);
        cards.push({
            id: "call_wall",
            label: "Call Wall Resistance",
            category: "flows",
            value: `₹${callWallStrike}`,
            status: "Resistance",
            description: `Highest CE Open Interest creating a ceiling ${dist}% away.`,
            normalized: -0.6,
            weight: 2,
            type: "metric"
        });
    }

    // 3. Put Base Support
    let highestPutOi = 0;
    let putBaseStrike = 0;
    chain.forEach(row => {
        if (row.put && row.put.oi > highestPutOi) {
            highestPutOi = row.put.oi;
            putBaseStrike = row.strike;
        }
    });

    if (putBaseStrike > 0) {
        const dist = ((spotPrice - putBaseStrike) / spotPrice * 100).toFixed(1);
        cards.push({
            id: "put_base",
            label: "Put Base Support",
            category: "flows",
            value: `₹${putBaseStrike}`,
            status: "Support",
            description: `Highest PE Open Interest providing a floor ${dist}% away.`,
            normalized: 0.6,
            weight: 2,
            type: "metric"
        });
    }

    // 4. Max Pain Gravitation
    if (metrics?.maxPain) {
        const diff = spotPrice - metrics.maxPain;
        const diffAbs = Math.abs(diff).toFixed(1);
        cards.push({
            id: "max_pain",
            label: "Max Pain Gravity",
            category: "sentiment",
            value: `₹${Math.round(metrics.maxPain)}`,
            status: diff > 0 ? "Pulling Down" : "Pulling Up",
            description: `Spot is ₹${diffAbs} away from the max pain strike.`,
            normalized: diff > 0 ? -0.4 : 0.4,
            weight: 1.2,
            type: "metric"
        });
    }

    return cards;
}
