import React, { useState } from 'react';
import AdvancedCandlestickChart from "@/shared/components/charts/AdvancedCandlestickChart";
import { useHistoricalCandles } from "@/shared/hooks/useHistoricalCandles";
import Loader from "@/shared/components/ui/Loader";
import { X, Maximize2, Minimize2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { FO_INDICES, FO_EQUITIES } from "@/shared/utils/foInstruments";

export default function ChartSlot({ 
    instrumentKey, 
    label,
    timeframe, 
    isPrimary = false, 
    isSingle = false,
    lotSize,
    onClose,
    onQuickOrder,
    className = ""
}) {
    const { data: candleData, loading: candlesLoading, isBackfilling, liveCandle } = useHistoricalCandles(instrumentKey, timeframe);
    const [isMaximized, setIsMaximized] = useState(false);

    const getReadableName = (val) => {
        if (!val) return 'NO INSTRUMENT';
        const all = [...(FO_INDICES || []), ...(FO_EQUITIES || [])];
        const found = all.find(i => i.value === val || i.value.includes(val) || val.includes(i.value));
        return found ? found.label : val.split('|').pop().replace('NSE_EQ:', '').replace('NSE_INDEX:', '');
    };

    const isMultiMode = !isSingle && !isMaximized;

    return (
        <div className={`flex flex-col w-full h-full min-h-0 ${isSingle ? 'bg-transparent border-transparent' : 'border border-border-default bg-background-card'} rounded-xl overflow-hidden ${isMaximized ? 'absolute inset-0 z-[100]' : `relative ${className}`}`}>
            {/* Header / Top Bar */}
            {/* Header / Top Bar */}
            {!isSingle && (
                <div className="absolute top-0 left-0 right-0 h-7 flex items-center justify-between px-2.5 z-10 pointer-events-none mt-1">
                    <div className="flex items-center gap-2 pointer-events-auto">
                        <div className="text-[10px] font-bold text-text-primary uppercase tracking-wider bg-background-surface/90 backdrop-blur-md px-2 py-0.5 rounded border border-border-subtle shadow-sm font-mono">
                            {label || getReadableName(instrumentKey)}
                        </div>
                        <div className="flex items-center gap-1">
                            <button 
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    onQuickOrder?.({ instrument_token: instrumentKey, tradingsymbol: label || getReadableName(instrumentKey), side: 'BUY', lot_size: lotSize }); 
                                }} 
                                className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white border border-emerald-500/30 rounded text-[9px] font-bold transition-all cursor-pointer shadow-sm"
                                title="Quick Buy"
                            >
                                <ArrowUpRight size={11} strokeWidth={2.5} />
                                <span>BUY</span>
                            </button>
                            <button 
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    onQuickOrder?.({ instrument_token: instrumentKey, tradingsymbol: label || getReadableName(instrumentKey), side: 'SELL', lot_size: lotSize }); 
                                }} 
                                className="flex items-center gap-1 px-2 py-0.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/30 rounded text-[9px] font-bold transition-all cursor-pointer shadow-sm"
                                title="Quick Sell"
                            >
                                <ArrowDownRight size={11} strokeWidth={2.5} />
                                <span>SELL</span>
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setIsMaximized(!isMaximized); }}
                            className="pointer-events-auto p-1 bg-background-surface/80 backdrop-blur-md rounded border border-border-subtle text-text-tertiary hover:text-blue-400 hover:bg-white/10 transition-colors"
                            title={isMaximized ? "Restore Chart" : "Maximize Chart"}
                        >
                            {isMaximized ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                        </button>
                        {!isPrimary && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onClose?.(); }}
                                className="pointer-events-auto p-1 bg-background-surface/80 backdrop-blur-md rounded border border-border-subtle text-text-tertiary hover:text-red-400 hover:bg-white/10 transition-colors"
                                title="Close Chart"
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Chart Area */}
            <div className={`flex-1 w-full relative flex flex-col ${isSingle ? 'pt-0' : 'pt-7'}`}>
                {candlesLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background-app/80 z-20 backdrop-blur-md">
                        <Loader size="md" color="blue" />
                    </div>
                )}
                {(!candlesLoading || candleData?.length > 0) && (
                    <AdvancedCandlestickChart 
                        key={`${instrumentKey}-${timeframe}`}
                        data={candleData} 
                        liveCandle={liveCandle}
                        showValuationBands={false} 
                        showEvents={false}
                        isBackfilling={isBackfilling}
                        instrumentKey={instrumentKey}
                        timeframe={timeframe}
                        allowFutureVision={isPrimary}
                        isMultiMode={isMultiMode}
                    />
                )}
            </div>
        </div>
    );
}
