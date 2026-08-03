import React from "react";
import { RefreshCw, Activity } from "lucide-react";

const CredentialCard = ({ providerKey, meta, healthData, onCheckConnection, checking, onConfigure }) => {
    const Icon = meta.icon;

    const isConnected = healthData?.status === "UP";
    const isConfigured = healthData?.configured || false;
    const latency = healthData?.latency || 0;

    const latencyColor = latency < 80 ? "text-green-500" : latency < 120 ? "text-amber-500" : "text-red-500";
    const latencyBarColor = latency < 80 ? "bg-green-500" : latency < 120 ? "bg-amber-500" : "bg-red-500";

    const getStatusBadge = () => {
        if (!isConfigured) return { text: "NOT CONFIGURED", color: "text-gray-500" };
        if (isConnected) return { text: "CONNECTED", color: "text-green-500" };
        return { text: "OFFLINE", color: "text-red-500" };
    };

    const statusBadge = getStatusBadge();

    return (
        <div className={`
            relative p-6 rounded-2xl border flex flex-col justify-between min-h-[280px] transition-all duration-300
            ${isConnected
                ? "bg-background-surface/80 border-accent-primary/30 shadow-lg shadow-accent-primary/5"
                : "bg-background-surface/40 border-border-subtle hover:border-border-hover"}
        `}>
            {/* Top Row */}
            <div className="flex justify-between items-start mb-4">
                <div className={`
                    p-3 rounded-xl 
                    ${isConnected ? "bg-gradient-to-br from-accent-primary to-accent-secondary" : "bg-background-floor"}
                `}>
                    <Icon size={24} className={isConnected ? "text-white" : "text-text-muted"} />
                </div>

                <div className="flex flex-col items-end gap-2">
                    <div className={`
                        px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase
                        ${isConnected ? "bg-green-500/10 text-green-500" : isConfigured ? "bg-red-500/10 text-red-500" : "bg-gray-500/10 text-gray-500"}
                    `}>
                        {statusBadge.text}
                    </div>
                    {meta.customToggle && meta.customToggle()}
                </div>
            </div>

            {/* Info */}
            <div className="flex-1">
                <h3 className={`text-lg font-bold tracking-tight mb-2 ${isConnected ? "text-text-primary" : "text-text-secondary"}`}>
                    {meta.name}
                </h3>
                <p className="text-xs text-text-muted leading-relaxed">
                    {meta.desc}
                </p>
                
                {healthData?.sampleData && (
                    <div className="mt-3 p-2 rounded bg-background-floor border border-border-subtle flex items-center gap-2 text-[11px] font-mono text-emerald-400 shadow-inner">
                        <span className="truncate">{healthData.sampleData}</span>
                    </div>
                )}
            </div>

            {/* Latency Section (Only when connected) */}
            <div className="h-16 flex flex-col justify-end">
                {isConnected ? (
                    <div className="space-y-2 mb-4">
                        <div className="flex justify-between items-center text-[10px] font-mono text-text-muted uppercase tracking-wider">
                            <span>Latency</span>
                            <div className="flex items-center gap-1">
                                <span className={latencyColor}>{latency}ms</span>
                                <RefreshCw size={10} className="animate-spin-slow" />
                            </div>
                        </div>
                        <div className="h-1 w-full bg-background-floor rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full ${latencyBarColor} transition-all duration-1000`}
                                style={{ width: `${Math.min((latency / 200) * 100, 100)}%` }}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="h-4 mb-4" />
                )}

                {/* Check Connection / OAuth Button */}
                <button
                    onClick={isConfigured ? onCheckConnection : onConfigure}
                    disabled={checking}
                    className="w-full py-3 rounded-xl bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary border border-accent-primary/20 text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-accent-primary/5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Activity size={14} className={checking ? "animate-pulse" : ""} />
                    {checking ? "Checking..." : isConfigured ? "Check Connection" : "Configure"}
                </button>
            </div>
        </div>
    );
};

export default CredentialCard;
