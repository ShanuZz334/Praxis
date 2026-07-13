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

import React, { useState, useMemo } from "react";
import GlobalHeader from "@/shared/components/ui/GlobalHeader/GlobalHeader";
import FundamentalMetricsDesk from "./FundamentalMetricsDesk";
import FundamentalGrid from "./FundamentalGrid";
import FundamentalModal from "./FundamentalModal";
import IndexSummaryWidget from "./IndexSummaryWidget";
import CompanySummaryWidget from "./CompanySummaryWidget";

import { useFundamentalsData } from '../api/useFundamentalsData';
import { FundamentalContext } from './FundamentalContext';
import axiosInstance from '@/shared/utils/axiosInstance';
import { useFundamentalComposite } from '../engine/useFundamentalComposite';
import { computeCompanyComposite, computeIndexComposite, TITLE_TO_ID } from '../engine/FundamentalCompositeEngine';
import { useDashboardContext } from "@/shared/context/DashboardContext";
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

import { DebouncedOverrideInput } from "@/shared/components/ui/Inputs/DebouncedOverrideInput";
import { useManualOverrides } from "@/shared/hooks/useManualOverrides";
import { useSnapshots } from "@/shared/hooks/useSnapshots";







const DEFAULT_OVERRIDES = {
    // Valuation
    pe_ratio: null, pe_hist: null, pe_sector: null, forward_pe: null, projected_eps: null,
    pb_ratio: null, pb_hist: null, pb_sector: null, earnings_yield: null, ey_hist: null, bond_yield: null,
    // Market Health
    market_cap_gdp: null, dividend_yield: null, fii_dii_flow: null, earnings_trend: null,
    // Growth
    eps_growth: null, gdp_growth: null, revenue_growth: null, profit_growth: null,
    // Profitability & Health
    roe: null, roce: null, net_margin: null, operating_margin: null, operating_profit: null,
    revenue: null, debt_to_equity: null, total_debt: null, shareholders_equity: null,
    current_ratio: null, current_assets: null, current_liabilities: null, interest_coverage: null,
    ebit: null, interest_expense: null, free_cash_flow: null, operating_cf: null, capex: null,
    face_value: null, high_low: null, current_price: null, book_value: null,
    // Index Specific
    index_pe: null, index_pb: null, index_div_yield: null, ad_ratio: null,
    india_vix: null, index_pcr: null, index_macd: null, index_200dma: null,
};

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
    { id: "market_cap_gdp", category: "Sector" },
    { id: "dividend_yield", category: "Sector" },
    { id: "earnings_trend", category: "Sector" },
    { id: "fii_dii_flow", category: "Liquidity" },
    { id: "eps_growth", category: "Earnings" },
    { id: "revenue_growth", category: "Earnings" },
    { id: "profit_growth", category: "Earnings" },
    { id: "gdp_growth", category: "Macro" },
    { id: "roe", category: "Corporate" },
    { id: "roce", category: "Corporate" },
    { id: "net_margin", category: "Corporate" },
    { id: "operating_margin", category: "Corporate" },
    { id: "debt_to_equity", category: "Global" },
    { id: "interest_coverage", category: "Global" },
    { id: "free_cash_flow", category: "Global" },
    { id: "current_ratio", category: "Global" },
  ];

  const { selectedCategory, selectedInstrument, filteredInstruments } = useDashboardContext();

  // Standardized Manual Overrides Hook
  const { overrides: manualOverrides, lastUpdated: manualLastUpdated, handleChange: handleOverrideChange, handleClearAll } = useManualOverrides('v2', selectedInstrument, DEFAULT_OVERRIDES);

  // Context manages auto-updating instrument when category changes

  const { data: fundamentalsData, loading, error, lastUpdated } = useFundamentalsData(selectedInstrument);

  // Fundamental Composite Engine integration
  const compositeData = useFundamentalComposite(selectedCategory, selectedInstrument);

  


  // Standardized Historical Snapshots Hook
  const { historicalSnapshots } = useSnapshots(selectedInstrument);

  // --- Previous Day Composite Calculation ---
  const [prevCompositeScore, setPrevCompositeScore] = useState(0);

  React.useEffect(() => {
      if (!historicalSnapshots || Object.keys(historicalSnapshots).length === 0) {
          setPrevCompositeScore(compositeData.compositeScore); // Fallback to current if no history
          return;
      }

      // 1. Gather the latest snapshot score for each card that is BEFORE today
      const todayDate = new Date().toISOString().split('T')[0];
      const prevScores = {};
      
      for (const [cardId, snaps] of Object.entries(historicalSnapshots)) {
          // Snaps are ordered ASC by date. Find the last one strictly before today.
          const pastSnaps = snaps.filter(s => s.date && s.date < todayDate);
          if (pastSnaps.length > 0) {
              const lastSnap = pastSnaps[pastSnaps.length - 1];
              const metricId = TITLE_TO_ID[cardId];
              if (metricId && lastSnap.score !== undefined) {
                  prevScores[metricId] = lastSnap.score;
              }
          }
      }

      // 2. Compute the old composite using the historical card scores
      if (Object.keys(prevScores).length > 0) {
          const isIndex = selectedCategory === 'Indices';
          const oldRes = isIndex 
              ? computeIndexComposite(prevScores) 
              : computeCompanyComposite(prevScores);
          setPrevCompositeScore(oldRes.compositeScore);
      } else {
          setPrevCompositeScore(compositeData.compositeScore); // No historical data yet
      }
  }, [historicalSnapshots, selectedCategory, compositeData.compositeScore]);


  // ----------------------------------

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
              <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Manual Data Overrides</span>
                  <button 
                      onClick={handleClearAll}
                      className="px-2 py-0.5 bg-red-900/30 text-red-400 hover:bg-red-900/50 hover:text-red-300 rounded text-[10px] font-medium transition-colors border border-red-900/50"
                  >
                      Clear All
                  </button>
              </div>
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
          
          {selectedCategory === "Indices" ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-8">
                  <div className="space-y-3">
                      <div className="text-xs font-bold text-emerald-500 mb-3 border-b border-border-default pb-2">Core Snapshot</div>
                      {!fundamentalsData?.quote?.last_price && <DebouncedOverrideInput label="Current Level" overrideKey="current_price" value={manualOverrides.current_price} onChange={handleOverrideChange} />}
                      {!(fundamentalsData?.quote?.ohlc?.high && fundamentalsData?.quote?.ohlc?.low) && <DebouncedOverrideInput label="High / Low" overrideKey="high_low" value={manualOverrides.high_low} onChange={handleOverrideChange} />}
                      <DebouncedOverrideInput label="Index P/E (x)" overrideKey="index_pe" value={manualOverrides.index_pe} onChange={handleOverrideChange} />
                      <DebouncedOverrideInput label="Index P/B (x)" overrideKey="index_pb" value={manualOverrides.index_pb} onChange={handleOverrideChange} />
                      <DebouncedOverrideInput label="Dividend Yield (%)" overrideKey="index_div_yield" value={manualOverrides.index_div_yield} onChange={handleOverrideChange} />
                  </div>
                  
                  <div className="space-y-3">
                      <div className="text-xs font-bold text-yellow-500 mb-3 border-b border-border-default pb-2">Market Internals</div>
                      <DebouncedOverrideInput label="A/D Ratio" overrideKey="ad_ratio" value={manualOverrides.ad_ratio} onChange={handleOverrideChange} />
                      <DebouncedOverrideInput label="India VIX" overrideKey="india_vix" value={manualOverrides.india_vix} onChange={handleOverrideChange} />
                      <DebouncedOverrideInput label="Put-Call Ratio" overrideKey="index_pcr" value={manualOverrides.index_pcr} onChange={handleOverrideChange} />
                      <DebouncedOverrideInput label="MACD Histogram" overrideKey="index_macd" value={manualOverrides.index_macd} onChange={handleOverrideChange} />
                      <DebouncedOverrideInput label="% From 200 DMA" overrideKey="index_200dma" value={manualOverrides.index_200dma} onChange={handleOverrideChange} />
                      <DebouncedOverrideInput label="FII Flow (₹ Cr)" overrideKey="fii_flow" value={manualOverrides.fii_flow} onChange={handleOverrideChange} />
                      <DebouncedOverrideInput label="DII Flow (₹ Cr)" overrideKey="dii_flow" value={manualOverrides.dii_flow} onChange={handleOverrideChange} />
                  </div>

                  <div className="space-y-3">
                      <div className="text-xs font-bold text-purple-500 mb-3 border-b border-border-default pb-2">Macro Environment</div>
                      <DebouncedOverrideInput label="GDP Growth (%)" overrideKey="gdp_growth" value={manualOverrides.gdp_growth} onChange={handleOverrideChange} />
                      <DebouncedOverrideInput label="Market Cap to GDP (%)" overrideKey="market_cap_gdp" value={manualOverrides.market_cap_gdp} onChange={handleOverrideChange} />
                      <DebouncedOverrideInput label="10Y Bond Yield" overrideKey="bond_yield" value={manualOverrides.bond_yield} onChange={handleOverrideChange} />
                      <DebouncedOverrideInput label="EPS Growth (%)" overrideKey="eps_growth" value={manualOverrides.eps_growth} onChange={handleOverrideChange} />
                  </div>
              </div>
          ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-6">
                  {/* Company Snapshot */}
                  <div className="space-y-2">
                      <div className="text-xs font-bold text-emerald-500 mb-2">Company Snapshot</div>
                      {!hasMarketCap && <DebouncedOverrideInput label="Market Cap" overrideKey="market_cap" value={manualOverrides.market_cap} onChange={handleOverrideChange} />}
                      {!hasBookValue && <DebouncedOverrideInput label="Book Value" overrideKey="book_value" value={manualOverrides.book_value} onChange={handleOverrideChange} />}
                      {!hasFaceValue && <DebouncedOverrideInput label="Face Value" overrideKey="face_value" value={manualOverrides.face_value} onChange={handleOverrideChange} />}
                      {!hasPeRatio && <DebouncedOverrideInput label="Stock P/E (x)" overrideKey="pe_ratio" value={manualOverrides.pe_ratio} onChange={handleOverrideChange} />}
                  </div>

                  {/* Dividends */}
                  <div className="space-y-2">
                      <div className="text-xs font-bold text-pink-500 mb-2">Dividends</div>
                      <DebouncedOverrideInput 
                          label="Dividend Yield (%)" 
                          overrideKey="dividend_yield" 
                          value={manualOverrides.dividend_yield}
                          onChange={handleOverrideChange}
                      />
                  </div>

                  {/* Trends & Flows */}
                  <div className="space-y-2">
                      <div className="text-xs font-bold text-yellow-500 mb-2">Trends & Flows</div>
                      {!hasEarningsTrend && <DebouncedOverrideInput label="Earnings Trend (CAGR %)" overrideKey="earnings_trend" value={manualOverrides.earnings_trend} onChange={handleOverrideChange} />}
                      <DebouncedOverrideInput label="FII Flow (₹ Cr)" overrideKey="fii_flow" value={manualOverrides.fii_flow} onChange={handleOverrideChange} />
                      <DebouncedOverrideInput label="DII Flow (₹ Cr)" overrideKey="dii_flow" value={manualOverrides.dii_flow} onChange={handleOverrideChange} />
                  </div>

                  {/* Valuation */}
                  <div className="space-y-2">
                      <div className="text-xs font-bold text-blue-500 mb-2">Valuation</div>
                      <DebouncedOverrideInput 
                          label="Forward P/E (x)" 
                          overrideKey="forward_pe" 
                          value={manualOverrides.forward_pe}
                          onChange={handleOverrideChange}
                      />
                  </div>

                  {/* Macro Indicators */}
                  <div className="space-y-2">
                      <div className="text-xs font-bold text-purple-500 mb-2">Macro Indicators</div>
                      <DebouncedOverrideInput 
                          label="GDP Growth (%)" 
                          overrideKey="gdp_growth" 
                          value={manualOverrides.gdp_growth}
                          onChange={handleOverrideChange}
                      />
                      <DebouncedOverrideInput 
                          label="Market Cap to GDP (%)" 
                          overrideKey="market_cap_gdp" 
                          value={manualOverrides.market_cap_gdp}
                          onChange={handleOverrideChange}
                      />
                      <DebouncedOverrideInput 
                          label="10Y Bond Yield" 
                          overrideKey="bond_yield" 
                          value={manualOverrides.bond_yield}
                          onChange={handleOverrideChange}
                      />
                  </div>

                  {/* Growth */}
                  <div className="space-y-2">
                      <div className="text-xs font-bold text-orange-500 mb-2">Growth</div>
                      <DebouncedOverrideInput 
                          label="EPS Growth (%)" 
                          overrideKey="eps_growth" 
                          value={manualOverrides.eps_growth}
                          onChange={handleOverrideChange}
                      />
                  </div>
              </div>
          )}
      </div>
  );

  // --- Dynamic Coverage & Credits Calculation ---
  const maxCards = selectedCategory === "Indices" ? 12 : 20;
  const activeCardsCount = Object.values(compositeData.rawScores || {}).filter(v => v !== null && v !== undefined && !isNaN(v)).length;
  const coveragePercent = maxCards > 0 ? Math.min(100, Math.round((activeCardsCount / maxCards) * 100)) : 0;
  
  const ID_TO_TITLE = useMemo(() => {
      const inverted = {};
      for (const [title, id] of Object.entries(TITLE_TO_ID)) {
          inverted[id] = title;
      }
      return inverted;
  }, []);

  const cardsForHeader = Object.entries(compositeData.rawScores || {})
      .filter(([_, score]) => score !== null && score !== undefined && !isNaN(score))
      .map(([id, score]) => {
          let normalized = 0;
          
          if (score > 70) {
              normalized = 1;  // Bullish
          } else if (score < 30) {
              normalized = -1; // Bearish
          }

          const cardName = ID_TO_TITLE[id] || id;
          const configData = getIndicatorConfig(id);
          const credit = configData?.creditScore ?? 5;

          return { id, module: cardName, normalized, credit, creditAllocation: credit, score };
      });

  const totalCredits = cardsForHeader.reduce((acc, c) => acc + c.credit, 0);

  return (
    <div className="px-4 md:px-6 pt-2 pb-32 animate-in fade-in duration-500 max-w-[1600px] mx-auto min-h-screen">

      {/* HEADER SECTION */}
      <div className="relative z-50 isolate mb-6 mt-0">
          <GlobalHeader
              title="Fundamental Composite"
              score={compositeData.compositeScore}
              prevScore={prevCompositeScore} // Calculated from historical snapshots
              regime={compositeData.regime}
              sections={compositeData.sections}
              tailwinds={compositeData.tailwinds}
              risks={compositeData.risks}
              integrity={{ 
                  coverageText: `${activeCardsCount}/${maxCards}`, 
                  coveragePercent: coveragePercent, 
                  source: error ? "Disconnected (Manual Only)" : "Upstox + Local", 
                  freshness: lastUpdated || "Realtime" 
              }}
              cards={cardsForHeader}
              totalCredits={totalCredits}
              enableBreakdown={true}
              infoContent={fundamentalManualForm}
              controls={{
                  search: searchQuery,
                  onSearchChange: setSearchQuery,
                  viewMode,
                  onViewChange: setViewMode,
                  sortMode,
                  onSortChange: setSortMode
              }}
          />
      </div>

      <div className="relative z-0">
          {selectedCategory === "Indices" ? (
            <IndexSummaryWidget 
                data={fundamentalsData}
                manualOverrides={manualOverrides}
                selectedInstrument={selectedInstrument}
            />
          ) : (
            <CompanySummaryWidget 
                data={fundamentalsData}
                manualOverrides={manualOverrides}
                selectedInstrument={selectedInstrument}
            />
          )}
      </div>

      {/* DETAILED MODAL */}
      <FundamentalModal
        open={!!selectedCard}
        onClose={() => setSelectedCard(null)}
        card={selectedCard}
      />

      {/* DATA GRID — empty until real data is wired */}
      <div className="mt-8">
        <FundamentalContext.Provider value={{ instrumentKey: selectedInstrument, snapshots: historicalSnapshots }}>
            <FundamentalGrid
              cards={cards.map(c => {
                  const dataCard = cardsForHeader.find(hc => hc.id === c.id);
                  return { ...c, ...dataCard };
              })}
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
        </FundamentalContext.Provider>
      </div>
    </div>
  );
}
