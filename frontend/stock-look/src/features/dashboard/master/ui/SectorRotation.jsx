import React, { useState, useEffect } from 'react';
import { PieChart, Info } from 'lucide-react';
import Loader from '@/shared/components/ui/Loader';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboardContext } from '@/shared/context/DashboardContext';

const HEATMAP_TIERS = [
    { min: 2.0, name: 'Exceptional', threshold: '(> +2.0%)', bg: '#2E5BFF', text: '#FFFFFF' },
    { min: 1.0, name: 'Strong', threshold: '(> +1.0%)', bg: '#0D9488', text: '#FFFFFF' },
    { min: 0.25, name: 'Constructive', threshold: '(> +0.25%)', bg: '#22C55E', text: '#FFFFFF' },
    { min: -0.25, name: 'Balanced', threshold: '(± 0.25%)', bg: '#FACC15', text: '#000000' },
    { min: -1.0, name: 'Weak', threshold: '(< -0.25%)', bg: '#F79009', text: '#FFFFFF' },
    { min: -2.0, name: 'High Risk', threshold: '(< -1.0%)', bg: '#F04438', text: '#FFFFFF' },
    { min: -Infinity, name: 'Extreme Risk', threshold: '(< -2.0%)', bg: '#D92D20', text: '#FFFFFF' }
];

const SectorRotation = React.memo(function SectorRotation({ sectors: propSectors }) {
    const context = useDashboardContext();
    const sectors = propSectors || context?.sectors;
    const [activeTooltip, setActiveTooltip] = useState(null);

    // Dismiss tooltip when clicking outside
    useEffect(() => {
        const handleClick = () => setActiveTooltip(null);
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    const isLoading = !sectors || sectors.length === 0;

    // Sort alphabetically for stable layout, or sort by percent if preferred.
    // Heatmaps usually keep a stable layout so we sort alphabetically.
    const sortedSectors = isLoading ? [] : [...sectors].sort((a, b) => a.symbol.localeCompare(b.symbol));

    const getColor = (pct) => {
        if (pct === undefined || pct === null) return { bg: '#1e293b', text: '#94a3b8' };
        const tier = HEATMAP_TIERS.find(t => pct >= t.min);
        return { bg: tier.bg, text: tier.text };
    };

    return (
        <div className="bg-background-card border border-border-default rounded-xl p-4 flex flex-col h-full shadow-sm relative">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-brand-primary" />
                    <div>
                        <h3 className="text-[13px] font-bold text-text-primary uppercase tracking-wide">Sector Rotation</h3>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-text-tertiary">Live</span>
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

            <div className="flex-1 overflow-y-auto custom-scrollbar relative min-h-[150px]">
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
                            className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5"
                        >
                            {sortedSectors.map((sector) => {
                                const color = getColor(sector.change_pct);
                                const shortName = sector.symbol.replace('Nifty ', '').substring(0, 10);
                                
                                // Calculate change in rupees
                                const previousClose = sector.ltp / (1 + (sector.change_pct / 100));
                                const changeRs = sector.ltp - previousClose;
                                const isUp = changeRs >= 0;

                                return (
                                    <div 
                                        key={sector.symbol}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (activeTooltip?.symbol === sector.symbol) {
                                                setActiveTooltip(null);
                                                return;
                                            }
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            setActiveTooltip({ 
                                                symbol: sector.symbol,
                                                label: `${sector.symbol}: ₹${sector.ltp.toFixed(2)} (${sector.change_pct.toFixed(2)}%)`, 
                                                top: rect.top - 8,
                                                left: rect.left + rect.width / 2 
                                            });
                                        }}
                                        style={{ backgroundColor: color.bg, color: color.text }}
                                        className="rounded-md p-1 flex flex-col items-center justify-center transition-colors aspect-square shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] cursor-pointer"
                                    >
                                        <span className="text-[10px] font-bold truncate w-full text-center leading-tight mb-0.5">{shortName}</span>
                                        <div className="flex flex-col items-center gap-[1px]">
                                            <span className="text-[10px] font-bold opacity-100 tabular-nums leading-none">{sector.change_pct > 0 ? '+' : ''}{sector.change_pct.toFixed(2)}%</span>
                                            <span className="text-[9px] font-medium opacity-90 tabular-nums leading-none mt-[1px]">{isUp ? '+' : ''}₹{Math.abs(Math.round(changeRs))}</span>
                                            <span className="text-[8px] opacity-70 tabular-nums leading-none mt-[1px]">₹{Math.round(sector.ltp)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Custom Fixed Tooltip */}
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
});

export default SectorRotation;
