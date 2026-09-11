const fs = require('fs');
let code = fs.readFileSync('c:/project/ALLBACKUP/Praxis/frontend/stock-look/src/shared/components/charts/AdvancedCandlestickChart.jsx', 'utf8');

// 1. Refactor triggerFutureVision to separate clearFutureVision and prevent clear on click
const triggerRegex = /const triggerFutureVision = async \(\) => \{\n\s*if \(fvLoading\) return;\n\n\s*\/\/ If active, toggle off \(clear ghosts\)\n\s*if \(fvActive\) \{\n\s*setFvActive\(false\);\n\s*setFvBias\(null\);\n\s*setFvRisk\(''\);\n\s*setFvPAE\(null\);\n\s*setFvModel\(null\);\n\s*fvIgnoreStaleRef\.current = false;\n\s*fvSessionRef\.current = null;\n\s*fvLiveBarIndexRef\.current = 0;\n\s*if \(ghostCandleSeriesRef\.current\) ghostCandleSeriesRef\.current\.setData\(\[\]\);\n\s*return;\n\s*\}/m;

const triggerReplacement = `const clearFutureVision = () => {
        setFvActive(false);
        setFvBias(null);
        setFvRisk('');
        setFvPAE(null);
        setFvModel(null);
        fvIgnoreStaleRef.current = false;
        fvSessionRef.current = null;
        fvLiveBarIndexRef.current = 0;
        if (ghostCandleSeriesRef.current) ghostCandleSeriesRef.current.setData([]);
    };

    const triggerFutureVision = async () => {
        if (fvLoading) return;

        // Do NOT clear on single click. User must right-click to delete.
        if (fvActive) return;`;

code = code.replace(triggerRegex, triggerReplacement);

// 2. Add Exhausted calculation and update Telescope button logic
const buttonStartRegex = /<button\n\s*onMouseEnter=\{\(e\) => handleMouseEnter\(e, fvActive \? 'Clear Future Vision' : \(fvStaleMsg \|\| 'Future Vision — AI Candle Prediction'\)\)\}\n\s*onMouseLeave=\{\(\) => setHoveredIndicator\(null\)\}\n\s*onClick=\{triggerFutureVision\}\n\s*disabled=\{fvLoading\}\n\s*className=\{`pointer-events-auto relative flex items-center justify-center w-6 h-6 rounded-md transition-all duration-200\n\s*\$\{fvLoading \? 'text-violet-400 animate-pulse' : ''\}\n\s*\$\{fvActive && !fvLoading \? 'text-violet-400' : ''\}\n\s*\$\{!fvActive && !fvLoading \? 'text-text-secondary hover:text-violet-400' : ''\}`\}\n\s*>\n\s*\{fvActive && !fvLoading && \(\n\s*<span className="absolute inset-0 rounded-md ring-2 ring-violet-400\/50 animate-ping" \/>\n\s*\)\}\n\s*\{fvLoading\n\s*\? <Loader size="tiny" \/>\n\s*: <Telescope size=\{13\} strokeWidth=\{2\} \/>\n\s*\}\n\s*<\/button>/m;

const buttonReplacement = `const isFvExhausted = fvPAE && Array.isArray(fvPAE.scores) && Array.isArray(fvPAE.candles) && fvPAE.scores.length >= fvPAE.candles.length;
                
                return (
                <button
                    onContextMenu={(e) => {
                        e.preventDefault();
                        if (fvActive) {
                            if (window.confirm("Delete the current Future Vision prediction?")) {
                                clearFutureVision();
                                setHoveredIndicator(null);
                            }
                        }
                    }}
                    onMouseEnter={(e) => handleMouseEnter(e, fvActive ? 'Right-Click to Clear Future Vision' : (fvStaleMsg || 'Future Vision — AI Candle Prediction'))}
                    onMouseLeave={() => setHoveredIndicator(null)}
                    onClick={triggerFutureVision}
                    disabled={fvLoading}
                    className={\`pointer-events-auto relative flex items-center justify-center w-6 h-6 rounded-md transition-all duration-200
                        \${fvLoading ? 'text-violet-400 animate-pulse' : ''}
                        \${fvActive && !fvLoading && !isFvExhausted ? 'text-violet-400' : ''}
                        \${fvActive && !fvLoading && isFvExhausted ? 'text-slate-500' : ''}
                        \${!fvActive && !fvLoading ? 'text-text-secondary hover:text-violet-400' : ''}\`}
                >
                    {fvActive && !fvLoading && !isFvExhausted && (
                        <span className="absolute inset-0 rounded-md ring-2 ring-violet-400/50 animate-ping" />
                    )}
                    {fvLoading
                        ? <Loader size="tiny" />
                        : <Telescope size={13} strokeWidth={2} />
                    }
                </button>
                );
                })() // self-executing wrapper to allow 'return'
                }
                
                {/* 🔮 Future Vision Bias HUD ─────────────────────────────────── */}
                {fvActive && fvBias && (() => {`;

// We must wrap it in an IIFE because we're injecting `const isFvExhausted` into the middle of JSX.
// Actually, let's just do a simpler replacement.
const simplerButtonStartRegex = /<button\n\s*onMouseEnter=\{\(e\) => handleMouseEnter\(e, fvActive \? 'Clear Future Vision' : \(fvStaleMsg \|\| 'Future Vision — AI Candle Prediction'\)\)\}\n\s*onMouseLeave=\{\(\) => setHoveredIndicator\(null\)\}\n\s*onClick=\{triggerFutureVision\}\n\s*disabled=\{fvLoading\}\n\s*className=\{`pointer-events-auto relative flex items-center justify-center w-6 h-6 rounded-md transition-all duration-200\n\s*\$\{fvLoading \? 'text-violet-400 animate-pulse' : ''\}\n\s*\$\{fvActive && !fvLoading \? 'text-violet-400' : ''\}\n\s*\$\{!fvActive && !fvLoading \? 'text-text-secondary hover:text-violet-400' : ''\}`\}\n\s*>\n\s*\{fvActive && !fvLoading && \(\n\s*<span className="absolute inset-0 rounded-md ring-2 ring-violet-400\/50 animate-ping" \/>\n\s*\)\}\n\s*\{fvLoading\n\s*\? <Loader size="tiny" \/>\n\s*: <Telescope size=\{13\} strokeWidth=\{2\} \/>\n\s*\}\n\s*<\/button>/m;

const simplerReplacement = `{(() => {
                    const isFvExhausted = fvPAE && Array.isArray(fvPAE.scores) && Array.isArray(fvPAE.candles) && fvPAE.scores.length >= fvPAE.candles.length;
                    return (
                        <button
                            onContextMenu={(e) => {
                                e.preventDefault();
                                if (fvActive) {
                                    if (window.confirm("Delete the current Future Vision prediction?")) {
                                        clearFutureVision();
                                        setHoveredIndicator(null);
                                    }
                                }
                            }}
                            onMouseEnter={(e) => handleMouseEnter(e, fvActive ? 'Right-Click to Clear Future Vision' : (fvStaleMsg || 'Future Vision — AI Candle Prediction'))}
                            onMouseLeave={() => setHoveredIndicator(null)}
                            onClick={triggerFutureVision}
                            disabled={fvLoading}
                            className={\`pointer-events-auto relative flex items-center justify-center w-6 h-6 rounded-md transition-all duration-200
                                \${fvLoading ? 'text-violet-400 animate-pulse' : ''}
                                \${fvActive && !fvLoading && !isFvExhausted ? 'text-violet-400' : ''}
                                \${fvActive && !fvLoading && isFvExhausted ? 'text-slate-500 opacity-60' : ''}
                                \${!fvActive && !fvLoading ? 'text-text-secondary hover:text-violet-400' : ''}\`}
                        >
                            {fvActive && !fvLoading && !isFvExhausted && (
                                <span className="absolute inset-0 rounded-md ring-2 ring-violet-400/50 animate-ping" />
                            )}
                            {fvLoading
                                ? <Loader size="tiny" />
                                : <Telescope size={13} strokeWidth={2} />
                            }
                        </button>
                    );
                })()}`;

code = code.replace(simplerButtonStartRegex, simplerReplacement);

fs.writeFileSync('c:/project/ALLBACKUP/Praxis/frontend/stock-look/src/shared/components/charts/AdvancedCandlestickChart.jsx', code);
console.log('Phase 2 UI logic patched successfully');
