/**
 * @file MasterDashboard.jsx
 * @purpose The central command center for the Praxis Composite dashboard.
 * @responsibilities
 * - Renders the GlobalHeader with the master composite score.
 * - Renders MobileDashboardLayout for mobile viewports.
 * - All sub-panels below the header are cleared — ready for real data.
 * @key_exports
 * - MasterDashboard (Default Component)
 * @lifecycle
 * - Main route component for the Dashboard.
 */

import React from "react";

// Shared UI
import GlobalHeader from "@/shared/components/ui/GlobalHeader/GlobalHeader";
import { useDashboardContext } from "@/shared/context/DashboardContext";
import UiverseDropdown from '@/shared/components/ui/UiverseDropdown';


import LiveMarketTicker from "./LiveMarketTicker";

// =============================
// Main Component
// =============================

export default function MasterDashboard() {
    const {
        selectedCategory, setSelectedCategory,
        selectedInstrument, setSelectedInstrument,
        selectedExpiry, setSelectedExpiry,
        expiries,
        filteredInstruments
    } = useDashboardContext();

    const categories = [
        { label: "Indices", value: "Indices" },
        { label: "Companies", value: "Companies" }
    ];

    const score = 0;
    const gauge = { label: "—", color: "#64748B" };
    const regime = { label: "—", description: "No data loaded", color: "#64748B", confidence: 0 };

    const sections = [
        { id: "tech",  label: "TECH",  normalizedScore: 0, rawScore: 0 },
        { id: "fund",  label: "FUND",  normalizedScore: 0, rawScore: 0 },
        { id: "opt",   label: "OPT",   normalizedScore: 0, rawScore: 0 },
        { id: "glob",  label: "GLOB",  normalizedScore: 0, rawScore: 0 },
        { id: "evt",   label: "EVT",   normalizedScore: 0, rawScore: 0 },
    ];

    return (
        <div className="block px-4 sm:px-6 pt-2 pb-32 animate-in fade-in duration-500 max-w-[1600px] mx-auto h-full space-y-4 md:space-y-6">
            {/* DESKTOP VIEW ONLY */}

            {/* Global Header / Composite Gauge */}
            <GlobalHeader
                title="Praxis Composite"
                score={score}
                prevScore={0}
                gauge={gauge}
                regime={regime}
                integrity={{ coverage: "—", source: "—", freshness: "—" }}
                sections={sections}
                tailwinds={[]}
                risks={[]}
                totalCredits={0}
                enableBreakdown={false}
                cards={[]}
                controls={{
                    customComponent: (
                        <div className="flex flex-col md:flex-row items-center gap-2">
                            {/* Indices vs Companies Toggle */}
                            <div className="flex bg-background-surface rounded-lg p-1 h-10 border border-border-default shadow-sm w-full md:w-auto">
                                {categories.map((c) => (
                                    <button
                                        key={c.value}
                                        onClick={() => setSelectedCategory(c.value)}
                                        className={`flex-1 md:flex-none flex items-center justify-center px-4 h-full rounded-md text-sm font-bold transition-all ${
                                            selectedCategory === c.value
                                                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                                : "text-text-secondary hover:text-text-primary hover:bg-white/5 border border-transparent"
                                        }`}
                                    >
                                        {c.label}
                                    </button>
                                ))}
                            </div>
                            
                            {/* Instrument Selector */}
                            <div className="w-full md:w-64 z-50">
                                <UiverseDropdown
                                    value={selectedInstrument}
                                    onChange={(val) => setSelectedInstrument(val)}
                                    options={filteredInstruments}
                                    placeholder={`Select ${selectedCategory}...`}
                                    searchPlaceholder="Search instruments..."
                                />
                            </div>

                            {/* Expiry Selector (Optional, if expiries exist for this instrument) */}
                            {expiries.length > 0 && (
                                <div className="w-full md:w-48 z-40">
                                    <UiverseDropdown
                                        value={selectedExpiry}
                                        onChange={(val) => setSelectedExpiry(val)}
                                        options={expiries.map(exp => ({
                                            label: new Date(exp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                                            value: exp
                                        }))}
                                        placeholder="Select Expiry..."
                                        searchPlaceholder="Search expiry..."
                                    />
                                </div>
                            )}
                        </div>
                    )
                }}
            />

            {/* Sub-panels cleared — ready for real data */}

        </div>
    );
}
