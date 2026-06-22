/**
 * @file TradingNotesModal.jsx
 * @purpose Comprehensive journaling interface for traders.
 * @responsibilities
 * - Performance Map: Heatmap visualization of PnL and consistency.
 * - Session Journal: Rich text recording of daily insights and behavioral notes.
 * - Manages read-only historical view vs editable current-day view.
 * @key_exports
 * - TradingNotesModal (Default Component)
 * @dependencies
 * - dayjs (Date Logic)
 * - framer-motion (Animations)
 * - lucide-react (Icons)
 * - react-hot-toast (Notifications)
 * @lifecycle
 * - Rendered by JournalPage (Modal).
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React, { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Calendar, Edit3, Save, TrendingUp, TrendingDown, Minus, Info, Palette, Signal, RotateCcw } from "lucide-react";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "react-hot-toast";
import axiosInstance from "@/shared/utils/axiosInstance";
import { API_PATHS } from "@/shared/utils/apiPaths";

dayjs.extend(isBetween);

// =============================
// Helper Components
// =============================

function LegendItem({ label, color, symbol, border = "" }) {
    return (
        <div className="flex items-center gap-2.5">
            <div className={`w-3 h-3 rounded-md ${color} ${border} flex items-center justify-center text-[8px] font-black ${symbol ? 'text-text-secondary' : 'text-white'} shadow-sm border`}>
                {symbol}
            </div>
            <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">{label}</span>
        </div>
    );
}

function MetricBox({ label, value, color = "text-text-primary", sub }) {
    return (
        <div className="p-4 bg-background-elevated border border-border-subtle rounded-xl flex flex-col justify-center transition-colors">
            <div className="text-[8px] font-bold text-text-secondary uppercase tracking-widest mb-1">{label}</div>
            <div className={`text-sm font-mono font-black ${color}`}>{value}</div>
            {sub && <div className="text-[8px] text-text-secondary font-bold uppercase mt-1 opacity-60">{sub}</div>}
        </div>
    );
}

// =============================
// Main Component
// =============================

export default function TradingNotesModal({ trades, notes, onClose, onNotesUpdate }) {
    const today = dayjs().format("YYYY-MM-DD");
    const [selectedDate, setSelectedDate] = useState(today);
    const [viewYear, setViewYear] = useState(dayjs().year());
    const [localNotes, setLocalNotes] = useState(notes || {});
    const [isEditingToday, setIsEditingToday] = useState(true);
    const editorRef = useRef(null);
    const [hoveredDate, setHoveredDate] = useState(null);

    // --- State Initialization ---
    useEffect(() => {
        if (editorRef.current && selectedDate === today && isEditingToday) {
            editorRef.current.innerHTML = localNotes[selectedDate] || "";
        }
    }, [isEditingToday, selectedDate, today, localNotes]);

    // --- Helper Logic ---
    const dailyStats = useMemo(() => {
        const stats = {};
        trades.forEach(trade => {
            const date = dayjs(trade.date).format("YYYY-MM-DD");
            if (!stats[date]) {
                stats[date] = { pnl: 0, count: 0, win: 0, loss: 0, rMult: 0 };
            }
            stats[date].pnl += trade.pnl;
            stats[date].count += 1;
            stats[date].rMult += trade.rMultiple;
            if (trade.outcome === 'Win') stats[date].win += 1;
            else stats[date].loss += 1;
        });
        return stats;
    }, [trades]);

    const handleDateSelect = (dateStr) => {
        if (dayjs(dateStr).isAfter(dayjs(), 'day')) return;
        setSelectedDate(dateStr);
    };

    const applyColor = (color) => {
        document.execCommand('foreColor', false, color);
    };

    const handleSaveNote = async () => {
        try {
            const content = editorRef.current.innerHTML;
            if (!content || content === "<br>") {
                toast.error("Commit failed: No data detected.");
                return;
            }

            // Optimistic UI Update
            const updatedNotes = { ...localNotes, [selectedDate]: content };
            setLocalNotes(updatedNotes);
            if (onNotesUpdate) onNotesUpdate(updatedNotes); // Update parent state

            // API Call
            await axiosInstance.post(API_PATHS.JOURNAL.SAVE_NOTE, {
                date: selectedDate,
                content: content
            });

            setIsEditingToday(false);

            toast.success("Session entry committed and sealed.", {
                style: {
                    background: '#0a0f18',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.1)',
                    fontSize: '11px',
                    fontWeight: 'bold',
                }
            });
        } catch (error) {
            toast.error("System failure: Could not sync record.");
        }
    };

    // --- Calendar Rendering ---
    const renderMiniMonth = (monthIndex) => {
        const firstDayOfMonth = dayjs().year(viewYear).month(monthIndex).startOf('month');
        const daysInMonth = firstDayOfMonth.daysInMonth();
        const startDay = (firstDayOfMonth.day() + 6) % 7;

        const days = [];
        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`pad-${monthIndex}-${i}`} className="w-4 h-4 sm:w-5 sm:h-5" />);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const date = firstDayOfMonth.date(d);
            const dateStr = date.format("YYYY-MM-DD");
            const data = dailyStats[dateStr];
            const isFuture = date.isAfter(dayjs(), 'day');
            const isSelected = selectedDate === dateStr;
            const isTodayDate = today === dateStr;

            let bgColor = "bg-background-elevated";
            let textColor = "text-text-secondary";
            let content = d;
            let opacity = "opacity-100";

            if (data) {
                if (data.pnl > 0) {
                    bgColor = "bg-emerald-500/80";
                    textColor = "text-white";
                } else if (data.pnl < 0) {
                    bgColor = "bg-red-500/80";
                    textColor = "text-white";
                }
            } else if (date.isBefore(dayjs(), 'day')) {
                content = "×";
                textColor = "text-text-secondary";
                opacity = "opacity-80";
            }

            if (isFuture) {
                bgColor = "bg-background-elevated/40";
                textColor = "text-text-tertiary";
                opacity = "opacity-30";
            }

            days.push(
                <div
                    key={dateStr}
                    className="relative"
                    onMouseEnter={() => setHoveredDate(dateStr)}
                    onMouseLeave={() => setHoveredDate(null)}
                >
                    <button
                        onClick={() => handleDateSelect(dateStr)}
                        disabled={isFuture}
                        className={`w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-[7px] sm:text-[9px] font-black rounded-sm transition-all shadow-sm
                            ${bgColor} ${textColor} ${opacity}
                            ${isSelected ? 'ring-2 ring-accent-primary ring-offset-2 ring-offset-background-card z-20 scale-125 shadow-xl !opacity-100' : ''}
                            ${isTodayDate && !isSelected ? 'ring-2 ring-accent-primary/50 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : ''}
                            ${!isFuture ? 'hover:scale-125 hover:z-30 cursor-pointer active:scale-95 hover:!opacity-100' : 'cursor-default'}
                        `}
                    >
                        {content}
                    </button>

                    <AnimatePresence>
                        {hoveredDate === dateStr && data && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[101] pointer-events-none"
                            >
                                <div className="bg-background-tooltip border border-border-default px-4 py-2.5 rounded-xl shadow-[0_15px_35px_rgba(0,0,0,0.35)] min-w-[120px]">
                                    <div className="text-[10px] font-black text-accent-primary mb-1.5 uppercase tracking-[0.2em] border-b border-border-subtle pb-1.5">{date.format("D MMMM")}</div>
                                    <div className="space-y-1.5">
                                        <div className={`text-sm font-black tracking-tight ${data.pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                            {data.pnl >= 0 ? '+' : ''}₹{data.pnl.toLocaleString()}
                                        </div>
                                        <div className="text-[10px] text-text-secondary font-black uppercase tracking-widest">
                                            {data.win}W / {data.loss}L • {data.rMult.toFixed(1)}R
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            );
        }

        return (
            <div className="flex flex-col gap-4">
                <span className="text-[7px] sm:text-[9px] font-black text-text-primary uppercase tracking-[0.2em] text-center border-b border-border-subtle/30 pb-1">{firstDayOfMonth.format("MMMM")}</span>
                <div className="grid grid-cols-7 gap-[2px] sm:gap-[4px]">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, index) => (
                        <div key={`${d}-${index}`} className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-[6px] sm:text-[7px] font-black text-text-secondary tracking-tighter">{d}</div>
                    ))}
                    {days}
                </div>
            </div>
        );
    };

    const selectedData = dailyStats[selectedDate];
    const selectedTrades = trades.filter(t => dayjs(t.date).format("YYYY-MM-DD") === selectedDate);
    const isPastDate = dayjs(selectedDate).isBefore(dayjs(), 'day');
    const isTodaySelected = selectedDate === today;
    const showEditor = isTodaySelected && isEditingToday;

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <Toaster position="top-right" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-background-tooltip border border-border-default rounded-2xl w-full max-w-[1700px] h-[90vh] lg:h-[95vh] flex flex-col lg:flex-row overflow-hidden shadow-2xl m-2 lg:m-0"
            >
                {/* LEFT: CALENDAR WORKSPACE */}
                <div className="w-full h-[50vh] lg:h-full lg:flex-1 bg-background-subtle p-3 md:p-6 lg:p-8 flex flex-col overflow-y-auto no-scrollbar order-2 lg:order-1 border-t lg:border-t-0 lg:border-r border-border-subtle shrink-0">
                    <div className="flex items-center justify-between mb-4 lg:mb-6 shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="bg-accent-primary/10 p-2.5 rounded-lg border border-accent-primary/20 shadow-sm">
                                <Calendar size={18} className="text-accent-primary" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-text-primary tracking-tight uppercase">Performance Map</h2>
                                <p className="text-[9px] text-text-secondary font-black tracking-[0.3em] uppercase opacity-80">{viewYear} Annual Discipline Matrix</p>
                            </div>
                        </div>

                        <div className="hidden md:flex items-center gap-6 bg-background-elevated px-6 py-3 rounded-2xl border border-border-default shadow-lg">
                            <LegendItem label="Profit" color="bg-emerald-600" />
                            <LegendItem label="Risk" color="bg-red-600" />
                            <LegendItem label="Idle" color="bg-background-card" symbol="×" border="border-border-default" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 min-[340px]:grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-4 md:gap-x-8 md:gap-y-6 lg:gap-x-10 lg:gap-y-6 items-start justify-center max-w-5xl mx-auto pb-4">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="flex justify-center w-full">
                                {renderMiniMonth(i)}
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT: TERMINAL PANEL */}
                <div className="w-full h-[40vh] lg:h-full lg:w-[460px] bg-background-card flex flex-col order-1 lg:order-2 border-b lg:border-b-0 border-border-subtle shrink-0 lg:shrink-1 overflow-y-auto no-scrollbar">
                    <div className="px-6 py-4 lg:py-6 border-b border-border-subtle flex items-center justify-between bg-background-surface/50">
                        <div>
                            <div className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest leading-none mb-1">{dayjs(selectedDate).format("dddd")}</div>
                            <div className="text-sm font-black text-text-primary tracking-tight leading-none">{dayjs(selectedDate).format("DD MMM, YYYY")}</div>
                        </div>
                        <button onClick={onClose} className="p-1.5 rounded-lg bg-background-elevated text-text-tertiary hover:text-red-400 transition-all border border-border-default active:scale-95 shadow-sm">
                            <X size={14} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6 lg:space-y-10 no-scrollbar">
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <MetricBox label="Net P&L" value={`₹${(selectedData?.pnl || 0).toLocaleString()}`} color={selectedData?.pnl >= 0 ? "text-emerald-600" : "text-red-600"} />
                            <MetricBox label="Edge Score" value={`${(selectedData?.rMult || 0).toFixed(1)}R`} color="text-accent-primary" />
                            <MetricBox label="Efficiency" value={selectedData ? (selectedData.win >= selectedData.loss ? "Optimal" : "Subpar") : "-"} color={selectedData && selectedData.win >= selectedData.loss ? "text-emerald-600" : "text-amber-600"} />
                            <MetricBox label="Win Rate" value={`${selectedData ? Math.round((selectedData.win / selectedData.count) * 100) : 0}%`} sub={`${selectedData?.win || 0}W / ${selectedData?.loss || 0}L`} />
                        </div>

                        {/* Recent History */}
                        <section>
                            <div className="flex items-center justify-between mb-5 border-b border-border-subtle pb-2">
                                <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                                    <Signal size={12} className="text-text-secondary opacity-60" /> Execution
                                </div>
                                <span className="text-[9px] font-mono text-text-secondary opacity-50 uppercase">Real-time</span>
                            </div>

                            <div className="space-y-2">
                                {selectedTrades.length > 0 ? selectedTrades.map(trade => (
                                    <div key={trade.id} className="p-3.5 rounded-lg bg-background-elevated border border-border-subtle flex items-center justify-between group transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-text-primary">{trade.instrument}</span>
                                                <span className="text-[9px] text-text-secondary font-mono uppercase opacity-90">{trade.strategy}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-xs font-mono font-bold ${trade.pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                {trade.pnl >= 0 ? '+' : ''}{trade.pnl}
                                            </div>
                                            <div className="text-[10px] text-text-secondary font-mono opacity-80">{trade.rMultiple}R</div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="py-12 border border-dashed border-border-subtle rounded-xl text-center flex flex-col items-center justify-center gap-2 bg-background-elevated/20">
                                        <Minus size={18} className="text-text-secondary opacity-40" />
                                        <p className="text-[10px] text-text-secondary uppercase font-bold tracking-[0.2em] opacity-80">Terminal Idle</p>
                                        <p className="text-[8px] text-text-secondary font-medium px-10 leading-relaxed uppercase tracking-widest opacity-60">No market exposure identified during this terminal session.</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Analysis Section */}
                        <section className="flex flex-col gap-4">
                            <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                                <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                                    <Edit3 size={12} className="text-text-secondary opacity-60" /> Commentary
                                </div>
                                {showEditor && (
                                    <div className="flex items-center gap-2">
                                        <button onMouseDown={(e) => { e.preventDefault(); applyColor('var(--text-text-secondary)'); }} className="w-5 h-5 rounded-md bg-background-elevated text-text-tertiary flex items-center justify-center hover:bg-background-subtle border border-border-subtle shadow-sm" title="Back to Default Pen">
                                            <RotateCcw size={10} />
                                        </button>
                                        <button onMouseDown={(e) => { e.preventDefault(); applyColor('#dc2626'); }} className="w-5 h-5 rounded-md bg-red-500/10 text-red-600 flex items-center justify-center hover:bg-red-500/20 border border-red-500/20 shadow-sm" title="Negative Note">
                                            <Palette size={10} />
                                        </button>
                                        <button onMouseDown={(e) => { e.preventDefault(); applyColor('#059669'); }} className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center hover:bg-emerald-500/20 border border-emerald-500/20 shadow-sm" title="Positive Note">
                                            <Palette size={10} />
                                        </button>
                                    </div>
                                )}
                                {!showEditor && isTodaySelected && (
                                    <button
                                        onClick={() => setIsEditingToday(true)}
                                        className="px-2 py-0.5 rounded-md bg-accent-primary/10 border border-accent-primary/20 text-[8px] font-black text-accent-primary uppercase tracking-[0.2em] hover:bg-accent-primary/20 transition-all active:scale-95 shadow-sm"
                                    >
                                        Edit Entry
                                    </button>
                                )}
                                {isPastDate && (
                                    <div className="px-2 py-0.5 rounded-md bg-background-elevated text-[8px] font-black text-text-tertiary uppercase tracking-tight border border-border-subtle opacity-60">Immutable Archive</div>
                                )}
                            </div>

                            <div className="relative group">
                                <style>{`
                                    [contenteditable]:empty:before {
                                        content: attr(placeholder);
                                        pointer-events: none;
                                        color: var(--text-tertiary);
                                        opacity: 0.4;
                                        font-style: italic;
                                    }
                                `}</style>

                                {showEditor ? (
                                    <div
                                        ref={editorRef}
                                        contentEditable={true}
                                        placeholder="Enter session analysis..."
                                        className="w-full min-h-[180px] p-5 bg-background-elevated/40 border border-border-default rounded-xl text-[11px] leading-relaxed text-text-primary focus:outline-none transition-all hover:bg-background-elevated/60 outline-none"
                                    />
                                ) : (
                                    <div
                                        className={`w-full min-h-[180px] p-5 bg-background-elevated/20 border border-border-subtle rounded-xl text-[11px] leading-relaxed text-text-secondary transition-all ${isPastDate ? 'opacity-60' : 'opacity-90'}`}
                                        dangerouslySetInnerHTML={{ __html: localNotes[selectedDate] || (isPastDate ? "No entry recorded for this session." : "Waiting for commitment...") }}
                                    />
                                )}

                                {showEditor && (
                                    <div className="flex justify-end mt-4">
                                        <button
                                            onClick={handleSaveNote}
                                            className="px-5 py-2 bg-[#1E1BFF] hover:bg-[#1E1BFF]/90 text-[10px] font-black text-white uppercase tracking-[0.2em] rounded-lg transition-all shadow-lg active:scale-95 flex items-center gap-2.5"
                                        >
                                            <Save size={12} /> Commit Record
                                        </button>
                                    </div>
                                )}
                            </div>

                            {!showEditor && (
                                <div className="flex gap-2 p-3.5 bg-background-elevated/50 border border-border-subtle rounded-xl shadow-sm italic">
                                    <Info size={12} className="text-accent-primary shrink-0" />
                                    <p className="text-[10px] text-text-tertiary leading-normal">
                                        {isPastDate ? "Historical performance is locked to prevent bias." : "Session entry confirmed. Use the 'Edit' toggle above for modifications."}
                                    </p>
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </motion.div>
        </div>,
        document.body
    );
}
