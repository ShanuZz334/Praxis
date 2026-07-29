import React from 'react';
import { Edit2, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDashboardContext } from '@/shared/context/DashboardContext';
import { FO_INDICES } from '@/shared/utils/foInstruments';

export default function IndexSummaryWidget({ data, manualOverrides, selectedInstrument, resolveTime }) {
    const { livePrices } = useDashboardContext();
    const liveData = livePrices?.[selectedInstrument];
    const instrumentLabel = FO_INDICES.find(e => e.value === selectedInstrument)?.label || selectedInstrument || "INDEX DATA";

    // 1. Data Extraction Helper
    const extractRatio = (names) => {
        const ratiosArray = Array.isArray(data?.ratios) ? data.ratios : [];
        const obj = ratiosArray.find(r => names.some(n => r.name?.toLowerCase() === n.toLowerCase()));
        return obj?.company_value ? parseFloat(obj.company_value) : null;
    };

    const extractQuote = (key) => {
        return data?.quote?.[key] ?? null;
    };

    // 2. Resolve Metrics (Upstox -> Manual Fallback)
    const metrics = [
        {
            label: "Current Level",
            value: liveData?.ltp ?? extractQuote('last_price') ?? manualOverrides?.current_price,
            prefix: "₹ ",
            overrideKey: 'current_price',
            isString: false,
            netChange: liveData?.netChange,
            pctChange: liveData?.pctChange,
            status: liveData?.status
        },
        {
            label: "High / Low",
            value: (extractQuote('ohlc')?.high && extractQuote('ohlc')?.low) 
                   ? `${parseFloat(extractQuote('ohlc').high).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / ${parseFloat(extractQuote('ohlc').low).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                   : manualOverrides?.high_low,
            prefix: "₹ ",
            overrideKey: 'high_low',
            isString: true
        },
        {
            label: "Index P/E",
            value: extractRatio(['p/e', 'pe', 'pe ratio']) ?? manualOverrides?.nifty_pe,
            suffix: "x",
            overrideKey: 'nifty_pe',
            isString: false
        },
        {
            label: "Index P/B",
            value: extractRatio(['p/b', 'pb', 'price to book']) ?? manualOverrides?.nifty_pb,
            suffix: "x",
            overrideKey: 'nifty_pb',
            isString: false
        },
        {
            label: "Dividend Yield",
            value: extractRatio(['dividend yield', 'div yield', 'dividend_yield', 'div_yield']) ?? manualOverrides?.dividend_yield,
            suffix: "%",
            overrideKey: 'dividend_yield',
            isString: false
        }
    ];

    // 3. Render Metric Row
    const renderMetric = (m, i) => {
        const isNull = m.value === null || m.value === undefined || m.value === '';
        let displayVal = '--';
        if (!isNull) {
            displayVal = (m.prefix || '') + (m.isString ? m.value : parseFloat(m.value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })) + (m.suffix || '');
        }
        
        // For Index P/E, P/B, DivYield, they are ALWAYS manual since Upstox doesn't provide them.
        // For Current Level & High/Low, they are manual if quote is missing.
        let isManual = false;
        if (m.overrideKey === 'nifty_pe') {
             isManual = extractRatio(['p/e', 'pe', 'pe ratio']) == null && m.value !== null;
        } else if (m.overrideKey === 'nifty_pb') {
             isManual = extractRatio(['p/b', 'pb', 'price to book']) == null && m.value !== null;
        } else if (m.overrideKey === 'dividend_yield') {
             isManual = extractRatio(['dividend yield', 'div yield', 'dividend_yield', 'div_yield']) == null && m.value !== null;
        } else {
             isManual = !isNull && m.value === manualOverrides?.[m.overrideKey];
        }

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
                            "text-xs md:text-[13px] font-mono font-semibold",
                            (!isManual && displayVal !== '--') ? "text-blue-400" : "text-text-primary"
                        )}>
                            {displayVal}
                        </span>
                    </div>
                    {m.netChange !== undefined && m.pctChange !== undefined && displayVal !== '--' && !isManual && (
                        <span className="text-[9px] mt-0.5 opacity-90 text-blue-400">
                            {m.netChange > 0 ? '+' : ''}{m.netChange.toFixed(2)} ({m.pctChange.toFixed(2)}%)
                        </span>
                    )}
                </div>
            </div>
        );
    };

    const visibleMetrics = metrics;

    const missingManualCount = metrics.filter(m => {
        const isNull = m.value === null || m.value === undefined || m.value === '';
        return isNull && (m.overrideKey === 'nifty_pe' || m.overrideKey === 'nifty_pb' || m.overrideKey === 'dividend_yield' || m.overrideKey === 'current_price' || m.overrideKey === 'high_low');
    }).length;

    const col1 = visibleMetrics.filter((_, i) => i % 3 === 0);
    const col2 = visibleMetrics.filter((_, i) => i % 3 === 1);
    const col3 = visibleMetrics.filter((_, i) => i % 3 === 2);

    const syncTimes = visibleMetrics.map(m => {
        if (!resolveTime) return null;
        let isManual = (m.value === null || m.value === undefined || m.value === '') || false;
        if (m.overrideKey === 'nifty_pe' || m.overrideKey === 'nifty_pb' || m.overrideKey === 'dividend_yield') {
             isManual = true; // Always manual
        } else {
             isManual = m.value === manualOverrides?.[m.overrideKey];
        }
        
        // Pass whether it's manual or Upstox data to resolveTime properly
        const str = resolveTime(m.value !== undefined && m.value !== null, isManual ? m.overrideKey : null);
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

    return (
        <div className="w-full mt-8 bg-background-elevated/95 backdrop-blur-xl border border-border-default rounded-xl p-4 md:p-6 mb-6 shadow-lg overflow-hidden relative z-0">
            {/* Header / Ticker */}
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
            <div className="flex items-center justify-between mb-4 md:mb-6 border-b border-border-subtle pb-3">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                        <TrendingUp className="w-4 h-4" />
                    </div>
                    <div className="flex items-center gap-4">
                        <div>
                            <h2 className="text-lg md:text-xl font-bold text-text-primary flex items-center gap-3">
                                Index Snapshot
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
                </div>
            </div>

            {/* Grid */}
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
        </div>
    );
}
