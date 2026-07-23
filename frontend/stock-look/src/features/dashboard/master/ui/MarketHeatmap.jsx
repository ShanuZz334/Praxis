import React, { useState, useEffect } from 'react';
import { Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboardContext } from '@/shared/context/DashboardContext';
import { getNifty50Keys, NIFTY_50_SYMBOLS } from '../data/nifty50';

export default function MarketHeatmap() {
    const { livePrices } = useDashboardContext();
    const [activeTooltip, setActiveTooltip] = useState(null);

    // Dismiss tooltip when clicking outside
    useEffect(() => {
        const handleClick = () => setActiveTooltip(null);
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    const HEATMAP_TIERS = [
        { min: 3.0, name: 'Exceptional', threshold: '(> +3%)', bg: '#2E5BFF', text: '#FFFFFF' },
        { min: 1.5, name: 'Strong', threshold: '(> +1.5%)', bg: '#0D9488', text: '#FFFFFF' },
        { min: 0.5, name: 'Constructive', threshold: '(> +0.5%)', bg: '#22C55E', text: '#FFFFFF' },
        { min: -0.5, name: 'Balanced', threshold: '(± 0.5%)', bg: '#FACC15', text: '#000000' },
        { min: -1.5, name: 'Weak', threshold: '(< -0.5%)', bg: '#F79009', text: '#FFFFFF' },
        { min: -3.0, name: 'High Risk', threshold: '(< -1.5%)', bg: '#F04438', text: '#FFFFFF' },
        { min: -Infinity, name: 'Extreme Risk', threshold: '(< -3%)', bg: '#D92D20', text: '#FFFFFF' }
    ];
    
    // Process Nifty 50 data from livePrices
    const keys = getNifty50Keys();
    
    const stocksData = NIFTY_50_SYMBOLS.map((symbol, index) => {
        const key = keys[index];
        const tick = livePrices[key];
        
        let ltp = tick?.ltp || null;
        let pctChange = tick?.pctChange || 0;

        return {
            symbol,
            ltp,
            pctChange,
        };
    });

    // Sort alphabetically so the boxes stay in the same position and don't jiggle around
    const sortedStocks = [...stocksData].sort((a, b) => a.symbol.localeCompare(b.symbol));

    const getColor = (pct) => {
        if (pct === undefined || pct === null) return { bg: '#1e293b', text: '#94a3b8' };
        const tier = HEATMAP_TIERS.find(t => pct >= t.min);
        return { bg: tier.bg, text: tier.text };
    };

    return (
        <div className="bg-background-card border border-border-default rounded-xl p-4 flex flex-col h-full shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-[13px] font-bold text-text-primary uppercase tracking-wide">Market Heatmap</h3>
                    <p className="text-[11px] text-text-secondary">NIFTY 50 Live Movers</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative group flex items-center justify-center">
                        <Info className="w-4 h-4 text-text-tertiary hover:text-text-primary cursor-pointer transition-colors" />
                        
                        <div className="absolute right-0 top-6 w-52 p-3 rounded-xl bg-white dark:bg-[#0f1219] border border-border-default shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] flex flex-col gap-2 pointer-events-none">
                            <div className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1">Heatmap Tiers</div>
                            {HEATMAP_TIERS.map(tier => (
                                <div key={tier.name} className="flex items-center justify-between text-[11px] font-medium">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: tier.bg }}></div>
                                        <span className="text-text-primary">{tier.name}</span>
                                    </div>
                                    <span className="text-text-secondary font-mono text-[10px]">{tier.threshold}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-1">
                {sortedStocks.map(stock => {
                    const color = getColor(stock.pctChange);
                    return (
                        <div 
                            key={stock.symbol}
                            onClick={(e) => {
                                e.stopPropagation(); // prevent document click from instantly closing it
                                if (activeTooltip?.symbol === stock.symbol) {
                                    setActiveTooltip(null);
                                    return;
                                }
                                const rect = e.currentTarget.getBoundingClientRect();
                                setActiveTooltip({ 
                                    symbol: stock.symbol,
                                    label: `${stock.symbol}: ${stock.ltp ? '₹'+stock.ltp : 'N/A'} (${stock.pctChange.toFixed(2)}%)`, 
                                    top: rect.top - 8, // Place slightly above
                                    left: rect.left + rect.width / 2 
                                });
                            }}
                            style={{ backgroundColor: color.bg, color: color.text }}
                            className={`rounded-md p-1.5 flex flex-col items-center justify-center transition-colors aspect-square shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] cursor-pointer`}
                        >
                            <span className="text-[10px] font-bold truncate w-full text-center leading-tight mb-0.5">{stock.symbol.substring(0, 6)}</span>
                            {stock.ltp ? (
                                <div className="flex flex-col items-center">
                                    <span className="text-[10px] font-medium opacity-90 tabular-nums">{stock.pctChange > 0 ? '+' : ''}{stock.pctChange.toFixed(1)}%</span>
                                    <span className="text-[9px] opacity-75 tabular-nums mt-[1px]">₹{stock.ltp.toFixed(1)}</span>
                                </div>
                            ) : (
                                <span className="text-[9px] opacity-50">-</span>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Custom Fixed Tooltip (Match DrawingToolbar) */}
            <AnimatePresence>
                {activeTooltip && (
                    <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.15 }}
                        className="fixed z-[9999] bg-[#1a1f2e] border border-white/10 text-white/90 text-[11px] font-medium px-2.5 py-1.5 rounded-md shadow-xl pointer-events-none whitespace-nowrap"
                        style={{
                            top: activeTooltip.top,
                            left: activeTooltip.left,
                            transform: 'translate(-50%, -100%)'
                        }}
                    >
                        {activeTooltip.label}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
