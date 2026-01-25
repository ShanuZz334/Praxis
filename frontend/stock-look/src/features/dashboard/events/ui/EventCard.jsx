import React from "react";
import Card from "@/shared/components/common/Card";
import { format, parseISO } from 'date-fns';

export default function EventCard({ event, onClick }) {
    const {
        title,
        date,
        category,
        impactScore,
        consensus,
        previous,
        marketSensitivity
    } = event;

    const scorePct = (impactScore / 10) * 100;

    // Styling based on score
    let scoreColor = "bg-emerald-500";
    let borderColor = "group-hover:border-white/20";

    if (impactScore >= 9) {
        scoreColor = "bg-red-500";
        borderColor = "group-hover:border-red-500/50";
    } else if (impactScore >= 7) {
        scoreColor = "bg-orange-500";
        borderColor = "group-hover:border-orange-500/50";
    }

    const eventDate = parseISO(date);

    return (
        <Card className={`relative group transition-all duration-300 ${borderColor} cursor-pointer`} onClick={onClick}>
            <div className="p-5 space-y-4">

                {/* TOP ROW: Category & Date */}
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-white/40 bg-white/5 px-2 py-0.5 rounded">
                            {category}
                        </span>
                        {marketSensitivity === 'High' && (
                            <span className="text-[10px] uppercase font-bold tracking-wider text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded">
                                High Impact
                            </span>
                        )}
                    </div>
                    <div className="text-right">
                        <div className="text-xs font-bold text-white/90">{format(eventDate, 'MMM dd')}</div>
                        <div className="text-[10px] text-white/50">{format(eventDate, 'HH:mm')}</div>
                    </div>
                </div>

                {/* TITLE */}
                <div>
                    <div className="text-lg font-bold text-white leading-tight mb-1">{title}</div>
                    <div className="flex items-center gap-2 text-xs text-white/40">
                        <span>Prev: {previous}</span>
                        <span>•</span>
                        <span>Est: <span className="text-white/80">{consensus}</span></span>
                    </div>
                </div>

                {/* IMPACT BAR */}
                <div className="space-y-1">
                    <div className="flex justify-between text-[10px] uppercase tracking-wider text-white/40">
                        <span>Impact Score</span>
                        <span className="font-mono text-white/60">{impactScore.toFixed(1)}/10</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${scoreColor} rounded-full transition-all duration-500`}
                            style={{ width: `${scorePct}%` }}
                        />
                    </div>
                </div>

            </div>

            {/* HOVER GLOW */}
            <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none ${scoreColor.replace('bg-', 'bg-')}`} />
        </Card>
    );
}
