import React from "react";

export default function MobileSignalIntegrity({
    coverage = "5/5 Engines",
    freshness = "Realtime",
    totalCredits = 1347,
    bulls = 88,
    bears = 27,
    neutrals = 185
}) {
    return (
        <div className="mb-4">
            <h3 className="text-text-primary text-[11px] font-semibold tracking-wider mb-2.5 px-1 uppercase">Signal Integrity</h3>
            <div className="bg-background-card rounded-2xl p-3.5 border border-border-default shadow-md">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[rgba(74,222,128,0.1)] flex items-center justify-center">
                            <i className="bx bx-radar text-[#4ADE80] text-sm"></i>
                        </div>
                        <div>
                            <div className="text-text-primary text-[11px] font-semibold">Monitor Active</div>
                            <div className="text-text-secondary text-[9px]">{freshness}</div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-text-secondary text-[10px] mb-1">
                            Coverage <span className="text-text-primary ml-1">{coverage}</span>
                        </div>
                        <div className="h-1 w-20 bg-background-surface rounded-full overflow-hidden ml-auto border border-border-subtle">
                            <div className="h-full bg-[#1E1BFF] w-full rounded-full"></div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-1 pt-3 border-t border-border-default">
                    <div className="text-center">
                        <div className="text-text-secondary text-[8px] uppercase tracking-wider mb-0.5">R Credits</div>
                        <div className="text-text-primary text-[15px] font-bold">{totalCredits}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-[#4ADE80] text-[8px] uppercase tracking-wider mb-0.5">Bulls</div>
                        <div className="text-[#4ADE80] text-[15px] font-bold">{bulls}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-[#EF4444] text-[8px] uppercase tracking-wider mb-0.5">Bears</div>
                        <div className="text-[#EF4444] text-[15px] font-bold">{bears}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-[#F59E0B] text-[8px] uppercase tracking-wider mb-0.5">Neutral</div>
                        <div className="text-[#F59E0B] text-[15px] font-bold">{neutrals}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
