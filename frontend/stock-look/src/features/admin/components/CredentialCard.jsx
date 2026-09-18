import React from "react";
import { RefreshCw, Activity, AlertCircle } from "lucide-react";

const CredentialCard = ({ providerKey, meta, healthData, onCheckConnection, checking, onConfigure }) => {
    const Icon = meta.icon;

    const isConnected = healthData?.status === "UP";
    const isConfigured = healthData?.configured || false;
    const latency = healthData?.latency || 0;
    const errorMessage = healthData?.error || (healthData?.status === "OFFLINE" ? healthData?.sampleData : null);

    const isUpstox = providerKey === "upstox";
    // For Upstox, if not connected (offline / token expired), it requires OAuth configuration/authentication
    const needsConfigure = isUpstox ? !isConnected : !isConfigured;

    const latencyColor = latency < 100 ? "text-green-500" : latency < 300 ? "text-amber-500" : "text-red-500";
    const latencyBarColor = latency < 100 ? "bg-green-500" : latency < 300 ? "bg-amber-500" : "bg-red-500";

    const getStatusBadge = () => {
        if (!isConfigured && !isUpstox) return { text: "NOT CONFIGURED", color: "text-gray-500", bg: "bg-gray-500/10" };
        if (isConnected) return { text: "CONNECTED", color: "text-green-500", bg: "bg-green-500/10" };
        return { text: "OFFLINE", color: "text-red-500", bg: "bg-red-500/10" };
    };

    const statusBadge = getStatusBadge();

    return (
        <div className={`
            relative p-6 rounded-2xl border flex flex-col justify-between min-h-[260px] transition-all duration-300
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
                        ${statusBadge.bg} ${statusBadge.color}
                    `}>
                        {statusBadge.text}
                    </div>
                    {meta.customToggle && meta.customToggle()}
                </div>
            </div>

            {/* Info Section */}
            <div className="flex-1">
                <h3 className={`text-lg font-bold tracking-tight mb-1.5 ${isConnected ? "text-text-primary" : "text-text-secondary"}`}>
                    {meta.name}
                </h3>
                <p className="text-xs text-text-muted leading-relaxed line-clamp-2">
                    {meta.desc}
                </p>
                
                {/* Clean Error Box (Only shown when offline / error exists) */}
                {!isConnected && errorMessage && (
                    <div 
                        onClick={isUpstox ? onConfigure : undefined}
                        className={`mt-3 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2 text-[11px] text-red-400 ${isUpstox ? "cursor-pointer hover:bg-red-500/20 hover:border-red-500/40 transition-all" : ""}`}
                        title={isUpstox ? "Click to authenticate with Upstox" : undefined}
                    >
                        <AlertCircle size={14} className="shrink-0 text-red-400 mt-0.5" />
                        <div className="flex-1 flex flex-col">
                            <span className="leading-snug line-clamp-2">
                                {errorMessage}
                            </span>
                            {isUpstox && (
                                <span className="text-[10px] text-accent-primary font-semibold mt-1 hover:underline">
                                    Click to authenticate with Upstox &rarr;
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Actions & Latency */}
            <div className="mt-6 pt-3 flex flex-col justify-end gap-3">
                {isConnected ? (
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-mono text-text-muted uppercase tracking-wider">
                            <span>Latency</span>
                            <div className="flex items-center gap-1.5">
                                <span className={`font-semibold ${latencyColor}`}>{latency}ms</span>
                                <RefreshCw size={10} className="animate-spin-slow text-text-muted" />
                            </div>
                        </div>
                        <div className="h-1.5 w-full bg-background-floor rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full ${latencyBarColor} transition-all duration-700`}
                                style={{ width: `${Math.max(Math.min((latency / 400) * 100, 100), 5)}%` }}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="h-5 flex items-center text-[10px] font-mono text-text-muted uppercase tracking-wider">
                        <span>Status: <span className={statusBadge.color}>{statusBadge.text}</span></span>
                    </div>
                )}

                {/* Check Connection / Configure Button */}
                <button
                    onClick={needsConfigure ? onConfigure : onCheckConnection}
                    disabled={checking}
                    className={`w-full py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                        needsConfigure
                            ? "bg-accent-primary text-white border-accent-primary hover:brightness-110 shadow-lg shadow-accent-primary/20"
                            : "bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary border-accent-primary/20 hover:shadow-lg hover:shadow-accent-primary/5"
                    }`}
                >
                    <Activity size={14} className={checking ? "animate-pulse" : ""} />
                    {checking ? "Checking..." : needsConfigure ? "Configure" : "Check Connection"}
                </button>
            </div>
        </div>
    );
};

export default CredentialCard;
