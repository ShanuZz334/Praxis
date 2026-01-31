import React from "react";
import { HelpCircle, ArrowUp } from "lucide-react";
import PortalTooltip from "@/shared/components/ui/PortalTooltip";
import { typography } from "@/shared/global/styles/typography";

/* --------------------------------------------------------------------------
   WALLET HEADER
   Matches styling of GlobalHeader for consistency.
-------------------------------------------------------------------------- */

const STYLES = {
    BORDER_OUTER: "border-border-default",
    BORDER_INNER: "border-border-subtle",
    DIVIDE: "divide-border-subtle",
    BORDER_DIVIDER: "border-border-subtle"
};

export default function WalletHeader({ summary }) {
    if (!summary) return null;

    const {
        availableCapital = 0,
        todayPnL = 0,
        todayPnLPct = 0,
        activeMode = "Normal",
        openRiskPct = 0,
        maxRiskAllowedPct = 0
    } = summary;

    const isPnLPositive = todayPnL >= 0;
    const deltaColor = isPnLPositive ? "text-emerald-400" : "text-red-400";
    const deltaSign = isPnLPositive ? "+" : "";

    // Determine Mode visuals
    const modeColor = activeMode === 'Aggressive' ? 'text-red-400' :
        activeMode === 'Conservative' ? 'text-emerald-400' :
            'text-blue-300';

    const modeSliderPos = activeMode === 'Aggressive' ? 90 :
        activeMode === 'Conservative' ? 10 :
            50;

    return (
        <div className={`relative rounded-2xl border ${STYLES.BORDER_OUTER} shadow-[0_8px_24px_rgba(0,0,0,0.45)] overflow-hidden bg-background-card`}>

            {/* MAIN ROW: CAPITAL | MODE | RISK */}
            <div className={`grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x ${STYLES.DIVIDE} bg-transparent min-h-[160px]`}>

                {/* A. AVAILABLE CAPITAL (HERO) */}
                <div className="p-6 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-2">
                        <div className={`${typography.label.sm} flex items-center gap-2`}>
                            Available Capital
                            <PortalTooltip content={<div className="p-2 text-xs">Total trading power currently free to use.</div>}>
                                <HelpCircle className="w-3.5 h-3.5 text-text-tertiary hover:text-blue-400 cursor-pointer transition-colors" />
                            </PortalTooltip>
                        </div>

                        {/* P&L Pill */}
                        <div className={`flex items-center gap-1 ${deltaColor} bg-background-surface px-2 py-1 rounded text-[10px] font-mono border ${STYLES.BORDER_INNER}`}>
                            <span className="font-bold">{deltaSign}₹{Math.abs(todayPnL).toLocaleString()}</span>
                            <span className="opacity-70 ml-1">({deltaSign}{Math.abs(todayPnLPct)}%)</span>
                        </div>
                    </div>

                    <div className="flex items-baseline gap-2 mb-1">
                        <div className={`${typography.number.giant} text-5xl md:text-6xl text-text-primary`}>
                            ₹{(availableCapital / 1000).toFixed(1)}k
                        </div>
                    </div>
                    <div className="text-[10px] text-text-tertiary font-mono tracking-widest pl-1">
                        REAL-TIME BALANCE
                    </div>
                </div>

                {/* B. TRADING MODE (CENTER) */}
                <div className="p-6 flex flex-col justify-center">
                    <div className={`${typography.label.sm} mb-3`}>Active Profile</div>
                    <div className="mb-4">
                        <div className="flex items-center gap-3 mb-1">
                            <div className={`text-3xl font-bold ${modeColor} tracking-tight`}>{activeMode}</div>
                        </div>
                        <div className="text-xs text-text-tertiary">
                            Current execution style & risk parameters.
                        </div>
                    </div>
                    {/* Mode Slider */}
                    <div className="relative h-2 rounded-full bg-gradient-to-r from-emerald-500 via-blue-500 to-red-500 opacity-80 mt-2">
                        <div
                            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-background-card rounded-full shadow-lg transition-all duration-1000"
                            style={{ left: `${modeSliderPos}%` }}
                        />
                    </div>
                </div>

                {/* C. RISK MONITOR (RIGHT) */}
                <div className="p-6 flex flex-col justify-center gap-4">
                    <div className={`${typography.label.sm} mb-1`}>Risk Monitor</div>

                    <div className="space-y-3">
                        {/* Open Risk */}
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-text-tertiary font-medium uppercase tracking-wide">Open Risk</span>
                            <div className="flex items-center gap-2">
                                <span className={`font-mono font-bold text-lg ${openRiskPct > 0.8 ? 'text-orange-400' : 'text-emerald-400'}`}>
                                    {openRiskPct}%
                                </span>
                            </div>
                        </div>
                        <div className="w-full bg-background-surface/50 border border-border-subtle h-1.5 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${openRiskPct > 0.8 ? 'bg-orange-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min(openRiskPct * 50, 100)}%` }} // Scaling for visual
                            />
                        </div>

                        {/* Max Risk */}
                        <div className="flex justify-between items-center text-xs pt-2">
                            <span className="text-text-tertiary font-medium uppercase tracking-wide">Max Allowed</span>
                            <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-text-tertiary">{maxRiskAllowedPct}% / Day</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
