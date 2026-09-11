/**
 * @file TradePermissionBanner.jsx
 * @purpose Visual banner indicating trade permission status.
 * @responsibilities
 * - Shows global trade status (Allowed, Reduced Size, Blocked).
 * - Contextualizes the reason for restrictions.
 * @key_exports
 * - TradePermissionBanner (Default)
 * @dependencies
 * - Lucide React
 * @lifecycle
 * - Rendered by WalletPage.
 * @date 2026-02-03
 */

import React from "react";
import { CheckCircle2, AlertTriangle, ShieldAlert, ShieldCheck } from "lucide-react";

export default function TradePermissionBanner({ permission }) {
    if (!permission) return null;

    const isBlocked = permission.status === "BLOCKED";
    const isReduced = permission.status === "REDUCED_SIZE";

    const config = isBlocked
        ? {
            container: "bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-rose-500/5",
            iconBg: "bg-rose-500/20 border-rose-500/30 text-rose-400",
            dotBg: "bg-rose-500",
            badge: "bg-rose-500/15 text-rose-300 border-rose-500/30",
            Icon: ShieldAlert,
            title: "Trading Blocked",
            label: "BLOCKED"
        }
        : isReduced
            ? {
                container: "bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-amber-500/5",
                iconBg: "bg-amber-500/20 border-amber-500/30 text-amber-400",
                dotBg: "bg-amber-500",
                badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
                Icon: AlertTriangle,
                title: "Reduced Position Sizing",
                label: "REDUCED SIZE"
            }
            : {
                container: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-emerald-500/5",
                iconBg: "bg-emerald-500/20 border-emerald-500/30 text-emerald-400",
                dotBg: "bg-emerald-500",
                badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
                Icon: CheckCircle2,
                title: "Trade Execution Permitted",
                label: "ALLOWED"
            };

    const { Icon } = config;

    return (
        <div className={`w-full ${config.container} border backdrop-blur-xl rounded-2xl p-4 md:p-5 shadow-sm transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4`}>
            <div className="flex items-center gap-3.5">
                <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${config.iconBg} shadow-sm`}>
                    <Icon size={22} strokeWidth={2.2} />
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] text-text-tertiary uppercase font-bold tracking-widest">
                            Trade Permission Status
                        </span>
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${config.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${config.dotBg} animate-pulse`} />
                            {config.label}
                        </span>
                    </div>
                    <div className="text-sm md:text-base font-bold text-text-primary tracking-tight">
                        {config.title}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-border-subtle/30">
                <div className="text-xs text-text-secondary md:text-right max-w-md font-medium leading-relaxed">
                    {permission.reason}
                </div>
                <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background-surface/60 border border-border-subtle/50 text-[10px] font-mono text-text-tertiary shrink-0">
                    <ShieldCheck size={13} className="text-emerald-400" />
                    <span>Risk Guard Active</span>
                </div>
            </div>
        </div>
    );
}
