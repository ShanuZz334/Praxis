import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function IndicatorSettingsModal({ config, currentParams, onSave, onClose }) {
    // config is an array of settings: { id: "adx_period", label: "ADX Period", type: "number", min: 1, max: 50, default: 14 }
    
    const [localParams, setLocalParams] = useState(currentParams || {});

    const handleChange = (id, value) => {
        setLocalParams(prev => ({ ...prev, [id]: value }));
    };

    const handleSave = () => {
        onSave(localParams);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background-base/80 backdrop-blur-sm">
            <div className="w-[320px] bg-background-elevated border border-border-default rounded-lg shadow-2xl p-5 flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-text-tertiary hover:text-text-primary transition-colors focus:outline-none"
                >
                    <X className="w-4 h-4" />
                </button>

                <h3 className="text-sm font-bold text-text-primary mb-4">Indicator Settings</h3>

                <div className="flex flex-col gap-4 mb-6">
                    {config.map((setting) => {
                        const val = localParams[setting.id] ?? setting.default;
                        return (
                            <div key={setting.id} className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-mono text-text-secondary">
                                    {setting.label}
                                </label>
                                {setting.type === 'number' && (
                                    <input 
                                        type="number" 
                                        min={setting.min} 
                                        max={setting.max}
                                        value={val}
                                        onChange={(e) => handleChange(setting.id, Number(e.target.value))}
                                        className="bg-background-base border border-border-default rounded px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-blue-500 font-mono"
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="flex justify-end gap-2">
                    <button 
                        onClick={onClose}
                        className="px-4 py-1.5 rounded bg-background-base border border-border-default text-xs font-mono text-text-secondary hover:text-text-primary transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave}
                        className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold transition-colors"
                    >
                        Apply
                    </button>
                </div>
            </div>
        </div>
    );
}
