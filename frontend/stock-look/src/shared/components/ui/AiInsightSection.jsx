/**
 * @file AiInsightSection.jsx
 * @purpose The AI Insight panel inside GlobalHeader — powers all 7 page-level header insights.
 *
 * Previously used a hardcoded INSIGHTS_DB with static fake text.
 * Now wired to the real AI Gateway via useCardInsight:
 *   - Each page variant has a unique targetId
 *   - Prompts are managed in Prompts Studio (PAI tab)
 *   - Insights are persisted to AiChatThread with scope='page'
 *   - Regenerates when the score/regime changes materially
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw, Volume2 } from "lucide-react";
import { useCardInsight } from "@/shared/hooks/useCardInsight";
import { useDataRegistry } from "@/shared/context/DataRegistryContext";
import { useVoice } from "@/shared/context/VoiceContext";
import PortalTooltip from "@/shared/components/ui/PortalTooltip";
import AiInsightModal from "@/shared/components/ui/AiInsightModal";
import { FO_EQUITIES, FO_INDICES } from "@/shared/utils/foInstruments";
import { getCompositeColor } from "@/shared/config/scoreColors";

function resolveReadableSymbol(instrumentKey) {
    if (!instrumentKey) return null;
    const match = FO_EQUITIES.find(e => e.value === instrumentKey) || FO_INDICES.find(i => i.value === instrumentKey);
    if (match) return match.label;
    const parts = instrumentKey.split('|');
    return parts.length > 1 ? parts[1] : instrumentKey;
}

// ─── Resolve targetId from URL path + instrument mode ─────────────────────────
function resolveTargetId(path, isIndex) {
    if (path.includes("/home") || path.endsWith("/dashboard")) return "praxis_composite_header";
    if (path.includes("/technical")) return isIndex ? "technical_index_header" : "technical_company_header";
    if (path.includes("/fundamental")) return isIndex ? "fundamentals_index_header" : "fundamentals_company_header";
    if (path.includes("/options")) return "options_header";
    if (path.includes("/foreign") || path.includes("/global")) return "foreign_header";
    if (path.includes("/events")) return "events_header";
    return "praxis_composite_header";
}

// ─── Resolve registry pageId from URL path ────────────────────────────────────
function resolvePageId(path) {
    if (path.includes("/technical"))                          return 'technical';
    if (path.includes("/fundamental"))                        return 'fundamentals';
    if (path.includes("/options"))                            return 'options';
    if (path.includes("/foreign") || path.includes("/global")) return 'foreign';
    if (path.includes("/events"))                             return 'events';
    return 'master';
}

// Global cache to prevent re-generating insights across tab switches unless score moves by >= 5 points
let globalInsightCache = {};
try {
    const stored = localStorage.getItem('praxis_ai_insight_cache');
    if (stored) {
        globalInsightCache = JSON.parse(stored);
    }
} catch (e) {
    console.warn("Failed to load insight cache", e);
}

export default function AiInsightSection({
    actionType = "Neutral",
    confidence = null,
    // Page context props — passed from GlobalHeader
    score = null,
    regime = null,
    bulls = null,
    bears = null,
    neutrals = null,
    stockSymbol = null,
    isIndex = false,
    coveragePercent = 100,
    cards = [],
    sections = [],
    masterPayload = null,
}) {
    const path = window.location.pathname.toLowerCase();
    const targetId = resolveTargetId(path, isIndex);
    const resolvedPageId = resolvePageId(path);
    const colorHex = getCompositeColor(score).hex;

    // ── Registry (provides richer card-level pageData grouped by section) ────
    const { getPageStructuredData } = useDataRegistry();
    const { synthesize, skipTts, status } = useVoice();
    const isSpeaking = status === 'speaking';

    // ── AI Hook ──────────────────────────────────────────────────────────────
    const { insight, isLoading, error, generate, meta } = useCardInsight(targetId);

    // Track last generated state to avoid redundant re-calls on minor fluctuations
    const lastStateRef = useRef({ score: null, symbol: null, regime: null });
    const hasGeneratedRef = useRef(false);
    const [displayedText, setDisplayedText] = useState("");
    const [isRestoredFromCache, setIsRestoredFromCache] = useState(false);

    // ── Restore from Global Cache on Mount ──
    const currentSymbol = resolveReadableSymbol(stockSymbol) || "Market";
    const cacheKey = `${targetId}_${currentSymbol}`;

    useEffect(() => {
        const cached = globalInsightCache[cacheKey];
        if (cached) {
            // Restore state to prevent auto-trigger when switching tabs
            hasGeneratedRef.current = true;
            lastStateRef.current = { score: cached.score, symbol: cached.symbol, regime: cached.regime };
            setDisplayedText(cached.insightText);
            setIsRestoredFromCache(true);
        } else {
            // Reset state for new cache key so it can correctly generate
            hasGeneratedRef.current = false;
            lastStateRef.current = { score: null, symbol: null, regime: null };
            setDisplayedText("");
            setIsRestoredFromCache(false);
        }
    }, [cacheKey]);

    const triggerGenerate = useCallback((forceOrEvent) => {
        if (score === null || score === undefined) return;
        if (coveragePercent < 75) return;

        const isForce = forceOrEvent === true || (forceOrEvent && forceOrEvent.type === 'click');
        const currentScore = typeof score === 'number' ? score : parseFloat(score) || 0;
        
        const { score: lastScore, symbol: lastSymbol, regime: lastRegime } = lastStateRef.current;

        // Only regenerate if user manually clicked, symbol changed, OR score moved by >= 5 points, OR regime changed
        const isSignificantScoreChange = lastScore === null || Math.abs(currentScore - lastScore) >= 5;
        const isSymbolChange = currentSymbol !== lastSymbol;
        const isRegimeChange = actionType !== lastRegime;
        
        // Ignore drops to exactly 0 unless forced, as they are usually websocket data-loading blips
        if (currentScore === 0 && !isForce) return;

        if (!isForce && hasGeneratedRef.current && !isSignificantScoreChange && !isSymbolChange && !isRegimeChange) {
            return; // Cache hit: change is too minor to warrant a new AI insight
        }

        // Update tracking state *before* generating so repeated triggers are blocked
        lastStateRef.current = { score: currentScore, symbol: currentSymbol, regime: actionType };
        hasGeneratedRef.current = true;

        // ── Extract sub-engine scores from masterPayload.engines (for Master header)
        const engineScoreLines = (masterPayload?.engines || []).flatMap(eng => {
            const n = (eng.name || '').toLowerCase();
            if (n.includes('fundamental')) return [`FundScore: ${eng.score}`];
            if (n.includes('technical'))   return [`TechScore: ${eng.score}`];
            if (n.includes('option'))      return [`OptsScore: ${eng.score}`];
            if (n.includes('global') || n.includes('foreign') || n.includes('macro'))
                                           return [`GlobScore: ${eng.score}`];
            if (n.includes('event'))       return [`EvtScore: ${eng.score}`];
            return [];
        });

        // ── Fix: use exact key names that parseAdditionalContext() expects ────────
        const contextLines = [
            `Regime: ${actionType}`,
            confidence != null ? `Confidence: ${confidence}%` : null,
            `Score: ${currentScore.toFixed(0)}`,
            bulls    != null ? `Bulls: ${bulls}`    : null,
            bears    != null ? `Bears: ${bears}`    : null,
            neutrals != null ? `Neutrals: ${neutrals}` : null,
            ...engineScoreLines,
        ].filter(Boolean).join(" | ");

        // ── Build pageData from DataRegistry — hierarchical sections/cards ─────────
        const structuredData = getPageStructuredData(resolvedPageId);
        const hasStructuredData = structuredData.sections?.some(s => s.cards?.length > 0);

        const pageData = hasStructuredData
            ? structuredData
            : masterPayload
                ? masterPayload
                : {
                    sections: sections.map(s => ({ name: s.label, score: s.score })),
                    cards: cards.map(c => ({ id: c.id, name: c.title || c.id, score: c.normalized, signal: c.state?.label, weight: c.credit }))
                };

        generate({
            value: typeof score === 'number' ? score.toFixed(0) : score,
            displayName: targetId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            stockSymbol: currentSymbol,
            scope: 'page',
            additionalContext: contextLines,
            pageData: pageData
        });
    }, [targetId, score, actionType, confidence, bulls, bears, neutrals, stockSymbol, generate,
        coveragePercent, cards, sections, masterPayload, getPageStructuredData, resolvedPageId, currentSymbol]);

    const [isReadyToGenerate, setIsReadyToGenerate] = useState(false);

    useEffect(() => {
        // Wait for websocket data to fully populate before allowing generation
        const timer = setTimeout(() => setIsReadyToGenerate(true), 1500);
        return () => clearTimeout(timer);
    }, []);

    // Auto-trigger when score becomes available
    // Re-run on score or coverage changes
    useEffect(() => {
        if (isReadyToGenerate && coveragePercent >= 75) {
            // Debounce generation by 1.5s so we don't double-fire while
            // complex multi-part websockets (like the Master Dashboard) are still loading in.
            const timer = setTimeout(() => {
                triggerGenerate();
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [score, stockSymbol, actionType, triggerGenerate, coveragePercent, isReadyToGenerate]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const handleCloseModal = useCallback(() => setIsModalOpen(false), []);
    const intervalRef = useRef(null);
    const prevInsightRef = useRef(null);

    // Extract insight, stripping out markdown formatting like ### and **
    const cleanInsight = insight ? insight.replace(/[#*]/g, '').trim() : "";
    const aiSummary = "";
    const aiBody = cleanInsight;

    useEffect(() => {
        if (!insight || insight === prevInsightRef.current) return;
        prevInsightRef.current = insight;
        
        // Save to global cache so tab switching doesn't wipe it
        const currentScore = typeof score === 'number' ? score : parseFloat(score) || 0;
        globalInsightCache[cacheKey] = {
            score: currentScore,
            symbol: currentSymbol,
            regime: actionType,
            insightText: cleanInsight
        };
        try {
            localStorage.setItem('praxis_ai_insight_cache', JSON.stringify(globalInsightCache));
        } catch (e) {
            console.warn("Failed to save insight cache", e);
        }

        // Clear previous interval
        if (intervalRef.current) clearInterval(intervalRef.current);
        
        setDisplayedText(""); // Reset text for typing effect
        setIsRestoredFromCache(false); // We just generated a new one, so type it out!
        
        let i = 0;
        intervalRef.current = setInterval(() => {
            if (i < cleanInsight.length) {
                setDisplayedText(cleanInsight.substring(0, i + 1));
                i++;
            } else {
                clearInterval(intervalRef.current);
            }
        }, 8);

        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [insight, aiBody, meta, score, currentSymbol, actionType, cacheKey, cleanInsight]);

    // Safety measure: if the currently displayed insight was generated for a wildly different score 
    // (e.g. before the rest of the Master Dashboard finished loading), instantly hide the outdated text 
    // so the user doesn't see a blatant contradiction while waiting for the new insight to generate.
    const currentScore = typeof score === 'number' ? score : parseFloat(score) || 0;
    const isOutdated = lastStateRef.current.score !== null && Math.abs(currentScore - lastStateRef.current.score) >= 5;

    const isTyping = insight && displayedText.length < aiBody.length;
    const showSkeleton = (isLoading && !insight) || isOutdated;

    return (
        <>
        <div 
            className="absolute inset-0 p-6 flex flex-col justify-center group overflow-hidden bg-background-card cursor-pointer"
            onDoubleClick={() => setIsModalOpen(true)}
            title="Double click to open interactive chat"
        >
            {/* Background Ambient Glow */}
            <motion.div
                className="absolute inset-0 opacity-10 dark:opacity-20 transition-opacity duration-1000 group-hover:opacity-20 dark:group-hover:opacity-40"
                style={{ background: `radial-gradient(circle at 50% 50%, ${colorHex}40 0%, transparent 70%)` }}
            />

            <div className="relative z-10 flex flex-col h-full justify-between">
                {/* Header Row */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Sparkles 
                            className={`w-4 h-4 ${isLoading ? 'animate-spin' : 'animate-pulse'}`} 
                            style={{ color: colorHex }} 
                        />
                        <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-text-tertiary">
                            AI Insight
                        </span>
                        {!isLoading && displayedText && (
                            <PortalTooltip content={<div className="text-xs text-text-secondary">Read Aloud</div>}>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (isSpeaking) {
                                            skipTts();
                                        } else {
                                            const text = cleanInsight || displayedText;
                                            if (text) synthesize(text.replace(/[#*]/g, '').trim());
                                        }
                                    }}
                                    className={`p-1.5 hover:bg-background-surface rounded-md transition-colors ${isSpeaking ? 'text-purple-400' : 'text-text-tertiary hover:text-text-primary'}`}
                                >
                                    <Volume2 className="w-3.5 h-3.5" />
                                </button>
                            </PortalTooltip>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {confidence && (
                            <PortalTooltip content={<div className="text-xs text-text-secondary">Model Confidence Level</div>}>
                                <div className="text-[10px] px-2 py-0.5 rounded bg-background-surface border border-border-subtle text-text-secondary font-mono cursor-help">
                                    {confidence}% Conf
                                </div>
                            </PortalTooltip>
                        )}
                        {/* Manual refresh button */}
                        {!isLoading && coveragePercent >= 90 && (
                            <PortalTooltip content={<div className="text-xs text-text-secondary">Regenerate insight</div>}>
                                <button
                                    onClick={triggerGenerate}
                                    className="text-text-tertiary hover:text-text-primary transition-colors p-1 rounded hover:bg-background-surface"
                                >
                                    <RefreshCw className="w-3 h-3" />
                                </button>
                            </PortalTooltip>
                        )}
                    </div>
                </div>

                {/* Action Badge / AI Summary */}
                <div className="flex items-center gap-3 mb-2 shrink-0">
                    <AnimatePresence mode="wait">
                        {coveragePercent < 75 ? (
                            <motion.div
                                key="low-coverage-title"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-sm font-semibold tracking-wide text-text-tertiary"
                            >
                                AI Insight Unavailable
                            </motion.div>
                        ) : isLoading ? (
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
                            aiSummary && (
                                <motion.div
                                    key="ai-summary"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="text-sm font-semibold tracking-wide line-clamp-2"
                                    style={{ color: colorHex }}
                                >
                                    {aiSummary}
                                </motion.div>
                            )
                        )}
                    </AnimatePresence>
                </div>

                {/* Insight Text */}
                <div className="relative mt-2 flex-grow flex items-start overflow-hidden">
                    <AnimatePresence mode="wait">
                        {coveragePercent < 75 ? (
                            <motion.div
                                key="low-coverage-body"
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-[13px] text-text-tertiary leading-relaxed font-medium italic"
                            >
                                Not enough data. AI Synthesis requires at least 75% indicator coverage to generate a reliable market regime analysis. Current coverage is {Math.round(coveragePercent)}%.
                            </motion.div>
                        ) : showSkeleton ? (
                            <motion.div
                                key="skeleton"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="w-full space-y-2 mt-2"
                            >
                                <div className="h-2 bg-black/10 dark:bg-white/5 rounded w-3/4 animate-pulse" />
                                <div className="h-2 bg-black/10 dark:bg-white/5 rounded w-full animate-pulse delay-75" />
                                <div className="h-2 bg-black/10 dark:bg-white/5 rounded w-2/3 animate-pulse delay-150" />
                            </motion.div>
                        ) : error ? (
                            <motion.div
                                key="error"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-xs text-text-tertiary italic mt-2"
                            >
                                Insight temporarily unavailable. Check AI provider settings.
                            </motion.div>
                        ) : (
                            <motion.div
                                key="text"
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-[13px] text-text-secondary leading-relaxed font-medium whitespace-pre-wrap overflow-y-auto h-full max-h-[175px] pr-2 custom-scrollbar"
                            >
                                {displayedText || (
                                    <span className="text-text-tertiary italic text-xs">
                                        {score != null ? "Generating insight..." : "Waiting for data..."}
                                    </span>
                                )}
                                {isTyping && (
                                    <span 
                                        className="inline-block w-1.5 h-3.5 ml-1 animate-pulse align-middle" 
                                        style={{ backgroundColor: colorHex }}
                                    />
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Animated border line */}
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-black/5 dark:bg-white/5 overflow-hidden">
                <motion.div
                    className="h-full w-1/3 opacity-50"
                    style={{ backgroundImage: `linear-gradient(to right, transparent, ${colorHex}, transparent)` }}
                    animate={{ x: ['-100%', '300%'] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                />
            </div>
        </div>
        
        <AiInsightModal 
            open={isModalOpen} 
            onClose={handleCloseModal} 
            targetId={targetId} 
        />
        </>
    );
}
