import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Minus, TrendingUp, ArrowRight, AlignLeft,
    Square, Triangle, Type, Trash2, CornerUpLeft,
    Crosshair, AlignJustify, ArrowUpRight, Circle, PenTool,
    Columns, Ruler, ArrowUpCircle, ArrowDownCircle, Zap
} from 'lucide-react';

export const TOOLS = [
    { id: 'cursor',    label: 'Select / Move',        Icon: Crosshair },
    { id: 'separator', type: 'sep' },
    { id: 'trend',     label: 'Trend Line',            Icon: TrendingUp },
    { id: 'hline',     label: 'Horizontal Line',       Icon: Minus },
    { id: 'hray',      label: 'Horizontal Ray →',      Icon: ArrowRight },
    { id: 'vline',     label: 'Vertical Line',         Icon: AlignLeft },
    { id: 'separator2', type: 'sep' },
    { id: 'circle',    label: 'Circle / Mark',         Icon: Circle },
    { id: 'channel',   label: 'Parallel Channel',      Icon: Columns },
    { id: 'fib',       label: 'Fibonacci Retracement', Icon: AlignJustify },
    { id: 'separator3', type: 'sep' },
    { id: 'arrow',     label: 'Arrow',                 Icon: ArrowUpRight },
    { id: 'brush',     label: 'Brush / Freehand',      Icon: PenTool },
    { id: 'text',      label: 'Text Label',            Icon: Type },
    { id: 'separator4', type: 'sep' },
    { id: 'measure',   label: 'Measure Tool',          Icon: Ruler },
    { id: 'longpos',   label: 'Long Position',         Icon: ArrowUpCircle },
    { id: 'shortpos',  label: 'Short Position',        Icon: ArrowDownCircle },
    { id: 'scalp',     label: 'Scalp Position',        Icon: Zap },
];

export const COLORS = [
    '#60a5fa', // blue
    '#34d399', // green
    '#f87171', // red
    '#fbbf24', // amber
    '#a78bfa', // purple
    '#fb923c', // orange
    '#ec4899', // pink
    '#94a3b8', // slate
    '#ffffff', // white
    '#000000', // black
];

export default function DrawingToolbar({
    activeTool,
    setActiveTool,
    activeColor,
    setActiveColor,
    onUndo,
    onClearAll,
    visible,
}) {
    const [hovered, setHovered] = useState(null);

    return (
        <>
            <AnimatePresence>
                {visible && (
                    <motion.div
                    key="drawing-toolbar"
                    initial={{ opacity: 0, x: -10, scale: 0.97 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -10, scale: 0.97 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="absolute left-0 top-8 z-30 flex flex-col gap-1 
                               bg-white/80 dark:bg-[#1e222d]/80 border border-black/5 dark:border-white/5 rounded-xl 
                               backdrop-blur-md shadow-2xl p-1.5 w-[68px]
                               max-h-[calc(100%-2rem)]"
                    onPointerDown={e => e.stopPropagation()}
                    onClick={e => e.stopPropagation()}
                >
                    <div className="overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden w-full">
                        <div className="grid grid-cols-2 gap-1">
                            {TOOLS.map((tool) => {
                                if (tool.type === 'sep') {
                                    return <div key={tool.id} className="col-span-2 w-full h-px bg-white/5 my-0.5" />;
                                }
                                const { Icon } = tool;
                                const isActive = activeTool === tool.id;
                                return (
                                    <button
                                        key={tool.id}
                                        onMouseEnter={(e) => {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            setHovered({ label: tool.label, top: rect.top + rect.height / 2, left: rect.right + 12 });
                                        }}
                                        onMouseLeave={() => setHovered(null)}
                                        onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); setActiveTool(isActive ? 'cursor' : tool.id); }}
                                        className={`
                                            relative group w-7 h-7 flex items-center justify-center rounded-md
                                            transition-all duration-150 cursor-pointer
                                            ${isActive
                                                ? 'bg-blue-500/15 text-blue-500 dark:text-blue-400'
                                                : 'text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white/90 hover:bg-black/5 dark:hover:bg-white/5'}
                                        `}
                                    >
                                        <Icon size={14} strokeWidth={isActive ? 2 : 1.5} />
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Fixed Bottom Section */}
                    <div className="flex-shrink-0 w-full flex flex-col gap-1 border-t border-black/5 dark:border-white/5 pt-1 mt-1">
                        <div className="flex flex-wrap gap-1.5 justify-center py-1 px-0.5">
                        {COLORS.map(color => (
                            <button
                                key={color}
                                onMouseEnter={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setHovered({ label: color, top: rect.top + rect.height / 2, left: rect.right + 12 });
                                }}
                                onMouseLeave={() => setHovered(null)}
                                onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); setActiveColor(color); }}
                                className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${activeColor === color ? 'scale-125 ring-1 ring-offset-1 ring-offset-white dark:ring-offset-[#1e222d] ring-black/20 dark:ring-white/50' : 'opacity-60 hover:opacity-100 hover:scale-110'}`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                        {/* Custom Color Input */}
                        <label 
                            onMouseEnter={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setHovered({ label: 'Custom Color', top: rect.top + rect.height / 2, left: rect.right + 12 });
                            }}
                            onMouseLeave={() => setHovered(null)}
                            className="cursor-pointer flex items-center justify-center w-3.5 h-3.5 rounded-full ring-1 ring-black/10 dark:ring-white/20 hover:ring-black/50 dark:hover:ring-white/50 bg-[conic-gradient(red,yellow,lime,aqua,blue,fuchsia,red)] relative overflow-hidden transition-all hover:scale-110"
                        >
                            <input 
                                type="color" 
                                value={activeColor.startsWith('#') && activeColor.length === 7 ? activeColor : '#ffffff'} 
                                onChange={(e) => setActiveColor(e.target.value)}
                                className="opacity-0 w-8 h-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                            />
                        </label>
                        </div>

                        {/* Undo + Clear */}
                        <div className="w-full h-px bg-black/5 dark:bg-white/5 my-0.5" />
                        <div className="grid grid-cols-2 gap-1">
                            <button
                                onMouseEnter={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setHovered({ label: 'Undo (Ctrl+Z)', top: rect.top + rect.height / 2, left: rect.right + 12 });
                                }}
                                onMouseLeave={() => setHovered(null)}
                                onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); onUndo(); }}
                                className="w-7 h-7 flex items-center justify-center rounded-md text-slate-500 dark:text-white/40 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-500/10 transition-all duration-150"
                            >
                                <CornerUpLeft size={13} />
                            </button>
                            <button
                                onMouseEnter={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setHovered({ label: 'Clear All Drawings', top: rect.top + rect.height / 2, left: rect.right + 12 });
                                }}
                                onMouseLeave={() => setHovered(null)}
                                onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); onClearAll(); }}
                                className="w-7 h-7 flex items-center justify-center rounded-md text-slate-500 dark:text-white/40 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
                            >
                                <Trash2 size={13} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
            </AnimatePresence>
            
            {/* Custom Fixed Tooltip */}
            <AnimatePresence>
                {hovered && visible && (
                    <motion.div
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -4 }}
                        transition={{ duration: 0.15 }}
                        className="fixed z-[100] bg-[#1a1f2e] border border-white/10 text-white/90 text-[11px] font-medium px-2.5 py-1.5 rounded-md shadow-xl pointer-events-none whitespace-nowrap"
                        style={{
                            top: hovered.top,
                            left: hovered.left,
                            transform: 'translateY(-50%)'
                        }}
                    >
                        {hovered.label}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}