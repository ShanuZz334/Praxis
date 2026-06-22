import React, { useState, useEffect, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { UserContext } from "@/shared/context/UserContext";

const INSIGHTS_DB = {
    master: [
        `Master AI: Market breadth is narrowing with negative momentum in small-caps. Volatility is elevated due to recent earnings misses.

Action: We are seeing a defensive rotation into healthcare and utilities. Consider adjusting portfolio beta and tightening stop losses.`,
        `Master AI: Heavy institutional accumulation is visible in defense and energy sectors. The VIX term structure remains in contango.

Outlook: Macro tailwinds are supporting energy producers. Look for breakout confirmations above key resistance levels before adding exposure.`,
        `Master AI: Global macro headwinds are increasing. The yield curve inversion continues to flash recessionary signals across major economies.

Strategy: Maintain a higher cash position and focus on high-quality dividend payers. Avoid high-multiple growth stocks until interest rate trajectories stabilize.`
    ],
    technical: [
        `Technical AI: Price action is testing major resistance at the 200-day moving average. RSI shows bearish divergence on the daily timeframe.

Observation: Volume is declining on up days, suggesting a lack of conviction from buyers. A breakdown below the 50-day moving average could trigger algorithmic selling.`,
        `Technical AI: A golden cross has formed on the hourly chart, supported by above-average volume. Momentum oscillators point upward.

Next Steps: Wait for a slight pullback to the 20-EMA for a safer entry. Upside targets sit near the previous swing high established last quarter.`,
        `Technical AI: Consolidation within a tight Bollinger Band range suggests an imminent breakout. Key support is holding strong at previous swing lows.

Key Levels: A daily close above the upper band will likely ignite a volatility expansion phase. Keep trailing stops tight if the breakout fails.`
    ],
    fundamental: [
        `Fundamental AI: Earnings revisions have trended positively for the tech sector, driven by AI hardware demand. Valuations remain stretched but supported by growth.

Analysis: Forward P/E multiples are at multi-year highs, making these names vulnerable to any earnings misses. Monitor upcoming CAPEX announcements closely.`,
        `Fundamental AI: Rising bond yields are putting pressure on high-duration growth stocks. Focus on companies with strong free cash flow yield.

Sectors: Value sectors such as Financials and Industrials are showing improved earnings quality. Debt-heavy companies face significant refinancing risks in this environment.`,
        `Fundamental AI: Profit margins are showing resilience despite inflationary pressures. Consumer discretionary is facing headwinds from slowing retail spending.

Focus: Companies with strong pricing power are successfully passing costs to consumers. Avoid retailers with high inventory levels and declining foot traffic metrics.`
    ],
    options: [
        `Options AI: Put/Call ratio has spiked, indicating extreme bearish sentiment which often precedes a contrarian rally. Implied volatility is elevated.

Flows: Smart money is selling downside puts to collect premium, suggesting a perceived floor in the near term. IV crush is expected post-earnings.`,
        `Options AI: Heavy call buying activity observed in out-of-the-money strikes expiring next week. Dealers are long gamma, suppressing realized volatility.

Strategy: The heavy gamma pinning suggests indices will remain range-bound. Iron condor or calendar spread strategies are currently favored over directional bets.`,
        `Options AI: Skew is flattening, suggesting reduced tail risk pricing. Dark pool prints show significant block trades occurring at the bid.

Execution: Consider financing long call positions by selling higher strike calls (bull call spreads) to mitigate theta decay while capturing potential upside.`
    ],
    events: [
        `Events AI: The upcoming FOMC meeting is the primary catalyst. Markets have fully priced in a rate pause, but the dot plot will drive direction.

Impact: Any hawkish surprises in the press conference could trigger a sharp sell-off in risk assets. Bond proxies and tech are highly sensitive to the terminal rate guidance.`,
        `Events AI: A cluster of high-impact macroeconomic data releases (CPI, PPI) this week could trigger significant sector rotation. Hedging is advised.

Preparation: Ensure portfolio delta is neutral heading into the prints. We expect a binary reaction where a hot inflation print will disproportionately hit rate-sensitive sectors.`,
        `Events AI: Geopolitical tensions are causing spikes in commodity prices. Watch for secondary impacts on global supply chains and inflation expectations.

Trading: Energy and materials are the primary beneficiaries of the current risk premium. Monitor shipping freight indices for early signs of supply chain bottlenecks.`
    ],
    foreign: [
        `Global AI: Emerging markets are outperforming developed markets due to a weakening US Dollar. Chinese equities are showing signs of bottoming following stimulus announcements.

Allocation: Consider increasing weightings in broad EM ETFs. Latin American markets are particularly attractive due to strong commodity exports and favorable valuations.`,
        `Global AI: European markets are facing headwinds from slowing manufacturing data. The ECB's hawkish tone is supporting the Euro but stifling growth.

Divergence: Peripheral European bonds are seeing spreads widen against the German Bund. Focus on defensive European multinationals with strong global revenue streams.`,
        `Global AI: Asian markets are mixed, with Japanese equities hitting new highs on corporate governance reforms. Cross-border capital flows are shifting rapidly.

Focus: The Bank of Japan's yield curve control policy remains a wild card. Exporters are benefiting from the weak Yen, but domestic consumption names are lagging.`
    ],
    default: [
        `AI Insight: Current market conditions suggest a balanced approach. Focus on risk management and wait for clearer directional signals.

Recommendation: Keep position sizing small and maintain strict stop losses. Do not aggressively add to losing positions in this choppy environment.`,
        `AI Insight: Sector rotation is underway. Momentum is fading in recent winners, presenting opportunities in undervalued defensive names.

Rotation: Capital is flowing from high-beta tech into consumer staples and healthcare. Rebalance your portfolio to align with the shifting relative strength.`,
        `AI Insight: Broad market indices are consolidating. Monitor key support levels and avoid aggressive positioning until volume confirms a breakout.

Action: Set price alerts at the upper and lower boundaries of the current range. Cash remains a viable position while waiting for a high-probability setup.`
    ]
};

let lastAnimationTime = 0;
let lastUserId = null;
let lastInsightCategory = null;
let currentInsightCache = INSIGHTS_DB.default[0];

export default function AiInsightSection({ 
    actionType = "Neutral", // Bullish, Bearish, Neutral, Cautious, etc.
    confidence = null 
}) {
    const { user } = useContext(UserContext);
    const [isAnalyzing, setIsAnalyzing] = useState(true);
    const [displayedText, setDisplayedText] = useState("");

    // Setup Colors based on actionType
    let glowColor = "rgba(59, 130, 246, 0.4)"; // Blue / Neutral
    let badgeColor = "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
    let textColor = "text-blue-600 dark:text-blue-400";
    
    const lowerAction = actionType.toLowerCase();
    if (lowerAction.includes("bull") || lowerAction.includes("long") || lowerAction.includes("accumulation")) {
        glowColor = "rgba(16, 185, 129, 0.4)"; // Emerald
        badgeColor = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
        textColor = "text-emerald-600 dark:text-emerald-400";
    } else if (lowerAction.includes("bear") || lowerAction.includes("short") || lowerAction.includes("risk")) {
        glowColor = "rgba(239, 68, 68, 0.4)"; // Red
        badgeColor = "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
        textColor = "text-red-600 dark:text-red-400";
    } else if (lowerAction.includes("caution") || lowerAction.includes("wait") || lowerAction.includes("vol") || lowerAction.includes("balance")) {
        glowColor = "rgba(245, 158, 11, 0.4)"; // Amber/Yellow
        badgeColor = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
        textColor = "text-amber-600 dark:text-amber-400";
    }

    // Determine category based on URL
    const path = window.location.pathname.toLowerCase();
    let category = "default";
    if (path.includes("/home") || path.endsWith("/dashboard")) category = "master";
    else if (path.includes("/technical")) category = "technical";
    else if (path.includes("/fundamental")) category = "fundamental";
    else if (path.includes("/options")) category = "options";
    else if (path.includes("/events")) category = "events";
    else if (path.includes("/foreign")) category = "foreign";

    // Simulate AI Generation
    useEffect(() => {
        const currentUserId = user?._id || null;
        const now = Date.now();
        const timeSinceLastAnim = now - lastAnimationTime;
        const isNewUser = currentUserId !== lastUserId;
        const isNewCategory = category !== lastInsightCategory;

        if (isNewUser || isNewCategory || timeSinceLastAnim > 5 * 60 * 1000) {
            const insights = INSIGHTS_DB[category];
            const randomIndex = Math.floor(Math.random() * insights.length);
            currentInsightCache = insights[randomIndex];

            lastAnimationTime = now;
            lastUserId = currentUserId;
            lastInsightCategory = category;

            setIsAnalyzing(true);
            setDisplayedText("");
            
            let typingInterval;
            
            // Simulating network/generation delay
            const timer = setTimeout(() => {
                setIsAnalyzing(false);
                
                // Typewriter Effect using substring to prevent missing letters due to React closures
                let i = 0;
                typingInterval = setInterval(() => {
                    i++;
                    if (i <= currentInsightCache.length) {
                        setDisplayedText(currentInsightCache.substring(0, i));
                    } else {
                        clearInterval(typingInterval);
                    }
                }, 10); // Speed of typing
                
            }, 1200);

            return () => {
                clearTimeout(timer);
                if (typingInterval) clearInterval(typingInterval);
            };
        } else {
            setIsAnalyzing(false);
            setDisplayedText(currentInsightCache);
        }
    }, [category, user?._id]);

    return (
        <div className="relative p-6 flex flex-col justify-center h-full group overflow-hidden bg-background-card">
            {/* Background Ambient Glow */}
            <motion.div 
                className="absolute inset-0 opacity-10 dark:opacity-20 transition-opacity duration-1000 group-hover:opacity-20 dark:group-hover:opacity-40"
                style={{ 
                    background: `radial-gradient(circle at 50% 50%, ${glowColor} 0%, transparent 70%)` 
                }}
            />
            
            <div className="relative z-10 flex flex-col h-full justify-center">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Sparkles className={`w-4 h-4 ${textColor} animate-pulse`} />
                        <span className="text-xs font-bold uppercase tracking-widest text-text-tertiary">AI Insight</span>
                    </div>
                    {confidence && (
                        <div className="text-[10px] px-2 py-0.5 rounded bg-background-surface border border-border-subtle text-text-secondary font-mono">
                            {confidence}% Conf
                        </div>
                    )}
                </div>

                {/* Primary Action / Posture */}
                <div className="flex items-center gap-3 mb-2 shrink-0">
                    <AnimatePresence mode="wait">
                        {isAnalyzing ? (
                            <motion.div 
                                key="analyzing-badge"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-xs px-2 py-1 rounded bg-background-surface text-text-tertiary border border-border-subtle animate-pulse font-mono"
                            >
                                COMPUTING...
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="action-badge"
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                                className={`text-sm font-bold px-3 py-1 rounded border uppercase tracking-wider ${badgeColor}`}
                            >
                                {actionType}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Insight Text Area */}
                <div className="relative mt-2 flex-grow flex items-start overflow-hidden">
                    <AnimatePresence mode="wait">
                        {isAnalyzing ? (
                            <motion.div 
                                key="skeleton"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="w-full space-y-2 mt-2"
                            >
                                <div className="h-2 bg-black/10 dark:bg-white/5 rounded w-3/4 animate-pulse"></div>
                                <div className="h-2 bg-black/10 dark:bg-white/5 rounded w-full animate-pulse delay-75"></div>
                                <div className="h-2 bg-black/10 dark:bg-white/5 rounded w-2/3 animate-pulse delay-150"></div>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="text"
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-sm text-text-secondary leading-relaxed font-medium whitespace-pre-wrap overflow-y-auto max-h-[140px] pr-2 custom-scrollbar"
                            >
                                {displayedText}
                                {displayedText.length < currentInsightCache.length && (
                                    <span className={`inline-block w-1.5 h-3.5 ml-1 animate-pulse align-middle bg-blue-400`} />
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
            
            {/* Animated border bottom line */}
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-black/5 dark:bg-white/5 overflow-hidden">
                <motion.div 
                    className={`h-full w-1/3 bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-50`}
                    animate={{
                        x: ['-100%', '300%']
                    }}
                    transition={{
                        repeat: Infinity,
                        duration: 3,
                        ease: "linear"
                    }}
                />
            </div>
        </div>
    );
}
