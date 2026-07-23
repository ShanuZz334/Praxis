import React, { useEffect } from 'react';
import { useDashboardContext } from '@/shared/context/DashboardContext';
import { useDataRegistry } from '@/shared/context/DataRegistryContext';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { Zap } from 'lucide-react';
import Loader from '@/shared/components/ui/Loader';
import { motion, AnimatePresence } from 'framer-motion';

export default function VolumeShockers() {
    const { smartlists } = useDashboardContext();
    const { register } = useDataRegistry();

    const isLoading = !smartlists || Object.keys(smartlists).length === 0 || !smartlists?.['MOST_ACTIVE'];
    const activeOpts = smartlists?.['MOST_ACTIVE'] || [];

    // Phase 2 Fix B: Register into DataRegistry so @Most Active resolves with real data
    useEffect(() => {
        if (activeOpts.length === 0) return;
        const topSymbols = activeOpts.slice(0, 5).map(o => o.trading_symbol || o.instrument_key || '').filter(Boolean);
        const ceCount = activeOpts.filter(o => (o.trading_symbol || '').endsWith('CE')).length;
        const peCount = activeOpts.filter(o => (o.trading_symbol || '').endsWith('PE')).length;
        register('master', CARD_REGISTRY.volume_shockers.id, {
            displayName: 'Most Active',
            value: `${activeOpts.length} contracts (${ceCount} CE / ${peCount} PE)`,
            score: null,
            signal: ceCount > peCount ? 'bullish' : peCount > ceCount ? 'bearish' : 'neutral',
            additionalContext: `Top: ${topSymbols.join(', ')}`,
        });
    }, [activeOpts, register]);


    // Format Trading Symbol
    const formatTradingSymbol = (sym) => {
        if (!sym) return 'Unknown';
        const matchOpt = sym.match(/^([A-Z]+)(\d{2}[A-Z]{3}|\d{5}|\d{2}[A-Z]\d{2})([\d\.]+)?(CE|PE|FUT)$/i);
        if (matchOpt) {
            return matchOpt.slice(1).filter(Boolean).join('-');
        }
        return sym;
    };

    return (
        <div className="bg-background-card border border-border-default rounded-xl p-4 flex flex-col h-full shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-warning-500 fill-warning-500" />
                    <h3 className="text-[13px] font-bold text-text-primary uppercase tracking-wide">Most Active</h3>
                </div>
            </div>

            <div className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar pr-1 relative min-h-[150px]">
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
                            className="w-full space-y-1.5"
                        >
                            {activeOpts.length === 0 ? (
                                <div className="text-[10px] text-text-tertiary px-2">No highly active contracts found</div>
                            ) : activeOpts.map((item, i) => {
                                const rawSymbol = item.trading_symbol || item.instrument_key;
                                const displaySymbol = formatTradingSymbol(rawSymbol);
                                const isCall = displaySymbol.endsWith('CE');
                                
                                return (
                                    <div key={i} className="flex items-center justify-between bg-background-elevated px-2.5 py-2 rounded text-[10.5px]">
                                        <span className={`font-semibold truncate mr-2 flex-1 ${isCall ? 'text-emerald-400' : 'text-rose-400'}`} title={displaySymbol}>
                                            {displaySymbol}
                                        </span>
                                        <div className="flex flex-col items-end shrink-0">
                                            <span className="text-text-secondary font-medium">&#8377;{item.price?.current || item.ltp || 0}</span>
                                            <span className={item.price?.change_pct > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                                {item.price?.change_pct > 0 ? '+' : ''}
                                                {(item.price?.change_pct || item.pct_change || 0).toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
