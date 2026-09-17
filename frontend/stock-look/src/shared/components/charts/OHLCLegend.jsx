import React, { useEffect, useState } from 'react';

const formatVol = (vol) => {
    if (!vol || isNaN(vol)) return null;
    if (vol >= 10000000) return (vol / 10000000).toFixed(2) + ' Cr';
    if (vol >= 1000000) return (vol / 1000000).toFixed(2) + 'M';
    if (vol >= 1000) return (vol / 1000).toFixed(1) + 'K';
    return vol.toString();
};

const formatPrice = (val) => {
    if (val === null || val === undefined || isNaN(val)) return '--';
    return Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const OHLCLegend = ({ crosshairData: propCrosshairData, chartRef, candleSeriesRef, volumeSeriesRef, data }) => {
    const [crosshairData, setCrosshairData] = useState(null);

    useEffect(() => {
        if (!chartRef?.current || !candleSeriesRef?.current) return;
        
        const chart = chartRef.current;
        const handleCrosshairMove = (param) => {
            if (param.time && param.point && candleSeriesRef.current && param.seriesData.get(candleSeriesRef.current)) {
                const d = param.seriesData.get(candleSeriesRef.current);
                const volData = volumeSeriesRef?.current ? param.seriesData.get(volumeSeriesRef.current) : null;
                setCrosshairData({ 
                    open: d.open, 
                    high: d.high, 
                    low: d.low, 
                    close: d.close,
                    volume: volData?.value ?? null
                });
            } else {
                setCrosshairData(null);
            }
        };

        chart.subscribeCrosshairMove(handleCrosshairMove);
        return () => {
            chart.unsubscribeCrosshairMove(handleCrosshairMove);
        };
    }, [chartRef, candleSeriesRef, volumeSeriesRef]);

    const latest = data && data.length > 0 ? data[data.length - 1] : null;
    const activeCrosshair = propCrosshairData !== undefined ? propCrosshairData : crosshairData;
    const d = activeCrosshair || latest;
    if (!d || d.open === undefined) return null;

    const isUp = d.close >= d.open;
    const chg = (typeof d.close === 'number' && typeof d.open === 'number') ? d.close - d.open : 0;
    const pct = d.open > 0 ? (chg / d.open) * 100 : 0;
    const safeChg = !isNaN(chg) ? chg : 0;
    const safePct = !isNaN(pct) ? pct : 0;
    const range = (d.high && d.low) ? (d.high - d.low) : 0;
    const rangePct = d.open > 0 ? (range / d.open) * 100 : 0;
    const volume = d.volume ?? latest?.volume;

    const valColor = isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400';
    const badgeColor = isUp 
        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25' 
        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25';
    const sign = isUp ? '+' : '';

    return (
        <div 
            style={{ fontVariantNumeric: 'tabular-nums' }}
            className="h-7 pointer-events-none flex items-center gap-2 text-[10px] font-mono select-none bg-white/90 dark:bg-[#111622]/90 border border-slate-200/90 dark:border-border-subtle/90 px-2.5 rounded-lg backdrop-blur-md shadow-sm tabular-nums shrink-0 min-w-[388px] lg:min-w-[464px]"
        >
            {/* Metric values */}
            <div className="flex items-center gap-1 text-text-secondary shrink-0">
                <span className="text-text-tertiary text-[9px] font-sans font-bold shrink-0">O</span>
                <span className={`font-semibold tabular-nums min-w-[46px] text-left inline-block ${valColor}`}>{formatPrice(d.open)}</span>
            </div>
            <div className="flex items-center gap-1 text-text-secondary shrink-0">
                <span className="text-text-tertiary text-[9px] font-sans font-bold shrink-0">H</span>
                <span className={`font-semibold tabular-nums min-w-[46px] text-left inline-block ${valColor}`}>{formatPrice(d.high)}</span>
            </div>
            <div className="flex items-center gap-1 text-text-secondary shrink-0">
                <span className="text-text-tertiary text-[9px] font-sans font-bold shrink-0">L</span>
                <span className={`font-semibold tabular-nums min-w-[46px] text-left inline-block ${valColor}`}>{formatPrice(d.low)}</span>
            </div>
            <div className="flex items-center gap-1 text-text-secondary shrink-0">
                <span className="text-text-tertiary text-[9px] font-sans font-bold shrink-0">C</span>
                <span className={`font-semibold tabular-nums min-w-[46px] text-left inline-block ${valColor}`}>{formatPrice(d.close)}</span>
            </div>

            {/* Change Badge */}
            <div className={`px-1.5 py-0.5 rounded border text-[9px] font-bold tabular-nums ${badgeColor} flex items-center justify-center min-w-[104px] shrink-0`}>
                <span className="tabular-nums">{sign}{safeChg.toFixed(2)}</span>
                <span className="opacity-75 tabular-nums ml-0.5">({sign}{safePct.toFixed(2)}%)</span>
            </div>

            {/* Volume readout */}
            {volume !== null && volume !== undefined && (
                <div className="hidden lg:flex items-center gap-1 text-text-secondary border-l border-slate-200 dark:border-border-subtle/60 pl-1.5 min-w-[68px] shrink-0">
                    <span className="text-text-tertiary text-[9px] font-sans font-bold shrink-0">V</span>
                    <span className="font-semibold text-text-primary tabular-nums min-w-[52px] text-left inline-block">{formatVol(volume)}</span>
                </div>
            )}
        </div>
    );
};

export default React.memo(OHLCLegend);
