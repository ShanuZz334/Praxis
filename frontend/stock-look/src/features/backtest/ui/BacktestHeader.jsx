/**
 * @file BacktestHeader.jsx
 * @purpose Minimal top header for Backtesting Workshop with Praxis logo, status badges, presets, and exit button.
 * @date 2026-09-12
 */

import React from 'react';
import { 
    ArrowLeft, FlaskConical, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen 
} from 'lucide-react';
import praxisLogo from '@/assets/icons/praxis logo 2 bgless.png';

export default function BacktestHeader({
    instrumentLabel,
    timeframe,
    tradingMode,
    walkForwardEnabled,
    dateSpan,
    onExit,
    isLeftOpen = true,
    isRightOpen = true,
    onToggleLeft = () => {},
    onToggleRight = () => {},
}) {
    return (
        <header className="h-[56px] w-full max-w-full border-b border-border-subtle bg-background-card/90 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between gap-2 z-30 select-none overflow-hidden">
            {/* Left: Brand, Panel Toggle & Workshop Badge */}
            <div className="flex items-center gap-2.5 shrink-0">
                <button
                    type="button"
                    onClick={onToggleLeft}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        isLeftOpen
                            ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                            : 'text-text-tertiary hover:text-text-primary bg-background-surface border border-border-subtle'
                    }`}
                    title={isLeftOpen ? 'Hide Configuration Panel' : 'Show Configuration Panel'}
                >
                    {isLeftOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
                    <span className="hidden md:inline text-[11px] font-medium">Config</span>
                </button>

                <div className="flex items-center gap-2">
                    <img src={praxisLogo} alt="Praxis" className="w-6 h-6 object-contain" />
                    <span className="text-sm font-black tracking-wider text-text-primary uppercase font-mono">
                        PRAXIS
                    </span>
                </div>

                <div className="h-4 w-px bg-border-subtle mx-1" />

                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
                    <FlaskConical size={13} className="text-blue-400" />
                    <span>Backtesting Workshop</span>
                </div>

                {/* Walk-forward badge */}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    walkForwardEnabled
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                    {walkForwardEnabled ? 'Walk-Forward (70/30 Split)' : 'In-Sample Full Replay'}
                </span>
            </div>

            {/* Middle: Active Target Context */}
            <div className="hidden md:flex items-center gap-2 min-w-0">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-background-surface border border-border-subtle/80 text-xs text-text-secondary shrink-0">
                    <span className="font-bold text-text-primary uppercase font-mono">{instrumentLabel}</span>
                    <span className="text-text-muted">•</span>
                    <span className="uppercase text-text-tertiary font-mono">{timeframe}</span>
                    {dateSpan && (
                        <>
                            <span className="text-text-muted">•</span>
                            <span className="text-emerald-400 font-mono font-bold text-[11px]">{dateSpan}</span>
                        </>
                    )}
                    <span className="text-text-muted">•</span>
                    <span className="capitalize text-accent-primary font-medium">{tradingMode}</span>
                </div>
            </div>

            {/* Right: Scorecard Toggle & Exit Workshop */}
            <div className="flex items-center gap-2 shrink-0">
                <button
                    type="button"
                    onClick={onToggleRight}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        isRightOpen
                            ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                            : 'text-text-tertiary hover:text-text-primary bg-background-surface border border-border-subtle'
                    }`}
                    title={isRightOpen ? 'Hide Live Scorecard' : 'Show Live Scorecard'}
                >
                    {isRightOpen ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}
                    <span className="hidden md:inline text-[11px] font-medium">Scorecard</span>
                </button>

                <button
                    onClick={onExit}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background-surface hover:bg-background-surface/80 border border-border-subtle hover:border-border-default text-text-secondary hover:text-text-primary text-xs font-semibold transition-all active:scale-95 shadow-sm"
                    title="Return to Live Dashboard"
                >
                    <ArrowLeft size={14} />
                    <span className="hidden sm:inline">Exit Workshop</span>
                </button>
            </div>
        </header>
    );
}
