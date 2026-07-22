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
import { Sparkles, RefreshCw } from "lucide-react";
import { useCardInsight } from "@/shared/hooks/useCardInsight";
import { useDataRegistry } from "@/shared/context/DataRegistryContext";
import PortalTooltip from "@/shared/components/ui/PortalTooltip";

// ─── Resolve targetId from URL path + instrument mode ─────────────────────────
function resolveTargetId(path, isIndex) {
    if (path.includes("/home") || path.endsWith("/dashboard")) return "master_header";
    if (path.includes("/technical")) return isIndex ? "technical_index_header" : "technical_company_header";
    if (path.includes("/fundamental")) return isIndex ? "fundamentals_index_header" : "fundamentals_company_header";
    if (path.includes("/options")) return "options_header";
    if (path.includes("/foreign") || path.includes("/global")) return "foreign_header";
    if (path.includes("/events")) return "events_header";
    return "master_header";
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

import { getCompositeColor } from "@/shared/config/scoreColors";

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

    // ── Registry (provides richer card-level pageData) ────────────────────────
    const { getPageSnapshot } = useDataRegistry();

    // ── AI Hook ──────────────────────────────────────────────────────────────
    const { insight, isLoading, error, generate, meta } = useCardInsight(targetId);

    // Track last generated state to avoid redundant re-calls on minor fluctuations
    const lastStateRef = useRef({ score: null, symbol: null });
    const hasGeneratedRef = useRef(false);

    const triggerGenerate = useCallback((forceOrEvent) => {
        if (score === null || score === undefined) return;
        if (coveragePercent < 90) return;

        const isForce = forceOrEvent === true || (forceOrEvent && forceOrEvent.type === 'click');
        const currentScore = typeof score === 'number' ? score : parseFloat(score) || 0;
        const currentSymbol = stockSymbol || "Market";
        
        const lastScore = lastStateRef.current.score;
        const lastSymbol = lastStateRef.current.symbol;

        // Only regenerate if user manually clicked, symbol changed, OR score moved by >= 5 points
        const isSignificantChange = lastScore === null || Math.abs(currentScore - lastScore) >= 5;
        const isSymbolChange = currentSymbol !== lastSymbol;

        if (!isForce && hasGeneratedRef.current && !isSignificantChange && !isSymbolChange) {
            return; // Cache hit: change is too minor to warrant a new AI insight
        }

        // Update tracking state
        lastStateRef.current = { score: currentScore, symbol: currentSymbol };
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
            `Score: ${currentScore.toFixed(0)}`,          // was "Composite Score: X/100" — broke {score}
            bulls    != null ? `Bulls: ${bulls}`    : null, // was "Bullish Signals: X"  — broke {bulls}
            bears    != null ? `Bears: ${bears}`    : null, // was "Bearish Signals: X"  — broke {bears}
            neutrals != null ? `Neutrals: ${neutrals}` : null, // was "Neutral Signals: X" — broke {neutrals}
            ...engineScoreLines,                          // TechScore/FundScore/etc. for Master header
        ].filter(Boolean).join(" | ");

        // ── Build pageData from DataRegistry (richer than manual section/card maps) ──
        const registrySnapshot = getPageSnapshot(resolvedPageId);
        const hasRegistryData = Object.keys(registrySnapshot).length > 0;

        const pageData = masterPayload
            ? masterPayload
            : hasRegistryData
                ? registrySnapshot
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
        coveragePercent, cards, sections, masterPayload, getPageSnapshot, resolvedPageId]);

    // Auto-trigger when score becomes available
    // Re-run on score or coverage changes
    useEffect(() => {
        if (coveragePercent >= 90) {
            triggerGenerate();
        }
    }, [score, stockSymbol, triggerGenerate, coveragePercent]);

    const [displayedText, setDisplayedText] = useState("");
    const intervalRef = useRef(null);
    const prevInsightRef = useRef(null);

    // Extract summary and body
    const sentences = insight ? insight.match(/[^.!?]+[.!?]+/g) || [insight] : [];
    const aiSummary = sentences.length > 0 ? sentences[0].trim() : "";
    const aiBody = sentences.length > 1 ? sentences.slice(1).join(' ').trim() : "";

    useEffect(() => {
        if (!insight || insight === prevInsightRef.current) return;
        prevInsightRef.current = insight;

        // Clear previous interval
        if (intervalRef.current) clearInterval(intervalRef.current);
        
        // If loaded from cache, skip the typewriter effect
        if (meta?.cached) {
            setDisplayedText(aiBody);
            return;
        }

        setDisplayedText("");
        let i = 0;
        intervalRef.current = setInterval(() => {
            i++;
            if (i <= aiBody.length) {
                setDisplayedText(aiBody.substring(0, i));
            } else {
                clearInterval(intervalRef.current);
            }
        }, 8);

        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [insight, aiBody, meta]);

    const isTyping = insight && displayedText.length < aiBody.length;
    const showSkeleton = isLoading && !insight;

    return (
        <div className="absolute inset-0 p-6 flex flex-col justify-center group overflow-hidden bg-background-card">
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
                        {coveragePercent < 90 ? (
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
    );
}
