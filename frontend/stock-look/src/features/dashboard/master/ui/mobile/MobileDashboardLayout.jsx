import React, { useContext } from "react";
import { UserContext } from "@/shared/context/UserContext";
import MobileCompositeCard from "./MobileCompositeCard";
import MobileSignalIntegrity from "./MobileSignalIntegrity";
import MobileAnalysisModules from "./MobileAnalysisModules";

export default function MobileDashboardLayout({
    stockyScore = 57,
    prevScore = 58,
    masterGauge,
    masterRegime,
    snapshots,
    totalCredits = 1347,
    signalCounts = { bulls: 88, bears: 27, neutrals: 185 },
    integrity = { coverage: "5/5 Engines", freshness: "Realtime" }
}) {
    // Determine delta
    const deltaRaw = stockyScore - prevScore;
    const { user } = useContext(UserContext);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning,";
        if (hour < 18) return "Good afternoon,";
        return "Good evening,";
    };

    return (
        <div className="bg-background-app min-h-screen text-text-primary font-sans px-3 pt-0 pb-24 overflow-x-hidden">
            <div className="mb-2 px-1">
                <span className="text-[11px] text-text-secondary font-medium tracking-wide">{getGreeting()}</span>
                <div className="text-base font-bold text-text-primary tracking-wide">
                    {user?.fullName ? (user.fullName.split(" ")[1] || user.fullName.split(" ")[0]) : "Trader"}
                </div>
            </div>

            <MobileCompositeCard 
                score={stockyScore}
                regime={masterRegime?.label || "ACCUMULATE"}
                confidence={masterRegime?.confidence || 96}
                deltaRaw={deltaRaw}
                gaugeColor={masterGauge?.color || "#4ADE80"}
            />
            
            <MobileSignalIntegrity 
                totalCredits={totalCredits}
                bulls={signalCounts.bulls}
                bears={signalCounts.bears}
                neutrals={signalCounts.neutrals}
                coverage={integrity.coverage}
                freshness={integrity.freshness}
            />
            
            <MobileAnalysisModules snapshots={snapshots} />
        </div>
    );
}
