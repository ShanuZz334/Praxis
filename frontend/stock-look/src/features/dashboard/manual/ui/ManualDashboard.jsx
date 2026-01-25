import React from "react";
import { useNavigate } from "react-router-dom";
import { MANUAL_SECTIONS } from "../data/manualData";
import { HelpCircle } from "lucide-react";

export default function ManualDashboard() {
    const navigate = useNavigate();

    return (
        <div className="p-8 pb-32 animate-in fade-in duration-500 max-w-7xl mx-auto min-h-screen text-white/90">

            {/* Header - Subtle Info Bar */}
            <div className="mb-10 border-b border-white/5 pb-6 flex items-start gap-2.5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <HelpCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <p className="text-sm text-white/50 font-medium leading-relaxed">
                    The comprehensive knowledge base for Stocky's intelligence engines, metrics, and risk frameworks.
                    Reference each module to understand the underlying logic and system behavior.
                </p>
            </div>

            {/* 8 Sections Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {MANUAL_SECTIONS.map((section) => (
                    <div
                        key={section.id}
                        onClick={() => navigate(`/dashboard/manual/${section.id}`)}
                        className="
                            relative
                            h-56
                            rounded-2xl
                            bg-[#0b1220] 
                            border border-white/5 
                            shadow-[0_8px_24px_rgba(0,0,0,0.45)]
                            hover:border-blue-500/40 
                            hover:shadow-[0_12px_32px_rgba(59,130,246,0.15)]
                            cursor-pointer 
                            transition-all duration-300
                            group
                            p-5
                            flex flex-col
                            overflow-hidden
                        "
                    >
                        {/* Inner Glow for Depth */}
                        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/3 to-transparent" />

                        <div className="relative z-10 flex flex-col h-full">
                            {/* Part 1 & 2: Heading & Overview (Fixed Height to Sync Footers) */}
                            <div className="h-[125px]">
                                <div className="flex items-center gap-3 mb-3">
                                    <section.icon className="w-6 h-6 text-blue-500/80 group-hover:text-blue-400 group-hover:scale-110 transition-all duration-300" />
                                    <h2 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors tracking-tight">
                                        {section.label}
                                    </h2>
                                </div>

                                <p className="text-white/60 text-[13px] leading-relaxed line-clamp-3">
                                    {section.overview}
                                </p>
                            </div>

                            {/* Part 3: Core Question (Synchronized) */}
                            <div className="pt-3 border-t border-white/5 flex-1 flex flex-col justify-center">
                                <p className="text-white/40 text-xs italic font-medium">
                                    "{section.coreQuestion}"
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
}
