import React, { useState, useEffect } from "react";
import { X, Check, Loader2, ChevronDown, ChevronUp, Shield, Terminal } from "lucide-react";
import axiosInstance from "@/shared/utils/axiosInstance";
import { API_PATHS } from "@/shared/utils/apiPaths";
import { toast } from "sonner";

const PROVIDERS = [
    { value: "FMP", label: "Financial Modeling Prep" },
    { value: "TWELVEDATA", label: "Twelve Data" },
    { value: "UPSTOX", label: "Upstox (Official)" },
    { value: "ALPHAVANTAGE", label: "Alpha Vantage" },
    { value: "POLYGON", label: "Polygon.io" },
    { value: "FRED", label: "Federal Reserve (FRED)" },
    { value: "NEWSAPI", label: "NewsAPI.org" }
];

const AddCredentialModal = ({ isOpen, onClose, onSuccess, initialProvider }) => {
    if (!isOpen) return null;

    const [formData, setFormData] = useState({
        provider: initialProvider || "FMP",
        label: "",
        key: "",
        secret: "",
        extra: ""
    });
    const [submitting, setSubmitting] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Reset form when modal opens with new initialProvider
    useEffect(() => {
        if (isOpen) {
            setFormData(prev => ({
                ...prev,
                provider: initialProvider || prev.provider
            }));
        }
    }, [isOpen, initialProvider]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            let extraJson = null;
            if (formData.extra) {
                try {
                    extraJson = JSON.parse(formData.extra);
                } catch (e) {
                    toast.error("Invalid JSON in Extra Config");
                    setSubmitting(false);
                    return;
                }
            }

            await axiosInstance.post(API_PATHS.ADMIN.CREDENTIALS, {
                provider: formData.provider,
                label: formData.label || PROVIDERS.find(p => p.value === formData.provider)?.label,
                key: formData.key,
                secret: formData.secret,
                extra: extraJson
            });

            toast.success("Credential saved successfully");
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            toast.error("Failed to save credential");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#0F1218]/95 border border-gray-200 dark:border-white/10 rounded-2xl w-full max-w-lg shadow-2xl ring-1 ring-black/5 dark:ring-white/5 overflow-hidden transform transition-all scale-100">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                            Add Connection
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure a new data provider.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Provider Display (Read-Only) */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-400 uppercase tracking-wider">Provider</label>
                        <div className="w-full p-3 rounded-xl bg-gray-50 dark:bg-[#1A1D24] border border-gray-300 dark:border-white/10 text-gray-600 dark:text-gray-300 font-medium flex items-center gap-2 cursor-not-allowed opacity-80">
                            <span className="text-accent-primary">●</span>
                            {PROVIDERS.find(p => p.value === formData.provider)?.label || formData.provider}
                        </div>
                    </div>

                    {/* API Key */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            API Key <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative group">
                            <input
                                type="password"
                                required
                                className="w-full p-3 pl-10 rounded-xl bg-gray-50 dark:bg-[#1A1D24] border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:border-accent-primary focus:ring-1 focus:ring-accent-primary outline-none transition-all font-mono text-sm hover:border-gray-400 dark:hover:border-white/20"
                                placeholder="sk_live_..."
                                value={formData.key}
                                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                            />
                            <div className="absolute left-3 top-3.5 text-gray-600 group-focus-within:text-accent-primary transition-colors">
                                <Shield size={16} />
                            </div>
                        </div>
                    </div>

                    {/* Display Label */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-400 uppercase tracking-wider">Label (Optional)</label>
                        <input
                            type="text"
                            className="w-full p-3 rounded-xl bg-gray-50 dark:bg-[#1A1D24] border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:border-accent-primary focus:ring-1 focus:ring-accent-primary outline-none transition-all text-sm hover:border-gray-400 dark:hover:border-white/20"
                            placeholder="e.g. Production Key"
                            value={formData.label}
                            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                        />
                    </div>

                    {/* Advanced Settings Toggle */}
                    <div>
                        <button
                            type="button"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="flex items-center gap-2 text-xs font-semibold text-accent-primary hover:text-accent-primary/80 transition-colors uppercase tracking-wider"
                        >
                            {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            Advanced Settings
                        </button>

                        <div className={`space-y-4 overflow-hidden transition-all duration-300 ease-in-out ${showAdvanced ? "max-h-96 mt-4 opacity-100" : "max-h-0 opacity-0"}`}>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-400 uppercase tracking-wider">Secret Key</label>
                                <input
                                    type="password"
                                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-[#1A1D24] border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:border-accent-primary focus:ring-1 focus:ring-accent-primary outline-none transition-all font-mono text-sm"
                                    placeholder="If required..."
                                    value={formData.secret}
                                    onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                    Extra Config <Terminal size={12} />
                                </label>
                                <textarea
                                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-[#1A1D24] border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:border-accent-primary focus:ring-1 focus:ring-accent-primary outline-none transition-all font-mono text-xs h-20 resize-none"
                                    placeholder='{"env": "sandbox"}'
                                    value={formData.extra}
                                    onChange={(e) => setFormData({ ...formData, extra: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-white/5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-6 py-2.5 rounded-xl bg-accent-primary hover:bg-accent-primary/90 text-white text-sm font-semibold shadow-lg shadow-accent-primary/20 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
                        >
                            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                            Save Connection
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddCredentialModal;
