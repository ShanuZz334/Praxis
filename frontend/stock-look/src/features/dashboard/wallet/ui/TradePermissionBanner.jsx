/**
 * @file TradePermissionBanner.jsx
 * @purpose Visual banner indicating trade permission status.
 * @responsibilities
 * - Shows global trade status (Allowed, Reduced Size, Blocked).
 * - Contextualizes the reason for restrictions.
 * @key_exports
 * - TradePermissionBanner (Default)
 * @dependencies
 * - None (Pure UI)
 * @lifecycle
 * - Rendered by WalletPage (Future/Expanded).
 * @date 2026-02-03
 */

import React from "react";
import { CheckCircle, AlertTriangle, ShieldAlert } from "lucide-react";

export default function TradePermissionBanner({ permission }) {
    if (!permission) return null;

    const bg = permission.status === "BLOCKED" ? "bg-red-500/5 border border-red-500/20"
        : permission.status === "REDUCED_SIZE" ? "bg-amber-500/5 border border-amber-500/20"
            : "bg-emerald-500/5 border border-emerald-500/20";

    const msgColor = permission.status === "BLOCKED" ? "text-red-400"
        : permission.status === "REDUCED_SIZE" ? "text-amber-400"
            : "text-emerald-400";
    
    const iconColor = permission.status === "BLOCKED" ? "text-red-500"
        : permission.status === "REDUCED_SIZE" ? "text-amber-500"
            : "text-emerald-500";
    
    const Icon = permission.status === "BLOCKED" ? ShieldAlert : permission.status === "REDUCED_SIZE" ? AlertTriangle : CheckCircle;

    return (
        <div className={`w-full ${bg} px-5 py-3 mb-6 rounded-xl shadow-lg backdrop-blur-md animate-in slide-in-from-top-2 duration-500 flex items-center justify-between transition-all hover:bg-opacity-10`}>
            <div className="flex items-center gap-4">
                <span className={`drop-shadow-md ${iconColor}`}>
                    <Icon size={24} strokeWidth={2.5} />
                </span>
                <div className="flex flex-col justify-center">
                    <div className="text-[9px] text-text-tertiary uppercase font-bold tracking-widest mb-0.5">Trade Permission Status</div>
                    <div className={`text-sm font-bold ${msgColor} tracking-wide uppercase`}>{permission.status.replace("_", " ")}</div>
                </div>
            </div>
            <div className={`text-xs font-medium ${msgColor} opacity-80 text-right hidden md:block max-w-md`}>
                {permission.reason}
            </div>
        </div>
    );
}
