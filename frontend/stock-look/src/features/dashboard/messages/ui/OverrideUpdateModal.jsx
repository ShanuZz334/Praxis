import React, { useState, useEffect } from "react";
import { FiX } from "react-icons/fi";
import { AlertCircle } from "lucide-react";
import { useNotificationStore } from "@/shared/context/NotificationContext";

export default function OverrideUpdateModal() {
    const { activeOverrideRequest, setActiveOverrideRequest, removeNotification } = useNotificationStore();
    const [inputValue, setInputValue] = useState("");

    // Reset input when modal opens
    useEffect(() => {
        if (activeOverrideRequest) {
            setInputValue("");
        }
    }, [activeOverrideRequest]);

    if (!activeOverrideRequest) return null;

    const { overrideKey, moduleKey, instrument, label, info, notificationId } = activeOverrideRequest;

    const handleSave = () => {
        if (inputValue.trim() === "") return;

        // 1. Update the value in localStorage
        const storageKey = `praxis_manual_overrides_${moduleKey}`;
        let allOverrides = {};
        try {
            const stored = localStorage.getItem(storageKey);
            if (stored) allOverrides = JSON.parse(stored);
        } catch (e) {
            console.error(e);
        }
        
        if (!allOverrides[instrument]) {
            allOverrides[instrument] = {};
        }
        allOverrides[instrument][overrideKey] = inputValue;
        localStorage.setItem(storageKey, JSON.stringify(allOverrides));

        // 2. Update the timestamp in localStorage
        const timeStorageKey = `praxis_manual_last_updated_${moduleKey}`;
        let allTimes = {};
        try {
            const storedTime = localStorage.getItem(timeStorageKey);
            if (storedTime) allTimes = JSON.parse(storedTime);
        } catch (e) {
            console.error(e);
        }
        
        if (!allTimes[instrument]) {
            allTimes[instrument] = {};
        }
        allTimes[instrument][overrideKey] = Date.now();
        localStorage.setItem(timeStorageKey, JSON.stringify(allTimes));

        // 3. Close the modal and dismiss the notification
        setActiveOverrideRequest(null);
        if (notificationId) {
            removeNotification(notificationId);
        }
        
        // 4. Optionally dispatch an event so active hooks can refresh immediately (if they listen, or they'll get it on remount)
        window.dispatchEvent(new Event('storage')); // Forces a storage event which some hooks might catch
    };

    const handleClose = () => {
        setActiveOverrideRequest(null);
    };

    return (
        <div 
            className="fixed inset-0 bg-black/75 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300"
            onClick={handleClose}
        >
            <div 
                className="bg-background-card border border-border-default rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-text-primary tracking-tight">Update Override</h2>
                    <button
                        onClick={handleClose}
                        className="text-text-tertiary hover:text-text-primary transition-colors p-1.5 hover:bg-background-surface rounded-lg"
                    >
                        <FiX className="text-xl" />
                    </button>
                </div>

                {/* Body */}
                <div className="space-y-4 mb-6">
                    <label className="text-xs text-text-tertiary uppercase font-bold tracking-wider flex items-center gap-1 group/info">
                        {label}
                        {info && (
                            <div className="relative ml-1">
                                <AlertCircle className="w-3.5 h-3.5 text-blue-400 cursor-help transition-colors" />
                                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 p-2.5 bg-background-elevated border border-border-default text-text-secondary text-[11px] rounded-lg opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all shadow-xl z-50 normal-case font-medium leading-relaxed pointer-events-none">
                                    {info}
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-background-elevated border-b border-r border-border-default rotate-45"></div>
                                </div>
                            </div>
                        )}
                    </label>

                    <input 
                        type="text"
                        autoFocus
                        placeholder="Enter new value..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave();
                        }}
                        className="w-full bg-background-input border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-blue-500 transition-colors shadow-inner"
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button 
                        onClick={handleClose}
                        className="flex-1 px-4 py-2.5 bg-background-surface hover:bg-border-default text-text-secondary hover:text-text-primary border border-border-default rounded-xl text-sm font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave}
                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl text-sm font-medium hover:opacity-90 hover:shadow-lg hover:shadow-blue-500/30 transition-all"
                    >
                        Save Value
                    </button>
                </div>
            </div>
        </div>
    );
}
