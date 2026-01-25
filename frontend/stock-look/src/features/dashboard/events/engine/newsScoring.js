export function calculateNewsImpact(newsItem) {
    if (!newsItem) return 0;

    // 1. Source Credibility (25%)
    let sourceScore = 5;
    const s = newsItem.source.toLowerCase();
    if (s.includes('bloomberg') || s.includes('reuters') || s.includes('rbi')) sourceScore = 10;
    else if (s.includes('nse') || s.includes('cnbc')) sourceScore = 8;
    else sourceScore = 4;

    // 2. Keyword Sentiment Analysis (AI Simulation) ("Direction")
    const sentiment = analyzeHeaderSentiment(newsItem.title, newsItem.takeaway);
    const directionMult = sentiment.bias === "Bullish" ? 1 : sentiment.bias === "Bearish" ? -1 : 0.2; // Neutral slight positive bias for normal news

    // 3. Significance Magnitude (0-10)
    // Based on tags or keywords
    const sensitivity = newsItem.sensitivity === 'High' ? 10 :
        newsItem.sensitivity === 'Medium' ? 6 : 3;

    // 4. Surprise Factor (20%)
    const surprise = newsItem.surpriseFactor || 5;

    // 5. Historical Reaction (20%)
    const history = newsItem.historicalReactionScore || 5;


    // Calculates MAGNITUDE (How big is the news?)
    const magnitude =
        (sourceScore * 0.20) +
        (sensitivity * 0.30) +
        (surprise * 0.25) +
        (history * 0.25);

    // Final Score = Magnitude * Direction (-10 to +10)
    const finalScore = parseFloat((magnitude * directionMult).toFixed(1));
    return finalScore;
}

// "AI" Simulation to determine Bullish/Bearish bias from text
function analyzeHeaderSentiment(title, takeaway) {
    const text = (title + " " + takeaway).toLowerCase();

    // Bearish Triggers
    const bearishKeywords = [
        "hike", "inflation", "war", "tension", "conflict", "crash", "plunge",
        "miss", "down", "spikes", "yields rise", "selling", "outflow", "ban",
        "restriction", "deficit", "debt", "insolvency", "default", "crisis", "fear"
    ];

    // Bullish Triggers
    const bullishKeywords = [
        "cut", "stimulus", "growth", "record", "beat", "rally", "up", "soars",
        "inflow", "buying", "acquisition", "expansion", "profit", "bonus",
        "dividend", "upgrade", "stable", "cools", "easing", "support"
    ];

    let score = 0;
    bearishKeywords.forEach(word => { if (text.includes(word)) score -= 1; });
    bullishKeywords.forEach(word => { if (text.includes(word)) score += 1; });

    if (score > 0) return { bias: "Bullish", score };
    if (score < 0) return { bias: "Bearish", score };
    return { bias: "Neutral", score };
}
