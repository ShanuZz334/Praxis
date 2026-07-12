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
import CompanySummaryWidget from "./CompanySummaryWidget";
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
      pe_ratio: null,
      pe_hist: null,
      pe_sector: null,
      forward_pe: null,
      projected_eps: null,
      pb_ratio: null,
      pb_hist: null,
      pb_sector: null,
      earnings_yield: null,
      ey_hist: null,
      bond_yield: null,
      // Market Health
      market_cap_gdp: null,
      dividend_yield: null,
      fii_dii_flow: null,
      earnings_trend: null,
      // Growth
      eps_growth: null,
      gdp_growth: null,
      revenue_growth: null,
      profit_growth: null,
      // Profitability & Health
      roe: null,
      roce: null,
      net_margin: null,
      operating_margin: null,
      operating_profit: null,
      revenue: null,
      debt_to_equity: null,
      total_debt: null,
      shareholders_equity: null,
      current_ratio: null,
      current_assets: null,
      current_liabilities: null,
      interest_coverage: null,
      ebit: null,
      interest_expense: null,
      free_cash_flow: null,
      operating_cf: null,
      capex: null,
      face_value: null,
      high_low: null,
      current_price: null,
      book_value: null,
  });

  const handleOverrideChange = (key, val) => {
      setManualOverrides(prev => ({ ...prev, [key]: val }));
      setManualLastUpdated(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));
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

  // --- Dynamic Hiding Logic for Fallbacks ---
  const extractRatioExists = (names) => {
      const ratiosArray = Array.isArray(fundamentalsData?.ratios) ? fundamentalsData.ratios : [];
      const obj = ratiosArray.find(r => names.some(n => r.name?.toLowerCase() === n.toLowerCase()));
      return obj?.company_value !== undefined && obj?.company_value !== null && obj?.company_value !== '';
  };
  
  const hasMarketCap = (fundamentalsData?.company_profile?.market_cap !== undefined && fundamentalsData?.company_profile?.market_cap !== null && fundamentalsData?.company_profile?.market_cap !== '') || extractRatioExists(['market_cap']);
  const hasBookValue = extractRatioExists(['book value', 'bvps']);
  const hasFaceValue = fundamentalsData?.company_profile?.face_value !== undefined && fundamentalsData?.company_profile?.face_value !== null && fundamentalsData?.company_profile?.face_value !== '';
  const hasPeRatio = extractRatioExists(['p/e', 'pe', 'pe ratio']);
  
  const incomeStatement = fundamentalsData?.income?.full_statement || [];
  const validTrendPeriods = incomeStatement.filter(p => !isNaN(parseFloat(p?.['EPS - Basic'])));
  const hasEarningsTrend = validTrendPeriods.length >= 2;
  // ------------------------------------------

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
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-6">
              {/* Company Snapshot */}
              <div className="space-y-2">
                  <div className="text-xs font-bold text-emerald-500 mb-2">Company Snapshot</div>
                  {!hasMarketCap && (
                      <OverrideInput 
                          label="Market Cap" 
                          overrideKey="market_cap" 
                          value={manualOverrides.market_cap}
                          onChange={handleOverrideChange}
                      />
                  )}
                  {!hasBookValue && (
                      <OverrideInput 
                          label="Book Value" 
                          overrideKey="book_value" 
                          value={manualOverrides.book_value}
                          onChange={handleOverrideChange}
                      />
                  )}
                  {!hasFaceValue && (
                      <OverrideInput 
                          label="Face Value" 
                          overrideKey="face_value" 
                          value={manualOverrides.face_value}
                          onChange={handleOverrideChange}
                      />
                  )}
                  {!hasPeRatio && (
                      <OverrideInput 
                          label="Stock P/E" 
                          overrideKey="pe_ratio" 
                          value={manualOverrides.pe_ratio}
                          onChange={handleOverrideChange}
                      />
                  )}
              </div>

              {/* Dividends */}
              <div className="space-y-2">
                  <div className="text-xs font-bold text-pink-500 mb-2">Dividends</div>
                  <OverrideInput 
                      label="Dividend Yield (%)" 
                      overrideKey="dividend_yield" 
                      value={manualOverrides.dividend_yield}
                      onChange={handleOverrideChange}
                  />
              </div>

              {/* Trends & Flows */}
              <div className="space-y-2">
                  <div className="text-xs font-bold text-yellow-500 mb-2">Trends & Flows</div>
                  {!hasEarningsTrend && (
                      <OverrideInput 
                          label="Earnings Trend (CAGR %)" 
                          overrideKey="earnings_trend" 
                          value={manualOverrides.earnings_trend}
                          onChange={handleOverrideChange}
                      />
                  )}
                  <OverrideInput 
                      label="FII Flow (₹ Cr)" 
                      overrideKey="fii_flow" 
                      value={manualOverrides.fii_flow}
                      onChange={handleOverrideChange}
                  />
                  <OverrideInput 
                      label="DII Flow (₹ Cr)" 
                      overrideKey="dii_flow" 
                      value={manualOverrides.dii_flow}
                      onChange={handleOverrideChange}
                  />
              </div>

              {/* Valuation */}
              <div className="space-y-2">
                  <div className="text-xs font-bold text-blue-500 mb-2">Valuation</div>
                  {selectedCategory !== "Indices" && (
                      <>
                          <OverrideInput 
                              label="Forward P/E" 
                              overrideKey="forward_pe" 
                              value={manualOverrides.forward_pe}
                              onChange={handleOverrideChange}
                          />
                      </>
                  )}
              </div>

              {/* Macro Indicators */}
              <div className="space-y-2">
                  <div className="text-xs font-bold text-purple-500 mb-2">Macro Indicators</div>
                  <OverrideInput 
                      label="GDP Growth (%)" 
                      overrideKey="gdp_growth" 
                      value={manualOverrides.gdp_growth}
                      onChange={handleOverrideChange}
                  />
                  <OverrideInput 
                      label="Market Cap to GDP (%)" 
                      overrideKey="market_cap_gdp" 
                      value={manualOverrides.market_cap_gdp}
                      onChange={handleOverrideChange}
                  />
                  <OverrideInput 
                      label="10Y Bond Yield" 
                      overrideKey="bond_yield" 
                      value={manualOverrides.bond_yield}
                      onChange={handleOverrideChange}
                  />
              </div>

              {/* Growth */}
              <div className="space-y-2">
                  <div className="text-xs font-bold text-orange-500 mb-2">Growth</div>
                  <OverrideInput 
                      label="EPS Growth (%)" 
                      overrideKey="eps_growth" 
                      value={manualOverrides.eps_growth}
                      onChange={handleOverrideChange}
                  />
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

      {selectedCategory !== "Indices" && (
        <CompanySummaryWidget 
            data={fundamentalsData}
            manualOverrides={manualOverrides}
            selectedInstrument={selectedInstrument}
        />
      )}

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
