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

export default function FundamentalPage() {
  const [viewMode, setViewMode] = useState("sectioned");
  const [sortMode, setSortMode] = useState("score_desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCard, setSelectedCard] = useState(null);

  const cards = [
    { id: "pe_ratio", category: "Valuation" },
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
      forward_pe: 18.5,
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
        score={0}
        prevScore={0}
        gauge={{ label: "—", color: "#64748B" }}
        regime={{ label: "—", description: "No data loaded", color: "#64748B" }}
      free_cash_flow: 1500,
      current_ratio: 1.5
  });

  const handleOverrideChange = (key, val) => {
      setManualOverrides(prev => ({ ...prev, [key]: val }));
  };

  // Auto-update instrument when category changes
  React.useEffect(() => {
      if (filteredInstruments.length > 0 && !filteredInstruments.find(i => i.value === selectedInstrument)) {
          setSelectedInstrument(filteredInstruments[0].value);
      }
  }, [selectedCategory, filteredInstruments, selectedInstrument]);

  const { data: fundamentalsData, loading, error, lastUpdated } = useFundamentalsData(selectedInstrument);

  // Reusable component for input fields
  const OverrideInput = ({ label, overrideKey }) => (
      <div className="flex flex-col gap-1">
          <label className="text-[10px] text-text-tertiary uppercase font-bold tracking-wider">{label}</label>
          <input 
              type="number"
              step="0.01"
              value={manualOverrides[overrideKey] || ""}
              onChange={(e) => handleOverrideChange(overrideKey, parseFloat(e.target.value))}
              className="bg-background-surface border border-border-subtle rounded px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-blue-500"
          />
      </div>
  );

  const fundamentalManualForm = (
      <div className="w-full h-full">
          <div className="flex items-center justify-between gap-2 mb-4 border-b border-border-default pb-2">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Manual Data Overrides</span>
              <div className="flex gap-2 md:gap-3">
                  <span className="text-[9px] md:text-[10px] px-2 py-0.5 rounded border border-border-default bg-background-surface text-blue-400 font-mono shadow-sm">
                    {selectedCategory}
                  </span>
                  {selectedInstrument && (
                      <span className="text-[9px] md:text-[10px] px-2 py-0.5 rounded border border-border-default bg-background-surface text-emerald-400 font-mono shadow-sm">
                        {selectedInstrument.replace(/_/g, ' ')}
                      </span>
                  )}
              </div>
          </div>
          <p className="text-[10px] text-text-secondary mb-4">
              When Upstox does not provide data for a specific metric, it falls back to the manual overrides configured here.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-4">
                  <OverrideInput label="P/B Ratio" overrideKey="pb_ratio" />
                  {selectedCategory !== "Indices" && (
                      <>
                          <OverrideInput label="Forward P/E" overrideKey="forward_pe" />
                          <OverrideInput label="Earnings Yield" overrideKey="earnings_yield" />
                      </>
                  )}
              </div>

              {/* Market Health */}
              <div className="space-y-2">
                  <div className="text-xs font-bold text-blue-500 mb-2">Market Health</div>
                  <OverrideInput label="Market Cap / GDP" overrideKey="market_cap_gdp" />
                  <OverrideInput label="Dividend Yield" overrideKey="dividend_yield" />
                  <OverrideInput label="FII/DII Flow" overrideKey="fii_dii_flow" />
                  {selectedCategory !== "Indices" && (
                      <OverrideInput label="Earnings Trend" overrideKey="earnings_trend" />
                  )}
              </div>

              {/* Growth */}
              <div className="space-y-2">
                  <div className="text-xs font-bold text-blue-500 mb-2">Growth</div>
                  <OverrideInput label="EPS Growth" overrideKey="eps_growth" />
                  <OverrideInput label="GDP Growth" overrideKey="gdp_growth" />
              <div className="space-y-2">
                  <div className="text-xs font-bold text-blue-500 mb-2">Growth</div>
                  <OverrideInput label="EPS Growth" overrideKey="eps_growth" />
                  <OverrideInput label="GDP Growth" overrideKey="gdp_growth" />
                  {selectedCategory !== "Indices" && (
                      <>
                          <OverrideInput label="Revenue Growth" overrideKey="revenue_growth" />
                          <OverrideInput label="Profit Growth" overrideKey="profit_growth" />
                      </>
                  )}
              </div>

              {/* Profitability & Financial Health (Companies Only) */}
              {selectedCategory !== "Indices" && (
                  <div className="space-y-2">
                      <div className="text-xs font-bold text-blue-500 mb-2">Profit & Health</div>
                      <OverrideInput label="ROE" overrideKey="roe" />
                      <OverrideInput label="ROCE" overrideKey="roce" />
                      <OverrideInput label="Debt to Equity" overrideKey="debt_to_equity" />
                      <OverrideInput label="Free Cash Flow" overrideKey="free_cash_flow" />
                  </div>
              )}
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
                      
                      <OverrideInput label="Operating Margin" overrideKey="operating_margin" />
                      <OverrideInput label="Operating Profit" overrideKey="operating_profit" />
                      <OverrideInput label="Revenue" overrideKey="revenue" />
                      
                      <OverrideInput label="Debt to Equity" overrideKey="debt_to_equity" />
                      <OverrideInput label="Total Debt" overrideKey="total_debt" />
                      <OverrideInput label="Shareholders Equity" overrideKey="shareholders_equity" />
                      
                      <OverrideInput label="Current Ratio" overrideKey="current_ratio" />
                      <OverrideInput label="Current Assets" overrideKey="current_assets" />
                      <OverrideInput label="Current Liabilities" overrideKey="current_liabilities" />
                      
                      <OverrideInput label="Interest Coverage" overrideKey="interest_coverage" />
                      <OverrideInput label="EBIT" overrideKey="ebit" />
                      <OverrideInput label="Interest Expense" overrideKey="interest_expense" />
                      
                      <OverrideInput label="Free Cash Flow" overrideKey="free_cash_flow" />
                      <OverrideInput label="Operating Cash Flow" overrideKey="operating_cf" />
                      <OverrideInput label="Capital Expenditure" overrideKey="capex" />
                  </div>
              )}
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