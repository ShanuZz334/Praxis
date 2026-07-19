import React from 'react';
import { useDashboardContext } from '@/shared/context/DashboardContext';
import { PieChart, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function SectorRotation() {
    const { sectors } = useDashboardContext();

    if (!sectors || sectors.length === 0) {
        return (
            <div className="bg-background-card border border-border-default rounded-xl p-4 flex flex-col h-full opacity-50">
                <div className="flex items-center gap-2 mb-4">
                    <PieChart className="w-4 h-4 text-brand-primary" />
                    <h3 className="text-[13px] font-bold text-text-primary uppercase tracking-wide">Sector Rotation</h3>
                </div>
                <p className="text-[11px] text-text-secondary">Waiting for sector indices (or no data available)...</p>
            </div>
        );
    }

    // Sort sectors by percent change descending
    const sortedSectors = [...sectors].sort((a, b) => b.change_pct - a.change_pct);

    return (
        <div className="bg-background-card border border-border-default rounded-xl p-4 flex flex-col h-full shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-brand-primary" />
                    <h3 className="text-[13px] font-bold text-text-primary uppercase tracking-wide">Sector Rotation</h3>
                </div>
                <span className="text-[10px] text-text-tertiary">Live</span>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                {sortedSectors.map((sector, i) => {
                    const isUp = sector.change_pct > 0;
                    return (
                        <div key={i} className="flex items-center justify-between p-2 rounded bg-background-elevated">
                            <span className="text-[11.5px] font-semibold text-text-primary">{sector.symbol.replace('Nifty ', '')}</span>
                            <div className="flex items-center gap-3">
                                <span className="text-[11px] text-text-secondary font-medium">&#8377;{sector.ltp.toFixed(2)}</span>
                                <div className={`flex items-center gap-1 text-[11px] font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                    <span>{Math.abs(sector.change_pct).toFixed(2)}%</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
