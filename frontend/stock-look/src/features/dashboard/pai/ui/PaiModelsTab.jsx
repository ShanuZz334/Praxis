import React, { useState, useEffect, useRef } from 'react';
import { 
    Server, Cloud, Cpu, SlidersHorizontal, Plus, Edit2, Trash2, Play, 
    CheckCircle, AlertCircle, Waypoints, GripVertical, Zap, Timer, Ban, 
    RotateCcw, CheckCircle2, Lock, Shield, Check, ChevronDown, Search, 
    X, Sparkles, MessageSquare, Layers, Activity, WifiOff, RefreshCw, AlertTriangle,
    Scale, Network, Atom, Route, Telescope, BrainCircuit, Bot, Flame, Compass
} from 'lucide-react';
import axiosInstance from '@/shared/utils/axiosInstance';
import UiverseDropdown from '@/shared/components/ui/UiverseDropdown';
import { UniversalSlider } from '@/shared/components/ui/UniversalSlider';
import { toast } from 'sonner';
import PaiModelInventory from './PaiModelInventory';
import GatewayLimitsCard from './GatewayLimitsCard';
import Loader from '@/shared/components/ui/Loader';

/**
 * Determine provider icon, accent styling, and brand badge
 * Strictly prevents icon duplication across primary providers, load balancers, and fallbacks
 */
const getProviderMeta = (providerId = '', displayName = '') => {
    const id = (providerId || '').toLowerCase();
    const name = (displayName || '').toLowerCase();

    // 1. Ollama / Local Compute
    if (id.includes('ollama') || name.includes('ollama') || id.includes('local')) {
        return { icon: Server, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', tag: 'Local' };
    }

    // 2. Google Gemini
    if (id.includes('gemini') || name.includes('gemini') || id.includes('google')) {
        return { icon: Sparkles, color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20', tag: 'Google' };
    }

    // 3. Groq 2 (Load Balancer / Secondary Pool) - Checked before primary Groq to avoid duplication
    if (id.includes('groq_2') || id.includes('groq2') || name.includes('groq 2') || name.includes('balancer') || name.includes('load balancer')) {
        return { icon: Scale, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', tag: 'Groq LB' };
    }

    // 4. Groq (Primary Lightning LPUs)
    if (id.includes('groq') || name.includes('groq')) {
        return { icon: Zap, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', tag: 'Groq' };
    }

    // 5. OpenRouter 2 (Second Set of Models / Fallback Mesh) - Checked before primary OpenRouter to avoid duplication
    if (id.includes('openrouter_2') || id.includes('openrouter2') || name.includes('openrouter2') || name.includes('openrouter 2') || name.includes('second set')) {
        return { icon: Network, color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10 border-fuchsia-500/20', tag: 'OpenRouter 2' };
    }

    // 6. OpenRouter (Primary Universal Gateway)
    if (id.includes('openrouter') || name.includes('openrouter')) {
        return { icon: Waypoints, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20', tag: 'OpenRouter' };
    }

    // 7. Zhipu / Z.AI (GLM Frontier Models)
    if (id.includes('zhipu') || id.includes('z.ai') || name.includes('zhipu') || name.includes('z.ai')) {
        return { icon: Atom, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20', tag: 'Zhipu' };
    }

    // 8. Anthropic / Claude
    if (id.includes('anthropic') || id.includes('claude') || name.includes('anthropic') || name.includes('claude')) {
        return { icon: BrainCircuit, color: 'text-amber-300', bg: 'bg-amber-500/10 border-amber-500/20', tag: 'Anthropic' };
    }

    // 9. OpenAI
    if (id.includes('openai') || name.includes('openai') || id.includes('chatgpt')) {
        return { icon: Bot, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', tag: 'OpenAI' };
    }

    // 10. Mistral AI
    if (id.includes('mistral') || name.includes('mistral')) {
        return { icon: Flame, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', tag: 'Mistral' };
    }

    // 11. DeepSeek
    if (id.includes('deepseek') || name.includes('deepseek')) {
        return { icon: Compass, color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/20', tag: 'DeepSeek' };
    }

    return { icon: Cloud, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20', tag: 'Cloud' };
};

/**
 * Institutional purpose tag styles
 */
const getPurposeBadgeStyle = (purpose = '') => {
    const p = (purpose || '').toLowerCase();
    if (p.includes('fast')) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25';
    if (p.includes('vision') || p.includes('general')) return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25';
    if (p.includes('reasoning') || p.includes('deep')) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25';
    if (p.includes('load balancing') || p.includes('secondary')) return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/25';
    if (p.includes('second set')) return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25';
    if (p.includes('concurrency') || p.includes('multi-modal')) return 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/25';
    return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25';
};

/**
 * Format and mask API Key safely
 */
const formatApiKey = (key) => {
    if (!key || typeof key !== 'string' || key.trim() === '' || key === 'No Key') return null;
    if (key.length <= 8) return `${key.slice(0, 3)}••••`;
    return `${key.slice(0, 4)}••••${key.slice(-4)}`;
};

/**
 * Institutional Provider Quota Health Badge system (7 distinct states)
 */
function ProviderQuotaHealthBadge({ provider }) {
    const health = provider.quotaHealth || {
        status: provider.limitStatus || 'healthy',
        label: provider.limitStatus === 'exhausted' ? 'Exhausted' : provider.limitStatus === 'warning' ? 'Low Quota' : 'Healthy'
    };

    const status = health.status || 'healthy';

    // 1. Inactive
    if (status === 'inactive' || provider.isActive === false) {
        return (
            <div className="flex flex-col items-center justify-center gap-0.5">
                <span 
                    title={health.reason || "Provider is deactivated in gateway settings"}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-500 dark:text-text-tertiary text-[11px] font-mono font-medium"
                >
                    <Shield size={12} className="shrink-0 opacity-50" />
                    <span>Inactive</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400 dark:text-text-tertiary">Disabled</span>
            </div>
        );
    }

    // 2. Auth Error (401 / 403)
    if (status === 'auth_error') {
        return (
            <div className="flex flex-col items-center justify-center gap-0.5">
                <span 
                    title={health.reason || "Authentication failed: Invalid or expired API Key"}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/25 text-purple-600 dark:text-purple-400 text-[11px] font-mono font-medium shadow-[0_0_8px_rgba(168,85,247,0.12)]"
                >
                    <Lock size={12} className="shrink-0" />
                    <span>Auth Error</span>
                </span>
                <span className="text-[10px] font-mono text-purple-600/80 dark:text-purple-400/80">Invalid Key</span>
            </div>
        );
    }

    // 3. Offline (Daemon down or network failure)
    if (status === 'offline') {
        return (
            <div className="flex flex-col items-center justify-center gap-0.5">
                <span 
                    title={health.reason || "Daemon unreachable or connection failed"}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-500/10 border border-zinc-500/25 text-zinc-600 dark:text-zinc-400 text-[11px] font-mono font-medium"
                >
                    <WifiOff size={12} className="shrink-0" />
                    <span>Offline</span>
                </span>
                <span className="text-[10px] font-mono text-zinc-600/80 dark:text-zinc-400/80">Daemon Down</span>
            </div>
        );
    }

    // 4. Cooling / Tripped (Circuit Breaker)
    if (status === 'cooling') {
        return (
            <div className="flex flex-col items-center justify-center gap-0.5">
                <span 
                    title={health.reason || "Circuit breaker open: Cooling down before retrying"}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/25 text-orange-600 dark:text-orange-400 text-[11px] font-mono font-medium shadow-[0_0_8px_rgba(249,115,22,0.12)]"
                >
                    <Activity size={12} className="shrink-0 animate-pulse" />
                    <span>Cooling</span>
                </span>
                <span className="text-[10px] font-mono text-orange-600/80 dark:text-orange-400/80">{health.subtext || "Tripped"}</span>
            </div>
        );
    }

    // 5. Exhausted (0 requests left or 429)
    if (status === 'exhausted') {
        return (
            <div className="flex flex-col items-center justify-center gap-0.5">
                <span 
                    title={health.reason || `Rate limit reached (0% left). Traffic routed to fallbacks. Resets in ${health.resetCountdown || 'Daily'}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-[11px] font-mono font-medium shadow-[0_0_8px_rgba(244,63,94,0.12)]"
                >
                    <Ban size={12} className="shrink-0" />
                    <span>Exhausted</span>
                </span>
                <span className="text-[10px] font-mono text-rose-600/80 dark:text-rose-400/80">{health.subtext || "0 / 50 left"}</span>
            </div>
        );
    }

    // 6. Throttling / Low Quota (<= 20% remaining)
    if (status === 'throttling' || status === 'warning') {
        return (
            <div className="flex flex-col items-center justify-center gap-0.5">
                <span 
                    title={health.reason || `Approaching rate limit: ${health.remainingPercent || 20}% remaining. Gateway may throttle requests.`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 text-[11px] font-mono font-medium shadow-[0_0_8px_rgba(245,158,11,0.12)]"
                >
                    <Timer size={12} className="shrink-0 animate-pulse" />
                    <span>Low Quota</span>
                </span>
                <span className="text-[10px] font-mono text-amber-600/80 dark:text-amber-400/80">{health.subtext || `${health.remainingPercent}% left`}</span>
            </div>
        );
    }

    // 7. Healthy
    return (
        <div className="flex flex-col items-center justify-center gap-0.5">
            <span 
                title={health.reason || "API limits healthy: Unthrottled gateway flow"}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-[11px] font-mono font-medium shadow-[0_0_8px_rgba(16,185,129,0.12)]"
            >
                <CheckCircle2 size={12} className="shrink-0" />
                <span>Healthy</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500 dark:text-text-tertiary">{health.subtext || "Normal"}</span>
        </div>
    );
}

/**
 * Ultra-slick Custom Model Selector Dropdown matching Praxis design system
 */
function ModelSelectorDropdown({
    options = [],
    value,
    onChange,
    placeholder = "Default (Tier Fallback)",
    searchable = true,
    className = ""
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [openUpward, setOpenUpward] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
                setSearchTerm("");
            }
        };
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
                setSearchTerm("");
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && dropdownRef.current) {
            const rect = dropdownRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            if (spaceBelow < 290 && rect.top > 290) {
                setOpenUpward(true);
            } else {
                setOpenUpward(false);
            }
        }
    }, [isOpen]);

    const selectedOption = options.find(o => o.value === value);

    const filtered = options.filter(opt => {
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        return (opt.label || '').toLowerCase().includes(q) ||
               (opt.provider || '').toLowerCase().includes(q) ||
               (opt.model || '').toLowerCase().includes(q);
    });

    const isCustom = Boolean(value);

    return (
        <div ref={dropdownRef} className={`relative w-full ${isOpen ? 'z-50' : 'z-10'} ${className}`}>
            <button
                type="button"
                onClick={() => {
                    setIsOpen(prev => !prev);
                    if (isOpen) setSearchTerm("");
                }}
                className={`
                    w-full min-h-[40px] py-2 px-3 rounded-xl flex items-center justify-between gap-2.5
                    bg-white dark:bg-background-surface/50 hover:bg-slate-50 dark:hover:bg-background-surface/80 border transition-all duration-200
                    ${isOpen ? 'border-blue-500/50 ring-2 ring-blue-500/20 shadow-lg' : 'border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.18] shadow-sm'}
                    text-left
                `}
            >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    {selectedOption?.isDefault || !selectedOption ? (
                        <>
                            <Cpu size={14} className="text-text-tertiary shrink-0" />
                            <span className="text-[12px] font-mono text-text-tertiary truncate">{placeholder}</span>
                        </>
                    ) : (
                        <>
                            {selectedOption.isElite ? (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-violet-500/15 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 border border-violet-300 dark:border-violet-500/35 shrink-0">
                                    ELITE
                                </span>
                            ) : selectedOption.provider ? (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25 shrink-0">
                                    {selectedOption.provider}
                                </span>
                            ) : null}
                            <span className="text-[12px] font-mono text-text-primary font-medium truncate">
                                {selectedOption.model || selectedOption.label}
                            </span>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    {isCustom && (
                        <span
                            role="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange('');
                            }}
                            className="p-1 rounded-md text-text-tertiary hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Reset to default fallback"
                        >
                            <X size={12} />
                        </span>
                    )}
                    <ChevronDown size={14} className={`text-text-tertiary transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-400' : ''}`} />
                </div>
            </button>

            {isOpen && (
                <div className={`absolute left-0 right-0 ${openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'} z-50 bg-white/95 dark:bg-[#0c101a]/95 backdrop-blur-2xl border border-slate-200 dark:border-white/[0.12] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150`}>
                    {searchable && (
                        <div className="p-2 border-b border-slate-200/80 dark:border-white/[0.06] bg-slate-50/80 dark:bg-black/20">
                            <div className="relative flex items-center">
                                <Search size={13} className="absolute left-2.5 text-text-tertiary pointer-events-none" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    placeholder="Search model or provider..."
                                    className="w-full bg-slate-100/80 dark:bg-background-surface/80 border border-slate-200 dark:border-white/[0.08] rounded-lg pl-8 pr-8 py-1.5 text-[11px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-blue-500/50 font-mono"
                                    autoFocus
                                    onClick={e => e.stopPropagation()}
                                />
                                {searchTerm && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchTerm("")}
                                        className="absolute right-2 text-text-tertiary hover:text-text-primary p-0.5"
                                    >
                                        <X size={11} />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="max-h-60 overflow-y-auto custom-scrollbar py-1">
                        {filtered.length === 0 ? (
                            <div className="px-3 py-4 text-center text-[11px] text-text-tertiary italic">
                                No matching models found
                            </div>
                        ) : (
                            filtered.map(opt => {
                                const isSelected = (value === opt.value) || (!value && opt.isDefault);
                                return (
                                    <button
                                        key={opt.value || 'default'}
                                        type="button"
                                        onClick={() => {
                                            onChange(opt.value);
                                            setIsOpen(false);
                                            setSearchTerm("");
                                        }}
                                        className={`w-full text-left px-3 py-2 text-[11px] font-mono transition-all flex items-center justify-between gap-2 ${
                                            isSelected
                                                ? 'bg-blue-500/15 text-blue-600 dark:text-blue-300 font-semibold'
                                                : 'text-text-secondary hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:text-text-primary'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            {opt.isDefault ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="p-1 rounded bg-slate-100 dark:bg-white/[0.05] text-text-tertiary">
                                                        <Cpu size={12} />
                                                    </span>
                                                    <div>
                                                        <div className="font-sans font-medium text-text-primary text-[12px]">{opt.label}</div>
                                                        <div className="text-[10px] text-text-tertiary font-sans">Automatic priority tier routing</div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                                    {opt.isElite ? (
                                                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-violet-500/15 dark:bg-violet-500/25 text-violet-700 dark:text-violet-300 border border-violet-300/80 dark:border-violet-500/40 shrink-0">
                                                            ELITE
                                                        </span>
                                                    ) : (
                                                        <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-slate-100 dark:bg-white/[0.06] text-text-tertiary shrink-0">
                                                            {opt.provider || 'Model'}
                                                        </span>
                                                    )}
                                                    <span className="truncate text-text-primary font-mono">
                                                        {opt.model || opt.label}
                                                    </span>
                                                    {opt.tier && (
                                                        <span className="text-[9px] text-text-tertiary shrink-0 ml-auto">
                                                            {opt.tier}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {isSelected && (
                                            <Check size={13} className="text-blue-400 shrink-0" />
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

const DEFAULT_PREDICTION_MODELS = [
    {
        modelId: 'master_llm',
        name: 'Master LLM Multi-Timeframe Oracle',
        category: 'Qualitative LLM Synthesis',
        provider: 'Dynamic Gateway (Gemini / Claude / DeepSeek / Groq)',
        architecture: 'Multi-Perspective Contextual Order Flow & Macro Pattern Synthesis',
        description: 'Synthesizes order flow, market structure, news sentiment, and multi-timeframe candle geometry into probabilistic price targets.',
        defaultWeight: 45,
        isReady: true,
        status: 'online',
        latencyBenchmark: '~400-850ms',
        capabilities: ['Multimodal OHLCV Patterning', 'Macro & Event Absorption', 'Directional Regime Categorization']
    },
    {
        modelId: 'kronos',
        name: 'Kronos AAAI-2026',
        category: 'Time-Series Transformer',
        provider: 'FastAPI Microservice (PyTorch)',
        architecture: 'Tokenized Candlestick Autoregression (100M+ Bars Equities/Crypto)',
        description: 'Trained specifically on raw candlestick sequences for direct sub-interval generative distribution forecasting.',
        defaultWeight: 25,
        isReady: true,
        status: 'online',
        latencyBenchmark: '~250-600ms',
        capabilities: ['Sub-candle Microstructure', 'Discrete Quantile Distribution', 'Tokenized Attention Mechanism']
    },
    {
        modelId: 'chronos_bolt',
        name: 'Amazon Chronos-Bolt Base',
        category: 'Zero-Shot Time-Series Foundation',
        provider: 'FastAPI Microservice (Amazon Science)',
        architecture: 'Quantized T5 Univariate Forecaster (Probabilistic Quantiles)',
        description: 'Pre-trained foundation model delivering high-precision zero-shot probabilistic trajectory projections.',
        defaultWeight: 20,
        isReady: true,
        status: 'online',
        latencyBenchmark: '~180-450ms',
        capabilities: ['Zero-Shot Generalization', 'Quantile Interval Bounds (Q10-Q90)', 'Ultra-Low Variance Mean Reversion']
    },
    {
        modelId: 'lag_llama',
        name: 'Lag-Llama Foundation Forecaster',
        category: 'Probabilistic Transformer',
        provider: 'FastAPI Microservice (Morgan Stanley / Mila)',
        architecture: 'Decoder-Only Transformer with Smoothed Lag Operations',
        description: 'Specialized for distribution-based probabilistic time-series forecasting with continuous lag attention.',
        defaultWeight: 15,
        isReady: true,
        status: 'online',
        latencyBenchmark: '~300-750ms',
        capabilities: ['Dynamic Lag Covariates', 'Student-t Distribution Modeling', 'Long-Tail Volatility Forecasting']
    },
    {
        modelId: 'naive_baseline',
        name: 'Geometric Volatility Drift',
        category: 'Mathematical Safeguard Engine',
        provider: 'Praxis Pure JS Engine (Embedded)',
        architecture: 'Dynamic ATR Mean-Drift & Statistical Variance Anchor',
        description: 'Ultra-fast statistical benchmark providing invariant ATR volatility bounds and cold-start fallback calibration.',
        defaultWeight: 10,
        isReady: true,
        status: 'online',
        latencyBenchmark: '< 1ms',
        capabilities: ['Zero-Latency Math Fallback', 'Geometric Variance Containment', 'Vincentization Conformal Anchor']
    }
];

export default function PaiModelsTab() {
    const [temperature, setTemperature] = useState(0.2);
    const [maxTokensShort, setMaxTokensShort] = useState(500);
    const [maxTokensMedium, setMaxTokensMedium] = useState(1000);
    const [maxTokensDetailed, setMaxTokensDetailed] = useState(3000);
    const [contextLimit, setContextLimit] = useState(15);
    const [providers, setProviders] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProvider, setEditingProvider] = useState(null);
    const [loading, setLoading] = useState(true);
    const [initialLoading, setInitialLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    
    // Future Vision Predictive Models & Ensemble State
    const [predictionModels, setPredictionModels] = useState([]);
    const [predictionConfig, setPredictionConfig] = useState({
        ensembleModels: ['master_llm', 'kronos', 'chronos_bolt', 'lag_llama', 'naive_baseline'],
        ensembleWeights: { master_llm: 45, kronos: 25, chronos_bolt: 20, lag_llama: 15, naive_baseline: 10 },
        autoWeighting: true
    });
    const [testingModelId, setTestingModelId] = useState(null);
    const [predictionBenchmarkResults, setPredictionBenchmarkResults] = useState({});

    // Custom UI states to replace native browser popups
    const [providerToDelete, setProviderToDelete] = useState(null);
    const [testingProviderId, setTestingProviderId] = useState(null);
    
    // Drag & Drop State
    const [draggedIdx, setDraggedIdx] = useState(null);
    const [dragOverIdx, setDragOverIdx] = useState(null);

    const showToast = (message, type = 'success') => {
        if (type === 'error') {
            toast.error(message);
        } else {
            toast.success(message);
        }
    };

    const [formData, setFormData] = useState({
        providerId: '',
        displayName: '',
        purpose: '',
        baseUrl: '',
        apiKey: '',
        priority: 10,
        supportedLevels: [],
        models: { level1_fast: '', level2_standard: '', level3_advanced: '', level4_expert: '', level5_reasoner: '', level6_vision: '', level7_audio: '' }
    });

    const [isCheckingHealth, setIsCheckingHealth] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const loadAllInitialData = async () => {
            try {
                await Promise.allSettled([
                    fetchProviders(),
                    fetchTemplates(),
                    fetchRouting(),
                    fetchLocalModels(),
                    fetchPredictionModels(),
                    fetchPredictionConfig()
                ]);
            } finally {
                if (isMounted) {
                    setInitialLoading(false);
                    setLoading(false);
                }
            }
        };

        loadAllInitialData();

        // Real-time synchronization listener across any AI mutation in the application
        const handleGatewayRefresh = () => {
            fetchProviders();
            fetchRouting();
            fetchLocalModels();
            fetchPredictionModels();
            fetchPredictionConfig();
        };
        window.addEventListener('ai_gateway_refresh', handleGatewayRefresh);

        // 25s continuous synchronization with gateway status
        const pollInterval = setInterval(() => {
            fetchProviders();
            fetchPredictionModels();
        }, 25000);

        return () => {
            isMounted = false;
            clearInterval(pollInterval);
            window.removeEventListener('ai_gateway_refresh', handleGatewayRefresh);
        };
    }, []);

    const handleHealthCheck = async () => {
        try {
            setIsCheckingHealth(true);
            const res = await axiosInstance.post('/api/v1/ai-settings/providers/health-check');
            if (res.data?.providers) {
                setProviders(res.data.providers);
                showToast("Provider health verified");
            }
        } catch (e) {
            showToast("Health check failed", "error");
        } finally {
            setIsCheckingHealth(false);
        }
    };

    const [routing, setRouting] = useState({
        cardInsight: { providerId: '', modelId: '' },
        headerInsight: { providerId: '', modelId: '' },
        pageInsight: { providerId: '', modelId: '' },
        manualChat: { providerId: '', modelId: '' },
        futureVision: { providerId: '', modelId: '' },
    });
    const [localModels, setLocalModels] = useState([]);

    const fetchRouting = async () => {
        try {
            const res = await axiosInstance.get('/api/v1/ai-settings/routing');
            if (res.data) {
                setRouting(res.data);
                if (res.data.temperature !== undefined) setTemperature(res.data.temperature);
                if (res.data.maxTokensShort !== undefined) setMaxTokensShort(res.data.maxTokensShort);
                if (res.data.maxTokensMedium !== undefined) setMaxTokensMedium(res.data.maxTokensMedium);
                if (res.data.maxTokensDetailed !== undefined) setMaxTokensDetailed(res.data.maxTokensDetailed);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchLocalModels = async () => {
        try {
            const res = await axiosInstance.get('/api/v1/ai-settings/providers/ollama/models');
            if (res.data) setLocalModels(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchPredictionModels = async () => {
        try {
            const res = await axiosInstance.get('/api/v1/ai-settings/prediction-models');
            if (res.data?.models) {
                setPredictionModels(res.data.models);
            }
        } catch (e) {
            console.error('Failed to fetch prediction models:', e);
        }
    };

    const fetchPredictionConfig = async () => {
        try {
            const res = await axiosInstance.get('/api/v1/ai-settings/prediction-models/config');
            if (res.data) {
                setPredictionConfig({
                    ensembleModels: res.data.ensembleModels || ['master_llm', 'kronos', 'chronos_bolt', 'lag_llama', 'naive_baseline'],
                    ensembleWeights: res.data.ensembleWeights || { master_llm: 45, kronos: 25, chronos_bolt: 20, lag_llama: 15, naive_baseline: 10 },
                    autoWeighting: res.data.autoWeighting !== undefined ? res.data.autoWeighting : true
                });
            }
        } catch (e) {
            console.error('Failed to fetch prediction config:', e);
        }
    };

    const handleTogglePredictionModel = async (modelId) => {
        const currentSelected = predictionConfig.ensembleModels || [];
        let updatedModels;
        if (currentSelected.includes(modelId)) {
            if (currentSelected.length <= 1) {
                showToast('At least 1 prediction model must remain active.', 'error');
                return;
            }
            updatedModels = currentSelected.filter(id => id !== modelId);
        } else {
            updatedModels = [...currentSelected, modelId];
        }

        const newConfig = {
            ...predictionConfig,
            ensembleModels: updatedModels
        };
        setPredictionConfig(newConfig);

        try {
            await axiosInstance.put('/api/v1/ai-settings/prediction-models/config', newConfig);
            showToast(`${modelId} ${updatedModels.includes(modelId) ? 'activated' : 'deactivated'}`);
        } catch (e) {
            showToast('Failed to update prediction model selection', 'error');
        }
    };

    const handlePredictionWeightChange = async (modelId, newWeight) => {
        const newWeights = {
            ...predictionConfig.ensembleWeights,
            [modelId]: Number(newWeight)
        };
        const newConfig = {
            ...predictionConfig,
            ensembleWeights: newWeights,
            autoWeighting: false
        };
        setPredictionConfig(newConfig);

        try {
            await axiosInstance.put('/api/v1/ai-settings/prediction-models/config', newConfig);
        } catch (e) {
            console.error(e);
        }
    };

    const handleToggleAutoWeighting = async () => {
        const newAuto = !predictionConfig.autoWeighting;
        const defaultWeights = { master_llm: 45, kronos: 25, chronos_bolt: 20, lag_llama: 15, naive_baseline: 10 };
        const newConfig = {
            ...predictionConfig,
            autoWeighting: newAuto,
            ...(newAuto ? { ensembleWeights: defaultWeights } : {})
        };
        setPredictionConfig(newConfig);

        try {
            await axiosInstance.put('/api/v1/ai-settings/prediction-models/config', newConfig);
            showToast(`Auto Weighting ${newAuto ? 'enabled' : 'disabled'}`);
        } catch (e) {
            showToast('Failed to toggle auto weighting', 'error');
        }
    };

    const handleTestPredictionModel = async (modelId) => {
        try {
            setTestingModelId(modelId);
            const res = await axiosInstance.post(`/api/v1/ai-settings/prediction-models/${modelId}/test`);
            const data = res.data;
            if (data.success) {
                setPredictionBenchmarkResults(prev => ({
                    ...prev,
                    [modelId]: { success: true, latencyMs: data.latencyMs, message: data.message || 'Operational' }
                }));
                showToast(`${modelId} benchmark: ${data.latencyMs}ms`, 'success');
            } else {
                setPredictionBenchmarkResults(prev => ({
                    ...prev,
                    [modelId]: { success: false, error: data.error || 'Check failed' }
                }));
                showToast(`${modelId} benchmark failed: ${data.error}`, 'error');
            }
        } catch (e) {
            setPredictionBenchmarkResults(prev => ({
                ...prev,
                [modelId]: { success: false, error: e.message }
            }));
            showToast(`Benchmark error: ${e.message}`, 'error');
        } finally {
            setTestingModelId(null);
        }
    };

    const handleRoutingChange = async (taskType, updates) => {
        const newRouting = { 
            ...routing, 
            [taskType]: { ...routing[taskType], ...updates } 
        };
        setRouting(newRouting);
        try {
            await axiosInstance.put('/api/v1/ai-settings/routing', newRouting);
            showToast('Routing preferences saved');
        } catch (e) {
            showToast('Failed to save routing', 'error');
        }
    };

    const fetchProviders = async () => {
        try {
            const res = await axiosInstance.get('/api/v1/ai-settings/providers');
            if (res.data) setProviders(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchTemplates = async () => {
        try {
            const res = await axiosInstance.get('/api/v1/ai-settings/providers/templates');
            if (res.data) setTemplates(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleTemplateSelect = (value) => {
        const tmpl = templates.find(t => t.providerId === value);
        if (tmpl) {
            setFormData({
                ...formData,
                providerId: tmpl.providerId,
                displayName: tmpl.displayName,
                baseUrl: tmpl.baseUrl,
                models: {
                    level1_fast: tmpl.models?.level1_fast || '', level2_standard: tmpl.models?.level2_standard || '', level3_advanced: tmpl.models?.level3_advanced || '', level4_expert: tmpl.models?.level4_expert || '', level5_reasoner: tmpl.models?.level5_reasoner || '', level6_vision: tmpl.models?.level6_vision || '', level7_audio: tmpl.models?.level7_audio || ''
                }
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = editingProvider ? `/api/v1/ai-settings/providers/${editingProvider.providerId}` : '/api/v1/ai-settings/providers';
        
        const supportedLevels = Object.keys(formData.models).filter(k => formData.models[k] && formData.models[k].trim() !== '');
        const dataToSubmit = { ...formData, supportedLevels };

        try {
            if (editingProvider) {
                await axiosInstance.put(url, dataToSubmit);
            } else {
                await axiosInstance.post(url, dataToSubmit);
            }
            setIsModalOpen(false);
            setEditingProvider(null);
            fetchProviders();
        } catch (error) {
            console.error(error);
        }
    };

    const handleToggle = async (providerId) => {
        try {
            await axiosInstance.patch(`/api/v1/ai-settings/providers/${providerId}/toggle`);
            fetchProviders();
        } catch (e) { console.error(e); }
    };

    const confirmDelete = async () => {
        if (!providerToDelete) return;
        try {
            await axiosInstance.delete(`/api/v1/ai-settings/providers/${providerToDelete}`);
            fetchProviders();
            setProviderToDelete(null);
            showToast("Provider deleted successfully");
        } catch (e) {
            console.error(e);
            showToast("Failed to delete provider", 'error');
        }
    };

    const handleDeleteClick = (providerId) => {
        setProviderToDelete(providerId);
    };

    const handleTest = async (providerId) => {
        try {
            setTestingProviderId(providerId);
            const res = await axiosInstance.post(`/api/v1/ai-settings/providers/${providerId}/test`);
            const data = res.data;
            if (data.success) {
                showToast(`Test Successful! Latency: ${data.latencyMs}ms`, 'success');
            } else {
                showToast(`Test Failed: ${data.error}`, 'error');
            }
            await fetchProviders();
            window.dispatchEvent(new CustomEvent('ai_gateway_refresh'));
        } catch (e) {
            showToast(`Test Error: ${e.response?.data?.error || e.message}`, 'error');
            await fetchProviders();
            window.dispatchEvent(new CustomEvent('ai_gateway_refresh'));
        } finally {
            setTestingProviderId(null);
        }
    };

    const handleDropReorder = async (dragIndex, hoverIndex) => {
        if (dragIndex === null || hoverIndex === null || dragIndex === hoverIndex) return;
        const newProviders = [...providers];
        const [draggedItem] = newProviders.splice(dragIndex, 1);
        newProviders.splice(hoverIndex, 0, draggedItem);
        
        setProviders(newProviders);
        const order = newProviders.map((p, i) => ({ providerId: p.providerId, priority: i + 1 }));
        
        try {
            await axiosInstance.patch(`/api/v1/ai-settings/providers/reorder`, { order });
        } catch (e) {
            console.error(e);
            showToast('Failed to save new order', 'error');
        }
    };

    if (initialLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[460px] w-full py-24 gap-4 animate-in fade-in duration-200">
                <Loader size="sm" color="blue" />
                <div className="flex flex-col items-center gap-1.5 text-center">
                    <p className="text-[14px] font-semibold text-text-primary tracking-tight">Initializing PAI Configuration...</p>
                    <p className="text-[11px] font-mono text-text-tertiary">Synchronizing provider meshes, model routes, and live quotas</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div>
                <h2 className="text-lg font-bold text-text-primary mb-1">AI Providers & Routing</h2>
                <p className="text-[13px] text-text-tertiary">Manage AI gateway endpoints, models, and fallback priorities.</p>
            </div>

            {/* ── 1. Configured Providers Section (Priority Fallback Pipeline) ── */}
            <div className="relative overflow-hidden bg-background-card/95 backdrop-blur-xl border border-border-default/60 rounded-2xl p-6 shadow-xl before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-gradient-to-r before:from-blue-500/0 before:via-blue-500/40 before:to-blue-500/0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.2)] shrink-0">
                            <Cpu size={18} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-[15px] font-bold text-text-primary tracking-tight">Configured Providers</h3>
                                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    {providers.filter(p => p.isActive).length} / {providers.length} Active
                                </span>
                            </div>
                            <p className="text-[12px] text-text-tertiary mt-0.5">
                                Drag & drop rows to set gateway priority. Top-ranked providers are queried first.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button 
                            type="button"
                            onClick={handleHealthCheck}
                            disabled={isCheckingHealth}
                            className="px-3 py-1.5 bg-background-surface hover:bg-white/[0.08] text-text-secondary hover:text-text-primary rounded-xl text-[12px] font-medium border border-border-default/50 transition-all flex items-center gap-1.5 active:scale-[0.98] disabled:opacity-50"
                            title="Ping all active providers and refresh live quota health"
                        >
                            <RefreshCw size={13} className={isCheckingHealth ? "animate-spin text-blue-400" : "text-text-tertiary"} />
                            <span>{isCheckingHealth ? 'Checking...' : 'Check Health'}</span>
                        </button>
                        <button 
                            onClick={() => {
                                setEditingProvider(null);
                                setFormData({ providerId: '', displayName: '', purpose: '', baseUrl: '', apiKey: '', priority: 10, supportedLevels: [], models: { level1_fast: '', level2_standard: '', level3_advanced: '', level4_expert: '', level5_reasoner: '', level6_vision: '', level7_audio: '' }});
                                setIsModalOpen(true);
                            }}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[12px] font-semibold transition-all duration-200 shadow-[0_0_15px_rgba(59,130,246,0.25)] flex items-center gap-1.5 active:scale-[0.98]"
                        >
                            <Plus size={14} /> Add Provider
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-white/[0.06] bg-slate-50/70 dark:bg-black/20">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-100/70 dark:bg-white/[0.02] border-b border-slate-200/80 dark:border-white/[0.06] text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-text-tertiary">
                                <th className="py-3 px-3 w-16 text-center">Rank</th>
                                <th className="py-3 px-3">Provider & Endpoint</th>
                                <th className="py-3 px-3">Authentication</th>
                                <th className="py-3 px-3 text-center">Gateway Status</th>
                                <th className="py-3 px-3 text-center">Quota Health</th>
                                <th className="py-3 px-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="py-8 text-center text-[12px] font-mono text-text-tertiary">
                                        <div className="flex items-center justify-center gap-2">
                                            <RotateCcw size={14} className="animate-spin text-blue-400" />
                                            <span>Loading AI gateway providers...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : providers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-8 text-center text-[12px] text-text-tertiary">
                                        No providers configured. Click &ldquo;Add Provider&rdquo; above to register an endpoint.
                                    </td>
                                </tr>
                            ) : (
                                providers.map((p, index) => {
                                    const providerMeta = getProviderMeta(p.providerId, p.displayName);
                                    const ProviderIcon = providerMeta.icon;
                                    const purposeStyle = getPurposeBadgeStyle(p.purpose);

                                    return (
                                        <tr 
                                            key={p.providerId} 
                                            draggable
                                            onDragStart={(e) => {
                                                setDraggedIdx(index);
                                                e.dataTransfer.effectAllowed = "move";
                                                const img = new Image();
                                                img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                                                e.dataTransfer.setDragImage(img, 0, 0);
                                            }}
                                            onDragOver={(e) => {
                                                e.preventDefault();
                                                if (dragOverIdx !== index) setDragOverIdx(index);
                                            }}
                                            onDragLeave={() => setDragOverIdx(null)}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                handleDropReorder(draggedIdx, index);
                                                setDraggedIdx(null);
                                                setDragOverIdx(null);
                                            }}
                                            onDragEnd={() => {
                                                setDraggedIdx(null);
                                                setDragOverIdx(null);
                                            }}
                                            className={`group border-b border-slate-200/70 dark:border-white/[0.04] last:border-b-0 transition-all duration-150 cursor-grab active:cursor-grabbing ${
                                                draggedIdx === index 
                                                    ? 'opacity-40 bg-blue-500/10 border-blue-500/30' 
                                                    : 'hover:bg-slate-100/60 dark:hover:bg-white/[0.03]'
                                            } ${
                                                dragOverIdx === index 
                                                    ? 'bg-blue-500/10 border-t-2 border-t-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
                                                    : ''
                                            }`}
                                        >
                                            {/* Column 1: Priority Rank & Drag Handle */}
                                            <td className="py-3.5 px-3 w-16 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <GripVertical size={14} className="text-slate-400 dark:text-text-tertiary/40 group-hover:text-slate-600 dark:group-hover:text-text-tertiary transition-colors" />
                                                    <span className="font-mono text-[11px] font-bold text-slate-500 dark:text-text-tertiary group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                        #{index + 1}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Column 2: Provider & Endpoint */}
                                            <td className="py-3.5 px-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-xl border shrink-0 ${providerMeta.bg} ${providerMeta.color}`}>
                                                        <ProviderIcon size={16} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-[13px] font-bold text-slate-800 dark:text-text-primary group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                                {p.displayName}
                                                            </span>
                                                            {p.purpose && (
                                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider border ${purposeStyle}`}>
                                                                    {p.purpose}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <span className="text-[11px] font-mono text-slate-500 dark:text-text-tertiary truncate max-w-[280px]">
                                                                {p.baseUrl}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Column 3: API Key */}
                                            <td className="py-3.5 px-3">
                                                {p.apiKey && formatApiKey(p.apiKey) ? (
                                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-black/30 border border-slate-200 dark:border-white/[0.06] text-[11px] font-mono text-slate-700 dark:text-text-secondary">
                                                        <Lock size={11} className="text-slate-400 dark:text-text-tertiary shrink-0" />
                                                        <span>{formatApiKey(p.apiKey)}</span>
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/70 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/[0.04] text-[11px] font-mono text-slate-500 dark:text-text-tertiary">
                                                        <span>Local Endpoint</span>
                                                    </div>
                                                )}
                                            </td>

                                            {/* Column 4: Gateway Status */}
                                            <td className="py-3.5 px-3 text-center">
                                                <button 
                                                    type="button"
                                                    onClick={() => handleToggle(p.providerId)}
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                                                        p.isActive 
                                                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.15)]' 
                                                            : 'bg-slate-100 dark:bg-white/[0.03] text-slate-500 dark:text-text-tertiary border border-slate-200 dark:border-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.06]'
                                                    }`}
                                                    title={`Click to ${p.isActive ? 'deactivate' : 'activate'} provider`}
                                                >
                                                    <span className={`w-1.5 h-1.5 rounded-full ${p.isActive ? 'bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse' : 'bg-neutral-400 dark:bg-neutral-600'}`} />
                                                    <span>{p.isActive ? 'Active' : 'Inactive'}</span>
                                                </button>
                                            </td>

                                            {/* Column 5: Quota Health */}
                                            <td className="py-3.5 px-3 text-center">
                                                <ProviderQuotaHealthBadge provider={p} />
                                            </td>

                                            {/* Column 6: Actions */}
                                            <td className="py-3.5 px-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleTest(p.providerId)} 
                                                        disabled={testingProviderId === p.providerId}
                                                        className="p-2 rounded-xl text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-blue-500/10 dark:hover:bg-blue-500/15 border border-transparent hover:border-blue-500/30 transition-all active:scale-95 disabled:opacity-50" 
                                                        title="Test Connection & Measure Latency"
                                                    >
                                                        {testingProviderId === p.providerId ? (
                                                            <RotateCcw size={13} className="animate-spin text-blue-500 dark:text-blue-400" />
                                                        ) : (
                                                            <Play size={13} fill="currentColor" />
                                                        )}
                                                    </button>
                                                    <button 
                                                        type="button"
                                                        onClick={() => {
                                                            setEditingProvider(p);
                                                            setFormData({ ...p, apiKey: '' });
                                                            setIsModalOpen(true);
                                                        }} 
                                                        className="p-2 rounded-xl text-slate-400 dark:text-text-tertiary hover:text-slate-700 dark:hover:text-text-primary hover:bg-slate-100 dark:hover:bg-white/[0.08] border border-transparent hover:border-slate-200 dark:hover:border-white/[0.12] transition-all active:scale-95" 
                                                        title="Edit Provider Configuration"
                                                    >
                                                        <Edit2 size={13} />
                                                    </button>
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleDeleteClick(p.providerId)} 
                                                        className="p-2 rounded-xl text-rose-500/70 dark:text-rose-400/70 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 dark:hover:bg-rose-500/15 border border-transparent hover:border-rose-500/30 transition-all active:scale-95" 
                                                        title="Delete Provider"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── 2. Task-Specific Routing Section (Workload Dispatcher) ── */}
            <div className="relative bg-background-card/95 backdrop-blur-xl border border-border-default/60 rounded-2xl p-6 shadow-xl before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:rounded-t-2xl before:bg-gradient-to-r before:from-purple-500/0 before:via-purple-500/40 before:to-purple-500/0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-border-default/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/25 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.15)] shrink-0">
                            <Route size={18} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-[15px] font-bold text-text-primary tracking-tight">Task Routing Engine</h3>
                                <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                                    GATEWAY V2
                                </span>
                            </div>
                            <p className="text-[12px] text-text-tertiary mt-0.5">
                                Direct specific intelligence workloads to dedicated model tiers, or let the Gateway intelligently load-balance.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 shadow-[0_0_8px_rgba(16,185,129,0.15)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>Auto-synced to Gateway</span>
                        </span>
                    </div>
                </div>

                {/* 4 Workload Routing Workstations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        { 
                            key: 'cardInsight', 
                            label: 'Card Insight Generation',
                            icon: Layers,
                            iconColor: 'text-blue-400',
                            iconBg: 'bg-blue-500/10 border-blue-500/25',
                            description: 'Metric-level micro analysis across individual dashboard cards.'
                        },
                        { 
                            key: 'headerInsight', 
                            label: 'Header Aggregation Insight',
                            icon: Activity,
                            iconColor: 'text-cyan-400',
                            iconBg: 'bg-cyan-500/10 border-cyan-500/25',
                            description: 'Macro composite confluence scoring and real-time header synthesis.'
                        },
                        { 
                            key: 'pageInsight', 
                            label: 'Page Synthesis',
                            icon: BrainCircuit,
                            iconColor: 'text-amber-400',
                            iconBg: 'bg-amber-500/10 border-amber-500/25',
                            description: 'Cross-module executive intelligence and comprehensive market summaries.'
                        },
                        { 
                            key: 'manualChat', 
                            label: 'Manual Analysis Chat',
                            icon: MessageSquare,
                            iconColor: 'text-emerald-400',
                            iconBg: 'bg-emerald-500/10 border-emerald-500/25',
                            description: 'Interactive conversational co-pilot in QChat and deep-dive queries.'
                        }
                    ].map(task => {
                        const TaskIcon = task.icon;

                        // Build flattened list of models across all providers
                        const allModels = [
                            { value: '', label: 'Default (Tier Fallback)', isDefault: true }
                        ];
                        
                        providers.forEach(p => {
                            if (p.providerId === 'ollama') {
                                localModels.forEach(lm => {
                                    const val = `ollama::${lm.modelId}`;
                                    if (!allModels.some(m => m.value === val)) {
                                        allModels.push({ 
                                            value: val, 
                                            label: `Local Ollama: ${lm.displayName}`,
                                            provider: p.displayName || 'Ollama',
                                            model: lm.displayName || lm.modelId
                                        });
                                    }
                                });
                            } else {
                                Object.entries(p.models || {}).forEach(([tier, modelName]) => {
                                    if (modelName) {
                                        const val = `${p.providerId}::${modelName}`;
                                        if (!allModels.some(m => m.value === val)) {
                                            allModels.push({ 
                                                value: val, 
                                                label: `${p.displayName}: ${modelName}`,
                                                provider: p.displayName,
                                                model: modelName,
                                                tier: tier.replace('level', 'L').replace('_', ' ')
                                            });
                                        }
                                    }
                                });
                            }
                        });

                        const currentValue = routing[task.key]?.providerId && routing[task.key]?.modelId 
                            ? `${routing[task.key].providerId}::${routing[task.key].modelId}` 
                            : '';
                        const isCustomRouted = Boolean(currentValue);

                        return (
                            <div 
                                key={task.key} 
                                className="group relative bg-white dark:bg-background-surface/30 hover:bg-slate-50 dark:hover:bg-background-surface/50 border border-slate-200/80 dark:border-white/[0.05] hover:border-slate-300 dark:hover:border-white/[0.12] rounded-xl p-4 transition-all duration-200 shadow-sm flex flex-col justify-between gap-3.5 focus-within:z-30"
                            >
                                <div>
                                    <div className="flex items-center justify-between gap-2 mb-1.5">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-lg border shrink-0 ${task.iconBg} ${task.iconColor}`}>
                                                <TaskIcon size={14} />
                                            </div>
                                            <h4 className="text-[13px] font-bold text-text-primary tracking-tight">
                                                {task.label}
                                            </h4>
                                        </div>
                                        {isCustomRouted ? (
                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                                                CUSTOM
                                            </span>
                                        ) : (
                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono text-slate-500 dark:text-text-tertiary bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06]">
                                                TIER FALLBACK
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-text-tertiary line-clamp-2 leading-relaxed">
                                        {task.description}
                                    </p>
                                </div>

                                <div>
                                    <ModelSelectorDropdown
                                        options={allModels}
                                        value={currentValue}
                                        onChange={(val) => {
                                            if (!val) {
                                                handleRoutingChange(task.key, { providerId: null, modelId: null });
                                            } else {
                                                const [provId, modId] = val.split('::');
                                                handleRoutingChange(task.key, { providerId: provId, modelId: modId });
                                            }
                                        }}
                                        placeholder="Default (Tier Fallback)"
                                        searchable={true}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ── Future Vision Model (Flagship Hero Panel) ── */}
                <div className="mt-6 relative rounded-2xl border border-violet-300/80 dark:border-violet-500/30 bg-gradient-to-br from-violet-50/70 via-background-card/95 to-purple-50/50 dark:from-violet-950/25 dark:via-background-card/90 dark:to-purple-950/20 p-5 shadow-xl dark:shadow-violet-950/20">
                    <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                        <div className="absolute -top-12 -right-12 w-56 h-56 bg-violet-500/10 rounded-full blur-3xl" />
                    </div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-violet-500/15 dark:bg-violet-500/20 border border-violet-300 dark:border-violet-500/35 text-violet-600 dark:text-violet-300 shadow-[0_0_15px_rgba(168,85,247,0.15)] dark:shadow-[0_0_15px_rgba(168,85,247,0.25)] shrink-0">
                                <Telescope size={18} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="text-[14px] font-bold text-text-primary tracking-tight">
                                        Future Vision — Prediction Engine
                                    </h4>
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-violet-500/15 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 border border-violet-300/80 dark:border-violet-500/40 shadow-[0_0_10px_rgba(168,85,247,0.1)] dark:shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                                        LEVEL 5 REASONER
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono text-slate-500 dark:text-text-tertiary bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08]">
                                        20-PERIOD OHLCV
                                    </span>
                                </div>
                                <p className="text-[11px] text-text-tertiary mt-1">
                                    High-precision quantitative AI model dedicated to forecasting predictive candles and directional market geometry.
                                </p>
                            </div>
                        </div>
                    </div>

                    {(() => {
                        const FUTURE_VISION_MODELS = [
                            { value: '', label: 'Auto — Best Available (Level 5 Reasoner)', isDefault: true }
                        ];

                        const ELITE_WHITELIST = [
                            'nvidia/nemotron-3-ultra-550b-a55b:free',
                            'nvidia/nemotron-3-super-120b-a12b:free',
                            'inclusionai/ling-3.0-flash-fin:free',
                            'openai/gpt-oss-120b',
                            'gemini-3.8-flash',
                            'qwen/qwen3.8-27b',
                            'glm-4-plus',
                            'glm-5.2',
                            'glm-5.3-flash'
                        ];

                        const seen = new Set();
                        const sortedProviders = [...providers].filter(p => p.isActive).sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));

                        sortedProviders.forEach(p => {
                            if (!p.models) return;
                            Object.entries(p.models).forEach(([tier, modelId]) => {
                                if (modelId && ELITE_WHITELIST.includes(modelId)) {
                                    const val = `${p.providerId}::${modelId}`;
                                    if (seen.has(val)) return;
                                    seen.add(val);
                                    FUTURE_VISION_MODELS.push({
                                        value: val,
                                        label: `[Elite] ${p.displayName}: ${modelId}`,
                                        provider: p.displayName,
                                        model: modelId,
                                        isElite: true
                                    });
                                }
                            });
                        });

                        const currentValue = routing.futureVision?.providerId && routing.futureVision?.modelId
                            ? `${routing.futureVision.providerId}::${routing.futureVision.modelId}`
                            : '';

                        return (
                            <div className="relative z-20 space-y-3">
                                <ModelSelectorDropdown
                                    options={FUTURE_VISION_MODELS}
                                    value={currentValue}
                                    onChange={(val) => {
                                        if (!val) {
                                            handleRoutingChange('futureVision', { providerId: null, modelId: null });
                                        } else {
                                            const parts = val.split('::');
                                            handleRoutingChange('futureVision', { providerId: parts[0], modelId: parts.slice(1).join('::') });
                                        }
                                    }}
                                    placeholder="Auto — Best Available (Level 5 Reasoner)"
                                    searchable={true}
                                />

                                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-background-surface/50 border border-border-subtle text-[11px] text-text-tertiary">
                                    <Telescope size={13} className="text-text-secondary shrink-0" />
                                    <span>
                                        <strong className="text-text-primary font-medium">Default (Auto):</strong> Automatically routes to the highest priority Level 5 (Reasoner) model for maximum quantitative intelligence.
                                    </span>
                                </div>

                                {/* ── Multi-Model Ensemble Selection & Dynamic Weight Mixing ── */}
                                <div className="mt-5 pt-5 border-t border-border-subtle">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                        <div className="flex items-center gap-2">
                                            <Layers size={16} className="text-text-secondary" />
                                            <div>
                                                <h5 className="text-[13px] font-bold text-text-primary tracking-tight">
                                                    Predictive Foundation Models & Generative Mixing
                                                </h5>
                                                <p className="text-[11px] text-text-tertiary">
                                                    Select one or more specialized forecasting models. Multiple models will be blended into a unified probabilistic trajectory.
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {/* Auto-Weighting Rebalance Button */}
                                        <button
                                            type="button"
                                            onClick={handleToggleAutoWeighting}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold tracking-wide border transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                                                predictionConfig.autoWeighting
                                                    ? 'bg-background-elevated text-text-primary border-border-default shadow-xs'
                                                    : 'bg-background-surface text-text-tertiary border-border-subtle hover:bg-background-elevated hover:text-text-secondary'
                                            }`}
                                            title="Automatically normalizes and rebalances model weights"
                                        >
                                            <SlidersHorizontal size={12} className={predictionConfig.autoWeighting ? 'text-emerald-500' : 'text-text-tertiary'} />
                                            <span>Auto-Rebalance: {predictionConfig.autoWeighting ? 'ON' : 'OFF'}</span>
                                            {predictionConfig.autoWeighting && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            )}
                                        </button>
                                    </div>

                                    {/* Dynamic Percentage Distribution Bar */}
                                    {(() => {
                                        const activeIds = predictionConfig.ensembleModels || [];
                                        const weights = predictionConfig.ensembleWeights || {};
                                        const totalWeight = activeIds.reduce((sum, id) => sum + (Number(weights[id]) || 10), 0) || 1;
                                        
                                        const MODEL_PALETTE = {
                                            master_llm: { color: 'bg-slate-600 dark:bg-slate-400', text: 'text-slate-600 dark:text-slate-300', label: 'Master LLM' },
                                            kronos: { color: 'bg-blue-600 dark:bg-blue-500', text: 'text-blue-600 dark:text-blue-400', label: 'Kronos' },
                                            chronos_bolt: { color: 'bg-indigo-600 dark:bg-indigo-400', text: 'text-indigo-600 dark:text-indigo-400', label: 'Chronos-Bolt' },
                                            lag_llama: { color: 'bg-teal-600 dark:bg-teal-400', text: 'text-teal-600 dark:text-teal-400', label: 'Lag-Llama' },
                                            naive_baseline: { color: 'bg-zinc-600 dark:bg-zinc-400', text: 'text-zinc-600 dark:text-zinc-400', label: 'Baseline Drift' }
                                        };

                                        return (
                                            <div className="p-3 rounded-xl bg-background-surface/50 border border-border-subtle mb-4 space-y-2">
                                                <div className="flex items-center justify-between text-[11px] font-mono text-text-secondary">
                                                    <span>Ensemble Blending Ratio ({activeIds.length} Active Model{activeIds.length > 1 ? 's' : ''})</span>
                                                    <span className="text-text-primary font-bold">{activeIds.length === 1 ? 'Single Model (100% Dedicated)' : 'Multi-Model Consensus'}</span>
                                                </div>

                                                <div className="h-2 w-full bg-background-app rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-border-subtle">
                                                    {activeIds.map(id => {
                                                        const w = Number(weights[id]) || 10;
                                                        const pct = ((w / totalWeight) * 100).toFixed(0);
                                                        const pal = MODEL_PALETTE[id] || { color: 'bg-slate-500', label: id };
                                                        return (
                                                            <div
                                                                key={id}
                                                                style={{ width: `${pct}%` }}
                                                                className={`${pal.color} h-full rounded-sm transition-all duration-300`}
                                                                title={`${pal.label}: ${pct}%`}
                                                            />
                                                        );
                                                    })}
                                                </div>

                                                <div className="flex flex-wrap items-center gap-3 pt-1 text-[10px] font-mono">
                                                    {activeIds.map(id => {
                                                        const w = Number(weights[id]) || 10;
                                                        const pct = ((w / totalWeight) * 100).toFixed(0);
                                                        const pal = MODEL_PALETTE[id] || { text: 'text-text-secondary', label: id };
                                                        return (
                                                            <div key={id} className="flex items-center gap-1.5">
                                                                <span className={`w-2 h-2 rounded-full ${MODEL_PALETTE[id]?.color || 'bg-slate-400'}`} />
                                                                <span className="text-text-secondary">{pal.label}:</span>
                                                                <span className={`font-bold ${pal.text}`}>{pct}%</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Model Cards Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                                        {(predictionModels.length > 0 ? predictionModels : DEFAULT_PREDICTION_MODELS).map((m) => {
                                            const isSelected = (predictionConfig.ensembleModels || []).includes(m.modelId);
                                            const isTesting = testingModelId === m.modelId;
                                            const testRes = predictionBenchmarkResults[m.modelId];
                                            const currentWeight = predictionConfig.ensembleWeights?.[m.modelId] || m.defaultWeight || 20;

                                            const activeIds = predictionConfig.ensembleModels || [];
                                            const totalWeight = activeIds.reduce((sum, id) => sum + (Number(predictionConfig.ensembleWeights?.[id]) || 10), 0) || 1;
                                            const dynamicShare = isSelected ? Math.round(((currentWeight / totalWeight) * 100)) : 0;

                                            return (
                                                <div
                                                    key={m.modelId}
                                                    className={`p-4 rounded-xl border transition-all relative flex flex-col justify-between ${
                                                        isSelected
                                                            ? 'bg-background-card border-border-default shadow-xs'
                                                            : 'bg-background-surface/30 border-border-subtle opacity-70 hover:opacity-90'
                                                    }`}
                                                >
                                                    <div>
                                                        {/* Top row: Checkbox + Name + Status */}
                                                        <div className="flex items-start justify-between gap-2 mb-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleTogglePredictionModel(m.modelId)}
                                                                className="flex items-center gap-2.5 text-left group cursor-pointer"
                                                            >
                                                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                                                    isSelected
                                                                        ? 'bg-accent-primary border-accent-primary text-white'
                                                                        : 'bg-background-surface border-border-default'
                                                                }`}>
                                                                    {isSelected && <Check size={11} className="stroke-[3]" />}
                                                                </div>
                                                                <div>
                                                                    <div className="text-[13px] font-bold text-text-primary tracking-tight group-hover:text-accent-primary transition-colors">
                                                                        {m.name}
                                                                    </div>
                                                                    <div className="text-[10px] font-mono text-text-tertiary">
                                                                        {m.category}
                                                                    </div>
                                                                </div>
                                                            </button>

                                                            <div className="flex flex-col items-end gap-1 shrink-0">
                                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${
                                                                    m.status === 'online'
                                                                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                                        : m.status === 'standby'
                                                                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                                        : 'bg-slate-500/10 text-text-tertiary border-border-subtle'
                                                                }`}>
                                                                    {m.status === 'online' ? '● READY' : m.status === 'standby' ? '◐ STANDBY' : '○ OFFLINE'}
                                                                </span>
                                                                {isSelected && (
                                                                    <span className="text-[10px] font-mono font-bold text-text-secondary">
                                                                        {dynamicShare}% Share
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Description & Specs */}
                                                        <p className="text-[11px] text-text-secondary leading-relaxed mb-3">
                                                            {m.description}
                                                        </p>

                                                        {/* Capability Pills */}
                                                        {m.capabilities && m.capabilities.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mb-3">
                                                                {m.capabilities.map((cap, cIdx) => (
                                                                    <span key={cIdx} className="px-1.5 py-0.5 rounded bg-background-surface border border-border-subtle text-[9px] font-mono text-text-tertiary">
                                                                        {cap}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Bottom controls: Weight Slider + Test Benchmark */}
                                                    <div className="space-y-3 pt-3 border-t border-border-subtle">
                                                        {isSelected && !predictionConfig.autoWeighting && (
                                                            <div className="space-y-1">
                                                                <div className="flex justify-between items-center text-[10px] font-mono">
                                                                    <span className="text-text-tertiary">Ensemble Weight:</span>
                                                                    <span className="text-text-primary font-mono font-bold">{currentWeight} pts</span>
                                                                </div>
                                                                <input
                                                                    type="range"
                                                                    min="5"
                                                                    max="100"
                                                                    step="5"
                                                                    value={currentWeight}
                                                                    onChange={(e) => handlePredictionWeightChange(m.modelId, e.target.value)}
                                                                    className="w-full accent-blue-500 h-1.5 bg-background-surface rounded-lg cursor-pointer"
                                                                />
                                                            </div>
                                                        )}

                                                        <div className="flex items-center justify-between gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleTestPredictionModel(m.modelId)}
                                                                disabled={isTesting}
                                                                className="px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-semibold bg-background-surface hover:bg-background-elevated text-text-secondary hover:text-text-primary border border-border-subtle transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                                            >
                                                                {isTesting ? <Loader size={11} /> : <Zap size={11} className="text-amber-400" />}
                                                                <span>{isTesting ? 'Testing...' : 'Test & Benchmark'}</span>
                                                            </button>

                                                            {testRes ? (
                                                                <span className={`text-[10px] font-mono font-bold ${testRes.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                                    {testRes.success ? `⚡ ${testRes.latencyMs}ms` : 'Failed'}
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] font-mono text-text-tertiary">
                                                                    {m.latencyBenchmark}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>

            {/* ── AI Gateway Live Provider Limits Card (Requests & Tokens) ── */}
            <GatewayLimitsCard className="mt-6" />

            {/* ── Models & Quotas Directory (5-in-a-row Architecture) ─────────────── */}
            <PaiModelInventory providers={providers} localModels={localModels} />

            {/* ── 3. Model Parameters ── */}
            <div className="bg-background-card/95 border border-border-default/60 rounded-2xl p-6 shadow-sm mt-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-border-default/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 shrink-0">
                            <SlidersHorizontal size={18} />
                        </div>
                        <div>
                            <h3 className="text-[15px] font-bold text-text-primary tracking-tight">Model Parameters</h3>
                            <p className="text-[12px] text-text-tertiary mt-0.5">
                                Global inference sampling controls and cognitive temperature tuning.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5 self-start sm:self-auto">
                        <button 
                            onClick={async () => {
                                setTemperature(0.7);
                                const newRouting = { ...routing, temperature: 0.7 };
                                setRouting(newRouting);
                                try {
                                    await axiosInstance.put('/api/v1/ai-settings/routing', newRouting);
                                    showToast('Temperature reset to default (0.70)');
                                } catch (e) {
                                    showToast('Failed to reset', 'error');
                                }
                            }}
                            className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-white/[0.05] transition-colors"
                            title="Reset to default (0.70)"
                        >
                            <RotateCcw size={13} />
                        </button>
                        <span className="text-[13px] font-mono font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2.5 py-0.5 rounded-lg">
                            {temperature.toFixed(2)}
                        </span>
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-[12px] font-medium text-text-secondary">Temperature (Creativity)</label>
                        <span className="text-[11px] font-mono text-text-tertiary">
                            {temperature <= 0.3 
                                ? 'Strict / Deterministic' 
                                : temperature <= 0.75 
                                ? 'Balanced Confluence' 
                                : 'Creative / Exploratory'}
                        </span>
                    </div>
                    <UniversalSlider 
                        min="0" max="1" step="0.05" value={temperature}
                        defaultValue={0.7}
                        recommendedRange={[0.2, 0.8]}
                        onChange={(e) => setTemperature(parseFloat(e.target.value))}
                        onMouseUp={async (e) => {
                            const val = parseFloat(e.target.value);
                            const newRouting = { ...routing, temperature: val };
                            setRouting(newRouting);
                            try {
                                await axiosInstance.put('/api/v1/ai-settings/routing', newRouting);
                                showToast('Temperature saved');
                            } catch (e) {
                                showToast('Failed to save temperature', 'error');
                            }
                        }}
                        className="mt-1"
                    />
                    <div className="flex justify-between items-center text-[10px] font-mono text-text-tertiary mt-2">
                        <span>0.00 (Strict)</span>
                        <span>0.20 (Quant)</span>
                        <span className="text-orange-400/80 font-semibold">0.70 (Default)</span>
                        <span>1.00 (Creative)</span>
                    </div>
                </div>
            </div>

            {/* ── 4. Response Verbosity ── */}
            <div className="bg-background-card/95 border border-border-default/60 rounded-2xl p-6 shadow-sm mt-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-border-default/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
                            <SlidersHorizontal size={18} />
                        </div>
                        <div>
                            <h3 className="text-[15px] font-bold text-text-primary tracking-tight">Response Verbosity</h3>
                            <p className="text-[12px] text-text-tertiary mt-0.5">
                                Target word count and dynamic token budgets across individual dashboard workstations.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        {
                            key: 'headerInsight',
                            label: 'Header Insight Length',
                            description: 'Controls the word length of page-level AI summaries at the top.',
                            defaultVal: 350,
                            recommendedRange: [150, 450]
                        },
                        {
                            key: 'cardInsight',
                            label: 'Card Insight Length',
                            description: 'Controls the word length of analysis inside individual indicator cards.',
                            defaultVal: 150,
                            recommendedRange: [50, 250]
                        },
                        {
                            key: 'pageInsight',
                            label: 'Master Dashboard Length',
                            description: 'Controls the word length of the main master dashboard composite summary.',
                            defaultVal: 500,
                            recommendedRange: [300, 750]
                        },
                        {
                            key: 'manualChat',
                            label: 'Chat Response Length',
                            description: 'Controls the word length of QChat and manual chat conversations.',
                            defaultVal: 500,
                            recommendedRange: [250, 800]
                        }
                    ].map(item => {
                        const rawVal = routing[item.key]?.verbosity;
                        let currentWords = item.defaultVal;
                        if (typeof rawVal === 'number') {
                            currentWords = rawVal;
                        } else if (rawVal === 'short') {
                            currentWords = 50;
                        } else if (rawVal === 'detailed') {
                            currentWords = 350;
                        } else if (rawVal === 'medium') {
                            currentWords = 150;
                        }

                        return (
                            <div key={item.key} className="flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-[12px] font-medium text-text-secondary">{item.label}</label>
                                        <span className="text-[12px] font-mono font-bold text-blue-400 text-right">
                                            {currentWords >= 1000 ? 'Max (1000w)' : `${currentWords} words`}
                                        </span>
                                    </div>
                                    <UniversalSlider 
                                        min="50" max="1000" step="25"
                                        value={currentWords}
                                        defaultValue={item.defaultVal}
                                        recommendedRange={item.recommendedRange}
                                        onChange={(e) => {
                                            const val = Number(e.target.value);
                                            setRouting(prev => ({ 
                                                ...prev, 
                                                [item.key]: { ...prev[item.key], verbosity: val } 
                                            }));
                                        }}
                                        onMouseUp={async (e) => {
                                            const val = Number(e.target.value);
                                            handleRoutingChange(item.key, { verbosity: val });
                                        }}
                                        className="mt-2"
                                    />
                                </div>
                                <p className="text-[11px] text-text-tertiary mt-2 leading-relaxed">
                                    {item.description}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-background-card border border-border-default rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                        <div className="p-4 border-b border-border-default/50 flex justify-between items-center">
                            <h3 className="font-semibold text-text-primary">{editingProvider ? 'Edit Provider' : 'Add Provider'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-text-tertiary hover:text-text-primary"><X size={16} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            {!editingProvider && (
                                <div>
                                    <label className="block text-[12px] font-medium text-text-secondary mb-1">Load Template</label>
                                    <UiverseDropdown
                                        options={templates.map(t => ({ value: t.providerId, label: t.displayName }))}
                                        onChange={handleTemplateSelect}
                                        placeholder="-- Select Template --"
                                        className="w-full"
                                        matchWidth={true}
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[12px] font-medium text-text-secondary mb-1">Provider ID</label>
                                    <input 
                                        required value={formData.providerId} 
                                        onChange={e => setFormData({...formData, providerId: e.target.value})}
                                        disabled={!!editingProvider}
                                        className="w-full bg-background-surface border border-border-default/50 rounded-lg px-3 py-2 text-[13px] text-text-primary outline-none disabled:opacity-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[12px] font-medium text-text-secondary mb-1">Display Name</label>
                                    <input 
                                        required value={formData.displayName} 
                                        onChange={e => setFormData({...formData, displayName: e.target.value})}
                                        className="w-full bg-background-surface border border-border-default/50 rounded-lg px-3 py-2 text-[13px] text-text-primary outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[12px] font-medium text-text-secondary mb-1">Base URL</label>
                                    <input 
                                        required value={formData.baseUrl} 
                                        onChange={e => setFormData({...formData, baseUrl: e.target.value})}
                                        className="w-full bg-background-surface border border-border-default/50 rounded-lg px-3 py-2 text-[13px] text-text-primary outline-none font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[12px] font-medium text-text-secondary mb-1">Purpose / Tag (Optional)</label>
                                    <input 
                                        value={formData.purpose} 
                                        onChange={e => setFormData({...formData, purpose: e.target.value})}
                                        placeholder="e.g. Fast Tasks, Personal"
                                        className="w-full bg-background-surface border border-border-default/50 rounded-lg px-3 py-2 text-[13px] text-text-primary outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[12px] font-medium text-text-secondary mb-1">API Key {editingProvider && "(Leave blank to keep existing)"}</label>
                                <input 
                                    type="password" value={formData.apiKey} 
                                    onChange={e => setFormData({...formData, apiKey: e.target.value})}
                                    placeholder={editingProvider ? "••••••••" : "sk-..."}
                                    className="w-full bg-background-surface border border-border-default/50 rounded-lg px-3 py-2 text-[13px] text-text-primary outline-none font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-[12px] font-medium text-text-secondary mb-2">Level Models (Optional)</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <input placeholder="Level 1 Fast" value={formData.models.level1_fast} onChange={e => setFormData({...formData, models: {...formData.models, level1_fast: e.target.value}})} className="w-full bg-background-surface border border-border-default/50 rounded-lg px-3 py-1.5 text-[12px] text-text-primary outline-none font-mono" />
                                    <input placeholder="Level 2 Standard" value={formData.models.level2_standard} onChange={e => setFormData({...formData, models: {...formData.models, level2_standard: e.target.value}})} className="w-full bg-background-surface border border-border-default/50 rounded-lg px-3 py-1.5 text-[12px] text-text-primary outline-none font-mono" />
                                    <input placeholder="Level 3 Advanced" value={formData.models.level3_advanced} onChange={e => setFormData({...formData, models: {...formData.models, level3_advanced: e.target.value}})} className="w-full bg-background-surface border border-border-default/50 rounded-lg px-3 py-1.5 text-[12px] text-text-primary outline-none font-mono" />
                                    <input placeholder="Level 4 Expert" value={formData.models.level4_expert} onChange={e => setFormData({...formData, models: {...formData.models, level4_expert: e.target.value}})} className="w-full bg-background-surface border border-border-default/50 rounded-lg px-3 py-1.5 text-[12px] text-text-primary outline-none font-mono" />
                                    <input placeholder="Level 5 Reasoner" value={formData.models.level5_reasoner} onChange={e => setFormData({...formData, models: {...formData.models, level5_reasoner: e.target.value}})} className="w-full bg-background-surface border border-border-default/50 rounded-lg px-3 py-1.5 text-[12px] text-text-primary outline-none font-mono" />
                                    <input placeholder="Level 6 Vision" value={formData.models.level6_vision} onChange={e => setFormData({...formData, models: {...formData.models, level6_vision: e.target.value}})} className="w-full bg-background-surface border border-border-default/50 rounded-lg px-3 py-1.5 text-[12px] text-text-primary outline-none font-mono" />
                                    <input placeholder="Level 7 Audio" value={formData.models.level7_audio} onChange={e => setFormData({...formData, models: {...formData.models, level7_audio: e.target.value}})} className="col-span-2 w-full bg-background-surface border border-border-default/50 rounded-lg px-3 py-1.5 text-[12px] text-text-primary outline-none font-mono" />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-border-default/50 mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-[13px] font-medium text-text-secondary hover:bg-background-surface transition-colors">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-[13px] font-medium transition-colors">Save Provider</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        {/* ── Custom Toast Notification Removed (Handled by Sonner) ── */}

        {/* ── Confirm Delete Modal ───────────────────────────────────────────── */}
        {providerToDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-background-elevated border border-border-default shadow-2xl rounded-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="px-5 py-4 border-b border-border-default/40 flex items-center gap-3">
                        <AlertCircle className="text-red-400" size={18} />
                        <h3 className="text-[14px] font-medium text-text-primary">Delete Provider</h3>
                    </div>
                    <div className="p-5">
                        <p className="text-[13px] text-text-secondary">
                            Are you sure you want to delete this provider? This action cannot be undone and may disrupt AI services.
                        </p>
                    </div>
                    <div className="px-5 py-4 border-t border-border-default/40 flex justify-end gap-3 bg-background-surface/30">
                        <button 
                            onClick={() => setProviderToDelete(null)}
                            className="px-4 py-2 text-[12px] font-medium text-text-secondary hover:bg-background-surface rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={confirmDelete}
                            className="px-4 py-2 text-[12px] font-medium bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        )}
        </div>
    );
}

