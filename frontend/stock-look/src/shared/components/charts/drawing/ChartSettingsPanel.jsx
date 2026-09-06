/**
 * @file ChartSettingsPanel.jsx
 * @purpose Settings popover for chart position-sizing parameters.
 *
 * All values are persisted to localStorage so DrawingCanvas reads them
 * instantly on the next render frame — no page reload needed.
 *
 * Exposed settings:
 *   praxis_risk_pct        — Risk % per trade (0.5 / 1 / 1.5 / 2)
 *   praxis_swing_tp1       — Swing TP1 R multiple (1.5 / 2 / 2.5 / 3)
 *   praxis_swing_tp2       — Swing TP2 R multiple (2.5 / 3 / 4 / 5)
 *   praxis_scalp_partial   — Scalp partial exit fraction (0.33 / 0.5 / 0.67)
 *   praxis_scalp_tp        — Scalp full exit R multiple (1 / 1.5 / 2)
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings2, X } from "lucide-react";

/* -- default values ------------------------------------------------------- */
const DEFAULTS = {
    praxis_risk_pct:      "1",
    praxis_swing_tp1:     "2",
    praxis_swing_tp2:     "3",
    praxis_scalp_partial: "0.5",
    praxis_scalp_tp:      "1.5",
};

function readSetting(key) {
    try { return localStorage.getItem(key) || DEFAULTS[key]; } catch { return DEFAULTS[key]; }
}
function writeSetting(key, value) {
    try { localStorage.setItem(key, value); } catch {}
}

/* -- pill button group ----------------------------------------------------- */
function PillGroup({ label, options, settingKey, value, onChange }) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-[9px] font-semibold uppercase tracking-widest text-white/30">
                {label}
            </span>
            <div className="flex gap-1 flex-wrap">
                {options.map(opt => {
                    const active = value === String(opt.value);
                    return (
                        <button
                            key={opt.value}
                            onClick={() => { writeSetting(settingKey, String(opt.value)); onChange(String(opt.value)); }}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all duration-150 border
                                ${active
                                    ? "bg-blue-500/20 border-blue-400/60 text-blue-300"
                                    : "bg-white/5 border-white/8 text-white/40 hover:text-white/70 hover:bg-white/10"
                                }`}
                        >
                            {opt.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

/* -- main component -------------------------------------------------------- */
export default function ChartSettingsPanel({ visible }) {
    const [open, setOpen]           = useState(false);
    const [riskPct, setRiskPct]     = useState(() => readSetting("praxis_risk_pct"));
    const [swingTP1, setSwingTP1]   = useState(() => readSetting("praxis_swing_tp1"));
    const [swingTP2, setSwingTP2]   = useState(() => readSetting("praxis_swing_tp2"));
    const [scalpPart, setScalpPart] = useState(() => readSetting("praxis_scalp_partial"));
    const [scalpTP, setScalpTP]     = useState(() => readSetting("praxis_scalp_tp"));
    const panelRef = useRef(null);

    /* close on outside click */
    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    if (!visible) return null;

    return (
        <div ref={panelRef} className="relative">
            {/* trigger button */}
            <button
                onPointerDown={e => { e.preventDefault(); e.stopPropagation(); setOpen(p => !p); }}
                title="Chart Position Settings"
                className={`pointer-events-auto flex items-center justify-center w-7 h-7 rounded-md transition-all duration-150
                    ${open
                        ? "bg-blue-500/20 text-blue-400"
                        : "text-slate-500 dark:text-white/40 hover:text-white/90 hover:bg-white/5"}`}
            >
                <Settings2 size={13} strokeWidth={2} />
            </button>

            {/* panel */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, x: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -8, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        onPointerDown={e => e.stopPropagation()}
                        onClick={e => e.stopPropagation()}
                        className="absolute bottom-0 left-[76px] z-[200] w-[220px] bg-[#1a1f2e]/97 border border-white/10 rounded-xl backdrop-blur-md shadow-2xl p-3 flex flex-col gap-3 max-h-[70vh] overflow-y-auto"
                    >
                        {/* header */}
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">
                                Position Settings
                            </span>
                            <button
                                onClick={() => setOpen(false)}
                                className="text-white/30 hover:text-white/70 transition-colors"
                            >
                                <X size={11} />
                            </button>
                        </div>

                        {/* divider */}
                        <div className="w-full h-px bg-white/6" />

                        {/* -- Risk per trade -- */}
                        <PillGroup
                            label="Risk % per trade"
                            settingKey="praxis_risk_pct"
                            value={riskPct}
                            onChange={setRiskPct}
                            options={[
                                { label: "0.5%", value: "0.5" },
                                { label: "1%",   value: "1"   },
                                { label: "1.5%", value: "1.5" },
                                { label: "2%",   value: "2"   },
                            ]}
                        />

                        <div className="w-full h-px bg-white/6" />
                        <span className="text-[9px] font-bold text-white/25 uppercase tracking-widest -mb-1">
                            Swing / Positional
                        </span>

                        {/* -- Swing TP1 -- */}
                        <PillGroup
                            label="TP1 Target"
                            settingKey="praxis_swing_tp1"
                            value={swingTP1}
                            onChange={setSwingTP1}
                            options={[
                                { label: "1.5R", value: "1.5" },
                                { label: "2R",   value: "2"   },
                                { label: "2.5R", value: "2.5" },
                                { label: "3R",   value: "3"   },
                            ]}
                        />

                        {/* -- Swing TP2 -- */}
                        <PillGroup
                            label="TP2 Target"
                            settingKey="praxis_swing_tp2"
                            value={swingTP2}
                            onChange={setSwingTP2}
                            options={[
                                { label: "2.5R", value: "2.5" },
                                { label: "3R",   value: "3"   },
                                { label: "4R",   value: "4"   },
                                { label: "5R",   value: "5"   },
                            ]}
                        />

                        <div className="w-full h-px bg-white/6" />
                        <span className="text-[9px] font-bold text-white/25 uppercase tracking-widest -mb-1">
                            Scalp
                        </span>

                        {/* -- Scalp Partial Exit % -- */}
                        <PillGroup
                            label="Partial Exit"
                            settingKey="praxis_scalp_partial"
                            value={scalpPart}
                            onChange={setScalpPart}
                            options={[
                                { label: "33%", value: "0.33" },
                                { label: "50%", value: "0.5"  },
                                { label: "67%", value: "0.67" },
                            ]}
                        />

                        {/* -- Scalp Full Target -- */}
                        <PillGroup
                            label="Full Exit Target"
                            settingKey="praxis_scalp_tp"
                            value={scalpTP}
                            onChange={setScalpTP}
                            options={[
                                { label: "1R",   value: "1"   },
                                { label: "1.5R", value: "1.5" },
                                { label: "2R",   value: "2"   },
                            ]}
                        />

                        {/* reset */}
                        <div className="w-full h-px bg-white/6" />
                        <button
                            onClick={() => {
                                Object.entries(DEFAULTS).forEach(([k, v]) => { writeSetting(k, v); });
                                setRiskPct(DEFAULTS.praxis_risk_pct);
                                setSwingTP1(DEFAULTS.praxis_swing_tp1);
                                setSwingTP2(DEFAULTS.praxis_swing_tp2);
                                setScalpPart(DEFAULTS.praxis_scalp_partial);
                                setScalpTP(DEFAULTS.praxis_scalp_tp);
                            }}
                            className="text-[9px] text-white/25 hover:text-white/50 transition-colors text-left"
                        >
                            Reset to defaults
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}




