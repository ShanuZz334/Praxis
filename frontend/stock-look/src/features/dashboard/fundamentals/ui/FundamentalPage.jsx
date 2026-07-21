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
import { useDataFreshness } from '@/shared/hooks/useDataFreshness';







const DEFAULT_OVERRIDES = {
    // ─── COMPANY OVERRIDES ───
    // Valuation
    pe_ratio: null, forward_pe: null, ev_ebitda: null, pb_ratio: null, earnings_yield: null, relative_valuation: null,
    analyst_consensus_rating: null, analyst_target_price: null, analyst_count: null,
    // Earnings
    eps_growth: null, revenue_growth: null, profit_growth: null,
    // Sector/Macro
    dividend_yield: null, earnings_trend: null, gdp_growth: null,
    // Liquidity/Ownership
    fii_dii_flow: null, promoter_holding: null, smart_money_flow: null, earnings_quality: null,
    // Corporate Health
    roe: null, roce: null, roa: null, net_margin: null, operating_margin: null,
    inventory_days: null, receivable_days: null, payable_days: null,
    // Balance Sheet (Global)
    debt_to_equity: null, interest_coverage: null, free_cash_flow: null, current_ratio: null,
    // Risk
    credit_rating_value: null, credit_rating_agency: null, credit_rating_outlook: null,

    // ─── INDEX OVERRIDES ───
    // Valuation
    nifty_pe: null, nifty_pb: null, mcap_gdp: null, // earnings_yield shared
    // Earnings
    eps_yoy: null, forward_eps: null, sector_earnings: null, profit_margin: null,
    // Macro
    gdp: null, cpi: null, repo: null, fiscal_deficit: null,
    // Liquidity
    fii: null, dii: null, fii_trend: null, system_liquidity: null, mf_flows: null,
    // Sector
    advance_decline: null, sector_valuation: null, sector_growth: null, cyc_def: null,
    // Corporate
    credit_growth: null, corp_debt: null, policy_tailwinds: null,
    // Global/Risk
    india_vix: null, crude: null, global_liq: null,
    sovereign_risk: null, npa: null, reform_momentum: null,
};

export default function FundamentalPage() {
  const [viewMode, setViewMode] = useState("sectioned");
  const [sortMode, setSortMode] = useState("score_desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCard, setSelectedCard] = useState(null);

  const { selectedCategory, selectedInstrument, filteredInstruments, livePrices, selectedExpiry } = useDashboardContext();
  const isIndex = selectedCategory === 'Indices';

  const cards = isIndex ? [
    // Valuation
    { id: "nifty_pe", category: "Valuation" },
    { id: "nifty_pb", category: "Valuation" },
    { id: "mcap_gdp", category: "Valuation" },
    { id: "earnings_yield", category: "Valuation" },
    { id: "dividend_yield", category: "Valuation" },
    // Earnings
    { id: "eps_yoy", category: "Earnings" },
    { id: "forward_eps", category: "Earnings" },
    { id: "profit_margin", category: "Earnings" },
    // Macro
    { id: "gdp", category: "Macro" },
    { id: "cpi", category: "Macro" },
    { id: "repo", category: "Macro" },
    { id: "fiscal_deficit", category: "Macro" },
    // Liquidity
    { id: "fii", category: "Liquidity" },
    { id: "dii", category: "Liquidity" },
    { id: "fii_trend", category: "Liquidity" },
    { id: "system_liquidity", category: "Liquidity" },
    { id: "mf_flows", category: "Liquidity" },
    // Sector
    { id: "advance_decline", category: "Sector" },
    { id: "sector_dashboard", category: "Sector" },
    // Corporate
    { id: "credit_growth", category: "Corporate" },
    { id: "corp_debt", category: "Corporate" },
    { id: "policy_tailwinds", category: "Corporate" },
    // Global
    { id: "india_vix", category: "Global" },
    { id: "crude", category: "Global" },
    { id: "global_liq", category: "Global" },
    // Risk
    { id: "sovereign_risk", category: "Risk" },
    { id: "npa", category: "Risk" },
    { id: "reform_momentum", category: "Risk" },
  ] : [
    // Valuation
    { id: "pe_ratio", category: "Valuation" },
    { id: "forward_pe", category: "Valuation" },
    { id: "ev_ebitda", category: "Valuation" },
    { id: "pb_ratio", category: "Valuation" },
    { id: "earnings_yield", category: "Valuation" },
    { id: "relative_valuation", category: "Valuation" },
    { id: "analyst_consensus", category: "Valuation" },
    // Peer Comparison (Moved to CompanySnapshotWidget)
    // Sector (Context)
    { id: "earnings_trend", category: "Sector" },
    // Liquidity
    { id: "fii_dii_flow", category: "Liquidity" },
    { id: "dividend_yield", category: "Liquidity" },
    // Earnings
    { id: "eps_growth", category: "Earnings" },
    { id: "revenue_growth", category: "Earnings" },
    { id: "profit_growth", category: "Earnings" },
    // Macro
    { id: "gdp_growth", category: "Macro" },
    // Corporate
    { id: "roe", category: "Corporate" },
    { id: "roce", category: "Corporate" },
    { id: "roa", category: "Corporate" },
    { id: "net_margin", category: "Corporate" },
    { id: "operating_margin", category: "Corporate" },
    { id: "cash_conversion", category: "Corporate" },
    // Balance Sheet (Global map)
    { id: "debt_to_equity", category: "Global" },
    { id: "interest_coverage", category: "Global" },
    { id: "free_cash_flow", category: "Global" },
    { id: "current_ratio", category: "Global" },
    // Ownership
    { id: "promoter_holding", category: "Ownership" },
    { id: "smart_money_flow", category: "Ownership" },
    { id: "earnings_quality", category: "Ownership" },
    { id: "corporate_actions", category: "Ownership" },
    // Risk
    { id: "credit_rating", category: "Risk" },
  ];

  // Standardized Manual Overrides Hook
  const { overrides: manualOverrides, lastUpdated: manualLastUpdated, handleChange: handleOverrideChange, handleClearAll } = useManualOverrides('v2', selectedInstrument, DEFAULT_OVERRIDES);

  // Context manages auto-updating instrument when category changes

  const { data: rawFundamentalsData, loading, error, lastUpdated } = useFundamentalsData(selectedInstrument);

  const [liveInstFlow, setLiveInstFlow] = useState(null);

  React.useEffect(() => {
      const fetchInstFlow = async () => {
          try {
              const res = await axiosInstance.get('/api/v1/upstox/inst-flow');
              if (res.data?.data) {
                  setLiveInstFlow(res.data.data);
              }
          } catch (err) {
              console.error("Failed to fetch inst flow:", err);
          }
      };
      fetchInstFlow();
  }, []);

  // Inject real-time India VIX from WebSocket and live Inst Flow if backend DB missed it
  const fundamentalsData = useMemo(() => {
      let data = { ...(rawFundamentalsData || {}) };
      const vixLtp = livePrices?.["NSE_INDEX|India VIX"]?.ltp;
      if (vixLtp) {
          data.india_vix = vixLtp;
      }
      if (liveInstFlow) {
          data.fii_dii_flow = liveInstFlow;
      }
      return data;
  }, [rawFundamentalsData, livePrices, liveInstFlow]);

  // Fundamental Composite Engine integration
  const compositeData = useFundamentalComposite(selectedCategory, selectedInstrument);

  


  // Standardized Historical Snapshots Hook
  const { historicalSnapshots } = useSnapshots(selectedInstrument);

  // --- Previous Day Composite Calculation ---
  const [prevCompositeScore, setPrevCompositeScore] = useState(null);
  const [snapshotDatesStr, setSnapshotDatesStr] = useState(null);

  React.useEffect(() => {
      if (!historicalSnapshots || Object.keys(historicalSnapshots).length === 0) {
          setPrevCompositeScore(null); // No history for this instrument — hide the pill
          return;
      }

      // 1. Gather the latest snapshot score for each card that is BEFORE today
      const todayDate = new Date().toISOString().split('T')[0];
      const prevScores = {};
      const dates = new Set();
      
      for (const [cardId, snaps] of Object.entries(historicalSnapshots)) {
          // Snaps are ordered ASC by date. Find the last one strictly before today.
          const pastSnaps = snaps.filter(s => s.date && s.date < todayDate);
          if (pastSnaps.length > 0) {
              const lastSnap = pastSnaps[pastSnaps.length - 1];
              const metricId = TITLE_TO_ID[cardId];
              if (metricId && lastSnap.score !== undefined) {
                  prevScores[metricId] = lastSnap.score;
                  dates.add(lastSnap.date);
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
          setPrevCompositeScore(null); // No historical snapshots for this instrument yet
      }

      // 3. Format the snapshot dates for the UI readout
      if (dates.size > 0) {
          const sorted = Array.from(dates).sort();
          const formatDateStr = (d) => {
              const dt = new Date(d);
              return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
          };
          
          if (sorted.length === 1) {
              setSnapshotDatesStr(`Snapshot: ${formatDateStr(sorted[0])}`);
          } else {
              setSnapshotDatesStr(`Snapshots: ${formatDateStr(sorted[0])} - ${formatDateStr(sorted[sorted.length - 1])}`);
          }
      } else {
          setSnapshotDatesStr(null);
      }
  }, [historicalSnapshots, selectedCategory, compositeData.compositeScore]);


  // ----------------------------------

  const getISTDateTime = () => {
      const date = new Date();
      const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
      return new Date(utc + (3600000 * 5.5)); // UTC+5.5 (IST)
  };

  const isMarketOpen = () => {
      const now = getISTDateTime();
      const day = now.getDay(); // 0 is Sunday, 6 is Saturday
      if (day === 0 || day === 6) return false;
      
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const timeNum = hours * 100 + minutes;
      
      return timeNum >= 915 && timeNum <= 1530; // 9:15 AM to 3:30 PM IST
  };

  const formatTime = (ts) => {
      if (!ts) return null;
      return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };
  
  // Use the universal freshness tracker for fundamentals. 
  // This ensures the global clock freezes if data is identical, and manual cards show exact typed times.
    const resolveTime = useDataFreshness(fundamentalsData, manualOverrides, manualLastUpdated, isMarketOpen, formatTime, "1m");

  // --- Dynamic Hiding Logic for Fallbacks ---
  const extractRatioExists = (names) => {
      const ratiosArray = Array.isArray(fundamentalsData?.ratios) ? fundamentalsData.ratios : [];
      const obj = ratiosArray.find(r => names.some(n => r.name?.toLowerCase() === n.toLowerCase()));
      return obj?.company_value !== undefined && obj?.company_value !== null && obj?.company_value !== '';
  };
  
  const hasMarketCap = extractRatioExists(['market_cap']);
  const hasPeRatio = extractRatioExists(['p/e', 'pe', 'pe ratio']);
  const hasDividendYield = extractRatioExists(['dividend yield', 'div yield']);
  
  const incomeStmtArray = fundamentalsData?.income?.income_statement || [];
  const incomeFull = fundamentalsData?.income?.full_statement || [];
  
  const hasEarningsTrend = incomeFull.some(p => (p.particular === 'EPS - Basic' || p.particular === 'EPS') && p.history?.length >= 2);
  const hasEpsGrowth = extractRatioExists(['eps growth']) || hasEarningsTrend;
  
  const hasRevenueGrowth = extractRatioExists(['revenue growth']) || incomeStmtArray.some(p => p.category === 'revenue' && p.history?.length >= 2);
  const hasProfitGrowth = extractRatioExists(['profit growth']) || incomeStmtArray.some(p => p.category === 'net_profit' && p.history?.length >= 2);
  
  const hasEvEbitda = extractRatioExists(['ev/ebitda', 'ev / ebitda']);
  const hasRoe = extractRatioExists(['return on equity', 'roe']);
  const hasRoce = extractRatioExists(['return on capital employed', 'roce']);
  const hasRoa = extractRatioExists(['return on asset', 'roa']);
  
  // We can compute net margin if we have Profit After Tax and Total Revenue
  const hasNetMargin = extractRatioExists(['net profit margin', 'net margin']) || (incomeFull.some(p => p.particular === 'Profit After Tax') && incomeFull.some(p => p.particular === 'Total Revenue'));
  const hasOperatingMargin = extractRatioExists(['operating margin', 'opm']) || incomeStmtArray.some(p => p.category === 'operating_profit');
  
  const balanceSheet = fundamentalsData?.balanceSheet?.full_statement || [];
  const hasDebtToEquity = extractRatioExists(['debt to equity', 'd/e']) || (balanceSheet.some(p => p.particular === 'Equity Capital') && balanceSheet.some(p => p.particular === 'Non-Current Liabilities' || p.particular === 'Current Liabilities'));
  const hasCurrentRatio = extractRatioExists(['current ratio']) || (balanceSheet.some(p => p.particular === 'Current Assets') && balanceSheet.some(p => p.particular === 'Current Liabilities'));
  
  const cashFlowStmtArray = fundamentalsData?.cashFlow?.cash_flow || [];
  const hasFreeCashFlow = extractRatioExists(['free cash flow', 'fcf']) || cashFlowStmtArray.some(p => p.category === 'operating' || p.category === 'investing');
  const hasInterestCoverage = extractRatioExists(['interest coverage']);
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
              When live API data is unavailable, the system seamlessly falls back to these manual inputs.
          </p>
          
          {selectedCategory === "Indices" ? (
              <div className="columns-2 md:columns-4 gap-4 space-y-6 md:space-y-0">
                  <div className="space-y-3 break-inside-avoid mb-6">
                      <div className="text-[10px] font-bold text-emerald-500 mb-2 border-b border-border-default pb-1 uppercase tracking-wider">Valuation</div>
                      <DebouncedOverrideInput label="Nifty P/E" overrideKey="nifty_pe" value={manualOverrides.nifty_pe} onChange={handleOverrideChange} />
                      <DebouncedOverrideInput label="Nifty P/B" overrideKey="nifty_pb" value={manualOverrides.nifty_pb} onChange={handleOverrideChange} />
                      <DebouncedOverrideInput label="M-Cap/GDP (%)" overrideKey="mcap_gdp" value={manualOverrides.mcap_gdp} onChange={handleOverrideChange} />
                      <DebouncedOverrideInput label="Earnings Yield (%)" overrideKey="earnings_yield" value={manualOverrides.earnings_yield} onChange={handleOverrideChange} />
                      <DebouncedOverrideInput label="Dividend Yield (%)" overrideKey="dividend_yield" value={manualOverrides.dividend_yield} onChange={handleOverrideChange} />
                  </div>
                  
                  <div className="space-y-3 break-inside-avoid mb-6">
                      <div className="text-[10px] font-bold text-orange-500 mb-2 border-b border-border-default pb-1 uppercase tracking-wider">Earnings</div>
                      <DebouncedOverrideInput label="EPS YoY (%)" overrideKey="eps_yoy" value={manualOverrides.eps_yoy} onChange={handleOverrideChange} />
                      <DebouncedOverrideInput label="Forward EPS (%)" overrideKey="forward_eps" value={manualOverrides.forward_eps} onChange={handleOverrideChange} />
                      <DebouncedOverrideInput label="Sector Earnings" overrideKey="sector_earnings" value={manualOverrides.sector_earnings} onChange={handleOverrideChange} />
                      <DebouncedOverrideInput label="Profit Margin (%)" overrideKey="profit_margin" value={manualOverrides.profit_margin} onChange={handleOverrideChange} />
                  </div>
                  
                  <div className="space-y-3 break-inside-avoid mb-6">
                      <div className="text-[10px] font-bold text-blue-500 mb-2 border-b border-border-default pb-1 uppercase tracking-wider">Macro Economy</div>
                      <DebouncedOverrideInput label="GDP Growth (%)" overrideKey="gdp" value={manualOverrides.gdp} onChange={handleOverrideChange} />
                      <DebouncedOverrideInput label="CPI Inflation (%)" overrideKey="cpi" value={manualOverrides.cpi} onChange={handleOverrideChange} />
                      <DebouncedOverrideInput label="Repo Rate (%)" overrideKey="repo" value={manualOverrides.repo} onChange={handleOverrideChange} />
                      <DebouncedOverrideInput label="Fiscal Deficit (%)" overrideKey="fiscal_deficit" value={manualOverrides.fiscal_deficit} onChange={handleOverrideChange} />
                  </div>
                  
                  <div className="space-y-3 break-inside-avoid mb-6">
                      <div className="text-[10px] font-bold text-indigo-500 mb-2 border-b border-border-default pb-1 uppercase tracking-wider">Corporate</div>
                      <DebouncedOverrideInput label="Credit Growth (%)" overrideKey="credit_growth" value={manualOverrides.credit_growth} onChange={handleOverrideChange} />
                      <DebouncedOverrideInput label="Corp Debt/Eq" overrideKey="corp_debt" value={manualOverrides.corp_debt} onChange={handleOverrideChange} />
                      <DebouncedOverrideInput label="Policy Tailwinds" overrideKey="policy_tailwinds" value={manualOverrides.policy_tailwinds} onChange={handleOverrideChange} />
                  </div>

                  <div className="space-y-3 break-inside-avoid mb-6">
                      <div className="text-[10px] font-bold text-purple-500 mb-2 border-b border-border-default pb-1 uppercase tracking-wider">Liquidity & Flow</div>
                      <DebouncedOverrideInput label="FII Flow (Cr)" overrideKey="fii" value={manualOverrides.fii} onChange={handleOverrideChange} />
                      <DebouncedOverrideInput label="DII Flow (Cr)" overrideKey="dii" value={manualOverrides.dii} onChange={handleOverrideChange} />
                      <DebouncedOverrideInput label="FII Trend (Days)" overrideKey="fii_trend" value={manualOverrides.fii_trend} onChange={handleOverrideChange} />
                      <DebouncedOverrideInput label="MF Flows (Cr)" overrideKey="mf_flows" value={manualOverrides.mf_flows} onChange={handleOverrideChange} />
                      <DebouncedOverrideInput label="Sys Liquidity (LCr)" overrideKey="system_liquidity" value={manualOverrides.system_liquidity} onChange={handleOverrideChange} />
                  </div>
                  
                  <div className="space-y-3 break-inside-avoid mb-6">
                      <div className="text-[10px] font-bold text-cyan-500 mb-2 border-b border-border-default pb-1 uppercase tracking-wider">Sector Data</div>
                      <DebouncedOverrideInput label="Advance/Decline" overrideKey="advance_decline" value={manualOverrides.advance_decline} onChange={handleOverrideChange} />
                      <DebouncedOverrideInput label="Sector Valuation" overrideKey="sector_valuation" value={manualOverrides.sector_valuation} onChange={handleOverrideChange} />
                      <DebouncedOverrideInput label="Sector Growth" overrideKey="sector_growth" value={manualOverrides.sector_growth} onChange={handleOverrideChange} />
                      <DebouncedOverrideInput label="Sector Concen." overrideKey="sector_concentration" value={manualOverrides.sector_concentration} onChange={handleOverrideChange} />
                      <DebouncedOverrideInput label="Cyc vs Def" overrideKey="cyc_def" value={manualOverrides.cyc_def} onChange={handleOverrideChange} />
                  </div>

                  <div className="space-y-3 break-inside-avoid mb-6">
                      <div className="text-[10px] font-bold text-red-500 mb-2 border-b border-border-default pb-1 uppercase tracking-wider">Global & Risk</div>
                      <DebouncedOverrideInput label="India VIX" overrideKey="india_vix" value={manualOverrides.india_vix} onChange={handleOverrideChange} />
                      <DebouncedOverrideInput label="Crude Oil ($)" overrideKey="crude" value={manualOverrides.crude} onChange={handleOverrideChange} />
                      <DebouncedOverrideInput label="Global Liquidity" overrideKey="global_liq" value={manualOverrides.global_liq} onChange={handleOverrideChange} />
                      <DebouncedOverrideInput label="Sovereign CDS" overrideKey="sovereign_risk" value={manualOverrides.sovereign_risk} onChange={handleOverrideChange} />
                      <DebouncedOverrideInput label="NPA Ratio (%)" overrideKey="npa" value={manualOverrides.npa} onChange={handleOverrideChange} />
                      <DebouncedOverrideInput label="Reform Momentum" overrideKey="reform_momentum" value={manualOverrides.reform_momentum} onChange={handleOverrideChange} />
                  </div>
              </div>
          ) : (
              <div className="columns-2 md:columns-4 gap-4 space-y-6 md:space-y-0">
                  {/* Valuation & Macro */}
                  <div className="space-y-3 break-inside-avoid mb-6">
                      <div className="text-[10px] font-bold text-blue-500 mb-2 border-b border-border-default pb-1 uppercase tracking-wider">Valuation & Macro</div>
                      {!hasPeRatio && <DebouncedOverrideInput label="P/E Ratio (x)" overrideKey="pe_ratio" value={manualOverrides.pe_ratio} onChange={handleOverrideChange} />}
                      <DebouncedOverrideInput label="Forward P/E (x)" overrideKey="forward_pe" value={manualOverrides.forward_pe} onChange={handleOverrideChange} />
                      {!hasEvEbitda && <DebouncedOverrideInput label="EV/EBITDA (x)" overrideKey="ev_ebitda" value={manualOverrides.ev_ebitda} onChange={handleOverrideChange} />}
                      <DebouncedOverrideInput label="Rel. Valuation (x)" overrideKey="relative_valuation" value={manualOverrides.relative_valuation} onChange={handleOverrideChange} />
                      <DebouncedOverrideInput label="GDP Growth (%)" overrideKey="gdp_growth" value={manualOverrides.gdp_growth} onChange={handleOverrideChange} />
                      <DebouncedOverrideInput label="Consensus Rating" overrideKey="analyst_consensus_rating" value={manualOverrides.analyst_consensus_rating} onChange={handleOverrideChange} />
                      <DebouncedOverrideInput label="Target Price" overrideKey="analyst_target_price" value={manualOverrides.analyst_target_price} onChange={handleOverrideChange} />
                      <DebouncedOverrideInput label="Analyst Count" overrideKey="analyst_count" value={manualOverrides.analyst_count} onChange={handleOverrideChange} />
                  </div>

                  {/* Earnings & Flows */}
                  <div className="space-y-3 break-inside-avoid mb-6">
                      <div className="text-[10px] font-bold text-orange-500 mb-2 border-b border-border-default pb-1 uppercase tracking-wider">Earnings & Flows</div>
                      {!hasEpsGrowth && <DebouncedOverrideInput label="EPS Growth (%)" overrideKey="eps_growth" value={manualOverrides.eps_growth} onChange={handleOverrideChange} />}
                      {!hasRevenueGrowth && <DebouncedOverrideInput label="Revenue Growth (%)" overrideKey="revenue_growth" value={manualOverrides.revenue_growth} onChange={handleOverrideChange} />}
                      {!hasProfitGrowth && <DebouncedOverrideInput label="Profit Growth (%)" overrideKey="profit_growth" value={manualOverrides.profit_growth} onChange={handleOverrideChange} />}
                      <DebouncedOverrideInput label="Smart Money Flow" overrideKey="smart_money_flow" value={manualOverrides.smart_money_flow} onChange={handleOverrideChange} />
                      <DebouncedOverrideInput label="Promoter Holding" overrideKey="promoter_holding" value={manualOverrides.promoter_holding} onChange={handleOverrideChange} />
                  </div>

                  {/* Profitability & CCC */}
                  <div className="space-y-3 break-inside-avoid mb-6">
                      <div className="text-[10px] font-bold text-green-500 mb-2 border-b border-border-default pb-1 uppercase tracking-wider">Profitability</div>
                      {!hasRoe && <DebouncedOverrideInput label="ROE (%)" overrideKey="roe" value={manualOverrides.roe} onChange={handleOverrideChange} />}
                      {!hasRoce && <DebouncedOverrideInput label="ROCE (%)" overrideKey="roce" value={manualOverrides.roce} onChange={handleOverrideChange} />}
                      {!hasRoa && <DebouncedOverrideInput label="ROA (%)" overrideKey="roa" value={manualOverrides.roa} onChange={handleOverrideChange} />}
                      {!hasNetMargin && <DebouncedOverrideInput label="Net Margin (%)" overrideKey="net_margin" value={manualOverrides.net_margin} onChange={handleOverrideChange} />}
                      {!hasOperatingMargin && <DebouncedOverrideInput label="Op. Margin (%)" overrideKey="operating_margin" value={manualOverrides.operating_margin} onChange={handleOverrideChange} />}
                      <DebouncedOverrideInput label="Inventory Days" overrideKey="inventory_days" value={manualOverrides.inventory_days} onChange={handleOverrideChange} />
                      <DebouncedOverrideInput label="Receivable Days" overrideKey="receivable_days" value={manualOverrides.receivable_days} onChange={handleOverrideChange} />
                      <DebouncedOverrideInput label="Payable Days" overrideKey="payable_days" value={manualOverrides.payable_days} onChange={handleOverrideChange} />
                  </div>

                  {/* Financial Health */}
                  <div className="space-y-3 break-inside-avoid mb-6">
                      <div className="text-[10px] font-bold text-purple-500 mb-2 border-b border-border-default pb-1 uppercase tracking-wider">Financial Health</div>
                      {!hasDebtToEquity && <DebouncedOverrideInput label="Debt to Equity" overrideKey="debt_to_equity" value={manualOverrides.debt_to_equity} onChange={handleOverrideChange} />}
                      {!hasInterestCoverage && <DebouncedOverrideInput label="Interest Coverage" overrideKey="interest_coverage" value={manualOverrides.interest_coverage} onChange={handleOverrideChange} />}
                      {!hasFreeCashFlow && <DebouncedOverrideInput label="Free Cash Flow (Cr)" overrideKey="free_cash_flow" value={manualOverrides.free_cash_flow} onChange={handleOverrideChange} />}
                      {!hasCurrentRatio && <DebouncedOverrideInput label="Current Ratio" overrideKey="current_ratio" value={manualOverrides.current_ratio} onChange={handleOverrideChange} />}
                  </div>

                  {/* Risk */}
                  <div className="space-y-3 break-inside-avoid mb-6">
                      <div className="text-[10px] font-bold text-red-500 mb-2 border-b border-border-default pb-1 uppercase tracking-wider">Risk</div>
                      <DebouncedOverrideInput label="Credit Rating" overrideKey="credit_rating_value" value={manualOverrides.credit_rating_value} onChange={handleOverrideChange} />
                      <DebouncedOverrideInput label="Rating Agency" overrideKey="credit_rating_agency" value={manualOverrides.credit_rating_agency} onChange={handleOverrideChange} />
                      <DebouncedOverrideInput label="Rating Outlook" overrideKey="credit_rating_outlook" value={manualOverrides.credit_rating_outlook} onChange={handleOverrideChange} />
                  </div>
              </div>
          )}
      </div>
  );

  // --- Dynamic Coverage & Credits Calculation ---
  // Dynamic maxCards = total cards tracked for the current category
  const maxCards = cards.length;
  // activeCardsCount: only count cards with score > 0.
  // All scoring engines return 0 ONLY when there is no data at all.
  // Minimum score when real data exists is 5-10 (Strong Bearish), never 0.
  const activeCardsCount = Object.values(compositeData.rawScores || {}).filter(v => v !== null && v !== undefined && !isNaN(v) && v > 0).length;
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
                  freshness: resolveTime(!!fundamentalsData),
                  snapshotTime: snapshotDatesStr
              }}
              cards={cardsForHeader}
              totalCredits={totalCredits}
              enableBreakdown={true}
              syncId={{ instrumentKey: selectedInstrument, category: 'fundamental' }}
              infoContent={fundamentalManualForm}
              controls={{
                  search: searchQuery,
                  onSearchChange: setSearchQuery,
                  viewMode,
                  onViewChange: setViewMode,
                  sortMode,
                  onSortChange: (m) => { setSortMode(m); setViewMode("flat"); }
              }}
          />
      </div>

      <div className="relative z-0">
          {selectedCategory === "Indices" ? (
            <IndexSummaryWidget 
                data={fundamentalsData}
                manualOverrides={manualOverrides}
                selectedInstrument={selectedInstrument}
                resolveTime={resolveTime}
            />
          ) : (
            <CompanySummaryWidget 
                data={fundamentalsData}
                manualOverrides={manualOverrides}
                selectedInstrument={selectedInstrument}
                resolveTime={resolveTime}
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
        {(() => {
          const contextValue = React.useMemo(() => ({ instrumentKey: selectedInstrument, snapshots: historicalSnapshots }), [selectedInstrument, historicalSnapshots]);
          return (
            <FundamentalContext.Provider value={contextValue}>
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
                onSortChange: (m) => { setSortMode(m); setViewMode("flat"); }
              }}
              data={fundamentalsData}
              selectedCategory={selectedCategory}
              manualOverrides={manualOverrides}
              resolveTime={resolveTime}
            />
        </FundamentalContext.Provider>
          );
        })()}
      </div>
    </div>
  );
}
