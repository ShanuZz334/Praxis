import React from "react";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const MODULE_ROUTES = {
    fundamental: "/dashboard/fundamental",
    technical: "/dashboard/technical",
    options: "/dashboard/options",
    events: "/dashboard/events",
    global: "/dashboard/globalstructure",
    sentiment: "/dashboard/fundamental",
};

const getModuleIcon = (id) => {
    switch (id) {
        case "fundamental": return <i className="bx bxs-bank text-base"></i>;
        case "technical": return <i className="bx bx-line-chart text-base"></i>;
        case "options": return <i className="bx bxs-zap text-base"></i>;
        case "events": return <i className="bx bx-calendar-event text-base"></i>;
        case "global": return <i className="bx bx-globe text-base"></i>;
        case "sentiment": return <i className="bx bx-heart text-base"></i>;
        default: return <i className="bx bx-cube-alt text-base"></i>;
    }
};

export default function MobileAnalysisModules({
    snapshots = {}
}) {
    const navigate = useNavigate();
    // We map snapshots to the array format needed for rendering
    // Fallback data ensures it matches mockup if data is missing
    const modules = [
        {
            id: "fundamental",
            title: "Fundamental",
            credits: 277,
            status: snapshots.fundamental?.regime || "Balanced",
            score: snapshots.fundamental?.score || 53,
            color: snapshots.fundamental?.color || "#94A3B8"
        },
        {
            id: "technical",
            title: "Technical",
            credits: 777,
            status: snapshots.technical?.trend || "Improving",
            score: snapshots.technical?.score || 58,
            color: snapshots.technical?.color || "#4ADE80"
        },
        {
            id: "options",
            title: "Options",
            credits: 96,
            status: snapshots.options?.positioning || "Improving",
            score: snapshots.options?.score || 56,
            color: snapshots.options?.color || "#4ADE80"
        },
        {
            id: "events",
            title: "Events",
            credits: 56,
            status: snapshots.events?.nextCatalyst || "Positive",
            score: snapshots.events?.score || 70,
            color: snapshots.events?.color || "#4ADE80"
        },
        {
            id: "global",
            title: "Foreign Markets",
            credits: 68,
            status: snapshots.global?.usTrend || "Positive",
            score: snapshots.global?.score || 68,
            color: snapshots.global?.color || "#1E1BFF"
        }
    ];

    return (
        <div className="mb-5">
            <div className="flex justify-between items-center mb-3 px-1">
                <h3 className="text-text-primary text-[11px] font-semibold tracking-wider uppercase">Analysis Modules</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-2.5">
                {modules.map((mod) => (
                    <div 
                        key={mod.id} 
                        onClick={() => navigate(MODULE_ROUTES[mod.id] || "/dashboard/home")}
                        className="bg-background-card rounded-2xl p-3 border border-border-default shadow-sm flex flex-col justify-between cursor-pointer active:scale-95 transition-transform duration-200"
                    >
                        {/* Top row */}
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-1.5">
                                <div style={{ color: mod.color }}>
                                    {getModuleIcon(mod.id)}
                                </div>
                                <span className="text-text-primary text-[11px] font-semibold leading-tight">{mod.title}</span>
                            </div>
                            <div className="bg-background-surface border border-border-subtle rounded px-1 py-0.5 text-text-secondary text-[9px] font-mono shrink-0">
                                {mod.credits}
                            </div>
                        </div>

                        {/* Bottom Row */}
                        <div>
                            <div className="flex justify-between items-end mb-1">
                                <span className="text-[9px] font-medium leading-tight" style={{ color: mod.color }}>
                                    {mod.status}
                                </span>
                                <div className="flex items-center gap-0.5 text-text-secondary text-[9px]">
                                    <span>{Math.round(mod.score)}/100</span>
                                    <ArrowRight className="w-2.5 h-2.5" />
                                </div>
                            </div>
                            <div className="h-0.5 bg-border-subtle rounded-full overflow-hidden w-full">
                                <div 
                                    className="h-full rounded-full transition-all duration-500" 
                                    style={{ width: `${mod.score}%`, backgroundColor: mod.color }}
                                ></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
