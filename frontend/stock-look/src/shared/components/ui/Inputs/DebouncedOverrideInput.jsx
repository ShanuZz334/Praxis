import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, AlertCircle } from 'lucide-react';
import { useNotificationStore } from '@/shared/context/NotificationContext';

export const DebouncedOverrideInput = ({ label, overrideKey, value, onChange, lastUpdatedTimestamp, expiryDuration, info, instrument, moduleKey }) => {
    const [localValue, setLocalValue] = useState(value ?? "");
    const [progress, setProgress] = useState(null);
    const hasNotifiedRef = useRef(false);
    const { addNotification, setActiveOverrideRequest, removeNotification } = useNotificationStore();

    // Sync local state when external value changes (e.g. clear all)
    useEffect(() => {
        setLocalValue(value ?? "");
        // Reset notification state if data receives a fresh manual override
        if (value !== null && value !== undefined) {
            hasNotifiedRef.current = false;
        }
    }, [value]);

    useEffect(() => {
        const timer = setTimeout(() => {
            const valToPass = localValue !== "" ? localValue : null;
            if (valToPass !== (value ?? null)) {
                onChange(overrideKey, valToPass);
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [localValue, overrideKey, onChange, value]);

    // Timer Logic
    useEffect(() => {
        if (!expiryDuration || !lastUpdatedTimestamp || (value ?? null) === null) {
            setProgress(null);
            return;
        }

        const updateProgress = () => {
            const elapsed = Date.now() - lastUpdatedTimestamp;
            const remaining = Math.max(0, expiryDuration - elapsed);
            const percentage = (remaining / expiryDuration) * 100;
            setProgress(percentage);

            if (percentage === 0 && !hasNotifiedRef.current) {
                hasNotifiedRef.current = true;
                addNotification({
                    id: `stale_${moduleKey || 'global'}_${instrument || 'all'}_${overrideKey}`,
                    category: 'alerts',
                    priority: 'critical',
                    title: `Stale Data: ${label}`,
                    description: `The manual override for ${label} has expired and needs a fresh value.`,
                    metadata: { instrument: instrument || "Global", module: moduleKey || "Dashboard" },
                    actions: [
                        {
                            label: "Ignore",
                            onClick: (id) => {
                                removeNotification(id);
                            }
                        },
                        { 
                            label: "Update", 
                            onClick: (id) => {
                                setActiveOverrideRequest({ overrideKey, moduleKey, instrument, label, info, notificationId: id });
                            }
                        }
                    ]
                });
            }
        };

        updateProgress();
        // Update at a reasonable interval based on duration
        const intervalId = setInterval(updateProgress, Math.min(1000, expiryDuration / 100));

        return () => clearInterval(intervalId);
    }, [expiryDuration, lastUpdatedTimestamp, value, label, overrideKey, instrument, moduleKey, info, addNotification, setActiveOverrideRequest, removeNotification]);

    const getProgressColor = (pct) => {
        if (pct > 80) return 'bg-emerald-500';
        if (pct > 60) return 'bg-blue-500';
        if (pct > 40) return 'bg-yellow-500';
        if (pct > 20) return 'bg-orange-500';
        return 'bg-red-500';
    };

    return (
        <div className="flex flex-col gap-1 w-fit relative">
            <label className="text-[10px] text-text-tertiary uppercase font-bold tracking-wider flex items-center gap-1 group/info">
                {label}
                {info && (
                    <div className="relative">
                        <AlertCircle className="w-3 h-3 text-text-tertiary cursor-help hover:text-blue-400 transition-colors" />
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-52 p-2 bg-background-elevated border border-border-default text-text-secondary text-[10px] rounded-lg opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all shadow-xl z-50 normal-case font-medium leading-relaxed pointer-events-none">
                            {info}
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-background-elevated border-b border-r border-border-default rotate-45"></div>
                        </div>
                    </div>
                )}
            </label>
            <div className="relative w-32">
                <input 
                    type="text"
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                    className="bg-background-surface border border-border-subtle rounded px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-blue-500 w-full"
                />
                {progress !== null && (
                    <div 
                        className="absolute bottom-[1px] left-[1px] right-[1px] h-[2px] rounded-b-sm overflow-hidden pointer-events-none"
                    >
                        <div 
                            className={`h-full ${getProgressColor(progress)} transition-all duration-1000 ease-linear`}
                            style={{ width: `${progress}%` }} 
                        />
                    </div>
                )}
                {/* Warning Icons outside box to the right */}
                {progress !== null && progress <= 20 && progress > 0 && (
                    <div className="absolute top-1/2 -translate-y-1/2 -right-5 flex items-center justify-center" title="Data expiring soon">
                        <AlertTriangle className="w-[14px] h-[14px] text-yellow-500" />
                    </div>
                )}
                {progress !== null && progress === 0 && (
                    <button 
                        onClick={() => setActiveOverrideRequest({ overrideKey, moduleKey, instrument, label, info })}
                        className="absolute top-1/2 -translate-y-1/2 -right-6 flex items-center justify-center p-1 rounded hover:bg-background-elevated transition-colors cursor-pointer group/btn" 
                        title="Data expired. Click to update."
                    >
                        <AlertCircle className="w-[14px] h-[14px] text-red-500 group-hover/btn:scale-110 transition-transform" />
                    </button>
                )}
            </div>
        </div>
    );
};
