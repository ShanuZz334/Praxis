import React, { useState, useEffect } from 'react';

export const DebouncedOverrideInput = ({ label, overrideKey, value, onChange }) => {
    const [localValue, setLocalValue] = useState(value ?? "");

    // Sync local state when external value changes (e.g. clear all)
    useEffect(() => {
        setLocalValue(value ?? "");
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

    return (
        <div className="flex flex-col gap-1">
            <label className="text-[10px] text-text-tertiary uppercase font-bold tracking-wider">{label}</label>
            <input 
                type="text"
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                className="bg-background-surface border border-border-subtle rounded px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-blue-500 w-32"
            />
        </div>
    );
};
