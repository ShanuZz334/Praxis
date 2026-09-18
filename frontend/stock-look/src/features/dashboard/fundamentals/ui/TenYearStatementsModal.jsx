import React, { useState, useRef } from 'react';
import { 
    X, TrendingUp, DollarSign, PieChart, BarChart3, Layers, 
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Percent,
    Sparkles, RotateCw, AlertCircle, ArrowLeft, Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import axiosInstance from '@/shared/utils/axiosInstance';
import Loader from '@/shared/components/ui/Loader';
import PeerComparisonTable from './PeerComparisonTable';

/**
 * Formats historical financial statement values into institutional, human-readable Indian units:
 * - >= 1,00,000 Cr -> e.g. 3.74L Cr
 * - >= 1,000 Cr -> e.g. 37.45k Cr
 * - < 1,000 Cr -> e.g. 500 Cr
 * - % metrics -> e.g. 18%
 * - EPS / Face Value -> e.g. ₹17.07
 * - Days / Cycle -> e.g. 18 d
 * - Multiples -> e.g. 1.25x
 */
const formatStatementValue = (v, rowName, mode = 'compact') => {
    if (v === null || v === undefined || v === '') {
        return { text: '--', tooltip: null, isNeg: false };
    }
    const strVal = String(v).trim();
    if (strVal === '' || strVal === '--') {
        return { text: '--', tooltip: null, isNeg: false };
    }

    const cleanVal = strVal.replace(/[₹,%\s]/g, '');
    const num = parseFloat(cleanVal);
    if (isNaN(num)) {
        return { text: strVal, tooltip: strVal, isNeg: false };
    }

    const isNeg = num < 0;
    const abs = Math.abs(num);
    const sign = isNeg ? '-' : '';
    const lower = (rowName || '').toLowerCase();

    // 1. Percentage Rows (strictly exclude profit, deferred tax, or non-% tax statement figures)
    const isPercentageMetric = (
        lower.includes('%') || 
        lower.includes('payout') || 
        lower.includes('margin') || 
        lower.includes('yield') || 
        lower.includes('cagr') || 
        lower.includes('growth') || 
        lower === 'tax %' || 
        lower === 'tax rate' ||
        lower.includes('tax rate') ||
        lower === 'roce' || 
        lower === 'roe' || 
        lower === 'roic'
    ) && !lower.includes('profit') && !lower.includes('before tax') && !lower.includes('deferred') && !lower.includes('advance');

    if (isPercentageMetric) {
        const dec = abs % 1 === 0 ? 0 : (abs >= 10 ? 1 : 2);
        return { 
            text: `${sign}${abs.toFixed(dec)}%`, 
            tooltip: `${rowName}: ${num}%`, 
            isNeg 
        };
    }

    // 2. Per-Share / Price Rows (INR)
    if (
        lower.includes('eps') || 
        lower.includes('per share') || 
        lower.includes('face value') || 
        lower.includes('dps') || 
        lower.includes('dividend/share')
    ) {
        return { 
            text: `${sign}₹${abs.toFixed(2)}`, 
            tooltip: `${rowName}: ₹${num.toFixed(2)} per share`, 
            isNeg 
        };
    }

    // 3. Operating Days / Cycles
    if (lower.includes('days') || lower.includes('cycle')) {
        return { 
            text: `${sign}${Math.round(abs)} d`, 
            tooltip: `${rowName}: ${Math.round(num)} Days`, 
            isNeg 
        };
    }

    // 4. Financial Multiples / Ratios
    if (
        lower.includes('coverage') || 
        lower.includes('debt to equity') || 
        lower.includes('debt/equity') || 
        lower.includes('current ratio') || 
        lower.includes('quick ratio')
    ) {
        return { 
            text: `${sign}${abs.toFixed(2)}x`, 
            tooltip: `${rowName}: ${num.toFixed(2)}x`, 
            isNeg 
        };
    }

    // 5. Financial Statement Values (Screener.in base unit is ₹ Crores)
    const exactFormatted = `${rowName}: ₹${num.toLocaleString('en-IN')} Crores`;
    
    if (mode === 'full') {
        return { 
            text: `${sign}${abs.toLocaleString('en-IN')} Cr`, 
            tooltip: exactFormatted, 
            isNeg 
        };
    }

    // Compact mode: L Cr (Lakh Crores >= 1,00,000), k Cr (Thousand Crores >= 1,000), Cr (< 1,000)
    if (abs >= 100000) {
        return { 
            text: `${sign}${(abs / 100000).toFixed(2)}L Cr`, 
            tooltip: exactFormatted, 
            isNeg 
        };
    }
    if (abs >= 1000) {
        return { 
            text: `${sign}${(abs / 1000).toFixed(2)}k Cr`, 
            tooltip: exactFormatted, 
            isNeg 
        };
    }
    return { 
        text: `${sign}${abs.toFixed(abs % 1 === 0 ? 0 : 1)} Cr`, 
        tooltip: exactFormatted, 
        isNeg 
    };
};

export default function TenYearStatementsModal({ 
    isOpen, 
    onClose, 
    screenerData, 
    fullData = null, 
    stockSymbol, 
    selectedInstrument = null 
}) {
    const [activeTab, setActiveTab] = useState('pl'); // 'pl', 'bs', 'cf', 'ratios', 'growth'
    const [unitFormat, setUnitFormat] = useState('compact'); // 'compact' | 'full'
    const [expandedRow, setExpandedRow] = useState(null);
    const [rowInsights, setRowInsights] = useState({});
    const tableScrollRef = useRef(null);

    if (!isOpen || !screenerData) return null;

    const { financials10Year, sector } = screenerData;
    const pl = financials10Year?.profitLoss || null;
    const bs = financials10Year?.balanceSheet || null;
    const cf = financials10Year?.cashFlow || null;
    const ratios = financials10Year?.ratiosTrajectory || null;
    const compounded = financials10Year?.compoundedGrowth || null;

    // Scroll table programmatically
    const scrollTable = (offset) => {
        if (tableScrollRef.current) {
            tableScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
        }
    };

    const scrollToEdge = (direction) => {
        if (tableScrollRef.current) {
            tableScrollRef.current.scrollTo({
                left: direction === 'left' ? 0 : tableScrollRef.current.scrollWidth,
                behavior: 'smooth'
            });
        }
    };

    // Fetch or toggle AI Insight for a double-clicked row (uses Cards Category model)
    const handleRowDoubleClick = (rowName, values, statementTitle) => {
        if (expandedRow === rowName) {
            setExpandedRow(null);
            return;
        }

        setExpandedRow(rowName);

        if (!rowInsights[rowName]?.text && !rowInsights[rowName]?.loading) {
            fetchRowInsight(rowName, values, statementTitle);
        }
    };

    const fetchRowInsight = async (rowName, values, statementTitle, isForce = false) => {
        if (!isForce && rowInsights[rowName]?.text) return;

        setRowInsights(prev => ({
            ...prev,
            [rowName]: { ...prev[rowName], loading: true, error: null }
        }));

        const years = getCurrentYears();
        const trajectorySummary = years.map((y, i) => `${y}: ${values[i] !== undefined && values[i] !== null ? values[i] : '--'}`).join(', ');
        const firstVal = values[0];
        const lastVal = values[values.length - 1];

        try {
            const res = await axiosInstance.post('/api/v1/ai-prompts/generate/historical_financials', {
                value: `${rowName}: ${lastVal} (10Y Initial: ${firstVal})`,
                displayName: `${rowName} (10-Year Trajectory)`,
                stockSymbol: stockSymbol || 'Company',
                scope: 'card', // CRITICAL: ensures cardInsight category model routing
                additionalContext: `Statement: ${statementTitle} | Metric: ${rowName} | 10Y Period: ${years[0]} (${firstVal}) → ${years[years.length - 1]} (${lastVal}) | Full 10Y Trajectory: ${trajectorySummary} | CRITICAL: Generate EXACTLY 5 to 6 lines of dense institutional equity research insight analyzing revenue/margin inflection points, balance sheet durability, capital allocation efficiency, and long-term compounding quality. No introductory fluff.`
            });

            setRowInsights(prev => ({
                ...prev,
                [rowName]: {
                    text: res.data?.insight || 'Insight currently unavailable.',
                    model: res.data?.model || 'Card AI Engine',
                    provider: res.data?.provider || '',
                    latencyMs: res.data?.latencyMs || 0,
                    loading: false,
                    error: null
                }
            }));
        } catch (err) {
            setRowInsights(prev => ({
                ...prev,
                [rowName]: {
                    text: null,
                    loading: false,
                    error: err.response?.data?.error || err.message
                }
            }));
        }
    };

    const getCurrentYears = () => {
        if (activeTab === 'pl') return pl?.years || [];
        if (activeTab === 'bs') return bs?.years || [];
        if (activeTab === 'cf') return cf?.years || [];
        if (activeTab === 'ratios') return ratios?.years || [];
        return [];
    };

    const getActiveStatementTitle = () => {
        if (activeTab === 'peers') return 'Domestic Industry Peer Comparison';
        if (activeTab === 'pl') return 'Annual Profit & Loss Statement';
        if (activeTab === 'bs') return 'Annual Consolidated Balance Sheet';
        if (activeTab === 'cf') return 'Annual Consolidated Cash Flow Statement';
        if (activeTab === 'ratios') return 'Audited Financial Ratios Trajectory';
        return 'Compounded Financial Growth';
    };

    const renderTable = (tableData) => {
        if (!tableData || !tableData.years || tableData.years.length === 0) {
            return (
                <div className="py-24 text-center text-sm text-text-tertiary italic">
                    Historical statement data unavailable for {stockSymbol || 'this company'}.
                </div>
            );
        }

        const years = tableData.years;
        const rawRows = tableData.rows || {};
        const currentStatementTitle = getActiveStatementTitle();

        const isRangeRow = (name) => {
            const lower = name.toLowerCase().trim();
            return lower.includes('years') || lower.includes('year') || lower === 'ttm' || lower.startsWith('ttm') || lower.includes('cagr');
        };

        const rows = Object.entries(rawRows).filter(([rowName, values]) => {
            if (isRangeRow(rowName)) return false;
            return Array.isArray(values) && values.length > 0;
        });

        return (
            <div 
                ref={tableScrollRef}
                className="overflow-x-auto overflow-y-auto flex-1 bg-background-card select-text"
                style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'var(--scrollbar-thumb) var(--bg-card)'
                }}
            >
                <table className="w-full min-w-max border-collapse text-left text-xs font-mono">
                    {/* Sticky Header */}
                    <thead>
                        <tr className="border-b-2 border-border-subtle bg-background-card">
                            <th className="sticky top-0 left-0 z-30 bg-background-card px-6 py-3 text-left font-bold text-xs text-text-tertiary uppercase tracking-widest min-w-[240px] max-w-[280px]">
                                Particulars
                            </th>
                            {years.map((yr, i) => (
                                <th 
                                    key={yr || i} 
                                    className="sticky top-0 z-10 bg-background-card px-4 py-3 text-right font-semibold text-xs text-text-tertiary uppercase tracking-wider min-w-[110px] whitespace-nowrap"
                                >
                                    {yr}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    {/* Table Body */}
                    <tbody className="divide-y divide-border-subtle text-[11px]">
                        {rows.map(([rowName, values], rIdx) => {
                            const isHighlightRow = [
                                'Sales', 'Revenue', 'Operating Profit', 'Profit before tax', 'Net Profit', 
                                'Total Assets', 'Total Liabilities', 'Cash from Operating Activity', 
                                'Net Cash flow', 'ROCE %', 'ROE %'
                            ].includes(rowName);

                            const isPercentageRow = rowName.includes('%') || rowName.toLowerCase().includes('payout');
                            const isEven = rIdx % 2 === 0;
                            const isExpanded = expandedRow === rowName;
                            const insightState = rowInsights[rowName];

                            return (
                                <React.Fragment key={rowName || rIdx}>
                                    <tr 
                                        onDoubleClick={() => handleRowDoubleClick(rowName, values, currentStatementTitle)}
                                        className={cn(
                                            "group transition-colors cursor-pointer select-none bg-background-card",
                                            isHighlightRow && "bg-blue-500/5 font-bold",
                                            isExpanded ? "bg-blue-500/10 border-l-2 border-blue-500" : "hover:bg-border-subtle/30"
                                        )}
                                        title="Double click to expand 5-6 line institutional AI insight"
                                    >
                                        {/* Sticky Particulars Cell */}
                                        <td 
                                            className={cn(
                                                "sticky left-0 z-20 px-6 py-3 whitespace-nowrap text-left transition-colors bg-background-card",
                                                isHighlightRow 
                                                    ? "text-blue-500 font-bold" 
                                                    : "text-text-primary",
                                                isExpanded ? "bg-blue-500/10" : "group-hover:bg-border-subtle/30"
                                            )}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span>{rowName}</span>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRowDoubleClick(rowName, values, currentStatementTitle);
                                                    }}
                                                    className={cn(
                                                        "p-1 rounded text-text-tertiary hover:text-amber-500 hover:bg-amber-500/10 transition-all opacity-0 group-hover:opacity-100",
                                                        isExpanded && "opacity-100 text-amber-500 bg-amber-500/10"
                                                    )}
                                                    title="AI Insight (or double-click row)"
                                                >
                                                    <Sparkles size={12} />
                                                </button>
                                            </div>
                                        </td>

                                        {/* Year Data Cells */}
                                        {years.map((_, cIdx) => {
                                            const v = values[cIdx];
                                            const { text: formattedVal, tooltip, isNeg } = formatStatementValue(v, rowName, unitFormat);

                                            return (
                                                <td 
                                                    key={cIdx} 
                                                    title={tooltip || undefined}
                                                    className={cn(
                                                        "px-4 py-3 text-right whitespace-nowrap min-w-[110px]",
                                                        isHighlightRow ? "font-bold text-text-primary" : "text-text-secondary",
                                                        isNeg && "text-rose-500 font-medium"
                                                    )}
                                                >
                                                    {formattedVal}
                                                </td>
                                            );
                                        })}
                                    </tr>

                                    {/* Inline Expanded AI Insight Row */}
                                    {isExpanded && (
                                        <tr className="bg-blue-500/5 border-y-2 border-blue-500/40">
                                            <td colSpan={years.length + 1} className="p-0">
                                                <div className="sticky left-0 max-w-[calc(100vw-80px)] px-6 py-4">
                                                    <div className="flex items-center justify-between pb-2.5 border-b border-border-subtle mb-3">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-500 shadow-sm">
                                                                <Sparkles size={14} className={insightState?.loading ? "animate-spin" : ""} />
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className="text-xs font-bold text-text-primary uppercase tracking-wide">
                                                                    {rowName} — 10-Year Institutional Trajectory Analysis
                                                                </span>
                                                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-500 font-semibold">
                                                                    Cards Model ({insightState?.model || 'Card Insight Routing'})
                                                                </span>
                                                                {insightState?.latencyMs > 0 && (
                                                                    <span className="text-[10px] text-text-tertiary font-mono">
                                                                        {insightState.latencyMs}ms
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => fetchRowInsight(rowName, values, currentStatementTitle, true)}
                                                                disabled={insightState?.loading}
                                                                className="px-2.5 py-1 text-[11px] rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 border border-blue-500/30 flex items-center gap-1.5 transition-colors font-mono"
                                                                title="Regenerate 5-6 line insight"
                                                            >
                                                                <RotateCw size={11} className={insightState?.loading ? "animate-spin" : ""} />
                                                                <span>Regenerate</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setExpandedRow(null)}
                                                                className="p-1 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-border-subtle transition-colors"
                                                                title="Collapse Insight"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Insight Text Body */}
                                                    {insightState?.loading ? (
                                                        <div className="py-4 flex items-center justify-start gap-3 text-xs text-blue-500 font-mono animate-pulse">
                                                            <Loader size="sm" color="blue" />
                                                            <span>Evaluating 10-year historical inflection points and capital efficiency...</span>
                                                        </div>
                                                    ) : insightState?.error ? (
                                                        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center justify-between font-sans">
                                                            <span>{insightState.error}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => fetchRowInsight(rowName, values, currentStatementTitle, true)}
                                                                className="underline hover:opacity-70 ml-3"
                                                            >
                                                                Retry
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="text-xs leading-relaxed text-text-primary font-sans whitespace-pre-line max-w-5xl">
                                                            {insightState?.text}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderCompoundedGrowth = () => {
        if (compounded && Object.keys(compounded).length > 0) {
            return (
                <div className="p-6 overflow-y-auto flex-1 bg-background-card">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {Object.entries(compounded).map(([key, section]) => {
                            const isProfitOrSales = key === 'salesGrowth' || key === 'profitGrowth';
                            return (
                                <div 
                                    key={key} 
                                    className="p-5 rounded-xl border border-border-subtle bg-background-subtle space-y-4"
                                >
                                    <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className={cn(
                                                "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold",
                                                key === 'salesGrowth' && "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30",
                                                key === 'profitGrowth' && "bg-blue-500/10 text-blue-500 border border-blue-500/30",
                                                key === 'priceCagr' && "bg-purple-500/10 text-purple-500 border border-purple-500/30",
                                                key === 'roe' && "bg-amber-500/10 text-amber-500 border border-amber-500/30"
                                            )}>
                                                {key === 'salesGrowth' ? <TrendingUp size={15} /> :
                                                 key === 'profitGrowth' ? <DollarSign size={15} /> :
                                                 key === 'priceCagr' ? <BarChart3 size={15} /> : <Percent size={15} />}
                                            </div>
                                            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                                                {section.title || key}
                                            </h4>
                                        </div>
                                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-border-subtle text-text-tertiary border border-border-subtle">
                                            Audited Screener.in
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-4 gap-3 text-center font-mono">
                                        {Object.entries(section.periods || {}).map(([period, val]) => {
                                            const clean = String(val).replace(/%/g, '');
                                            const num = parseFloat(clean);
                                            const isNeg = !isNaN(num) && num < 0;

                                            return (
                                                <div 
                                                    key={period} 
                                                    className="p-3 rounded-lg bg-background-card border border-border-subtle flex flex-col justify-center"
                                                >
                                                    <span className="text-[10px] text-text-tertiary uppercase block mb-1">
                                                        {period}
                                                    </span>
                                                    <span className={cn(
                                                        "text-sm font-bold",
                                                        isNeg ? "text-rose-500" : (isProfitOrSales ? "text-emerald-500" : "text-blue-500")
                                                    )}>
                                                        {val}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }

        return (
            <div className="py-24 text-center text-sm text-text-tertiary italic">
                Compounded growth metrics currently unavailable for {stockSymbol || 'this company'}.
            </div>
        );
    };

    const currentYears = getCurrentYears();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
            {/* Modal Dialog Container — Full viewport width, single clean outer box */}
            <div className="relative w-full h-full bg-background-card border-x border-border-subtle shadow-2xl overflow-hidden flex flex-col">
                
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-border-subtle bg-background-card shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-900/30 border border-blue-700/40 flex items-center justify-center text-blue-400">
                            <Layers size={20} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h3 className="text-lg font-bold text-text-primary tracking-tight">
                                    {stockSymbol || 'Company Financials'}
                                </h3>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/80 border border-blue-700/60 text-blue-300 font-semibold">
                                    10+ Years Audited Statements
                                </span>
                            </div>
                            <p className="text-[11px] text-text-tertiary mt-0.5">
                                {sector?.industry ? `${sector.industry} • ` : ''}Screener.in Financial Intelligence Pipeline
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="p-2 rounded-xl text-text-tertiary hover:text-text-primary hover:bg-border-subtle transition-colors border border-transparent hover:border-border-subtle"
                            title="Close (Esc)"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Master Navigation & Controls Bar — Zero redundant strips, perfectly aligned toggle box */}
                <div className="flex items-center gap-3 px-5 py-3 bg-background-card border-b border-border-subtle shrink-0 overflow-x-auto no-scrollbar">
                    {/* The Segmented Tab Toggle */}
                    <div className="inline-flex items-center p-1 bg-background-subtle rounded-xl border border-border-subtle gap-1 shadow-inner shrink-0 h-10">
                        <button
                            type="button"
                            onClick={() => { setActiveTab('pl'); setExpandedRow(null); }}
                            className={cn(
                                "h-8 px-3.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 select-none shrink-0",
                                activeTab === 'pl'
                                    ? "bg-blue-600 text-white shadow-[0_1px_8px_rgba(37,99,235,0.4)]"
                                    : "text-text-secondary hover:text-text-primary hover:bg-border-subtle"
                            )}
                        >
                            <BarChart3 size={13} className={activeTab === 'pl' ? "text-white" : "text-blue-500"} />
                            <span>Profit & Loss</span>
                            {pl?.years?.length > 0 && (
                                <span className={cn(
                                    "text-[10px] font-mono px-1.5 py-0.5 rounded font-normal leading-none",
                                    activeTab === 'pl' ? "bg-blue-700/80 text-white" : "bg-border-subtle text-text-tertiary"
                                )}>
                                    {pl.years.length}Y
                                </span>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => { setActiveTab('bs'); setExpandedRow(null); }}
                            className={cn(
                                "h-8 px-3.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 select-none shrink-0",
                                activeTab === 'bs'
                                    ? "bg-blue-600 text-white shadow-[0_1px_8px_rgba(37,99,235,0.4)]"
                                    : "text-text-secondary hover:text-text-primary hover:bg-border-subtle"
                            )}
                        >
                            <PieChart size={13} className={activeTab === 'bs' ? "text-white" : "text-purple-500"} />
                            <span>Balance Sheet</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => { setActiveTab('cf'); setExpandedRow(null); }}
                            className={cn(
                                "h-8 px-3.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 select-none shrink-0",
                                activeTab === 'cf'
                                    ? "bg-blue-600 text-white shadow-[0_1px_8px_rgba(37,99,235,0.4)]"
                                    : "text-text-secondary hover:text-text-primary hover:bg-border-subtle"
                            )}
                        >
                            <DollarSign size={13} className={activeTab === 'cf' ? "text-white" : "text-emerald-500"} />
                            <span>Cash Flow</span>
                        </button>

                        {ratios?.years?.length > 0 && (
                            <button
                                type="button"
                                onClick={() => { setActiveTab('ratios'); setExpandedRow(null); }}
                                className={cn(
                                    "h-8 px-3.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 select-none shrink-0",
                                    activeTab === 'ratios'
                                        ? "bg-blue-600 text-white shadow-[0_1px_8px_rgba(37,99,235,0.4)]"
                                        : "text-text-secondary hover:text-text-primary hover:bg-border-subtle"
                                )}
                            >
                                <Percent size={13} className={activeTab === 'ratios' ? "text-white" : "text-amber-500"} />
                                <span>Financial Ratios</span>
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={() => { setActiveTab('growth'); setExpandedRow(null); }}
                            className={cn(
                                "h-8 px-3.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 select-none shrink-0",
                                activeTab === 'growth'
                                    ? "bg-blue-600 text-white shadow-[0_1px_8px_rgba(37,99,235,0.4)]"
                                    : "text-text-secondary hover:text-text-primary hover:bg-border-subtle"
                            )}
                        >
                            <TrendingUp size={13} className={activeTab === 'growth' ? "text-white" : "text-cyan-500"} />
                            <span>Compounded CAGR</span>
                        </button>
                    </div>

                    {/* Center: Minimal clean label */}
                    {activeTab !== 'growth' && (
                        <div className="hidden 2xl:flex items-center gap-1.5 font-mono text-[11px] text-text-tertiary shrink-0 whitespace-nowrap">
                            <span className="text-text-secondary font-medium">{getActiveStatementTitle()}</span>
                            <span className="text-border-default">·</span>
                            <span className="text-blue-500">{currentYears.length}Y</span>
                        </div>
                    )}

                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col min-h-0">
                    {activeTab === 'pl' && renderTable(pl)}
                    {activeTab === 'bs' && renderTable(bs)}
                    {activeTab === 'cf' && renderTable(cf)}
                    {activeTab === 'ratios' && renderTable(ratios)}
                    {activeTab === 'growth' && renderCompoundedGrowth()}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-border-subtle bg-background-card flex items-center justify-between text-[11px] text-text-tertiary shrink-0">
                    <div className="flex items-center gap-3 font-mono">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                        <span>Audited Consolidated Statements via Screener.in</span>
                        <span className="text-border-default">•</span>
                        <span className="text-text-secondary">Card Model Routing: Active</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-1.5 rounded-xl bg-border-subtle border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-border-default transition-colors font-medium text-xs"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
