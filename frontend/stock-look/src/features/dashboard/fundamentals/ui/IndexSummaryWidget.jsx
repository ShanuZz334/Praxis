import React from 'react';
import { Edit2, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDashboardContext } from '@/shared/context/DashboardContext';
import { FO_INDICES } from '@/shared/utils/foInstruments';

export default function IndexSummaryWidget({ data, manualOverrides, selectedInstrument }) {
    const { livePrices } = useDashboardContext();
    const liveData = livePrices?.[selectedInstrument];
    const instrumentLabel = FO_INDICES.find(e => e.value === selectedInstrument)?.label || selectedInstrument || "INDEX DATA";

    // 1. Data Extraction Helper
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
                   ? `${extractQuote('ohlc').high} / ${extractQuote('ohlc').low}` 
                   : manualOverrides?.high_low,
            prefix: "₹ ",
            overrideKey: 'high_low',
            isString: true
        },
        {
            label: "Index P/E",
            value: manualOverrides?.index_pe,
            suffix: "x",
            overrideKey: 'index_pe',
            isString: false
        },
        {
            label: "Index P/B",
            value: manualOverrides?.index_pb,
            suffix: "x",
            overrideKey: 'index_pb',
            isString: false
        },
        {
            label: "Dividend Yield",
            value: manualOverrides?.index_div_yield,
            suffix: "%",
            overrideKey: 'index_div_yield',
            isString: false
        }
    ];

    // 3. Render Metric Row
    const renderMetric = (m, i) => {
        const isNull = m.value === null || m.value === undefined || m.value === '';
        let displayVal = '--';
        if (!isNull) {
            displayVal = (m.prefix || '') + (m.isString ? m.value : parseFloat(m.value).toLocaleString('en-IN')) + (m.suffix || '');
        }
        
        // For Index P/E, P/B, DivYield, they are ALWAYs manual since Upstox doesn't provide them.
        // For Current Level & High/Low, they are manual if quote is missing.
        let isManual = isNull || false;
        if (m.overrideKey === 'index_pe' || m.overrideKey === 'index_pb' || m.overrideKey === 'index_div_yield') {
             isManual = !isNull; // Always manual if present
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
                        {isManual && displayVal !== '--' && (
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

    const visibleMetrics = metrics.filter(m => {
        const isNull = m.value === null || m.value === undefined || m.value === '';
        return !isNull;
    });

    const missingManualCount = metrics.length - visibleMetrics.length;

    const col1 = visibleMetrics.filter((_, i) => i % 3 === 0);
    const col2 = visibleMetrics.filter((_, i) => i % 3 === 1);
    const col3 = visibleMetrics.filter((_, i) => i % 3 === 2);

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
                            <span className="text-xs text-text-tertiary font-mono">{instrumentLabel}</span>
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
