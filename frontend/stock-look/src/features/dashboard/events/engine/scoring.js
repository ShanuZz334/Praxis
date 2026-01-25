export function calculateEventSelfScore(event) {
    if (!event) return 0;

    // 1. Historical Volatility Reaction (30%)
    // Normalized 0-10 based on past IV spikes or Nifty moves
    const histVol = event.historicalImpact?.ivSpike || 0; // e.g., 15% -> 
    const volScore = Math.min(10, histVol / 2); // 20% spike = 10/10

    // 2. Surprise Magnitude Factor (25%)
    // How often does this event surprise? (Manual weight for now)
    const surpriseWeight = event.surpriseFrequency || 5; // 0-10

    // 3. Index Sensitivity (20%)
    // High for macro, low for specific midcaps
    const sensitivity = event.marketSensitivity === 'High' ? 10 :
        event.marketSensitivity === 'Medium' ? 6 : 3;

    // 4. Frequency Penalty (15%)
    // Rare events (Budget) > Monthly (CPI) > Weekly
    const freqScore = event.frequency === 'Annual' ? 10 :
        event.frequency === 'Quarterly' ? 8 :
            event.frequency === 'Monthly' ? 5 : 2;

    // 5. Global Spillover (10%)
    const globalScore = event.globalCorrelation || 0;

    // Weighted Sum
    const rawScore =
        (volScore * 0.30) +
        (surpriseWeight * 0.25) +
        (sensitivity * 0.20) +
        (freqScore * 0.15) +
        (globalScore * 0.10);

    return parseFloat(rawScore.toFixed(1));
}
