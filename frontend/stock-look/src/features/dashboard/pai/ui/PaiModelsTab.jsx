import React, { useState, useEffect } from 'react';
import { Server, Cloud, Cpu, SlidersHorizontal, Plus, Edit2, Trash2, Play, CheckCircle, AlertCircle, Waypoints, GripVertical, Zap, Timer, Ban } from 'lucide-react';
import axiosInstance from '@/shared/utils/axiosInstance';
import UiverseDropdown from '@/shared/components/ui/UiverseDropdown';
import { toast } from 'sonner';

export default function PaiModelsTab() {
    const [temperature, setTemperature] = useState(0.2);
    const [contextLimit, setContextLimit] = useState(15);
    const [providers, setProviders] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProvider, setEditingProvider] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    
    // Custom UI states to replace native browser popups
    // Custom UI states to replace native browser popups
    const [providerToDelete, setProviderToDelete] = useState(null);
    
    // Drag & Drop State
    const [draggedIdx, setDraggedIdx] = useState(null);
    const [dragOverIdx, setDragOverIdx] = useState(null);

    const showToast = (message, type = 'success') => {
        if (type === 'error') {
            toast.error(message);
        } else {
            toast.success(message);
        }
    };

    const [formData, setFormData] = useState({
        providerId: '',
        displayName: '',
        purpose: '',
        baseUrl: '',
        apiKey: '',
        priority: 10,
        supportedTiers: [],
        models: { tier1_simple: '', tier2_medium: '', tier3_complex: '', tier4_vision: '' }
    });

    useEffect(() => {
        fetchProviders();
        fetchTemplates();
        fetchRouting();
        fetchLocalModels();
    }, []);

    const [routing, setRouting] = useState({
        cardInsight: { providerId: '', modelId: '' },
        headerInsight: { providerId: '', modelId: '' },
        pageInsight: { providerId: '', modelId: '' },
        manualChat: { providerId: '', modelId: '' }
    });
    const [localModels, setLocalModels] = useState([]);

    const fetchRouting = async () => {
        try {
            const res = await axiosInstance.get('/api/v1/ai-settings/routing');
            if (res.data) {
                setRouting(res.data);
                if (res.data.temperature !== undefined) setTemperature(res.data.temperature);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchLocalModels = async () => {
        try {
            const res = await axiosInstance.get('/api/v1/ai-settings/providers/ollama/models');
            if (res.data) setLocalModels(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleRoutingChange = async (taskType, updates) => {
        const newRouting = { 
            ...routing, 
            [taskType]: { ...routing[taskType], ...updates } 
        };
        setRouting(newRouting);
        try {
            await axiosInstance.put('/api/v1/ai-settings/routing', newRouting);
            showToast('Routing preferences saved');
        } catch (e) {
            showToast('Failed to save routing', 'error');
        }
    };

    const fetchProviders = async () => {
        try {
            const res = await axiosInstance.get('/api/v1/ai-settings/providers');
            if (res.data) setProviders(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchTemplates = async () => {
        try {
            const res = await axiosInstance.get('/api/v1/ai-settings/providers/templates');
            if (res.data) setTemplates(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleTemplateSelect = (value) => {
        const tmpl = templates.find(t => t.providerId === value);
        if (tmpl) {
            setFormData({
                ...formData,
                providerId: tmpl.providerId,
                displayName: tmpl.displayName,
                baseUrl: tmpl.baseUrl,
                models: {
                    tier1_simple: tmpl.models?.tier1_simple || '',
                    tier2_medium: tmpl.models?.tier2_medium || '',
                    tier3_complex: tmpl.models?.tier3_complex || '',
                    tier4_vision: tmpl.models?.tier4_vision || ''
                }
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = editingProvider ? `/api/v1/ai-settings/providers/${editingProvider.providerId}` : '/api/v1/ai-settings/providers';
        
        const supportedTiers = Object.keys(formData.models)
            .filter(k => formData.models[k] && formData.models[k].trim() !== '')
            .map(k => k.replace('tier', '').split('_')[0]);

        const dataToSubmit = { ...formData, supportedTiers };

        try {
            if (editingProvider) {
                await axiosInstance.put(url, dataToSubmit);
            } else {
                await axiosInstance.post(url, dataToSubmit);
            }
            setIsModalOpen(false);
            setEditingProvider(null);
            fetchProviders();
        } catch (error) {
            console.error(error);
        }
    };

    const handleToggle = async (providerId) => {
        try {
            await axiosInstance.patch(`/api/v1/ai-settings/providers/${providerId}/toggle`);
            fetchProviders();
        } catch (e) { console.error(e); }
    };

    const confirmDelete = async () => {
        if (!providerToDelete) return;
        try {
            await axiosInstance.delete(`/api/v1/ai-settings/providers/${providerToDelete}`);
            fetchProviders();
            setProviderToDelete(null);
            showToast("Provider deleted successfully");
        } catch (e) {
            console.error(e);
            showToast("Failed to delete provider", 'error');
        }
    };

    const handleDeleteClick = (providerId) => {
        setProviderToDelete(providerId);
    };

    const handleTest = async (providerId) => {
        try {
            const res = await axiosInstance.post(`/api/v1/ai-settings/providers/${providerId}/test`);
            const data = res.data;
            if (data.success) {
                showToast(`Test Successful! Latency: ${data.latencyMs}ms`, 'success');
            } else {
                showToast(`Test Failed: ${data.error}`, 'error');
            }
        } catch (e) {
            showToast(`Test Error: ${e.response?.data?.error || e.message}`, 'error');
        }
    };

    const handleDropReorder = async (dragIndex, hoverIndex) => {
        if (dragIndex === null || hoverIndex === null || dragIndex === hoverIndex) return;
        const newProviders = [...providers];
        const [draggedItem] = newProviders.splice(dragIndex, 1);
        newProviders.splice(hoverIndex, 0, draggedItem);
        
        setProviders(newProviders);
        const order = newProviders.map((p, i) => ({ providerId: p.providerId, priority: i + 1 }));
        
        try {
            await axiosInstance.patch(`/api/v1/ai-settings/providers/reorder`, { order });
        } catch (e) {
            console.error(e);
            showToast('Failed to save new order', 'error');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div>
                <h2 className="text-lg font-bold text-text-primary mb-1">AI Providers & Routing</h2>
                <p className="text-[13px] text-text-tertiary">Manage AI gateway endpoints, models, and fallback priorities.</p>
            </div>

            <div className="bg-background-card border border-border-default/40 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Cpu size={18} className="text-blue-500" />
                        <h3 className="text-[15px] font-semibold text-text-primary">Configured Providers</h3>
                    </div>
                    <button 
                        onClick={() => {
                            setEditingProvider(null);
                            setFormData({ providerId: '', displayName: '', purpose: '', baseUrl: '', apiKey: '', priority: 10, supportedTiers: [], models: { tier1_simple: '', tier2_medium: '', tier3_complex: '', tier4_vision: '' }});
                            setIsModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 rounded-lg text-[13px] font-medium transition-colors"
                    >
                        <Plus size={14} /> Add Provider
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border-default/30">
                                <th className="py-3 px-2 text-[12px] font-medium text-text-secondary w-10 text-center">#</th>
                                <th className="py-3 px-2 text-[12px] font-medium text-text-secondary">Provider</th>
                                <th className="py-3 px-2 text-[12px] font-medium text-text-secondary">API Key</th>
                                <th className="py-3 px-2 text-[12px] font-medium text-text-secondary text-center">Status</th>
                                <th className="py-3 px-2 text-[12px] font-medium text-text-secondary text-center">Usage</th>
                                <th className="py-3 px-2 text-[12px] font-medium text-text-secondary text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="py-4 text-center text-[13px] text-text-tertiary">Loading providers...</td></tr>
                            ) : providers.length === 0 ? (
                                <tr><td colSpan="6" className="py-4 text-center text-[13px] text-text-tertiary">No providers configured.</td></tr>
                            ) : (
                                providers.map((p, index) => (
                                    <tr 
                                        key={p.providerId} 
                                        draggable
                                        onDragStart={(e) => {
                                            setDraggedIdx(index);
                                            e.dataTransfer.effectAllowed = "move";
                                            // Optional: set invisible drag image to rely purely on css
                                            const img = new Image();
                                            img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                                            e.dataTransfer.setDragImage(img, 0, 0);
                                        }}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            if (dragOverIdx !== index) setDragOverIdx(index);
                                        }}
                                        onDragLeave={() => setDragOverIdx(null)}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            handleDropReorder(draggedIdx, index);
                                            setDraggedIdx(null);
                                            setDragOverIdx(null);
                                        }}
                                        onDragEnd={() => {
                                            setDraggedIdx(null);
                                            setDragOverIdx(null);
                                        }}
                                        className={`border-b border-border-default/10 transition-colors cursor-grab active:cursor-grabbing
                                            ${draggedIdx === index ? 'opacity-40 bg-background-surface' : 'hover:bg-background-surface/30'} 
                                            ${dragOverIdx === index ? 'bg-background-elevated/80 border-t-2 border-t-blue-500' : ''}
                                        `}
                                    >
                                        <td className="py-3 px-2 w-10">
                                            <div className="flex items-center justify-center text-text-tertiary">
                                                <GripVertical size={16} className="opacity-50 hover:opacity-100 transition-opacity" />
                                            </div>
                                        </td>
                                        <td className="py-3 px-2">
                                            <div className="flex items-center gap-2">
                                                <div className="text-[13px] font-medium text-text-primary">{p.displayName}</div>
                                                {p.purpose && <span className="px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[9px] font-bold uppercase tracking-wider">{p.purpose}</span>}
                                            </div>
                                            <div className="text-[11px] text-text-tertiary">{p.baseUrl}</div>
                                        </td>
                                        <td className="py-3 px-2 font-mono text-[12px] text-text-secondary">
                                            {p.apiKey || 'No Key'}
                                        </td>
                                        <td className="py-3 px-2">
                                            <button 
                                                onClick={() => handleToggle(p.providerId)}
                                                className={`mx-auto w-[64px] flex justify-center px-2 py-0.5 rounded text-[11px] font-medium ${p.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}
                                            >
                                                {p.isActive ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className="py-3 px-2">
                                            {(() => {
                                                const status = p.limitStatus || 'healthy';
                                                if (status === 'warning') {
                                                    return (
                                                        <div title="Approaching rate limit: Throttling" className="flex items-center justify-center text-amber-500 w-full">
                                                            <Timer size={18} />
                                                        </div>
                                                    );
                                                }
                                                if (status === 'exhausted') {
                                                    return (
                                                        <div title="Rate limit reached: Blocked" className="flex items-center justify-center text-red-500 w-full">
                                                            <AlertCircle size={18} />
                                                        </div>
                                                    );
                                                }
                                                return (
                                                    <div title="API limits healthy: Unthrottled" className="flex items-center justify-center text-emerald-500 w-full">
                                                        <CheckCircle size={18} />
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                        <td className="py-3 px-2 text-right space-x-3">
                                            <button onClick={() => handleTest(p.providerId)} className="text-blue-400 hover:text-blue-300 transition-colors" title="Test Connection">
                                                <Play size={16} />
                                            </button>
                                            <button onClick={() => {
                                                setEditingProvider(p);
                                                setFormData({ ...p, apiKey: '' });
                                                setIsModalOpen(true);
                                            }} className="text-text-tertiary hover:text-text-primary" title="Edit"><Edit2 size={14} /></button>
                                            <button onClick={() => handleDeleteClick(p.providerId)} className="text-red-400/80 hover:text-red-400 transition-colors" title="Delete Provider">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Task-Specific Routing ───────────────────────────────────────────── */}
            <div className="bg-background-card border border-border-default/40 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Waypoints size={18} className="text-purple-500" />
                        <h3 className="text-[15px] font-semibold text-text-primary">Task Routing</h3>
                    </div>
                    <span className="text-[11px] text-text-tertiary bg-background-surface px-2 py-0.5 rounded-md">Auto-saved</span>
                </div>
                
                <p className="text-[12px] text-text-secondary mb-6">
                    Assign specific models to distinct Praxis features. If left blank, the Gateway falls back to Priority Tier routing.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {/* Helper to render a generic dropdown with all available models */}
                    {[
                        { key: 'cardInsight', label: 'Card Insight Generation' },
                        { key: 'headerInsight', label: 'Header Aggregation Insight' },
                        { key: 'pageInsight', label: 'Page Synthesis' },
                        { key: 'manualChat', label: 'Manual Analysis Chat' }
                    ].map(task => {
                        // Build flattened list of models across all providers
                        const allModels = [];
                        allModels.push({ value: '', label: 'Default (Tier Fallback)' });
                        
                        providers.forEach(p => {
                            if (p.providerId === 'ollama') {
                                localModels.forEach(lm => {
                                    const val = `ollama::${lm.modelId}`;
                                    if (!allModels.some(m => m.value === val)) {
                                        allModels.push({ value: val, label: `Local Ollama: ${lm.displayName}` });
                                    }
                                });
                            } else {
                                Object.entries(p.models).forEach(([tier, modelName]) => {
                                    if (modelName) {
                                        const val = `${p.providerId}::${modelName}`;
                                        if (!allModels.some(m => m.value === val)) {
                                            allModels.push({ value: val, label: `${p.displayName}: ${modelName}` });
                                        }
                                    }
                                });
                            }
                        });

                        const currentValue = routing[task.key]?.providerId && routing[task.key]?.modelId 
                            ? `${routing[task.key].providerId}::${routing[task.key].modelId}` 
                            : '';

                        return (
                            <div key={task.key} className="flex flex-col gap-2">
                                <label className="text-[13px] font-medium text-text-primary">{task.label}</label>
                                <UiverseDropdown
                                    options={allModels}
                                    value={currentValue}
                                    onChange={(val) => {
                                        if (!val) {
                                            handleRoutingChange(task.key, { providerId: null, modelId: null });
                                        } else {
                                            const [provId, modId] = val.split('::');
                                            handleRoutingChange(task.key, { providerId: provId, modelId: modId });
                                        }
                                    }}
                                    placeholder="Default (Tier Fallback)"
                                    className="w-full text-[13px]"
                                    matchWidth={true}
                                    hideSearch={true}
                                />
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="bg-background-card border border-border-default/40 rounded-2xl p-6 shadow-sm mt-6">
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
                            type="range" min="0" max="1" step="0.1" value={temperature}
                            onChange={(e) => setTemperature(parseFloat(e.target.value))}
                            onMouseUp={async (e) => {
                                const val = parseFloat(e.target.value);
                                const newRouting = { ...routing, temperature: val };
                                setRouting(newRouting);
                                try {
                                    await axiosInstance.put('/api/v1/ai-settings/routing', newRouting);
                                    showToast('Temperature saved');
                                } catch (e) {
                                    showToast('Failed to save temperature', 'error');
                                }
                            }}
                            className="w-full accent-blue-500 h-1.5 bg-background-surface rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-background-card border border-border-default/40 rounded-2xl p-6 shadow-sm mt-6">
                <div className="flex items-center gap-2 mb-4">
                    <SlidersHorizontal size={18} className="text-orange-500" />
                    <h3 className="text-[15px] font-semibold text-text-primary">Response Verbosity</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-[13px] font-medium text-text-primary mb-2">Header Insight Length</label>
                        <UiverseDropdown
                            options={[
                                { value: 'short', label: 'Short (1-2 sentences)' },
                                { value: 'medium', label: 'Medium (1 paragraph)' },
                                { value: 'detailed', label: 'Detailed (Multi-paragraph)' }
                            ]}
                            value={routing['headerInsight']?.verbosity || 'detailed'}
                            onChange={(val) => handleRoutingChange('headerInsight', { verbosity: val })}
                            placeholder="Select length..."
                            className="w-full text-[13px]"
                            matchWidth={true}
                            hideSearch={true}
                        />
                        <p className="text-[11px] text-text-tertiary mt-2">Controls the length of page-level AI summaries at the top.</p>
                    </div>
                    <div>
                        <label className="block text-[13px] font-medium text-text-primary mb-2">Card Insight Length</label>
                        <UiverseDropdown
                            options={[
                                { value: 'short', label: 'Short (1-2 sentences)' },
                                { value: 'medium', label: 'Medium (1 paragraph)' },
                                { value: 'detailed', label: 'Detailed (Multi-paragraph)' }
                            ]}
                            value={routing['cardInsight']?.verbosity || 'medium'}
                            onChange={(val) => handleRoutingChange('cardInsight', { verbosity: val })}
                            placeholder="Select length..."
                            className="w-full text-[13px]"
                            matchWidth={true}
                            hideSearch={true}
                        />
                        <p className="text-[11px] text-text-tertiary mt-2">Controls the length of analysis inside individual indicator cards.</p>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-background-card border border-border-default rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                        <div className="p-4 border-b border-border-default/50 flex justify-between items-center">
                            <h3 className="font-semibold text-text-primary">{editingProvider ? 'Edit Provider' : 'Add Provider'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-text-tertiary hover:text-text-primary">✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            {!editingProvider && (
                                <div>
                                    <label className="block text-[12px] font-medium text-text-secondary mb-1">Load Template</label>
                                    <UiverseDropdown
                                        options={templates.map(t => ({ value: t.providerId, label: t.displayName }))}
                                        onChange={handleTemplateSelect}
                                        placeholder="-- Select Template --"
                                        className="w-full"
                                        matchWidth={true}
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[12px] font-medium text-text-secondary mb-1">Provider ID</label>
                                    <input 
                                        required value={formData.providerId} 
                                        onChange={e => setFormData({...formData, providerId: e.target.value})}
                                        disabled={!!editingProvider}
                                        className="w-full bg-background-surface border border-border-default/50 rounded-lg px-3 py-2 text-[13px] text-text-primary outline-none disabled:opacity-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[12px] font-medium text-text-secondary mb-1">Display Name</label>
                                    <input 
                                        required value={formData.displayName} 
                                        onChange={e => setFormData({...formData, displayName: e.target.value})}
                                        className="w-full bg-background-surface border border-border-default/50 rounded-lg px-3 py-2 text-[13px] text-text-primary outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[12px] font-medium text-text-secondary mb-1">Base URL</label>
                                    <input 
                                        required value={formData.baseUrl} 
                                        onChange={e => setFormData({...formData, baseUrl: e.target.value})}
                                        className="w-full bg-background-surface border border-border-default/50 rounded-lg px-3 py-2 text-[13px] text-text-primary outline-none font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[12px] font-medium text-text-secondary mb-1">Purpose / Tag (Optional)</label>
                                    <input 
                                        value={formData.purpose} 
                                        onChange={e => setFormData({...formData, purpose: e.target.value})}
                                        placeholder="e.g. Fast Tasks, Personal"
                                        className="w-full bg-background-surface border border-border-default/50 rounded-lg px-3 py-2 text-[13px] text-text-primary outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[12px] font-medium text-text-secondary mb-1">API Key {editingProvider && "(Leave blank to keep existing)"}</label>
                                <input 
                                    type="password" value={formData.apiKey} 
                                    onChange={e => setFormData({...formData, apiKey: e.target.value})}
                                    placeholder={editingProvider ? "••••••••" : "sk-..."}
                                    className="w-full bg-background-surface border border-border-default/50 rounded-lg px-3 py-2 text-[13px] text-text-primary outline-none font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-[12px] font-medium text-text-secondary mb-2">Tier Models (Optional)</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <input placeholder="Tier 1 (e.g. qwen2.5:3b)" value={formData.models.tier1_simple} onChange={e => setFormData({...formData, models: {...formData.models, tier1_simple: e.target.value}})} className="w-full bg-background-surface border border-border-default/50 rounded-lg px-3 py-1.5 text-[12px] text-text-primary outline-none font-mono" />
                                    <input placeholder="Tier 2" value={formData.models.tier2_medium} onChange={e => setFormData({...formData, models: {...formData.models, tier2_medium: e.target.value}})} className="w-full bg-background-surface border border-border-default/50 rounded-lg px-3 py-1.5 text-[12px] text-text-primary outline-none font-mono" />
                                    <input placeholder="Tier 3" value={formData.models.tier3_complex} onChange={e => setFormData({...formData, models: {...formData.models, tier3_complex: e.target.value}})} className="w-full bg-background-surface border border-border-default/50 rounded-lg px-3 py-1.5 text-[12px] text-text-primary outline-none font-mono" />
                                    <input placeholder="Tier 4 (Vision)" value={formData.models.tier4_vision} onChange={e => setFormData({...formData, models: {...formData.models, tier4_vision: e.target.value}})} className="w-full bg-background-surface border border-border-default/50 rounded-lg px-3 py-1.5 text-[12px] text-text-primary outline-none font-mono" />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-border-default/50 mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-[13px] font-medium text-text-secondary hover:bg-background-surface transition-colors">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-[13px] font-medium transition-colors">Save Provider</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        {/* ── Custom Toast Notification Removed (Handled by Sonner) ── */}

        {/* ── Confirm Delete Modal ───────────────────────────────────────────── */}
        {providerToDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-background-elevated border border-border-default shadow-2xl rounded-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="px-5 py-4 border-b border-border-default/40 flex items-center gap-3">
                        <AlertCircle className="text-red-400" size={18} />
                        <h3 className="text-[14px] font-medium text-text-primary">Delete Provider</h3>
                    </div>
                    <div className="p-5">
                        <p className="text-[13px] text-text-secondary">
                            Are you sure you want to delete this provider? This action cannot be undone and may disrupt AI services.
                        </p>
                    </div>
                    <div className="px-5 py-4 border-t border-border-default/40 flex justify-end gap-3 bg-background-surface/30">
                        <button 
                            onClick={() => setProviderToDelete(null)}
                            className="px-4 py-2 text-[12px] font-medium text-text-secondary hover:bg-background-surface rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={confirmDelete}
                            className="px-4 py-2 text-[12px] font-medium bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        )}
        </div>
    );
}
