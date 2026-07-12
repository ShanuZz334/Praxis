/**
 * @file FundamentalPage.jsx
 * @purpose Main Controller for the Fundamental Analysis Dashboard.
 * @responsibilities
 * - Renders GlobalHeader for the Fundamental module.
 * - Renders FundamentalGrid (empty — ready for real data).
 * - Manages view/sort/search controls.
 * @key_exports
 * - FundamentalPage (Default Component)
 * @lifecycle
 * - Route: /dashboard/fundamental
 */

import React, { useState } from "react";
import GlobalHeader from "@/shared/components/ui/GlobalHeader/GlobalHeader";
import FundamentalGrid from "./FundamentalGrid";
import FundamentalModal from "./FundamentalModal";
import UiverseDropdown from '@/shared/components/ui/UiverseDropdown';
import { FO_INDICES, FO_EQUITIES } from '@/shared/utils/foInstruments';
import { useFundamentalsData } from '../api/useFundamentalsData';

// Reusable component for input fields (defined outside to prevent focus loss)
const OverrideInput = ({ label, overrideKey, value, onChange }) => (
    <div className="flex flex-col gap-1">
        <label className="text-[10px] text-text-tertiary uppercase font-bold tracking-wider">{label}</label>
        <input 
            type="number"
            step="0.01"
            value={value || ""}
            onChange={(e) => onChange(overrideKey, e.target.value ? parseFloat(e.target.value) : "")}
            className="bg-background-surface border border-border-subtle rounded px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-blue-500 w-32"
        />
    </div>
);

export default function FundamentalPage() {
  const [viewMode, setViewMode] = useState("sectioned");
  const [sortMode, setSortMode] = useState("score_desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCard, setSelectedCard] = useState(null);

  const cards = [
    { id: "pe_ratio", category: "Valuation" },
    { id: "forward_pe", category: "Valuation" },
    { id: "pb_ratio", category: "Valuation" },
    { id: "earnings_yield", category: "Valuation" },
    { id: "market_cap_gdp", category: "Market Health" },
    { id: "dividend_yield", category: "Market Health" },
    { id: "earnings_trend", category: "Market Health" },
    { id: "fii_dii_flow", category: "Market Health" },
    { id: "eps_growth", category: "Growth" },
    { id: "revenue_growth", category: "Growth" },
    { id: "profit_growth", category: "Growth" },
    { id: "gdp_growth", category: "Growth" },
    { id: "roe", category: "Profitability" },
    { id: "roce", category: "Profitability" },
    { id: "net_margin", category: "Profitability" },
    { id: "operating_margin", category: "Profitability" },
    { id: "debt_to_equity", category: "Financial Health" },
    { id: "interest_coverage", category: "Financial Health" },
    { id: "free_cash_flow", category: "Financial Health" },
    { id: "current_ratio", category: "Financial Health" },
  ];

  const categories = [
      { label: "Indices", value: "Indices" },
      { label: "Companies", value: "Companies" }
  ];

  const [selectedCategory, setSelectedCategory] = useState("Companies");
  const [selectedInstrument, setSelectedInstrument] = useState("NSE_EQ|INE467B01029"); // Default TCS
  
  const filteredInstruments = selectedCategory === "Indices" ? FO_INDICES : FO_EQUITIES;

  // Master state for manual overrides
  const [manualOverrides, setManualOverrides] = useState({
      // Valuation
      pe_ratio: 20.15,
      pe_hist: 25.0,        // Historical avg PE — manual (not in Upstox)
      pe_sector: 22.0,      // Sector PE — manual (not in Upstox)
      forward_pe: 18.5,
      projected_eps: 120.5, // Projected EPS (Next 12M) — manual (not in Upstox)
      pb_ratio: 2.5,
      earnings_yield: 4.8,
      // Market Health
      market_cap_gdp: 95.0,
      dividend_yield: 1.2,
      earnings_trend: 10.0,
      fii_dii_flow: 500,
      // Growth
      eps_growth: 12.5,
      revenue_growth: 15.0,
      profit_growth: 14.2,
      gdp_growth: 6.5,
      // Profitability
      roe: 18.5,
      roce: 22.0,
      net_margin: 15.5,
      operating_margin: 18.0,
      operating_profit: 5000,
      revenue: 30000,
      // Financial Health
      debt_to_equity: 0.4,
      total_debt: 8000,
      shareholders_equity: 20000,
      free_cash_flow: 1500,
      operating_cf: 3000,
      capex: 1500,
      current_ratio: 1.5,
      current_assets: 15000,
      current_liabilities: 10000,
      interest_coverage: 8.0,
      ebit: 4000,
      interest_expense: 500,
  });

  const handleOverrideChange = (key, val) => {
      setManualOverrides(prev => ({ ...prev, [key]: val }));
      setManualLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  };

  // Track when a manual override was last changed
  const [manualLastUpdated, setManualLastUpdated] = React.useState('--:--');

  // Auto-update instrument when category changes
  React.useEffect(() => {
      if (filteredInstruments.length > 0 && !filteredInstruments.find(i => i.value === selectedInstrument)) {
          setSelectedInstrument(filteredInstruments[0].value);
      }
  }, [selectedCategory, filteredInstruments, selectedInstrument]);

  const { data: fundamentalsData, loading, error, lastUpdated } = useFundamentalsData(selectedInstrument);



  const fundamentalManualForm = (
      <div className="w-full h-full">
          <div className="flex items-center justify-between gap-2 mb-4 border-b border-border-default pb-2 pr-8 md:pr-10">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Manual Data Overrides</span>
              <div className="flex gap-2 md:gap-3">
                  <span className="text-[9px] md:text-[10px] px-2 py-0.5 rounded border border-border-default bg-background-surface text-blue-400 font-mono shadow-sm">
                    {selectedCategory}
                  </span>
                  {selectedInstrument && (
                      <span className="text-[9px] md:text-[10px] px-2 py-0.5 rounded border border-border-default bg-background-surface text-emerald-400 font-mono shadow-sm">
                        {filteredInstruments.find(i => i.value === selectedInstrument)?.label || selectedInstrument.replace(/_/g, ' ')}
                      </span>
                  )}
              </div>
          </div>
          <p className="text-[10px] text-text-secondary mb-4">
              When Upstox does not provide data for a specific metric, it falls back to the manual overrides configured here.
          </p>
          
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              {/* Valuation */}
              <div className="space-y-2">
                  <div className="text-xs font-bold text-blue-500 mb-2">Valuation</div>
                  {selectedCategory !== "Indices" && (
                      <OverrideInput 
                          label="Forward P/E" 
                          overrideKey="forward_pe" 
                          value={manualOverrides.forward_pe}
                          onChange={handleOverrideChange}
                      />
                  )}
              </div>
          </div>
      </div>
  );

  return (
    <div className="p-4 md:p-6 pb-32 animate-in fade-in duration-500 max-w-[1600px] mx-auto min-h-screen">

      {/* HEADER SECTION */}
      <GlobalHeader
        title="Fundamental Composite"
        score={0}
        prevScore={0}
        gauge={{ label: "—", color: "#64748B" }}
        regime={{ label: "—", description: "No data loaded", color: "#64748B" }}
        integrity={{ coverage: "—", source: "—", freshness: "—" }}
        infoContent={fundamentalManualForm}
        sections={[]}
        tailwinds={[]}
        risks={[]}
        totalCredits={0}
        cards={[]}
        selectedCategory={selectedCategory}
        manualOverrides={manualOverrides}
        onOverrideChange={handleOverrideChange}
        controls={{
          search: searchQuery,
          onSearchChange: setSearchQuery,
          viewMode,
          onViewChange: setViewMode,
          sortMode,
          onSortChange: setSortMode,
          customComponent: (
            <>
                <UiverseDropdown 
                    options={categories} 
                    value={selectedCategory} 
                    onChange={setSelectedCategory} 
                />
                <UiverseDropdown 
                    options={filteredInstruments} 
                    value={selectedInstrument} 
                    onChange={setSelectedInstrument} 
                />
                {loading && <div className="text-sm text-text-secondary animate-pulse shrink-0 ml-2">Loading...</div>}
                {error && <div className="text-sm text-red-500 shrink-0 ml-2">Failed to load data</div>}
            </>
          )
        }}
      />

      {/* DETAILED MODAL */}
      <FundamentalModal
        open={!!selectedCard}
        onClose={() => setSelectedCard(null)}
        card={selectedCard}
      />

      {/* DATA GRID — empty until real data is wired */}
      <div className="mt-8">
        <FundamentalGrid
          cards={cards}
          viewMode={viewMode}
          sortMode={sortMode}
          onCardClick={setSelectedCard}
          controls={{
            search: searchQuery,
            onSearchChange: setSearchQuery,
            viewMode,
            onViewChange: setViewMode,
            sortMode,
            onSortChange: setSortMode
          }}
          data={fundamentalsData}
          selectedCategory={selectedCategory}
          manualOverrides={manualOverrides}
          lastUpdated={lastUpdated}
          manualLastUpdated={manualLastUpdated}
        />
      </div>
    </div>
  );
}
