import React, { useState } from 'react';
import { Server, Cloud, Cpu, SlidersHorizontal, CheckCircle2 } from 'lucide-react';

export default function PaiModelsTab() {
    const [temperature, setTemperature] = useState(0.2);
    const [contextLimit, setContextLimit] = useState(15);

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div>
                <h2 className="text-lg font-bold text-text-primary mb-1">Model Connections</h2>
                <p className="text-[13px] text-text-tertiary">Configure endpoints, API keys, and model parameters.</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
                
                {/* Local LLM Block */}
                <div className="bg-background-card border border-border-default/40 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Server size={18} className="text-blue-500" />
                        <h3 className="text-[15px] font-semibold text-text-primary">Local LLM (Ollama / LM Studio)</h3>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[12px] font-medium text-text-secondary mb-1">Local API Endpoint</label>
                            <input 
                                type="text" 
                                defaultValue="http://localhost:11434/api/generate"
                                className="w-full bg-background-surface/50 border border-border-default/50 rounded-xl px-4 py-2.5 text-[13px] text-text-primary focus:border-blue-500/50 outline-none font-mono"
                            />
                        </div>
                        <div>
                            <label className="block text-[12px] font-medium text-text-secondary mb-1">Model Name</label>
                            <input 
                                type="text" 
                                defaultValue="llama3:8b"
                                className="w-full bg-background-surface/50 border border-border-default/50 rounded-xl px-4 py-2.5 text-[13px] text-text-primary focus:border-blue-500/50 outline-none font-mono"
                            />
                        </div>
                        <button className="px-4 py-2 bg-background-elevated hover:bg-background-surface rounded-lg text-[12px] font-medium transition-colors border border-border-default/50">
                            Test Local Connection
                        </button>
                    </div>
                </div>

                {/* Model Parameters Block */}
                <div className="bg-background-card border border-border-default/40 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <SlidersHorizontal size={18} className="text-orange-500" />
                        <h3 className="text-[15px] font-semibold text-text-primary">Model Parameters</h3>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-[12px] font-medium text-text-secondary">Temperature (Creativity)</label>
                                <span className="text-[12px] font-bold text-blue-500">{temperature.toFixed(1)}</span>
                            </div>
                            <input 
                                type="range" 
                                min="0" 
                                max="1" 
                                step="0.1" 
                                value={temperature}
                                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                                className="w-full accent-blue-500 h-1.5 bg-background-surface rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex justify-between mt-1 px-1">
                                <span className="text-[10px] text-text-tertiary">Analytical (0)</span>
                                <span className="text-[10px] text-text-tertiary">Creative (1)</span>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-[12px] font-medium text-text-secondary">Context Memory Limit</label>
                                <span className="text-[12px] font-bold text-blue-500">{contextLimit} msgs</span>
                            </div>
                            <input 
                                type="range" 
                                min="5" 
                                max="50" 
                                step="1" 
                                value={contextLimit}
                                onChange={(e) => setContextLimit(parseInt(e.target.value))}
                                className="w-full accent-blue-500 h-1.5 bg-background-surface rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex justify-between mt-1 px-1">
                                <span className="text-[10px] text-text-tertiary">Short Memory (5)</span>
                                <span className="text-[10px] text-text-tertiary">Long Memory (50)</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* API Provider Block */}
                <div className="bg-background-card border border-border-default/40 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Cpu size={18} className="text-emerald-500" />
                        <h3 className="text-[15px] font-semibold text-text-primary">Commercial APIs (OpenAI / Anthropic)</h3>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[12px] font-medium text-text-secondary mb-1">OpenAI API Key</label>
                            <input 
                                type="password" 
                                defaultValue="sk-................................"
                                className="w-full bg-background-surface/50 border border-border-default/50 rounded-xl px-4 py-2.5 text-[13px] text-text-primary focus:border-emerald-500/50 outline-none font-mono"
                            />
                        </div>
                        <div>
                            <label className="block text-[12px] font-medium text-text-secondary mb-1">Anthropic API Key</label>
                            <input 
                                type="password" 
                                placeholder="sk-ant-..."
                                className="w-full bg-background-surface/50 border border-border-default/50 rounded-xl px-4 py-2.5 text-[13px] text-text-primary focus:border-emerald-500/50 outline-none font-mono"
                            />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
