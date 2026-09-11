import React, { useEffect, useState } from 'react';

const OHLCLegend = ({ chartRef, candleSeriesRef, data }) => {
    const [crosshairData, setCrosshairData] = useState(null);

    useEffect(() => {
        if (!chartRef.current || !candleSeriesRef.current) return;
        
        const chart = chartRef.current;
        const handleCrosshairMove = (param) => {
            if (param.time && param.point && param.seriesData.get(candleSeriesRef.current)) {
                const d = param.seriesData.get(candleSeriesRef.current);
                setCrosshairData({ open: d.open, high: d.high, low: d.low, close: d.close });
            } else {
                setCrosshairData(null);
            }
        };

        chart.subscribeCrosshairMove(handleCrosshairMove);
        return () => {
            chart.unsubscribeCrosshairMove(handleCrosshairMove);
        };
    }, [chartRef, candleSeriesRef]);

    const d = crosshairData || (data && data.length > 0 ? data[data.length - 1] : null);
    if (!d) return null;

    const isUp = d.close >= d.open;
    const chg = d.close - d.open;
    const pct = (chg / d.open) * 100;
    const cls = isUp ? 'text-[#26a69a]' : 'text-[#ef5350]';
    const sign = isUp ? '+' : '';

    return (
        <div className="pointer-events-none flex items-center gap-1.5 text-[11px] font-mono drop-shadow-md bg-black/5 dark:bg-black/20 border border-black/5 dark:border-white/5 px-1.5 py-0.5 rounded backdrop-blur-sm ml-1">
            <span className="text-slate-600 dark:text-gray-500">O<span className={cls}>{d.open.toFixed(2)}</span></span>
            <span className="text-slate-600 dark:text-gray-500">H<span className={cls}>{d.high.toFixed(2)}</span></span>
            <span className="text-slate-600 dark:text-gray-500">L<span className={cls}>{d.low.toFixed(2)}</span></span>
            <span className="text-slate-600 dark:text-gray-500">C<span className={cls}>{d.close.toFixed(2)}</span></span>
            <span className={cls}>{sign}{chg.toFixed(2)} ({sign}{pct.toFixed(2)}%)</span>
        </div>
    );
};

export default React.memo(OHLCLegend);
