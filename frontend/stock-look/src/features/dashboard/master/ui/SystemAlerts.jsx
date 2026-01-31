import React from "react";
import { AlertTriangle, Info, BellRing } from "lucide-react";

export default function SystemAlerts({ alerts }) {
    if (!alerts || alerts.length === 0) return null;

    return (
        <div className="mb-6 space-y-2">
            {alerts.slice(0, 2).map(alert => (
                <div key={alert.id} className={`group flex items-center justify-between px-4 py-2.5 rounded-lg border backdrop-blur-md transition-all ${alert.type === 'warning'
                    ? 'bg-state-bearish-surface border-red-500/20 hover:border-red-500/30'
                    : 'bg-blue-500/[0.03] border-blue-500/20 hover:border-blue-500/30'
                    }`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-1 rounded ${alert.type === 'warning' ? 'bg-red-500/10 text-state-bearish-text' : 'bg-blue-500/10 text-accent-primary'}`}>
                            {alert.type === 'warning' ? <AlertTriangle size={14} /> : <Info size={14} />}
                        </div>
                        <span className={`text-xs font-bold uppercase tracking-wide ${alert.type === 'warning' ? 'text-state-bearish-text' : 'text-accent-primary opacity-80'}`}>
                            {alert.type === 'warning' ? 'Risk Alert' : 'System Notice'}
                        </span>
                        <div className={`h-3 w-px ${alert.type === 'warning' ? 'bg-red-500/20' : 'bg-blue-500/20'}`} />
                        <span className={`text-sm font-medium ${alert.type === 'warning' ? 'text-text-primary' : 'text-text-primary'}`}>
                            {alert.text}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}
