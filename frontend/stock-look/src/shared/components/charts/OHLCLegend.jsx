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
    const chg = d.close - d.open;
    const pct = d.open > 0 ? (chg / d.open) * 100 : 0;
    const range = (d.high && d.low) ? (d.high - d.low) : 0;
    const rangePct = d.open > 0 ? (range / d.open) * 100 : 0;
    const volume = d.volume ?? latest?.volume;

    const valColor = isUp ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400';
    const badgeColor = isUp 
        ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20' 
        : 'bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500/20';
    const sign = isUp ? '+' : '';

    return (
        <div className="h-7 pointer-events-none flex items-center gap-2 text-[10px] font-mono select-none bg-background-surface/90 dark:bg-[#111622]/90 border border-border-subtle/90 px-2.5 rounded-lg backdrop-blur-md shadow-sm">
            {/* Metric values */}
            <div className="flex items-center gap-1 text-text-secondary">
                <span className="text-text-tertiary text-[9px] font-sans font-bold">O</span>
                <span className={`font-semibold ${valColor}`}>{formatPrice(d.open)}</span>
            </div>
            <div className="flex items-center gap-1 text-text-secondary">
                <span className="text-text-tertiary text-[9px] font-sans font-bold">H</span>
                <span className={`font-semibold ${valColor}`}>{formatPrice(d.high)}</span>
            </div>
            <div className="flex items-center gap-1 text-text-secondary">
                <span className="text-text-tertiary text-[9px] font-sans font-bold">L</span>
                <span className={`font-semibold ${valColor}`}>{formatPrice(d.low)}</span>
            </div>
            <div className="flex items-center gap-1 text-text-secondary">
                <span className="text-text-tertiary text-[9px] font-sans font-bold">C</span>
                <span className={`font-semibold ${valColor}`}>{formatPrice(d.close)}</span>
            </div>

            {/* Change Badge */}
            <div className={`px-1 py-0.2 rounded border text-[9px] font-bold ${badgeColor} flex items-center gap-0.5`}>
                <span>{sign}{chg.toFixed(2)}</span>
                <span className="opacity-75">({sign}{pct.toFixed(2)}%)</span>
            </div>

            {/* Volume readout */}
            {volume !== null && volume !== undefined && (
                <div className="hidden lg:flex items-center gap-1 text-text-secondary border-l border-border-subtle/60 pl-1.5">
                    <span className="text-text-tertiary text-[9px] font-sans font-bold">V</span>
                    <span className="font-semibold text-text-primary">{formatVol(volume)}</span>
                </div>
            )}
        </div>
    );
};

export default React.memo(OHLCLegend);
