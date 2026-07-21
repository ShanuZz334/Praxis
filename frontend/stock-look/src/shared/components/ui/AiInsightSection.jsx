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

// ─── Color scheme based on actionType ─────────────────────────────────────────
function resolveColors(actionType = "") {
    const lower = actionType.toLowerCase();
    if (lower.includes("bull") || lower.includes("long") || lower.includes("accumulation")) {
        return {
            glow: "rgba(16, 185, 129, 0.4)",
            badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
            text: "text-emerald-600 dark:text-emerald-400",
            cursor: "after:bg-emerald-400"
        };
    }
    if (lower.includes("bear") || lower.includes("short") || lower.includes("risk-off")) {
        return {
            glow: "rgba(239, 68, 68, 0.4)",
            badge: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
            text: "text-red-600 dark:text-red-400",
            cursor: "after:bg-red-400"
        };
    }
    if (lower.includes("caution") || lower.includes("wait") || lower.includes("balance") || lower.includes("neutral")) {
        return {
            glow: "rgba(245, 158, 11, 0.4)",
            badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
            text: "text-amber-600 dark:text-amber-400",
            cursor: "after:bg-amber-400"
        };
    }
    return {
        glow: "rgba(59, 130, 246, 0.4)",
        badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
        text: "text-blue-600 dark:text-blue-400",
        cursor: "after:bg-blue-400"
    };
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
}) {
    const path = window.location.pathname.toLowerCase();
    const targetId = resolveTargetId(path, isIndex);
    const colors = resolveColors(actionType);

    // ── AI Hook ──────────────────────────────────────────────────────────────
    const { insight, isLoading, error, generate } = useCardInsight(targetId);

    // Track last generated context to avoid redundant re-calls
    const lastContextRef = useRef(null);
    const hasGeneratedRef = useRef(false);

    const triggerGenerate = useCallback(() => {
        if (score === null || score === undefined) return;

        const contextLines = [
            `Regime: ${actionType}`,
            confidence != null ? `Confidence: ${confidence}%` : null,
            `Composite Score: ${typeof score === 'number' ? score.toFixed(0) : score}/100`,
            bulls != null ? `Bullish Signals: ${bulls}` : null,
            bears != null ? `Bearish Signals: ${bears}` : null,
            neutrals != null ? `Neutral Signals: ${neutrals}` : null,
        ].filter(Boolean).join(" | ");

        // Avoid re-calling if nothing changed
        if (contextLines === lastContextRef.current && hasGeneratedRef.current) return;
        lastContextRef.current = contextLines;
        hasGeneratedRef.current = true;

        generate({
            value: typeof score === 'number' ? score.toFixed(0) : score,
            displayName: targetId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            stockSymbol: stockSymbol || "Market",
            scope: 'page',
            additionalContext: contextLines
        });
    }, [targetId, score, actionType, confidence, bulls, bears, neutrals, stockSymbol, generate]);

    // Auto-trigger when score becomes available
    useEffect(() => {
        triggerGenerate();
    }, [triggerGenerate]);

    // ── Typewriter for displayed text ─────────────────────────────────────────
    const [displayedText, setDisplayedText] = useState("");
    const intervalRef = useRef(null);
    const prevInsightRef = useRef(null);

    useEffect(() => {
        if (!insight || insight === prevInsightRef.current) return;
        prevInsightRef.current = insight;

        // Clear previous interval
        if (intervalRef.current) clearInterval(intervalRef.current);
        setDisplayedText("");

        let i = 0;
        intervalRef.current = setInterval(() => {
            i++;
            if (i <= insight.length) {
                setDisplayedText(insight.substring(0, i));
            } else {
                clearInterval(intervalRef.current);
            }
        }, 8);

        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [insight]);

    const isTyping = insight && displayedText.length < insight.length;
    const showSkeleton = isLoading && !insight;

    return (
        <div className="absolute inset-0 p-6 flex flex-col justify-center group overflow-hidden bg-background-card">
            {/* Background Ambient Glow */}
            <motion.div
                className="absolute inset-0 opacity-10 dark:opacity-20 transition-opacity duration-1000 group-hover:opacity-20 dark:group-hover:opacity-40"
                style={{ background: `radial-gradient(circle at 50% 50%, ${colors.glow} 0%, transparent 70%)` }}
            />

            <div className="relative z-10 flex flex-col h-full justify-between">
                {/* Header Row */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Sparkles className={`w-4 h-4 ${colors.text} ${isLoading ? 'animate-spin' : 'animate-pulse'}`} />
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
                        {!isLoading && (
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

                {/* Action Badge */}
                <div className="flex items-center gap-3 mb-2 shrink-0">
                    <AnimatePresence mode="wait">
                        {isLoading ? (
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
                                className={`text-sm font-bold px-3 py-1 rounded border uppercase tracking-wider ${colors.badge}`}
                            >
                                {actionType}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Insight Text */}
                <div className="relative mt-2 flex-grow flex items-start overflow-hidden">
                    <AnimatePresence mode="wait">
                        {showSkeleton ? (
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
                                    <span className="inline-block w-1.5 h-3.5 ml-1 animate-pulse align-middle bg-blue-400" />
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Animated border line */}
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-black/5 dark:bg-white/5 overflow-hidden">
                <motion.div
                    className="h-full w-1/3 bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-50"
                    animate={{ x: ['-100%', '300%'] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                />
            </div>
        </div>
    );
}
