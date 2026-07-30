import React, { useState, useMemo } from 'react';
import axiosInstance from '@/shared/utils/axiosInstance';
import { Loader2, RefreshCcw, Send, FileText, Globe, AlertCircle, CheckCircle, Zap, Newspaper } from 'lucide-react';
import { getColorMap, detectInstrumentType, getPES7Breakdown, INSTRUMENT_TYPES, SOURCE_COLORS } from '@/shared/global/logic/eventsEngine';

export default function EventsManualForm({ onEventSubmitted }) {
    const [formData, setFormData] = useState({
        headline: '',
        content: '',
        source: ''
    });

    const [loading, setLoading] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [previewMeta, setPreviewMeta] = useState(null);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSourceDropdownOpen, setIsSourceDropdownOpen] = useState(false);

    // Auto-detect instrument type as user types (debounced via useMemo)
    const autoDetectedType = useMemo(() => {
        if (!formData.headline && !formData.content) return null;
        return detectInstrumentType(formData.headline, formData.content, formData.source);
    }, [formData.headline, formData.content, formData.source]);

    const handlePreview = async () => {
        if (!formData.headline.trim() || !formData.content.trim() || !formData.source.trim()) {
            setError("Headline, Content, and Source are required.");
            return;
        }

        setError(null);
        setLoading(true);
        setPreviewData(null);

        try {
            const res = await axiosInstance.post('/api/v1/events/preview', {
                headline: formData.headline,
                summary: formData.content,
                source: formData.source
            });

            if (res.data.success) {
                setPreviewData(res.data.data);
                setPreviewMeta(res.data.meta || null);
            } else {
                setError(res.data.message || "Failed to parse event.");
            }
        } catch (err) {
            console.error(err);
            setError("Error communicating with AI Gateway.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!previewData) return;

        setIsSubmitting(true);
        try {
            const res = await axiosInstance.post('/api/v1/events/confirm', previewData);
            if (res.data.success) {
                // Reset form
                setFormData({ headline: '', content: '', source: '' });
                setPreviewData(null);
                if (onEventSubmitted) onEventSubmitted();
            } else {
                setError("Failed to save event.");
            }
        } catch (err) {
            console.error(err);
            setError("Error saving event.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full h-full flex flex-col md:flex-row gap-4 p-4 lg:p-6 overflow-y-auto">
            {/* LEFT SIDE: Inputs */}
            <div className="flex-1 flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-border-default pb-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-bold text-text-primary uppercase tracking-wider">Manual Event Entry</span>
                    {autoDetectedType && (
                        <div className="ml-auto flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-bold uppercase tracking-widest"
                            style={{ color: INSTRUMENT_TYPES[autoDetectedType]?.color || '#94A3B8', borderColor: `${INSTRUMENT_TYPES[autoDetectedType]?.color || '#94A3B8'}30`, backgroundColor: `${INSTRUMENT_TYPES[autoDetectedType]?.color || '#94A3B8'}10` }}>
                            <Zap className="w-2.5 h-2.5" />
                            Auto: {INSTRUMENT_TYPES[autoDetectedType]?.label}
                        </div>
                    )}
                </div>

                {error && (
                    <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </div>
                )}

                <div className="space-y-3">
                    <div>
                        <label className="text-xs font-bold text-text-secondary uppercase mb-1 block">Headline *</label>
                        <input
                            type="text"
                            value={formData.headline}
                            onChange={e => setFormData({ ...formData, headline: e.target.value })}
                            className="w-full bg-background-surface border border-border-subtle rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-blue-500 transition-colors"
                            placeholder="Enter event headline..."
                        />
                    </div>
                    
                    <div>
                        <label className="text-xs font-bold text-text-secondary uppercase mb-1 block flex justify-between">
                            <span>Content / Summary *</span>
                            <span className="text-text-tertiary">{formData.content.length}/5000</span>
                        </label>
                        <textarea
                            value={formData.content}
                            onChange={e => setFormData({ ...formData, content: e.target.value.substring(0, 5000) })}
                            className="w-full h-32 bg-background-surface border border-border-subtle rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-blue-500 transition-colors resize-none custom-scrollbar-thin"
                            placeholder="Paste the full content or summary of the event..."
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-text-secondary uppercase mb-1 block">Source *</label>
                        <div className="relative">
                            <div 
                                className={`w-full bg-background-surface border ${isSourceDropdownOpen ? 'border-blue-500' : 'border-border-subtle'} rounded-md pl-9 pr-3 py-2 text-sm text-text-primary transition-colors cursor-pointer flex items-center justify-between`}
                                onClick={() => setIsSourceDropdownOpen(!isSourceDropdownOpen)}
                            >
                                <div className="flex items-center h-5">
                                    <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                                    <span className={formData.source ? "text-text-primary" : "text-text-tertiary"}>
                                        {formData.source || "Select a source..."}
                                    </span>
                                </div>
                                <svg className={`w-4 h-4 text-text-tertiary transition-transform ${isSourceDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                            </div>

                            {isSourceDropdownOpen && (
                                <>
                                    <div 
                                        className="fixed inset-0 z-40" 
                                        onClick={() => setIsSourceDropdownOpen(false)}
                                    />
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-background-card border border-border-subtle rounded-md shadow-2xl z-50 overflow-hidden max-h-48 overflow-y-auto custom-scrollbar-thin">
                                        {Object.keys(SOURCE_COLORS).filter(k => k !== "Default").map(source => (
                                            <div
                                                key={source}
                                                className="px-3 py-2.5 text-sm text-text-secondary hover:bg-background-surface hover:text-text-primary cursor-pointer transition-colors flex items-center gap-3"
                                                onClick={() => {
                                                    setFormData({ ...formData, source });
                                                    setIsSourceDropdownOpen(false);
                                                }}
                                            >
                                                <Newspaper className="w-3.5 h-3.5 shrink-0" style={{ color: SOURCE_COLORS[source] }} />
                                                {source}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE: Preview & Actions */}
            <div className="flex-1 flex flex-col gap-4">
                <div className="flex-1 bg-background-surface border border-border-subtle rounded-xl p-4 flex flex-col relative overflow-hidden">
                    <div className="text-xs font-bold text-text-secondary uppercase mb-3 flex items-center justify-between">
                        <span>Event Preview</span>
                        <div className="flex items-center gap-2">
                            {previewMeta?.instrumentType && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border" style={{ color: INSTRUMENT_TYPES[previewMeta.instrumentType]?.color || '#94A3B8', borderColor: `${INSTRUMENT_TYPES[previewMeta.instrumentType]?.color}30`, backgroundColor: `${INSTRUMENT_TYPES[previewMeta.instrumentType]?.color}10` }}>
                                    {INSTRUMENT_TYPES[previewMeta.instrumentType]?.label}
                                </span>
                            )}
                            {previewData && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                        </div>
                    </div>

                    {!previewData && !loading && (
                        <div className="flex-1 flex flex-col items-center justify-center text-text-tertiary">
                            <div className="mb-2">✨</div>
                            <div className="text-sm">Preview will appear here</div>
                            <div className="text-[10px] mt-1 text-center max-w-[200px]">Submit the event to see AI analysis, sentiment, impact, and more.</div>
                        </div>
                    )}

                    {loading && (
                        <div className="flex-1 flex flex-col items-center justify-center text-blue-500">
                            <Loader2 className="w-6 h-6 animate-spin mb-2" />
                            <div className="text-xs font-bold uppercase tracking-widest animate-pulse">Analyzing...</div>
                        </div>
                    )}

                    {previewData && (
                        <div className="flex-1 overflow-y-auto custom-scrollbar-thin space-y-4">
                            <EventPreviewCard event={previewData} />
                            
                            {/* PES-7 Score Breakdown */}
                            {(() => {
                                const bd = getPES7Breakdown(previewData.sentiment, previewData.importance, previewData.severity, previewData.confidence);
                                return (
                                    <div className="bg-background-app rounded border border-border-default p-3">
                                        <div className="text-[10px] font-bold text-text-secondary uppercase mb-2 border-b border-border-default pb-1 flex items-center gap-1.5">
                                            <Zap className="w-3 h-3 text-blue-400" />
                                            PES-7 Score Formula
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                                            <span className="text-text-tertiary">Sentiment Weight</span>
                                            <span className="text-text-primary font-mono text-right">{bd.sentimentWeight > 0 ? '+' : ''}{bd.sentimentWeight}</span>
                                            <span className="text-text-tertiary">Importance ×</span>
                                            <span className="text-text-primary font-mono text-right">{bd.importanceMultiplier}</span>
                                            <span className="text-text-tertiary">Severity ×</span>
                                            <span className="text-text-primary font-mono text-right">{bd.severityMultiplier}</span>
                                            <span className="text-text-tertiary">Confidence ×</span>
                                            <span className="text-text-primary font-mono text-right">{(bd.confidenceFactor * 100).toFixed(0)}%</span>
                                        </div>
                                        <div className="mt-2 pt-2 border-t border-border-default flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-text-secondary uppercase">Computed Score</span>
                                            <span className="text-sm font-mono font-bold" style={{ color: bd.finalScore > 0 ? '#22C55E' : bd.finalScore < 0 ? '#F97316' : '#94A3B8' }}>
                                                {bd.finalScore > 0 ? '+' : ''}{bd.finalScore}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })()}

                            <div className="bg-background-app rounded border border-border-default p-3">
                                <div className="text-[10px] font-bold text-text-secondary uppercase mb-1 border-b border-border-default pb-1">AI Reasoning</div>
                                <div className="text-xs text-text-primary leading-relaxed">{previewData.reasoning}</div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handlePreview}
                        disabled={loading || isSubmitting}
                        className="flex-1 bg-background-surface hover:bg-background-hover border border-border-subtle text-text-primary px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                        {previewData ? "Re-Analyze" : "Preview"}
                    </button>
                    
                    <button
                        onClick={handleSubmit}
                        disabled={!previewData || isSubmitting}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors disabled:opacity-50 disabled:bg-slate-700 flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Submit Event
                    </button>
                </div>
            </div>
        </div>
    );
}

function EventPreviewCard({ event }) {
    const colors = getColorMap(event);

    return (
        <div className="w-full bg-background-card border border-border-default rounded-lg relative overflow-hidden">
            {/* Left Accent Bar */}
            <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: colors.scoreHex }} />
            
            <div className="p-4 pl-5">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col gap-1.5 flex-1 pr-4">
                        <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest">
                            <span style={{ color: colors.sourceHex }}>{event.source}</span>
                            <span className="text-text-tertiary">•</span>
                            <span style={{ color: colors.categoryHex }}>{event.category}</span>
                        </div>
                        <h3 className="text-[15px] font-bold text-text-primary leading-snug">
                            {event.headline}
                        </h3>
                    </div>
                    
                    <div className="flex flex-col items-end shrink-0 pt-0.5">
                        <div className="text-[10px] text-text-primary font-bold uppercase tracking-widest mb-1">Event Score</div>
                        <div className="text-xl font-mono font-bold" style={{ color: colors.scoreHex }}>
                            {event.event_score > 0 ? '+' : ''}{event.event_score}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-x-6 gap-y-3 mt-4">
                    <Badge label={event.sentiment} color={colors.sentiment} prefix="Sentiment" />
                    <Badge label={event.severity} color={colors.severity} prefix="Severity" />
                    <Badge label={event.importance} color={colors.importance} prefix="Importance" />
                    <Badge label={event.horizon} color={colors.horizon} prefix="Horizon" />
                    {event.override_mode && event.override_mode !== 'None' && (
                        <Badge label={event.override_mode} color={colors.override} prefix="Override" />
                    )}
                </div>

                {Array.isArray(event.affected_assets) && event.affected_assets.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-border-default">
                        <div className="text-[10px] uppercase font-bold text-text-primary tracking-widest mb-2">Affected Assets</div>
                        <div className="flex flex-wrap gap-2">
                            {event.affected_assets.map(a => (
                                <span key={a} className="text-[10px] px-2 py-0.5 rounded bg-[#1E3A8A]/30 text-blue-400 border border-[#1E3A8A] font-medium tracking-wide">
                                    {a}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {Array.isArray(event.key_data_points) && event.key_data_points.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border-default">
                        <div className="text-[10px] uppercase font-bold text-text-primary tracking-widest mb-2">Key Data Points</div>
                        <div className="flex flex-wrap gap-2">
                            {event.key_data_points.map((pt, i) => (
                                <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                                    {pt}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function Badge({ label, color, prefix }) {
    if (!label) return null;
    return (
        <div className="flex flex-col gap-1">
            <span className="text-[9px] uppercase font-bold text-text-secondary tracking-widest">{prefix}</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded border inline-block w-fit" style={{ color: color, borderColor: `${color}30`, backgroundColor: `${color}10` }}>
                {label}
            </span>
        </div>
    );
}
