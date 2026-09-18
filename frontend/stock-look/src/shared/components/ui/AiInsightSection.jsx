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
import { Sparkles, RefreshCw, Volume2, Clock } from "lucide-react";
import { useCardInsight } from "@/shared/hooks/useCardInsight";
import { useDataRegistry } from "@/shared/context/DataRegistryContext";
import { useVoice } from "@/shared/context/VoiceContext";
import PortalTooltip from "@/shared/components/ui/PortalTooltip";
import AiInsightModal from "@/shared/components/ui/AiInsightModal";
import { FO_EQUITIES, FO_INDICES } from "@/shared/utils/foInstruments";
import { getCompositeColor } from "@/shared/config/scoreColors";
import axiosInstance from "@/shared/utils/axiosInstance";
import { formatTimestampWithDate } from "@/shared/utils/formatters";

function resolveReadableSymbol(instrumentKey) {
    if (!instrumentKey) return null;
    const match = FO_EQUITIES.find(e => e.value === instrumentKey) || FO_INDICES.find(i => i.value === instrumentKey);
    if (match) return match.label;
    const parts = instrumentKey.split('|');
    return parts.length > 1 ? parts[1] : instrumentKey;
}

function formatInsightTime(ts) {
    return formatTimestampWithDate(ts, { includeSeconds: true });
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

// Global cache backed by localStorage to survive page refreshes for the Future Vision engine
const CACHE_KEY = 'praxis_fv_global_insight_cache';
let globalInsightCache = {};
try {
    const saved = localStorage.getItem(CACHE_KEY);
    if (saved) globalInsightCache = JSON.parse(saved);
} catch (e) {}

export const getGlobalInsightCache = () => globalInsightCache;

export const updateGlobalInsightCache = (key, data) => {
    globalInsightCache[key] = data;
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(globalInsightCache));
    } catch (e) {}
};

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
    isSyncing = false,
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
    const intervalRef = useRef(null);
    const prevInsightRef = useRef(null);
    const [displayedText, setDisplayedText] = useState("");
    const [isRestoredFromCache, setIsRestoredFromCache] = useState(false);
    const [lastGeneratedAt, setLastGeneratedAt] = useState(null);

    // AI Generation Mode (Auto vs Manual) - loaded from localStorage with live sync
    const [generationMode, setGenerationMode] = useState(() => {
        return localStorage.getItem('praxis_ai_insight_generation_mode') || 'auto';
    });

    useEffect(() => {
        const handleModeUpdate = () => {
            setGenerationMode(localStorage.getItem('praxis_ai_insight_generation_mode') || 'auto');
        };
        window.addEventListener('storage', handleModeUpdate);
        window.addEventListener('praxis_ai_mode_change', handleModeUpdate);
        return () => {
            window.removeEventListener('storage', handleModeUpdate);
            window.removeEventListener('praxis_ai_mode_change', handleModeUpdate);
        };
    }, []);

    // Sensitivity thresholds — loaded from SQLite preferences on mount
    const sensitivityRef = useRef({});
    useEffect(() => {
        fetch('/api/v1/preferences')
            .then(r => r.json())
            .then(res => {
                if (res.status === 'success' && res.data) {
                    sensitivityRef.current = res.data;
                }
            })
            .catch(() => {});
    }, []);

    // ── Restore from Global Cache on Mount ──
    const currentSymbol = resolveReadableSymbol(stockSymbol) || "Market";
    const cacheKey = `${targetId}_${currentSymbol}`;

    const isTelemetryDump = (text) => typeof text === 'string' && (text.includes('Metrics:') || text.includes('[INSTITUTIONAL TELEMETRY SYNTHESIS'));

    useEffect(() => {
        const cached = globalInsightCache[cacheKey];
        if (cached) {
            if (isTelemetryDump(cached.insightText)) {
                delete globalInsightCache[cacheKey];
            } else {
                // Restore clean state to prevent auto-trigger when switching tabs
                hasGeneratedRef.current = true;
                lastStateRef.current = { score: cached.score, symbol: cached.symbol, regime: cached.regime };
                setDisplayedText(cached.insightText);
                setLastGeneratedAt(cached.timestamp || null);
                setIsRestoredFromCache(true);
                return;
            }
        }

        // Check localStorage directly in case globalInsightCache wasn't hydrated
        try {
            const storedCache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
            if (storedCache[cacheKey]) {
                const c = storedCache[cacheKey];
                if (isTelemetryDump(c.insightText)) {
                    delete storedCache[cacheKey];
                    localStorage.setItem(CACHE_KEY, JSON.stringify(storedCache));
                } else {
                    globalInsightCache[cacheKey] = c;
                    hasGeneratedRef.current = true;
                    lastStateRef.current = { score: c.score, symbol: c.symbol, regime: c.regime };
                    setDisplayedText(c.insightText);
                    setLastGeneratedAt(c.timestamp || null);
                    setIsRestoredFromCache(true);
                    return;
                }
            }
        } catch {}

        // Fallback: fetch persisted thread entry from SQLite backend if available
        let isCurrent = true;
        const symbolQuery = currentSymbol ? `&stockSymbol=${encodeURIComponent(currentSymbol)}` : '';
        axiosInstance.get(`/api/v1/ai-prompts/thread/${targetId}?scope=page${symbolQuery}`)
            .then(res => {
                if (!isCurrent) return;
                const entries = res.data?.entries || [];
                const lastAssistant = [...entries].reverse().find(e => e.role === 'assistant' && e.content);
                if (lastAssistant?.content) {
                    const clean = lastAssistant.content.replace(/[#*]/g, '').trim();
                    setDisplayedText(clean);
                    setLastGeneratedAt(new Date(lastAssistant.timestamp || Date.now()).getTime());
                    setIsRestoredFromCache(true);
                    hasGeneratedRef.current = true;
                }
            })
            .catch(() => {});

        // Clear any running typewriter interval to prevent ghost updates on symbol switch
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        prevInsightRef.current = null;

        // Reset state for new cache key so it can correctly generate
        hasGeneratedRef.current = false;
        lastStateRef.current = { score: null, symbol: null, regime: null };
        setDisplayedText("");
        setLastGeneratedAt(null);
        setIsRestoredFromCache(false);

        return () => { isCurrent = false; };
    }, [cacheKey, targetId, currentSymbol]);

    const triggerGenerate = useCallback((forceOrEvent) => {
        if (score === null || score === undefined) return;
        if (coveragePercent < 75) return;

        const isForce = forceOrEvent === true || (forceOrEvent && forceOrEvent.type === 'click');

        // Block auto-generation while sync is in flight to prevent intermediate flickering
        if (isSyncing && !isForce) return;

        // In manual mode, strictly block auto-generation; only proceed if user clicked/forced
        if (generationMode === 'manual' && !isForce) {
            return;
        }

        const currentScore = typeof score === 'number' ? score : parseFloat(score) || 0;
        
        const { score: lastScore, symbol: lastSymbol, regime: lastRegime } = lastStateRef.current;

        // Determine threshold dynamically based on target ID (Technical vs others)
        // Sensitivity is loaded from SQLite preferences on mount (see sensitivityRef below)
        const key = targetId.includes('technical') ? 'praxis_ai_sensitivity_technical' : 'praxis_ai_sensitivity_global';
        const stored = sensitivityRef.current[key];
        let sensitivityThreshold = (stored !== undefined && !isNaN(parseInt(stored, 10))) ? Math.min(parseInt(stored, 10), 2) : 2;

        // Only regenerate if user manually clicked, symbol changed, OR score moved by >= threshold, OR regime changed
        const isSignificantScoreChange = lastScore === null || Math.abs(currentScore - lastScore) >= sensitivityThreshold;
        const isSymbolChange = currentSymbol !== lastSymbol;
        const isRegimeChange = actionType !== lastRegime;
        
        // Ignore drops to exactly 0 during initial websocket load if data has not populated yet
        const isDataPopulated = coveragePercent >= 75 && ((cards && cards.length > 0) || (sections && sections.length > 0) || masterPayload != null);
        if (currentScore === 0 && !isForce && !isDataPopulated) return;

        if (!isForce && hasGeneratedRef.current && !isSignificantScoreChange && !isSymbolChange && !isRegimeChange) {
            return; // Cache hit: change is too minor to warrant a new AI insight
        }

        // Update tracking state *before* generating so repeated triggers are blocked
        lastStateRef.current = { score: currentScore, symbol: currentSymbol, regime: actionType };
        hasGeneratedRef.current = true;

        // ── Extract sub-engine scores from masterPayload.engines (for Master header)
        const engineScoreLines = (sections || []).flatMap(eng => {
            const n = (eng.name || eng.module || eng.id || '').toLowerCase();
            if (n.includes('fund')) return [`FundScore: ${eng.score}`];
            if (n.includes('tech'))   return [`TechScore: ${eng.score}`];
            if (n.includes('opt'))      return [`OptsScore: ${eng.score}`];
            if (n.includes('glob') || n.includes('foreign') || n.includes('macro'))
                                           return [`GlobScore: ${eng.score}`];
            if (n.includes('evt') || n.includes('event'))       return [`EvtScore: ${eng.score}`];
            return [`${eng.name || eng.module || eng.id || 'Score'}: ${eng.score}`];
        });

        const isEventsPage = resolvedPageId === 'events';
        const breadthBlock = isEventsPage && masterPayload?.metrics
            ? [
                `Net Momentum: ${masterPayload.metrics.netMomentum}`,
                `Total Events: ${masterPayload.metrics.eventCount}`
            ]
            : [
                bulls    != null ? `Bulls: ${bulls}`    : null,
                bears    != null ? `Bears: ${bears}`    : null,
                neutrals != null ? `Neutrals: ${neutrals}` : null,
            ];

        // ── 10-Year Audited Statements Trajectory (Fundamental Header Integration)
        let fin10Trajectory = null;
        const fin10 = masterPayload?.financials10Year || masterPayload?.screener?.financials10Year;
        if (fin10) {
            const comp = fin10.compoundedGrowth;
            const pl = fin10.profitLoss;
            const parts = [];
            if (comp?.salesGrowth?.periods?.['10 Years:']) parts.push(`10Y Sales CAGR: ${comp.salesGrowth.periods['10 Years:']}`);
            if (comp?.profitGrowth?.periods?.['10 Years:']) parts.push(`10Y Profit CAGR: ${comp.profitGrowth.periods['10 Years:']}`);
            if (pl?.rows?.['OPM %']?.length) {
                const opm = pl.rows['OPM %'];
                parts.push(`OPM: ${opm[0]} → ${opm[opm.length - 1]}`);
            }
            if (parts.length) fin10Trajectory = `10Y Track Record: ${parts.join(' | ')}`;
        }

        // ── Fix: use exact key names that parseAdditionalContext() expects ────────
        const contextLines = [
            `Regime: ${actionType}`,
            confidence != null ? `Confidence: ${confidence}%` : null,
            `Score: ${currentScore.toFixed(0)}`,
            ...breadthBlock,
            fin10Trajectory,
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
                    sections: (sections || []).map(s => ({ name: s.name || s.label || s.module || s.id || 'Module', score: s.score })),
                    cards: (cards || []).map(c => ({ id: c.id, name: c.title || c.module || c.id || 'Card', score: c.normalized, signal: c.state?.label || 'N/A', weight: c.credit }))
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
        coveragePercent, cards, sections, masterPayload, getPageStructuredData, resolvedPageId, currentSymbol, generationMode, isSyncing]);

    const [isReadyToGenerate, setIsReadyToGenerate] = useState(false);

    useEffect(() => {
        // Wait 2.5 seconds for websocket data to fully populate and settle
        // before allowing generation. This prevents rapid generating on partial data.
        const timer = setTimeout(() => setIsReadyToGenerate(true), 2500);
        return () => clearTimeout(timer);
    }, []);

    // Use a ref for triggerGenerate so its changing dependencies don't endlessly reset the debounce timer
    const triggerGenerateRef = useRef(triggerGenerate);
    useEffect(() => {
        triggerGenerateRef.current = triggerGenerate;
    }, [triggerGenerate]);

    // Force regenerate AI insight when user clicks Sync button and pipeline finishes
    useEffect(() => {
        const handleForceRefresh = () => {
            if (triggerGenerateRef.current) {
                triggerGenerateRef.current(true);
            }
        };
        window.addEventListener('praxis:ai:force-refresh', handleForceRefresh);
        return () => window.removeEventListener('praxis:ai:force-refresh', handleForceRefresh);
    }, []);

    // Instant telemetry sync listener — updates displayedText immediately when user clicks the Navbar FV Launcher button
    useEffect(() => {
        const handleTelemetrySynced = (e) => {
            const detail = e.detail;
            if (detail && detail.cacheKey === cacheKey && !isTelemetryDump(detail.text)) {
                hasGeneratedRef.current = true;
                lastStateRef.current = { score: detail.score, symbol: detail.symbol, regime: detail.regime };
                setDisplayedText(detail.text);
                setLastGeneratedAt(Date.now());
                setIsRestoredFromCache(true);
            }
        };
        window.addEventListener('praxis:fv:telemetry-synced', handleTelemetrySynced);
        return () => window.removeEventListener('praxis:fv:telemetry-synced', handleTelemetrySynced);
    }, [cacheKey]);

    // Auto-trigger when score becomes available (Auto mode only)
    // Re-run on score or coverage changes
    useEffect(() => {
        if (generationMode === 'manual') return; // Strict manual mode: never auto-trigger
        if (isSyncing) return; // Strict sync freeze: do not auto-trigger while sync is running
        if (isReadyToGenerate && coveragePercent >= 75) {
            // Debounce generation by 1.5s so we don't double-fire while
            // complex multi-part websockets (like the Master Dashboard) are still loading in.
            const timer = setTimeout(() => {
                if (triggerGenerateRef.current) {
                    triggerGenerateRef.current();
                }
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [score, stockSymbol, actionType, coveragePercent, isReadyToGenerate, generationMode, isSyncing]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const handleCloseModal = useCallback(() => setIsModalOpen(false), []);

    // Extract insight, stripping out markdown formatting like ### and **
    const cleanInsight = insight ? insight.replace(/[#*]/g, '').trim() : "";
    const aiSummary = "";
    const aiBody = cleanInsight;

    useEffect(() => {
        if (!cleanInsight || cleanInsight === prevInsightRef.current) return;
        prevInsightRef.current = cleanInsight;

        // Record timestamp for newly generated response
        setLastGeneratedAt(Date.now());

        // Clear previous interval
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        
        setDisplayedText(""); // Reset text for typing effect
        setIsRestoredFromCache(false); // We just generated a new one, so type it out!
        
        let i = 0;
        intervalRef.current = setInterval(() => {
            if (i < cleanInsight.length) {
                setDisplayedText(cleanInsight.substring(0, i + 1));
                i++;
            } else {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
            }
        }, 8);

        return () => { 
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [cleanInsight]);

    // Separate effect for saving to global in-memory cache (tab switch prevention)
    // SQLite persistence is handled by aiPromptsRoutes on the backend when generate() resolves
    useEffect(() => {
        if (!cleanInsight || isRestoredFromCache) return;
        
        const currentScore = typeof score === 'number' ? score : parseFloat(score) || 0;
        const genTime = lastGeneratedAt || Date.now();
        updateGlobalInsightCache(cacheKey, {
            score: currentScore,
            symbol: currentSymbol,
            regime: actionType,
            insightText: cleanInsight,
            timestamp: genTime
        });
    }, [cleanInsight, score, currentSymbol, actionType, cacheKey, isRestoredFromCache, lastGeneratedAt]);

    // Safety measure: if the currently displayed insight was generated for a different score 
    // or regime (e.g. before the rest of the Master Dashboard finished loading), instantly hide the outdated text 
    // so the user doesn't see a blatant contradiction while waiting for the new insight to generate.
    const currentScore = typeof score === 'number' ? score : parseFloat(score) || 0;
    
    // Determine display threshold using sensitivityRef (loaded from SQLite preferences)
    const displayKey = targetId.includes('technical') ? 'praxis_ai_sensitivity_technical' : 'praxis_ai_sensitivity_global';
    const displayStored = sensitivityRef.current[displayKey];
    const displaySensitivityThreshold = (displayStored !== undefined && !isNaN(parseInt(displayStored, 10))) ? Math.min(parseInt(displayStored, 10), 2) : 2;

    const isScoreOutdated = lastStateRef.current.score !== null && Math.abs(currentScore - lastStateRef.current.score) >= displaySensitivityThreshold;
    const isRegimeOutdated = lastStateRef.current.regime !== null && actionType && lastStateRef.current.regime !== actionType;
    const isOutdated = isScoreOutdated || isRegimeOutdated;

    const isTyping = insight && displayedText.length < aiBody.length;
    
    // We should show the skeleton ONLY if there is no text at all and we are loading or waiting
    const hasAnyText = Boolean(displayedText || cleanInsight);
    const isWaitingToGenerate = !isRestoredFromCache && !hasGeneratedRef.current && !isLoading && generationMode !== 'manual' && !isReadyToGenerate;
    const showSkeleton = !hasAnyText && (isLoading || isWaitingToGenerate);

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
                        {/* Time of response generated */}
                        {lastGeneratedAt && (
                            <PortalTooltip content={<div className="text-xs text-text-secondary">Insight generated at {new Date(lastGeneratedAt).toLocaleString()}</div>}>
                                <div className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-background-surface border border-border-subtle text-text-secondary font-mono cursor-help">
                                    <Clock className="w-2.5 h-2.5 text-text-tertiary" />
                                    <span>{formatInsightTime(lastGeneratedAt)}</span>
                                </div>
                            </PortalTooltip>
                        )}

                        {confidence && (
                            <PortalTooltip content={<div className="text-xs text-text-secondary">Model Confidence Level</div>}>
                                <div className="text-[10px] px-2 py-0.5 rounded bg-background-surface border border-border-subtle text-text-secondary font-mono cursor-help">
                                    {confidence}% Conf
                                </div>
                            </PortalTooltip>
                        )}

                        {/* Generation Mode Badge */}
                        <PortalTooltip content={<div className="text-xs text-text-secondary">AI Insight Mode: {generationMode === 'auto' ? 'Auto (updates with live data)' : 'Manual (only generates when you click refresh)'} — change in App Settings</div>}>
                            <div className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold uppercase cursor-help ${
                                generationMode === 'auto' 
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                                {generationMode}
                            </div>
                        </PortalTooltip>

                        {/* Syncing Indicator */}
                        {isSyncing && (
                            <div className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse">
                                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                <span>SYNCING</span>
                            </div>
                        )}

                        {/* Manual refresh button */}
                        {!isLoading && coveragePercent >= 75 && (
                            <PortalTooltip content={<div className="text-xs text-text-secondary">Regenerate insight</div>}>
                                <button
                                    onClick={triggerGenerate}
                                    className="text-text-tertiary hover:text-text-primary transition-colors p-1 rounded hover:bg-background-surface cursor-pointer"
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
                        ) : !displayedText && generationMode === 'manual' ? (
                            <motion.div
                                key="manual-ready"
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col items-start gap-2.5 py-2 w-full"
                            >
                                <span className="text-[12px] text-text-tertiary italic">
                                    {regime?.description ? regime.description : 'Manual generation mode active. Click below or use the refresh button to synthesize the market insight.'}
                                </span>
                                <button
                                    onClick={triggerGenerate}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-semibold transition-all shadow-sm group cursor-pointer"
                                >
                                    <Sparkles className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                                    <span>Generate Insight</span>
                                </button>
                            </motion.div>
                        ) : !displayedText ? (
                            <motion.div
                                key="empty-fallback"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-[13px] text-text-secondary leading-relaxed font-medium"
                            >
                                {regime?.description || 'Awaiting market regime analysis...'}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="text"
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-[13px] text-text-secondary leading-relaxed font-medium whitespace-pre-wrap overflow-y-auto h-full max-h-[175px] pr-2 custom-scrollbar"
                            >
                                {displayedText}
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
            symbol={currentSymbol}
            initialInsight={cleanInsight || displayedText}
        />
        </>
    );
}
