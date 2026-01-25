import React, { useState, useMemo, useRef, useEffect } from "react";
import { X, Calendar, Edit3, Save, Clock, TrendingUp, TrendingDown, Minus, Info, Lock, Palette, Signal, RotateCcw } from "lucide-react";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "react-hot-toast";

dayjs.extend(isBetween);

export default function TradingNotesModal({ trades, notes, onClose }) {
    const today = dayjs().format("YYYY-MM-DD");
    const [selectedDate, setSelectedDate] = useState(today);
    const [viewYear, setViewYear] = useState(dayjs().year());
    const [localNotes, setLocalNotes] = useState(notes || {});
    const [isEditingToday, setIsEditingToday] = useState(true);
    const editorRef = useRef(null);
    const [hoveredDate, setHoveredDate] = useState(null);

    // Sync editor content only when entering Edit mode for Today
    useEffect(() => {
        if (editorRef.current && selectedDate === today && isEditingToday) {
            editorRef.current.innerHTML = localNotes[selectedDate] || "";
        }
    }, [isEditingToday, selectedDate, today, localNotes]);

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

    const handleSaveNote = () => {
        try {
            const content = editorRef.current.innerHTML;
            if (!content || content === "<br>") {
                toast.error("Commit failed: No data detected.");
                return;
            }

            setLocalNotes(prev => ({ ...prev, [selectedDate]: content }));
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

    const renderMiniMonth = (monthIndex) => {
        const firstDayOfMonth = dayjs().year(viewYear).month(monthIndex).startOf('month');
        const daysInMonth = firstDayOfMonth.daysInMonth();
        const startDay = (firstDayOfMonth.day() + 6) % 7;

        const days = [];
        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`pad-${monthIndex}-${i}`} className="w-5 h-5" />);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const date = firstDayOfMonth.date(d);
            const dateStr = date.format("YYYY-MM-DD");
            const data = dailyStats[dateStr];
            const isFuture = date.isAfter(dayjs(), 'day');
            const isSelected = selectedDate === dateStr;
            const isTodayDate = today === dateStr;

            let bgColor = "bg-slate-900/30";
            let textColor = "text-slate-600";
            let content = d;

            if (data) {
                if (data.pnl > 0) {
                    bgColor = "bg-emerald-500/70";
                    textColor = "text-emerald-950";
                } else if (data.pnl < 0) {
                    bgColor = "bg-red-500/70";
                    textColor = "text-white";
                }
            } else if (date.isBefore(dayjs(), 'day')) {
                content = "×";
                textColor = "text-slate-700";
            }

            if (isFuture) {
                bgColor = "bg-slate-950/10";
                textColor = "text-slate-800";
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
                        className={`w-5 h-5 flex items-center justify-center text-[8px] font-bold rounded-sm transition-all
                            ${bgColor} ${textColor}
                            ${isSelected ? 'ring-1 ring-blue-500 ring-offset-1 ring-offset-[#0b1220] z-20 scale-110 shadow-lg' : ''}
                            ${isTodayDate && !isSelected ? 'ring-1 ring-white/20' : ''}
                            ${!isFuture ? 'hover:scale-125 hover:z-30 cursor-pointer active:scale-95' : 'cursor-default'}
                        `}
                    >
                        {content}
                    </button>

                    <AnimatePresence>
                        {hoveredDate === dateStr && data && (
                            <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[100] pointer-events-none"
                            >
                                <div className="bg-[#121826] border border-white/10 px-2 py-1.5 rounded shadow-2xl backdrop-blur-md">
                                    <div className="text-[9px] font-bold text-white mb-1 uppercase tracking-tight">{date.format("MMM D")}</div>
                                    <div className="flex items-center gap-3">
                                        <div className={`text-[10px] font-mono font-bold ${data.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {data.pnl >= 0 ? '+' : ''}₹{data.pnl.toLocaleString()}
                                        </div>
                                        <div className="text-[8px] text-slate-500 font-mono">
                                            {data.win}W/{data.loss}L
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
            <div className="flex flex-col gap-1.5">
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em] text-center mb-1">{firstDayOfMonth.format("MMMM")}</span>
                <div className="grid grid-cols-7 gap-[2px]">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => (
                        <div key={d} className="w-5 h-5 flex items-center justify-center text-[7px] font-bold text-slate-800">{d}</div>
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

    // Only Today can be in "Edit" mode. Past dates are always "Read" mode.
    // Today can start in Edit mode and switch to Read mode after commit.
    const showEditor = isTodaySelected && isEditingToday;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm overflow-hidden">
            <Toaster position="top-right" />

            <motion.div
                initial={{ opacity: 0, scale: 0.99, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.99, y: -10 }}
                className="bg-[#080d16] border border-white/[0.05] rounded-xl w-full max-w-[1600px] h-[85vh] flex overflow-hidden shadow-2xl"
            >
                {/* LEFT: CALENDAR WORKSPACE */}
                <div className="flex-1 bg-black/5 p-10 flex flex-col overflow-y-auto no-scrollbar">
                    <div className="flex items-center justify-between mb-12">
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-500/5 p-2.5 rounded-lg border border-blue-500/10">
                                <Calendar size={18} className="text-blue-500/80" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white tracking-tight uppercase">Performance Map</h2>
                                <p className="text-[9px] text-slate-500 font-bold tracking-[0.3em] uppercase opacity-50">{viewYear} Annual Discipline Matrix</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 bg-black/20 px-5 py-2.5 rounded-lg border border-white/[0.03]">
                            <LegendItem label="Profit" color="bg-emerald-500/60" />
                            <LegendItem label="Risk" color="bg-red-500/60" />
                            <LegendItem label="Idle" color="bg-slate-800" symbol="×" />
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-x-12 gap-y-12 items-start justify-center max-w-5xl mx-auto">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="flex justify-center">
                                {renderMiniMonth(i)}
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT: TERMINAL PANEL */}
                <div className="w-[440px] border-l border-white/[0.03] bg-[#0b1220]/20 flex flex-col">
                    <div className="px-8 py-8 border-b border-white/[0.03] flex items-center justify-between">
                        <div>
                            <div className="text-[9px] font-bold text-blue-500/70 uppercase tracking-[0.3em] mb-1">{dayjs(selectedDate).format("dddd")} log</div>
                            <div className="text-2xl font-bold text-white tracking-tight">{dayjs(selectedDate).format("DD MMM, YYYY")}</div>
                        </div>
                        <button onClick={onClose} className="p-2.5 rounded-lg hover:bg-white/[0.03] text-slate-600 transition-all hover:text-white">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-10 no-scrollbar">
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <MetricBox label="Net P&L" value={`₹${(selectedData?.pnl || 0).toLocaleString()}`} color={selectedData?.pnl >= 0 ? "text-emerald-400" : "text-red-400"} />
                            <MetricBox label="Edge Score" value={`${(selectedData?.rMult || 0).toFixed(1)}R`} color="text-blue-400/80" />
                            <MetricBox label="Efficiency" value={selectedData ? (selectedData.win >= selectedData.loss ? "Optimal" : "Subpar") : "-"} color={selectedData && selectedData.win >= selectedData.loss ? "text-emerald-500/80" : "text-amber-500/70"} />
                            <MetricBox label="Win Rate" value={`${selectedData ? Math.round((selectedData.win / selectedData.count) * 100) : 0}%`} sub={`${selectedData?.win || 0}W / ${selectedData?.loss || 0}L`} />
                        </div>

                        {/* Recent History */}
                        <section>
                            <div className="flex items-center justify-between mb-5 border-b border-white/[0.03] pb-2">
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <Signal size={12} className="text-slate-700" /> Execution
                                </div>
                                <span className="text-[9px] font-mono text-slate-700 uppercase">Real-time</span>
                            </div>

                            <div className="space-y-2">
                                {selectedTrades.length > 0 ? selectedTrades.map(trade => (
                                    <div key={trade.id} className="p-3.5 rounded-lg bg-white/[0.01] border border-white/[0.03] flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-300">{trade.instrument}</span>
                                                <span className="text-[9px] text-slate-600 font-mono uppercase">{trade.strategy}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-xs font-mono font-bold ${trade.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {trade.pnl >= 0 ? '+' : ''}{trade.pnl}
                                            </div>
                                            <div className="text-[10px] text-slate-700 font-mono">{trade.rMultiple}R</div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="py-12 border border-dashed border-white/[0.03] rounded-lg text-center flex flex-col items-center justify-center gap-2 bg-black/5">
                                        <Minus size={18} className="text-slate-800" />
                                        <p className="text-[10px] text-slate-700 uppercase font-bold tracking-[0.2em]">Terminal Idle</p>
                                        <p className="text-[8px] text-slate-800 font-medium px-10 leading-relaxed uppercase tracking-widest">No market exposure identified during this terminal session.</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Analysis Section */}
                        <section className="flex flex-col gap-4">
                            <div className="flex items-center justify-between border-b border-white/[0.03] pb-2">
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <Edit3 size={12} className="text-slate-700" /> Commentary
                                </div>
                                {showEditor && (
                                    <div className="flex items-center gap-2">
                                        <button onMouseDown={(e) => { e.preventDefault(); applyColor('#94a3b8'); }} className="w-5 h-5 rounded-md bg-slate-500/10 text-slate-400 flex items-center justify-center hover:bg-slate-500/20" title="Back to Default Pen">
                                            <RotateCcw size={10} />
                                        </button>
                                        <button onMouseDown={(e) => { e.preventDefault(); applyColor('#ef4444'); }} className="w-5 h-5 rounded-md bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20" title="Negative Note">
                                            <Palette size={10} />
                                        </button>
                                        <button onMouseDown={(e) => { e.preventDefault(); applyColor('#10b981'); }} className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-500 flex items-center justify-center hover:bg-emerald-500/20" title="Positive Note">
                                            <Palette size={10} />
                                        </button>
                                    </div>
                                )}
                                {!showEditor && isTodaySelected && (
                                    <button
                                        onClick={() => setIsEditingToday(true)}
                                        className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[8px] font-bold text-blue-400 uppercase tracking-[0.2em] hover:bg-blue-500/20 transition-all active:scale-95"
                                    >
                                        Edit Entry
                                    </button>
                                )}
                                {isPastDate && (
                                    <div className="px-2 py-0.5 rounded bg-white/[0.03] text-[8px] font-bold text-slate-600 uppercase tracking-tight">Immutable Archive</div>
                                )}
                            </div>

                            <div className="relative group">
                                <style>{`
                                    [contenteditable]:empty:before {
                                        content: attr(placeholder);
                                        pointer-events: none;
                                        color: #475569;
                                        opacity: 0.5;
                                        font-style: italic;
                                    }
                                `}</style>

                                {showEditor ? (
                                    <div
                                        ref={editorRef}
                                        contentEditable={true}
                                        placeholder="Enter session analysis..."
                                        className="w-full min-h-[180px] p-5 bg-black/20 border border-white/[0.01] rounded-xl text-[11px] leading-relaxed text-slate-400 focus:outline-none transition-all hover:bg-black/30 outline-none"
                                    />
                                ) : (
                                    <div
                                        className={`w-full min-h-[180px] p-5 bg-black/10 border border-white/[0.005] rounded-xl text-[11px] leading-relaxed text-slate-500/80 transition-all ${isPastDate ? 'opacity-40' : 'opacity-70'}`}
                                        dangerouslySetInnerHTML={{ __html: localNotes[selectedDate] || (isPastDate ? "No entry recorded for this session." : "Waiting for commitment...") }}
                                    />
                                )}

                                {showEditor && (
                                    <div className="flex justify-end mt-4">
                                        <button
                                            onClick={handleSaveNote}
                                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-[9px] font-bold text-white uppercase tracking-[0.2em] rounded-lg transition-all shadow-xl shadow-blue-900/10 active:scale-95 flex items-center gap-3"
                                        >
                                            <Save size={12} /> Commit Record
                                        </button>
                                    </div>
                                )}
                            </div>

                            {!showEditor && (
                                <div className="flex gap-2 p-3.5 bg-blue-500/[0.02] border border-blue-500/[0.05] rounded-lg">
                                    <Info size={12} className="text-blue-500/40 shrink-0" />
                                    <p className="text-[10px] text-slate-600 leading-normal italic">
                                        {isPastDate ? "Historical performance is locked to prevent bias." : "Session entry confirmed. Use the 'Edit' toggle above for modifications."}
                                    </p>
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

function LegendItem({ label, color, symbol }) {
    return (
        <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-sm ${color} flex items-center justify-center text-[7px] font-bold`}>
                {symbol}
            </div>
            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{label}</span>
        </div>
    );
}

function MetricBox({ label, value, color = "text-white", sub }) {
    return (
        <div className="p-4 bg-white/[0.01] border border-white/[0.03] rounded-lg flex flex-col justify-center">
            <div className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mb-1">{label}</div>
            <div className={`text-sm font-mono font-bold ${color}`}>{value}</div>
            {sub && <div className="text-[8px] text-slate-700 font-bold uppercase mt-1">{sub}</div>}
        </div>
    );
}
