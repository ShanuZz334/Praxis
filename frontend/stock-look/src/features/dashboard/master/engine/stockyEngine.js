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
    const isHighVol = volatilityState === "High" || volatilityState === "Elevated" || volatilityState === "Volatile";

    if (score >= 75) {
        return isHighVol ? "Volatile Breakout" : "Risk-On Trend";
    }
    if (score >= 60) {
        return isHighVol ? "Emotional Rally" : "Selective Bullish";
    }
    if (score >= 40) {
        return isHighVol ? "Choppy / Uncertain" : "Neutral / Range";
    }
    if (score >= 25) {
        return isHighVol ? "Liquidation Risk" : "Defensive / Hedge";
    }
    return "Capital Protection";
}

export function getRegimeColor(regime) {
    switch (regime) {
        case "Risk-On Trend":
        case "Volatile Breakout":
            return "text-emerald-600 dark:text-emerald-400 font-bold";
        case "Selective Bullish":
        case "Emotional Rally":
            return "text-emerald-500 font-bold";
        case "Neutral / Range":
        case "Choppy / Uncertain":
            return "text-amber-600 dark:text-amber-400 font-bold";
        case "Defensive / Hedge":
        case "Liquidation Risk":
            return "text-orange-600 dark:text-orange-400 font-bold";
        case "Capital Protection":
            return "text-red-600 dark:text-red-400 font-bold";
        default:
            return "text-text-primary";
    }
}
