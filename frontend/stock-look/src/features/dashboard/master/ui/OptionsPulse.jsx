import React from 'react';
import { TrendingUp, TrendingDown, Activity, AlertTriangle } from 'lucide-react';
import Loader from '@/shared/components/ui/Loader';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboardContext } from '@/shared/context/DashboardContext';
import { toast } from 'sonner';

const OptionsPulse = React.memo(function OptionsPulse({ smartlists: propSmartlists }) {
    const context = useDashboardContext();
    const smartlists = propSmartlists || context?.smartlists;
    const additionalCharts = context?.additionalCharts || [];
    const setAdditionalCharts = context?.setAdditionalCharts;
    const selectedInstrument = context?.selectedInstrument;

    const isLoading = !smartlists || (Object.keys(smartlists).length === 0);

    const oiGainers = smartlists?.['OI_GAINERS'] || [];
    const ivSurge = smartlists?.['IV_GAINERS'] || [];
    const premium = smartlists?.['PREMIUM'] || [];

    // Helper to format symbols like NSE_FO|RELIANCE24JUL2900CE (if trading_symbol is missing)
    const formatSymbol = (key) => {
        if (!key) return "Unknown";
        const parts = key.split('|');
        let sym = parts[parts.length - 1];
        if (sym.length > 20) sym = sym.substring(0, 20) + '..';
        return sym;
    };

    // Helper to inject hyphens for readability (e.g., BANKNIFTY26SEPFUT -> BANKNIFTY-26SEP-FUT)
    const formatTradingSymbol = (sym) => {
        if (!sym) return "Unknown";
        const matchOpt = sym.match(/^([A-Z]+)(\d{2}[A-Z]{3}|\d{5}|\d{2}[A-Z]\d{2})([\d\.]+)?(CE|PE|FUT)$/i);
        if (matchOpt) {
            return matchOpt.slice(1).filter(Boolean).join('-');
        }
        return sym;
    };

    const handleAddToChart = (item) => {
        if (!setAdditionalCharts) return;
        const rawSymbol = item.trading_symbol || formatSymbol(item.instrument_key || item.symbol);
        const displaySymbol = formatTradingSymbol(rawSymbol);
        const instKey = item.instrument_key || item.symbol || item.trading_symbol;
        if (!instKey) return;

        const currentMainKey = selectedInstrument?.value || selectedInstrument;
        const isAlreadyMain = currentMainKey === instKey;
        const isAlreadyAdded = additionalCharts?.some(c => (typeof c === 'string' ? c : c.value) === instKey);

        if (isAlreadyMain || isAlreadyAdded) {
            toast.info(`${displaySymbol} is already pinned to Charts`, { id: `chart-${instKey}` });
            return;
        }

        if (additionalCharts.length >= 3) {
            toast.error("Chart grid is fully filled (Max 4 charts). Remove a chart to add more.", { id: 'max-charts-error' });
            return;
        }

        setAdditionalCharts(prev => [...(prev || []), { value: instKey, label: displaySymbol }]);
        toast.success(`${displaySymbol} added to Chart Grid!`, { id: `chart-${instKey}` });
    };

    const renderList = (title, items, icon, color) => (
        <div className="mb-4 last:mb-0">
            <div className="flex items-center gap-1.5 mb-2 sticky top-0 bg-background-card z-10 py-1">
                {icon}
                <span className="text-[11px] font-bold text-text-secondary uppercase">{title}</span>
            </div>
            <div className="space-y-1.5">
                {items.length === 0 ? (
                    <div className="text-[10px] text-text-tertiary px-2">No signals found</div>
                ) : items.map((item, i) => {
                    const rawSymbol = item.trading_symbol || formatSymbol(item.instrument_key || item.symbol);
                    const displaySymbol = formatTradingSymbol(rawSymbol);
                    
                    return (
                        <div 
                            key={i} 
                            onClick={() => handleAddToChart(item)}
                            className="flex items-center justify-between bg-background-elevated hover:bg-background-subtle/80 border border-transparent hover:border-blue-500/30 px-2.5 py-2 rounded text-[10.5px] cursor-pointer transition-all active:scale-[0.99] group/item"
                            title={`Click to add ${displaySymbol} to Charts`}
                        >
                            <span className="font-semibold text-text-primary group-hover/item:text-blue-400 transition-colors truncate mr-2 flex-1" title={displaySymbol}>
                                {displaySymbol}
                            </span>
                            <div className="flex flex-col items-end shrink-0">
                                <span className="text-text-secondary font-medium">₹{item.price?.current || item.ltp || 0}</span>
                                <span className={item.price?.change_pct > 0 ? color : color.replace('400', '400')}>
                                    {item.price?.change_pct > 0 ? '+' : ''}
                                    {(item.price?.change_pct || item.pct_change || 0).toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className="bg-background-card border border-border-default rounded-xl p-4 flex flex-col h-full shadow-sm relative">
            <div className="flex items-center gap-2 mb-4 shrink-0">
                <Activity className="w-4 h-4 text-brand-primary" />
                <h3 className="text-[13px] font-bold text-text-primary uppercase tracking-wide">Options Pulse</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto no-scrollbar relative min-h-[150px]">
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div 
                            key="loader"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-0 flex items-center justify-center opacity-70"
                        >
                            <Loader size="sm" color="blue" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="content"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.4 }}
                            className="w-full h-full"
                        >
                            <div className="mb-2">
                                <span className="text-[10px] text-text-tertiary">Smartlist Signals</span>
                            </div>
                            {renderList("OI Surge", oiGainers, <TrendingUp className="w-3 h-3 text-blue-400" />, "text-blue-400")}
                            {renderList("IV Expansion", ivSurge, <AlertTriangle className="w-3 h-3 text-yellow-400" />, "text-yellow-400")}
                            {renderList("Premium Gainers", premium, <TrendingUp className="w-3 h-3 text-emerald-400" />, "text-emerald-400")}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
});

export default OptionsPulse;
