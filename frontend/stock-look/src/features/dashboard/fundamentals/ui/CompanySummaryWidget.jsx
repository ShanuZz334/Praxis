import React, { useState } from 'react';
import { Edit2, Building2, BarChart2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDashboardContext } from '@/shared/context/DashboardContext';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { FO_EQUITIES } from '@/shared/utils/foInstruments';
import PeerComparisonTable from './PeerComparisonTable';
import TenYearStatementsModal from './TenYearStatementsModal';

export default function CompanySummaryWidget({ data, manualOverrides, selectedInstrument, setEditingKey, resolveTime }) {
    const { livePrices } = useDashboardContext();
    const [isStatementsModalOpen, setIsStatementsModalOpen] = useState(false);

    const liveData = livePrices?.[selectedInstrument];
    const instrumentLabel = FO_EQUITIES.find(e => e.value === selectedInstrument)?.label || selectedInstrument;

    // 1. Data Extraction Helper
    const extractRatio = (names) => {
        const ratiosArray = Array.isArray(data?.ratios) ? data.ratios : [];
        const obj = ratiosArray.find(r => names.some(n => r.name?.toLowerCase() === n.toLowerCase()));
        return obj?.company_value ? parseFloat(obj.company_value) : null;
    };

    const extractProfile = (key) => {
        return data?.company_profile?.[key] ?? null;
    };

    const extractQuote = (key) => {
        return data?.quote?.[key] ?? null;
    };

    const scrRatios = data?.screener?.ratios || {};

    // 2. Resolve Metrics (Upstox -> Screener -> Manual Fallback)
    const metrics = [
        {
            label: "Market Cap",
            value: data?.marketCap ?? extractProfile('market_cap') ?? extractRatio(['market_cap']) ?? (scrRatios['Market Cap'] ? parseFloat(scrRatios['Market Cap'].replace(/,/g, '')) : null) ?? manualOverrides?.market_cap,
            suffix: " Cr.",
            prefix: "₹",
            overrideKey: 'market_cap'
        },
        {
            label: "Current Price",
            value: liveData?.ltp ?? extractQuote('last_price') ?? (scrRatios['Current Price'] ? parseFloat(scrRatios['Current Price'].replace(/,/g, '')) : null) ?? manualOverrides?.current_price,
            prefix: "₹",
            overrideKey: 'current_price',
            netChange: liveData?.netChange,
            pctChange: liveData?.pctChange,
            status: liveData?.status
        },
        {
            label: "High / Low",
            value: (extractQuote('ohlc')?.high && extractQuote('ohlc')?.low) 
                   ? `${parseFloat(extractQuote('ohlc').high).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / ${parseFloat(extractQuote('ohlc').low).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                   : (scrRatios['High / Low'] || manualOverrides?.high_low),
            prefix: "₹ ",
            overrideKey: 'high_low',
            isString: true
        },
        {
            label: 'P/E Ratio',
            value: extractRatio(['p/e', 'pe', 'pe ratio']) ?? (scrRatios['Stock P/E'] ? parseFloat(scrRatios['Stock P/E']) : null) ?? manualOverrides?.pe_ratio,
            suffix: "x",
            overrideKey: CARD_REGISTRY.pe_ratio.id
        },
        {
            label: "Book Value",
            value: extractRatio(['book value', 'bvps']) ?? (scrRatios['Book Value'] ? parseFloat(scrRatios['Book Value']) : null) ?? manualOverrides?.book_value,
            prefix: "₹",
            overrideKey: 'book_value'
        },
        {
            label: "Dividend Yield",
            value: data?.dividendYield ?? extractRatio(['dividend yield', 'div yield']) ?? (scrRatios['Dividend Yield'] ? parseFloat(scrRatios['Dividend Yield']) : null) ?? manualOverrides?.dividend_yield,
            suffix: "%",
            overrideKey: 'dividend_yield'
        },
        {
            label: "ROCE",
            value: extractRatio(['roce', 'return on capital']) ?? (scrRatios['ROCE'] ? parseFloat(scrRatios['ROCE']) : null) ?? manualOverrides?.roce,
            suffix: "%",
            overrideKey: 'roce'
        },
        {
            label: "ROE",
            value: extractRatio(['roe', 'return on equity']) ?? (scrRatios['ROE'] ? parseFloat(scrRatios['ROE']) : null) ?? manualOverrides?.roe,
            suffix: "%",
            overrideKey: 'roe'
        },
        {
            label: "Face Value",
            value: extractProfile('face_value') ?? (scrRatios['Face Value'] ? parseFloat(scrRatios['Face Value']) : null) ?? manualOverrides?.face_value,
            prefix: "₹",
            overrideKey: 'face_value'
        }
    ];

    // 3. Render Metric Row
    const renderMetric = (m, i) => {
        const isNull = m.value === null || m.value === undefined || m.value === '';
        const displayVal = isNull ? '--' : (m.isString ? m.value : (m.prefix || '') + parseFloat(m.value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + (m.suffix || ''));
        const isManual = isNull || (m.value === manualOverrides?.[m.overrideKey]);

        return (
            <div key={i} className="flex items-center justify-between py-1.5 md:py-2 border-b border-border-subtle last:border-0 md:border-0 md:px-4">
                <span className="text-[11px] md:text-xs text-text-secondary font-medium tracking-wider">
                    {m.label}
                </span>
                <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2">
                        {isManual && (
                            <span className="text-text-tertiary">
                                <Edit2 className="w-3 h-3" />
                            </span>
                        )}
                        <span className={cn(
                            "text-xs md:text-sm font-bold font-mono tracking-tight",
                            isNull ? "text-text-tertiary" : (isManual ? "text-text-primary" : "text-text-primary")
                        )}>
                            {displayVal}
                        </span>
                    </div>
                    {m.netChange !== undefined && m.pctChange !== undefined && m.netChange !== null && (
                        <span className={cn(
                            "text-[10px] font-mono",
                            m.status === 'UP' ? "text-emerald-500" : (m.status === 'DOWN' ? "text-rose-500" : "text-text-tertiary")
                        )}>
                            {m.netChange > 0 ? '+' : ''}{m.netChange?.toFixed(2)} ({m.pctChange > 0 ? '+' : ''}{m.pctChange?.toFixed(2)}%)
                        </span>
                    )}
                </div>
            </div>
        );
    };

    const col1 = metrics.slice(0, 3);
    const col2 = metrics.slice(3, 6);
    const col3 = metrics.slice(6, 9);

    const missingManualCount = metrics.filter(m => {
        const isNull = m.value === null || m.value === undefined || m.value === '';
        return isNull || (m.value === manualOverrides?.[m.overrideKey]);
    }).length;

    // Collect distinct sync times
    const syncTimes = metrics.map(m => {
        const isNull = m.value === null || m.value === undefined || m.value === '';
        const isManual = isNull || (m.value === manualOverrides?.[m.overrideKey]);
        const str = resolveTime ? resolveTime(!isManual, isManual ? m.overrideKey : null) : null;
        if (!str) return null;
        const match = str.match(/(\d{1,2}:\d{2}\s[AP]M)/);
        return match ? match[1] : null;
    }).filter(Boolean);
    
    const uniqueTimes = Array.from(new Set(syncTimes));
    
    let syncTimeText = null;
    if (uniqueTimes.length === 1) {
        syncTimeText = `Sync: ${uniqueTimes[0]}`;
    } else if (uniqueTimes.length > 1) {
        const sorted = uniqueTimes.sort((a, b) => new Date('1970/01/01 ' + a) - new Date('1970/01/01 ' + b));
        syncTimeText = `Sync: ${sorted[0]} - ${sorted[sorted.length - 1]}`;
    } else {
        const globalSync = resolveTime ? resolveTime(!!data) : null;
        if (globalSync) {
            const match = globalSync.match(/(\d{1,2}:\d{2}\s[AP]M)/);
            syncTimeText = match ? `Sync: ${match[1]}` : globalSync;
        }
    }

    const pros = data?.screener?.pros || [];
    const cons = data?.screener?.cons || [];
    const hasProsCons = pros.length > 0 || cons.length > 0;
    const has10YData = !!(data?.screener?.financials10Year?.profitLoss?.years?.length);

    return (
        <div className="w-full mt-8 bg-background-elevated/95 backdrop-blur-xl border border-border-default rounded-xl p-4 md:p-6 mb-6 shadow-lg overflow-hidden relative">
            {/* Header / Ticker */}
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 md:mb-6 border-b border-border-subtle pb-3">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                        <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                        <h2 className="text-lg md:text-xl font-bold text-text-primary flex items-center gap-3">
                            Company Snapshot
                            {missingManualCount > 0 && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/30">
                                    {missingManualCount} manual
                                </span>
                            )}
                        </h2>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-text-tertiary font-mono">{instrumentLabel}</span>
                            {syncTimeText && (
                                <span className="text-[10px] text-text-secondary font-mono border-l border-border-subtle pl-3">
                                    {syncTimeText}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* 10Y Statements Button */}
                {has10YData && (
                    <button
                        onClick={() => setIsStatementsModalOpen(true)}
                        className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400 hover:bg-blue-600/30 hover:text-blue-300 text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
                    >
                        <BarChart2 size={14} />
                        <span>10Y Financial Statements</span>
                    </button>
                )}
            </div>

            {/* Metrics 3-Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 md:gap-y-4 md:divide-x divide-border-subtle">
                <div className="flex flex-col">
                    {col1.map(renderMetric)}
                </div>
                <div className="flex flex-col">
                    {col2.map(renderMetric)}
                </div>
                <div className="flex flex-col">
                    {col3.map(renderMetric)}
                </div>
            </div>

            {/* Dynamic Screener Pros & Cons Intelligence Chips */}
            {hasProsCons && (
                <div className="mt-4 pt-3 border-t border-border-subtle">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {pros.slice(0, 2).map((pro, idx) => (
                            <div key={`pro-${idx}`} className="flex items-start gap-2 p-2 rounded-lg bg-emerald-950/20 border border-emerald-800/30 text-[11px] text-emerald-300">
                                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                                <span>{pro}</span>
                            </div>
                        ))}
                        {cons.slice(0, 2).map((con, idx) => (
                            <div key={`con-${idx}`} className="flex items-start gap-2 p-2 rounded-lg bg-rose-950/20 border border-rose-800/30 text-[11px] text-rose-300">
                                <AlertCircle size={13} className="text-rose-400 shrink-0 mt-0.5" />
                                <span>{con}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Embed Peer Comparison directly in the Snapshot */}
            <PeerComparisonTable data={data} selectedInstrument={selectedInstrument} />

            {/* 10Y Financial Statements Modal */}
            <TenYearStatementsModal
                isOpen={isStatementsModalOpen}
                onClose={() => setIsStatementsModalOpen(false)}
                screenerData={data?.screener}
                fullData={data}
                selectedInstrument={selectedInstrument}
                stockSymbol={instrumentLabel}
            />
        </div>
    );
}
