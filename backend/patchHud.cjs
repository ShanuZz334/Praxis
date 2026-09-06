const fs = require('fs');
const path = 'c:/project/ALLBACKUP/Praxis/frontend/stock-look/src/shared/components/charts/AdvancedCandlestickChart.jsx';
let content = fs.readFileSync(path, 'utf8');

const startTarget = '{fvActive && fvBias && (';
const endTarget = '</motion.div>\r\n                )}';
const endTargetAlt = '</motion.div>\n                )}';

let startIndex = content.indexOf(startTarget);
if (startIndex !== -1) {
    let endIndex = content.indexOf(endTarget, startIndex);
    if (endIndex === -1) endIndex = content.indexOf(endTargetAlt, startIndex);
    
    if (endIndex !== -1) {
        let actualEnd = endIndex + endTarget.length;
        if (content.substring(endIndex, endIndex + endTargetAlt.length) === endTargetAlt) {
            actualEnd = endIndex + endTargetAlt.length;
        }

        const replacement = `{fvActive && fvBias && (
                    <motion.div
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center ml-1"
                    >
                        <button
                            onMouseEnter={(e) => {
                                const tooltipContent = (
                                    <div className="flex flex-col gap-1.5 min-w-[140px]">
                                        <div className="flex justify-between items-center border-b border-white/10 pb-1.5 mb-0.5">
                                            <span className="text-white/50 text-[9px] uppercase font-bold tracking-wider">Bias</span>
                                            <span className={\`text-[10px] font-bold \${fvBias === 'bullish' ? 'text-emerald-400' : fvBias === 'bearish' ? 'text-red-400' : 'text-slate-400'}\`}>
                                                AI {fvBias.toUpperCase()}
                                            </span>
                                        </div>
                                        {fvSessionRef.current?.candles && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-white/50 text-[9px] uppercase font-bold tracking-wider">Confidence</span>
                                                <span className="text-violet-400 text-[10px] font-bold font-mono">
                                                    {Math.round(fvSessionRef.current.candles.reduce((acc, c) => acc + c.confidence, 0) / fvSessionRef.current.candles.length)}%
                                                </span>
                                            </div>
                                        )}
                                        {fvPAE && fvPAE.scores?.length > 0 && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-white/50 text-[9px] uppercase font-bold tracking-wider">Dir. Accuracy</span>
                                                <span className="text-blue-400 text-[10px] font-bold font-mono">
                                                    {Math.round(fvPAE.scores.reduce((a, b) => a + b.da, 0) / fvPAE.scores.length * 100)}% ({fvPAE.scores.length}/{fvSessionRef.current?.candles?.length})
                                                </span>
                                            </div>
                                        )}
                                        {fvModel && (
                                            <div className="flex justify-between items-center pt-1 border-t border-white/10 mt-0.5">
                                                <span className="text-white/50 text-[9px] uppercase font-bold tracking-wider">Model</span>
                                                <span className="text-slate-300 text-[9px] truncate max-w-[90px]" title={fvModel}>{fvModel}</span>
                                            </div>
                                        )}
                                    </div>
                                );
                                handleMouseEnter(e, tooltipContent);
                            }}
                            onMouseLeave={() => setHoveredIndicator(null)}
                            className="p-1 text-slate-500 hover:text-violet-400 transition-colors bg-black/5 hover:bg-violet-500/10 rounded-full"
                        >
                            <Info size={13} strokeWidth={2.5} />
                        </button>
                    </motion.div>
                )}`;
        
        let before = content.substring(0, startIndex);
        let after = content.substring(actualEnd);
        fs.writeFileSync(path, before + replacement + after);
        console.log('Success');
    }
}
