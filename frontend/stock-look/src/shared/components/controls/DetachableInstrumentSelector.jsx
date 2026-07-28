import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboardContext } from '@/shared/context/DashboardContext';
import { FO_INDICES, FO_EQUITIES } from '@/shared/utils/foInstruments';
import UiverseDropdown from '@/shared/components/ui/UiverseDropdown';
import { FiMove, FiX } from 'react-icons/fi';

/**
 * Detachable Magnetic Instrument Selector
 * A floating, drag-and-drop widget that manages global dashboard state.
 */
export default function DetachableInstrumentSelector({ isOpen, onClose }) {
    const {
        selectedCategory, setSelectedCategory,
        selectedInstrument, setSelectedInstrument,
        selectedExpiry, setSelectedExpiry,
        expiries
    } = useDashboardContext();

    const widgetRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);

    // Instrument Filtering based on Category
    const categories = [
        { label: "Indices", value: "Indices" },
        { label: "Companies", value: "Companies" }
    ];
    const filteredInstruments = selectedCategory === "Indices" ? FO_INDICES : FO_EQUITIES;

    // Framer Motion Animation Variants
    const springTransition = { type: "spring", stiffness: 300, damping: 25 };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                ref={widgetRef}
                drag
                dragMomentum={false}
                dragElastic={0.2}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={() => setIsDragging(false)}
                initial={{ opacity: 0, scale: 0.8, y: -20, x: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -20, x: 20 }}
                transition={springTransition}
                className={`fixed z-[9999] top-[80px] right-[80px] cursor-grab active:cursor-grabbing
                    bg-[#0B0E14] border border-border-default 
                    rounded-2xl shadow-2xl min-w-[320px] max-w-[90vw]
                    transition-shadow duration-300
                    ${isDragging ? 'shadow-blue-500/20 shadow-2xl border-blue-500/30' : ''}
                `}
                style={{ touchAction: "none" }} // Prevent browser scrolling while dragging on touch
            >
                {/* Drag Handle & Header */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-transparent rounded-t-2xl border-b border-border-subtle select-none">
                    <div className="flex items-center gap-2 text-text-tertiary">
                        <FiMove className={`text-sm transition-colors ${isDragging ? 'text-blue-400' : ''}`} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Market Target</span>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-1 rounded-md text-text-tertiary hover:bg-white/10 hover:text-red-400 transition-colors"
                    >
                        <FiX size={14} />
                    </button>
                </div>

                {/* Controls Content */}
                <div className="p-4 space-y-4 cursor-default select-text" onPointerDown={(e) => e.stopPropagation()}>
                    {/* Indices vs Companies Toggle */}
                    <div className="flex bg-background-surface rounded-lg p-1 h-10 border border-border-default shadow-inner w-full">
                        {categories.map((c) => (
                            <button
                                key={c.value}
                                onClick={() => setSelectedCategory(c.value)}
                                className={`flex-1 flex items-center justify-center px-4 h-full rounded-md text-sm font-bold transition-all ${
                                    selectedCategory === c.value
                                        ? "bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-sm"
                                        : "text-text-secondary hover:text-text-primary hover:bg-white/5 border border-transparent"
                                }`}
                            >
                                {c.label}
                            </button>
                        ))}
                    </div>

                    {/* Instrument Selector */}
                    <div className="w-full relative z-[60]">
                        <UiverseDropdown
                            value={selectedInstrument}
                            onChange={(val) => setSelectedInstrument(val)}
                            options={filteredInstruments}
                            placeholder={`Select ${selectedCategory}...`}
                            searchPlaceholder="Search instruments..."
                        />
                    </div>

                    {/* Expiry Selector */}
                    <div className="w-full relative z-[50]">
                        <UiverseDropdown
                            value={selectedExpiry}
                            onChange={(val) => setSelectedExpiry(val)}
                            options={expiries.map(exp => ({
                                label: new Date(exp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                                value: exp
                            }))}
                            placeholder={expiries.length === 0 ? "No Expiries (Market Closed)" : "Select Expiry..."}
                            searchPlaceholder="Search expiry..."
                            disabled={expiries.length === 0}
                        />
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
