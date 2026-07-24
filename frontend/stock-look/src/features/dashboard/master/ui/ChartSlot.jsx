import React from 'react';
import AdvancedCandlestickChart from "@/shared/components/charts/AdvancedCandlestickChart";
import { useHistoricalCandles } from "@/shared/hooks/useHistoricalCandles";
import Loader from "@/shared/components/ui/Loader";
import { X } from 'lucide-react';
import { FO_INDICES, FO_EQUITIES } from "@/shared/utils/foInstruments";

export default function ChartSlot({ 
    instrumentKey, 
    label,
    timeframe, 
    isPrimary = false, 
    isSingle = false,
    onClose,
    className = ""
}) {
    const { data: candleData, loading: candlesLoading, isBackfilling, liveCandle } = useHistoricalCandles(instrumentKey, timeframe);

    const getReadableName = (val) => {
        if (!val) return 'NO INSTRUMENT';
        const all = [...(FO_INDICES || []), ...(FO_EQUITIES || [])];
        const found = all.find(i => i.value === val || i.value.includes(val) || val.includes(i.value));
        return found ? found.label : val.split('|').pop().replace('NSE_EQ:', '').replace('NSE_INDEX:', '');
    };

    return (
        <div className={`relative flex flex-col w-full h-full min-h-0 ${isSingle ? 'bg-transparent border-transparent' : 'border border-border-default bg-background-card'} rounded-xl overflow-hidden ${className}`}>
            {/* Header / Top Bar */}
            {!isSingle && (
                <div className="absolute top-0 left-0 right-0 h-8 flex items-center justify-between px-2 z-10 pointer-events-none mt-1">
                    <div className="text-[10px] font-bold text-text-primary uppercase tracking-widest drop-shadow-md pointer-events-auto bg-background-surface/80 backdrop-blur-md px-1.5 py-0.5 rounded-md border border-border-subtle">
                        {label || getReadableName(instrumentKey)}
                    </div>
                    {!isPrimary && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onClose?.(); }}
                            className="pointer-events-auto p-1 bg-background-surface/80 backdrop-blur-md rounded-md border border-border-subtle text-text-tertiary hover:text-red-400 hover:bg-white/10 transition-colors"
                            title="Close Chart"
                        >
                            <X size={12} />
                        </button>
                    )}
                </div>
            )}

            {/* Chart Area */}
            <div className="flex-1 w-full relative flex flex-col pt-8">
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
                    />
                )}
            </div>
        </div>
    );
}
