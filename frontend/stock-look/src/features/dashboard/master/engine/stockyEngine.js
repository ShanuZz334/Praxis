export function calculateStockyScore(components) {
    // Weights
    const W = {
        technical: 0.30,
        options: 0.25,
        fundamental: 0.20,
        global: 0.15,
        events: 0.10
    };

    // Calculate weighted sum
    // Note: Events Score is often "Risk". If 40 means "High Risk", we might need to invert it for a "Bullish Score".
    // For this engine, let's assume the inputs are all normalized to 0-100 "Bullishness/Health".
    // If Event Score 40 means "Caution", it pulls the total down.

    let score =
        (components.technical * W.technical) +
        (components.options * W.options) +
        (components.fundamental * W.fundamental) +
        (components.events * W.events) +
        (components.global * W.global);

    return Math.round(score);
}

export function deriveMasterRegime(score, volatilityState) {
    if (score >= 75) return "Conviction Buy";
    if (score >= 60) return "Selective Bullish";
    if (score >= 40) return "Neutral / Range";
    if (score >= 25) return "Defensive / Hedge";
    return "Capital Protection";
}

export function getRegimeColor(regime) {
    switch (regime) {
        case "Conviction Buy": return "text-emerald-400";
        case "Selective Bullish": return "text-green-300";
        case "Neutral / Range": return "text-yellow-400";
        case "Defensive / Hedge": return "text-orange-400";
        case "Capital Protection": return "text-red-500";
        default: return "text-white";
    }
}
