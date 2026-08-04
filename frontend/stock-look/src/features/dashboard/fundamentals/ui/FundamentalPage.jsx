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
import Loader from "@/shared/components/ui/Loader";
import { useManualOverrides } from "@/shared/hooks/useManualOverrides";
import { useSnapshots } from "@/shared/hooks/useSnapshots";
import { useGlobalApiData } from "@/features/dashboard/foreign/data/useGlobalApiData";

// Wrapper to automatically inject timer configs
const TimerOverrideInput = ({ overrideKey, manualLastUpdated, expiryConfigs, info, ...props }) => {
    const { selectedInstrument } = useDashboardContext();
    return (
        <DebouncedOverrideInput
            {...props}
            overrideKey={overrideKey}
            lastUpdatedTimestamp={manualLastUpdated?.[overrideKey]}
            expiryDuration={expiryConfigs?.[overrideKey] || expiryConfigs?.global_default}
            info={info}
            instrument={selectedInstrument}
            moduleKey="fundamentals"
        />
    );
};
import { useAiSync } from "@/shared/hooks/useAiSync";
import { computeCardConfidence, computeHeaderConfidence } from "@/shared/engine/confidenceEngine";
import { useDataFreshness } from '@/shared/hooks/useDataFreshness';







const DEFAULT_OVERRIDES = {
    // ─── COMPANY OVERRIDES ───
    // Valuation
    pe_ratio: null, forward_pe: null, ev_ebitda: null, pb_ratio: null, earnings_yield: null, relative_valuation: null,
    face_value: null,
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
    { id: "eps_yoy", category: "Earnings" },
    { id: "forward_eps", category: "Earnings" },
    { id: "profit_margin", category: "Earnings" },
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
  ];

  // Standardized Manual Overrides Hook
  const { overrides: manualOverrides, lastUpdated: manualLastUpdated, expiryConfigs, handleChange: handleOverrideChange, handleClearAll } = useManualOverrides('v2', selectedInstrument, DEFAULT_OVERRIDES);

  // Context manages auto-updating instrument when category changes

  const { data: rawFundamentalsData, snapshot, loading, error, lastUpdated } = useFundamentalsData(selectedInstrument);
  const { data: globalApiData } = useGlobalApiData();

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

  // Inject real-time India VIX from WebSocket and live Inst Flow
  const fundamentalsData = useMemo(() => {
      let data = { ...(rawFundamentalsData || {}) };
      
      // Inject AI Store snapshot data for external macros (e.g. GDP, Fwd PE) fetched by the cron engine
      if (snapshot && Array.isArray(snapshot.cards)) {
          const gdpCard = snapshot.cards.find(c => c.id === 'gdp_growth');
          if (gdpCard && gdpCard.rawInput?.gdpGrowth !== undefined && gdpCard.rawInput?.gdpGrowth !== null) {
              data.gdp_growth = gdpCard.rawInput.gdpGrowth;
          }
          
          const fwdPeCard = snapshot.cards.find(c => c.id === 'forward_pe');
          if (fwdPeCard && fwdPeCard.rawInput?.forwardPE !== undefined && fwdPeCard.rawInput?.forwardPE !== null) {
              data.forward_pe = fwdPeCard.rawInput.forwardPE;
          }
      }

        const vixLtp = livePrices?.["NSE_INDEX|India VIX"]?.ltp;
        if (vixLtp) {
            data.india_vix = vixLtp;
        }
        
        const crudeLtp = livePrices?.["GLOBAL_INDICATOR|BZUSD"]?.ltp || globalApiData?.crude;
        if (crudeLtp) {
            data.crude = crudeLtp;
        }

        if (rawFundamentalsData?.global_liq !== undefined && rawFundamentalsData?.global_liq !== null) {
            data.global_liq = rawFundamentalsData.global_liq;
        }

        if (liveInstFlow) {
          data.fii_dii_flow = liveInstFlow;
      }

      // --- ON-DEMAND LIVE MACROS OVERRIDE ---
      if (rawFundamentalsData?.analystConsensus) {
          data.analyst_consensus = rawFundamentalsData.analystConsensus;
      }
      if (rawFundamentalsData?.gdpGrowth !== undefined && rawFundamentalsData?.gdpGrowth !== null) {
          data.gdp_growth = rawFundamentalsData.gdpGrowth;
      }
      if (rawFundamentalsData?.dividendYield !== undefined && rawFundamentalsData?.dividendYield !== null) {
          data.dividend_yield = rawFundamentalsData.dividendYield;
      }

      if (rawFundamentalsData?.cashConversionCycle) {
          if (!Array.isArray(data.ratios)) data.ratios = [];
          const ccc = rawFundamentalsData.cashConversionCycle;
          if (ccc.inventoryDays !== null) data.ratios.push({ name: 'inventory days', company_value: ccc.inventoryDays });
          if (ccc.receivableDays !== null) data.ratios.push({ name: 'receivable days', company_value: ccc.receivableDays });
          if (ccc.payableDays !== null) data.ratios.push({ name: 'payable days', company_value: ccc.payableDays });
      }

      if (rawFundamentalsData?.interestCoverage !== undefined && rawFundamentalsData?.interestCoverage !== null) {
          if (!Array.isArray(data.ratios)) data.ratios = [];
          data.ratios.push({ name: 'interest coverage', company_value: rawFundamentalsData.interestCoverage });
      }

      if (rawFundamentalsData?.bookValue !== undefined && rawFundamentalsData?.bookValue !== null) {
          if (!Array.isArray(data.ratios)) data.ratios = [];
          data.ratios.push({ name: 'book value', company_value: rawFundamentalsData.bookValue });
      }

      // Inject Live Price for the selected instrument so cards like Dividend Yield can calculate dynamically
      if (livePrices && livePrices[selectedInstrument] && livePrices[selectedInstrument].ltp) {
          if (!data.quote) data.quote = {};
          data.quote.last_price = livePrices[selectedInstrument].ltp;
      }

      return data;
  }, [rawFundamentalsData, livePrices, liveInstFlow, snapshot, selectedInstrument, globalApiData]);

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

      // 4. Transform to Array structure for Gridates for the UI readout
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
      if (!obj || obj.company_value === undefined || obj.company_value === null || obj.company_value === '') return false;
      const parsed = parseFloat(String(obj.company_value).replace(/,/g, ''));
      return !isNaN(parsed);
  };
  
  const hasMarketCap = extractRatioExists(['market_cap', 'mcap', 'marketcap']) || 
      (rawFundamentalsData?.company_profile?.market_cap !== undefined && rawFundamentalsData?.company_profile?.market_cap !== null) || 
      (rawFundamentalsData?.company_profile?.mcap !== undefined && rawFundamentalsData?.company_profile?.mcap !== null) ||
      (rawFundamentalsData?.company_profile?.marketcap !== undefined && rawFundamentalsData?.company_profile?.marketcap !== null) ||
      (rawFundamentalsData?.marketCap !== undefined && rawFundamentalsData?.marketCap !== null);
  
  const hasPeRatio = extractRatioExists(['p/e', 'pe', 'pe ratio']);
  const hasPbRatio = extractRatioExists(['p/b', 'pb', 'price to book']);
  const hasEarningsYield = extractRatioExists(['earnings yield']);
  const hasDividendYield = extractRatioExists(['dividend yield', 'div yield', 'dividend_yield', 'div_yield']) || 
      (rawFundamentalsData?.company_profile?.dividend_yield !== undefined && rawFundamentalsData?.company_profile?.dividend_yield !== null) ||
      (rawFundamentalsData?.dividendYield !== undefined && rawFundamentalsData?.dividendYield !== null);
  
  const incomeStmtArray = fundamentalsData?.income?.income_statement || [];
  const incomeFull = fundamentalsData?.income?.full_statement || [];
  
  const hasEarningsTrend = incomeFull.some(p => (p.particular === 'EPS - Basic' || p.particular === 'EPS') && p.history?.length >= 2);
  const hasEpsGrowth = extractRatioExists(['eps growth']) || hasEarningsTrend;
  
  const hasRevenueGrowth = extractRatioExists(['revenue growth']) || incomeStmtArray.some(p => p.category === 'revenue' && p.history?.length >= 2);
  const hasProfitGrowth = extractRatioExists(['profit growth']) || incomeStmtArray.some(p => p.category === 'net_profit' && p.history?.length >= 2);

  const hasEpsYoy = hasEarningsTrend;
  const hasForwardEps = hasEarningsTrend;
  const hasProfitMargin = (incomeStmtArray.some(p => p.category === 'net_profit' && p.history?.length >= 1) && incomeStmtArray.some(p => p.category === 'revenue' && p.history?.length >= 1));
  
  const hasEvEbitda = extractRatioExists(['ev/ebitda', 'ev / ebitda']);
  const hasRoe = extractRatioExists(['return on equity', 'roe']);
  const hasRoce = extractRatioExists(['return on capital employed', 'roce']);
  const hasRoa = extractRatioExists(['return on asset', 'roa']);
  
  // We can compute net margin if we have Profit After Tax and Total Revenue
  const hasNetMargin = extractRatioExists(['net profit margin', 'net margin', 'pat margin']) || 
      (incomeFull.some(p => (p.particular === 'Profit After Tax' || p.particular === 'Profit Before Tax') && p.history?.length >= 1) && 
       incomeFull.some(p => (p.particular === 'Total Revenue' || p.particular === 'Revenue') && p.history?.length >= 1 && parseFloat(p.history[0].value) > 0));
  const hasOperatingMargin = extractRatioExists(['operating margin', 'opm', 'operating profit margin', 'ebit margin']) || 
      (incomeStmtArray.some(p => p.category === 'operating_profit' && p.history?.length >= 1) && 
       incomeStmtArray.some(p => p.category === 'revenue' && p.history?.length >= 1 && parseFloat(p.history[0].value) > 0));
  
  const balanceSheet = fundamentalsData?.balanceSheet?.full_statement || [];
  const hasDebtToEquity = extractRatioExists(['debt to equity', 'd/e']) || 
      (balanceSheet.some(p => p.particular === 'Equity Capital' && p.history?.length > 0) && 
       balanceSheet.some(p => (p.particular === 'Non-Current Liabilities' || p.particular === 'Current Liabilities')));
  const hasCurrentRatio = extractRatioExists(['current ratio']) || 
      (balanceSheet.some(p => p.particular?.toLowerCase() === 'current assets' && p.history?.length > 0) && 
       balanceSheet.some(p => p.particular?.toLowerCase() === 'current liabilities' && p.history?.length > 0));
  
  const cashFlowStmtArray = fundamentalsData?.cashFlow?.cash_flow || [];
  const hasFreeCashFlow = extractRatioExists(['free cash flow', 'fcf']) || 
      (cashFlowStmtArray.some(p => p.category === 'operating' && p.history?.length > 0) && 
       cashFlowStmtArray.some(p => p.category === 'investing' && p.history?.length > 0));
          const hasInterestCoverage = extractRatioExists(['interest coverage']);
  
  // Dynamic variables for everything else to prevent UI clutter if API data exists
  const hasForwardPe = extractRatioExists(['forward pe', 'forward p/e', 'fwd pe']) || rawFundamentalsData?.forward_pe !== undefined || (hasPeRatio && hasEpsGrowth);
  const hasRelativeValuation = hasPeRatio || hasEvEbitda || extractRatioExists(['p/b', 'pb', 'price to book']);
  const hasGdpGrowth = rawFundamentalsData?.gdpGrowth !== undefined && rawFundamentalsData?.gdpGrowth !== null;
  const hasCrude = fundamentalsData?.crude !== undefined && fundamentalsData?.crude !== null;
  const hasGlobalLiq = fundamentalsData?.global_liq !== undefined && fundamentalsData?.global_liq !== null;
  const hasCreditGrowth = fundamentalsData?.credit_growth !== undefined && fundamentalsData?.credit_growth !== null;
  const hasCorpDebt = fundamentalsData?.corporate_debt !== undefined && fundamentalsData?.corporate_debt !== null;
  const hasFaceValue = extractRatioExists(['face value', 'face_value']) || (rawFundamentalsData?.company_profile?.face_value !== undefined && rawFundamentalsData?.company_profile?.face_value !== null);
  const hasConsensusRating = rawFundamentalsData?.analystConsensus?.consensus !== undefined && rawFundamentalsData?.analystConsensus?.consensus !== null;
  const hasTargetPrice = rawFundamentalsData?.analystConsensus?.targetPrice !== undefined && rawFundamentalsData?.analystConsensus?.targetPrice !== null;
  const hasAnalystCount = rawFundamentalsData?.analystConsensus?.analysts !== undefined && rawFundamentalsData?.analystConsensus?.analysts !== null;
  
  const hasFiiFlow = fundamentalsData?.liquidity?.fii_net !== undefined;
  const hasDiiFlow = fundamentalsData?.liquidity?.dii_net !== undefined;
  const hasAdvanceDecline = fundamentalsData?.advance_decline?.advances !== undefined;
  const hasMcapGdp = false; // Always manual for now
  
  const hasCpi = rawFundamentalsData?.cpiInflation !== undefined && rawFundamentalsData?.cpiInflation !== null;
  const hasRepo = rawFundamentalsData?.repoRate !== undefined && rawFundamentalsData?.repoRate !== null;
  const hasFiscalDeficit = rawFundamentalsData?.fiscalDeficit !== undefined && rawFundamentalsData?.fiscalDeficit !== null;
  const hasPolicyTailwinds = fundamentalsData?.policy_tailwinds !== undefined && fundamentalsData?.policy_tailwinds !== null;
  const hasFiiTrend = fundamentalsData?.fiiTrend !== undefined && fundamentalsData?.fiiTrend !== null;
  const hasMfFlows = fundamentalsData?.mf_flows !== undefined && fundamentalsData?.mf_flows !== null;
  const hasSystemLiquidity = false; // Always manual for now
  
  const hasSmartMoneyFlow = Array.isArray(fundamentalsData?.holdings) && fundamentalsData?.holdings.some(h => h.category === 'fii' || h.category === 'other_dii');
  const hasPromoterHolding = Array.isArray(fundamentalsData?.holdings) && fundamentalsData?.holdings.some(h => h.category === 'promoter');
  
  const hasInventoryDays = extractRatioExists(['inventory days']);
  const hasReceivableDays = extractRatioExists(['receivable days']);
  const hasPayableDays = extractRatioExists(['payable days']);
  

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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6 items-start">
                  {(!hasPeRatio || !hasPbRatio || !hasMcapGdp || !hasEarningsYield || !hasDividendYield) && (
                      <div className="space-y-3 break-inside-avoid mb-6">
                          <div className="text-[10px] font-bold text-emerald-500 mb-2 border-b border-border-default pb-1 uppercase tracking-wider">Valuation</div>
                          {!hasPeRatio && <TimerOverrideInput manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} label="Nifty P/E" overrideKey="nifty_pe" value={manualOverrides.nifty_pe} onChange={handleOverrideChange} />}
                          {!hasPbRatio && <TimerOverrideInput manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} label="Nifty P/B" overrideKey="nifty_pb" value={manualOverrides.nifty_pb} onChange={handleOverrideChange} />}
                          {!hasMcapGdp && <TimerOverrideInput manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} label="M-Cap/GDP (%)" overrideKey="mcap_gdp" value={manualOverrides.mcap_gdp} onChange={handleOverrideChange} info="Market Cap to GDP ratio. Enter as a percentage (e.g., 95.5 for 95.5%). Realistic range for India: 60% to 130%." />}
                          {!hasEarningsYield && <TimerOverrideInput manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} label="Earnings Yield (%)" overrideKey="earnings_yield" value={manualOverrides.earnings_yield} onChange={handleOverrideChange} />}
                          {!hasDividendYield && <TimerOverrideInput manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} label="Dividend Yield (%)" overrideKey="dividend_yield" value={manualOverrides.dividend_yield} onChange={handleOverrideChange} />}
                      </div>
                  )}
                  
                  {(!hasEpsYoy || !hasForwardEps || !hasProfitMargin) && (
                      <div className="space-y-3 break-inside-avoid mb-6">
                          <div className="text-[10px] font-bold text-orange-500 mb-2 border-b border-border-default pb-1 uppercase tracking-wider">Earnings</div>
                          {!hasEpsYoy && <TimerOverrideInput manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} label="EPS YoY (%)" overrideKey="eps_yoy" value={manualOverrides.eps_yoy} onChange={handleOverrideChange} info="Earnings Per Share Year-over-Year Growth. Enter as a percentage (e.g., 15.2). Realistic range: -20% to +40%." />}
                          {!hasForwardEps && <TimerOverrideInput manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} label="Forward EPS (%)" overrideKey="forward_eps" value={manualOverrides.forward_eps} onChange={handleOverrideChange} info="Forward EPS Growth Estimate. Enter as a percentage (e.g., 12.5). Realistic range: -10% to +35%." />}
                          {!hasProfitMargin && <TimerOverrideInput manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} label="Profit Margin (%)" overrideKey="profit_margin" value={manualOverrides.profit_margin} onChange={handleOverrideChange} info="Net Profit Margin. Enter as a percentage (e.g., 8.5). Realistic range: 2% to 25%." />}
                      </div>
                  )}
                  
                  {(!hasGdpGrowth || !hasCpi || !hasRepo || !hasFiscalDeficit) && (
                      <div className="space-y-3 break-inside-avoid mb-6">
                          <div className="text-[10px] font-bold text-blue-500 mb-2 border-b border-border-default pb-1 uppercase tracking-wider">Macro Economy</div>
                          {!hasGdpGrowth && <TimerOverrideInput manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} label="GDP Growth (%)" overrideKey="gdp" value={manualOverrides.gdp} onChange={handleOverrideChange} />}
                          {!hasCpi && <TimerOverrideInput manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} label="CPI Inflation (%)" overrideKey="cpi" value={manualOverrides.cpi} onChange={handleOverrideChange} />}
                          {!hasRepo && <TimerOverrideInput manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} label="Repo Rate (%)" overrideKey="repo" value={manualOverrides.repo} onChange={handleOverrideChange} />}
                          {!hasFiscalDeficit && <TimerOverrideInput manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} label="Fiscal Deficit (%)" overrideKey="fiscal_deficit" value={manualOverrides.fiscal_deficit} onChange={handleOverrideChange} />}
                      </div>
                  )}
                  
                  {(!hasCreditGrowth || !hasCorpDebt || !hasPolicyTailwinds) && (
                      <div className="space-y-3 break-inside-avoid mb-6">
                          <div className="text-[10px] font-bold text-indigo-500 mb-2 border-b border-border-default pb-1 uppercase tracking-wider">Corporate</div>
                          {!hasCreditGrowth && <TimerOverrideInput manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} label="Credit Growth (%)" overrideKey="credit_growth" value={manualOverrides.credit_growth} onChange={handleOverrideChange} />}
                          {!hasCorpDebt && <TimerOverrideInput manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} label="Corp Debt/Eq" overrideKey="corp_debt" value={manualOverrides.corp_debt} onChange={handleOverrideChange} />}
                          {!hasPolicyTailwinds && <TimerOverrideInput manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} label="Policy Tailwinds" overrideKey="policy_tailwinds" value={manualOverrides.policy_tailwinds} onChange={handleOverrideChange} info="Score out of 100 representing favorable government policies or reforms. Realistic range: 0 to 100." />}
                      </div>
                  )}

                  {(!hasFiiFlow || !hasDiiFlow || !hasFiiTrend || !hasMfFlows || !hasSystemLiquidity) && (
                      <div className="space-y-3 break-inside-avoid mb-6">
                          <div className="text-[10px] font-bold text-purple-500 mb-2 border-b border-border-default pb-1 uppercase tracking-wider">Liquidity & Flow</div>
                          {!hasFiiFlow && <TimerOverrideInput manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} label="FII Flow (Cr)" overrideKey="fii" value={manualOverrides.fii} onChange={handleOverrideChange} info="FII Net Flow in Crores (INR). Enter absolute value (e.g., 2500). Realistic range: -15000 to +15000." />}
                          {!hasDiiFlow && <TimerOverrideInput manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} label="DII Flow (Cr)" overrideKey="dii" value={manualOverrides.dii} onChange={handleOverrideChange} info="DII Net Flow in Crores (INR). Enter absolute value (e.g., 1200). Realistic range: -10000 to +15000." />}
                          {!hasFiiTrend && <TimerOverrideInput manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} label="FII Trend (Days)" overrideKey="fii_trend" value={manualOverrides.fii_trend} onChange={handleOverrideChange} info="FII Trend Persistence in Days. Positive for consecutive buying, negative for selling (e.g., 3 or -2). Realistic range: -15 to +15." />}
                          {!hasMfFlows && <TimerOverrideInput manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} label="MF Flows (Cr)" overrideKey="mf_flows" value={manualOverrides.mf_flows} onChange={handleOverrideChange} info="Mutual Fund Flows in Crores (INR). Enter absolute value (e.g., 2500 for ₹2,500 Cr). Realistic range: -10000 to +30000." />}
                          {!hasSystemLiquidity && <TimerOverrideInput manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} label="System Liquidity" overrideKey="system_liquidity" value={manualOverrides.system_liquidity} onChange={handleOverrideChange} info="System Liquidity surplus/deficit in Crores (INR). Enter absolute value (e.g., -50000). Realistic range: -300000 to +300000." />}
                      </div>
                  )}
                  
                  {(!hasAdvanceDecline) && (
                      <div className="space-y-3 break-inside-avoid mb-6">
                          <div className="text-[10px] font-bold text-cyan-500 mb-2 border-b border-border-default pb-1 uppercase tracking-wider">Sector Data</div>
                          {!hasAdvanceDecline && <TimerOverrideInput manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} label="Advance/Decline" overrideKey="advance_decline" value={manualOverrides.advance_decline} onChange={handleOverrideChange} info="Advance/Decline Ratio (ADR). Enter absolute value (e.g., 1.2). Realistic range: 0.1 to 5.0." />}
                      </div>
                  )}

                  {(!hasCrude || !hasGlobalLiq) && (
                        <div className="space-y-3 break-inside-avoid mb-6">
                            <div className="text-[10px] font-bold text-red-500 mb-2 border-b border-border-default pb-1 uppercase tracking-wider">Global Data</div>
                            {!hasCrude && <TimerOverrideInput manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} label="Crude Oil ($/bbl)" overrideKey="crude" value={manualOverrides.crude} onChange={handleOverrideChange} info="Brent Crude price in USD per barrel ($/bbl). Enter absolute value (e.g., 75.50). Realistic range: 50 to 130." />}
                            {!hasGlobalLiq && <TimerOverrideInput manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} label="Global Liquidity" overrideKey="global_liq" value={manualOverrides.global_liq} onChange={handleOverrideChange} info="Global Liquidity Index/Trillions. Enter absolute value (e.g., 85.5)." />}
                        </div>
                    )}
              </div>
          ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6 items-start">
                  {/* Valuation & Macro */}
                  {(!hasMarketCap || !hasDividendYield || !hasPeRatio || !hasForwardPe || !hasEvEbitda || !hasRelativeValuation || !hasFaceValue || !hasGdpGrowth || !hasConsensusRating || !hasTargetPrice || !hasAnalystCount) && (
                      <div className="space-y-3 break-inside-avoid mb-6">
                          <div className="text-[10px] font-bold text-blue-500 mb-2 border-b border-border-default pb-1 uppercase tracking-wider">Valuation & Macro</div>
                          {!hasMarketCap && <TimerOverrideInput manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} label="Market Cap (Cr)" overrideKey="market_cap" value={manualOverrides.market_cap} onChange={handleOverrideChange} info="Market Capitalization in Crores (INR). Enter absolute value (e.g., 50000). Realistic range: 100 to 2000000." />}
                          {!hasDividendYield && <TimerOverrideInput manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} label="Dividend Yield (%)" overrideKey="dividend_yield" value={manualOverrides.dividend_yield} onChange={handleOverrideChange} info="Dividend Yield in percent (%). Enter absolute value (e.g., 1.5). Realistic range: 0 to 10." />}
                          
                          {!hasPeRatio && <TimerOverrideInput manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} label="P/E Ratio (x)" overrideKey="pe_ratio" value={manualOverrides.pe_ratio} onChange={handleOverrideChange} info="Price to Earnings Ratio. Enter absolute value (e.g., 25.5). Realistic range: 5 to 100." />}
                          {!hasForwardPe && <TimerOverrideInput manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} label="Forward P/E (x)" overrideKey="forward_pe" value={manualOverrides.forward_pe} onChange={handleOverrideChange} info="Forward P/E Ratio. Enter absolute value (e.g., 22.0). Realistic range: 5 to 100." />}
                          {!hasEvEbitda && <TimerOverrideInput manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} label="EV/EBITDA (x)" overrideKey="ev_ebitda" value={manualOverrides.ev_ebitda} onChange={handleOverrideChange} info="Enterprise Value to EBITDA Ratio. Enter absolute value (e.g., 12.5). Realistic range: 2 to 50." />}
                          {!hasRelativeValuation && <TimerOverrideInput manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} label="Rel. Valuation (x)" overrideKey="relative_valuation" value={manualOverrides.relative_valuation} onChange={handleOverrideChange} info="Relative Valuation premium/discount in percent (%). Enter negative for discount (e.g., -15). Realistic range: -50 to +100." />}
                          {!hasFaceValue && <TimerOverrideInput manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} label="Face Value (₹)" overrideKey="face_value" value={manualOverrides.face_value} onChange={handleOverrideChange} info="Face Value of the stock in INR. Usually ₹1, ₹2, ₹5, or ₹10. Enter absolute value (e.g., 10)." />}
                          {!hasGdpGrowth && <TimerOverrideInput manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} label="GDP Growth (%)" overrideKey="gdp_growth" value={manualOverrides.gdp_growth} onChange={handleOverrideChange} info="GDP Growth in percent (%). Enter absolute value (e.g., 7.2). Realistic range: -5 to +12." />}
                          {!hasConsensusRating && <TimerOverrideInput manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} label="Consensus Rating" overrideKey="analyst_consensus_rating" value={manualOverrides.analyst_consensus_rating} onChange={handleOverrideChange} info="Consensus Rating. Enter 1 (Strong Buy), 2 (Buy), 3 (Hold), 4 (Sell), or 5 (Strong Sell)." />}
                          {!hasTargetPrice && <TimerOverrideInput manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} label="Target Price" overrideKey="analyst_target_price" value={manualOverrides.analyst_target_price} onChange={handleOverrideChange} info="Analyst Target Price in INR. Enter absolute value (e.g., 1500)." />}
                          {!hasAnalystCount && <TimerOverrideInput manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} label="Analyst Count" overrideKey="analyst_count" value={manualOverrides.analyst_count} onChange={handleOverrideChange} info="Number of analysts covering the stock. Enter absolute integer (e.g., 12)." />}
                      </div>
                  )}

                  {/* Earnings & Flows */}
                  {(!hasEpsGrowth || !hasRevenueGrowth || !hasProfitGrowth || !hasEpsYoy || !hasForwardEps || !hasProfitMargin || !hasSmartMoneyFlow) && (
                      <div className="space-y-3 break-inside-avoid mb-6">
                          <div className="text-[10px] font-bold text-orange-500 mb-2 border-b border-border-default pb-1 uppercase tracking-wider">Earnings & Flows</div>
                          {!hasEpsGrowth && <TimerOverrideInput manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} label="EPS Growth (%)" overrideKey="eps_growth" value={manualOverrides.eps_growth} onChange={handleOverrideChange} info="EPS Growth in percent (%). Enter absolute value (e.g., 15.5). Realistic range: -50 to +100." />}
                          {!hasRevenueGrowth && <TimerOverrideInput manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} label="Revenue Growth (%)" overrideKey="revenue_growth" value={manualOverrides.revenue_growth} onChange={handleOverrideChange} info="Revenue Growth in percent (%). Enter absolute value (e.g., 12.0). Realistic range: -20 to +100." />}
                          {!hasProfitGrowth && <TimerOverrideInput manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} label="Profit Growth (%)" overrideKey="profit_growth" value={manualOverrides.profit_growth} onChange={handleOverrideChange} info="Profit Growth in percent (%). Enter absolute value (e.g., 18.5). Realistic range: -50 to +200." />}
                          {!hasEpsYoy && <TimerOverrideInput manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} label="EPS YoY (%)" overrideKey="eps_yoy" value={manualOverrides.eps_yoy} onChange={handleOverrideChange} info="EPS Year-over-Year Growth in percent (%). Enter absolute value (e.g., 14.0). Realistic range: -50 to +100." />}
                          {!hasForwardEps && <TimerOverrideInput manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} label="Forward EPS" overrideKey="forward_eps" value={manualOverrides.forward_eps} onChange={handleOverrideChange} info="Forward EPS (Earnings Per Share) in INR. Enter absolute value (e.g., 45.50)." />}
                          {!hasProfitMargin && <TimerOverrideInput manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} label="Profit Margin (%)" overrideKey="profit_margin" value={manualOverrides.profit_margin} onChange={handleOverrideChange} info="Profit Margin in percent (%). Enter absolute value (e.g., 12.5). Realistic range: -20 to +50." />}
                          {!hasSmartMoneyFlow && <TimerOverrideInput manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} label="Smart Money Flow" overrideKey="smart_money_flow" value={manualOverrides.smart_money_flow} onChange={handleOverrideChange} info="Smart Money Flow index/percent. Enter absolute value (e.g., 65). Realistic range: 0 to 100." />}
                      </div>
                  )}

                  {/* Profitability & CCC */}
                  {(!hasRoe || !hasRoce || !hasRoa || !hasNetMargin || !hasOperatingMargin || !hasInventoryDays || !hasReceivableDays || !hasPayableDays) && (
                      <div className="space-y-3 break-inside-avoid mb-6">
                          <div className="text-[10px] font-bold text-green-500 mb-2 border-b border-border-default pb-1 uppercase tracking-wider">Profitability</div>
                          {!hasRoe && <TimerOverrideInput manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} label="ROE (%)" overrideKey="roe" value={manualOverrides.roe} onChange={handleOverrideChange} info="Return on Equity (ROE) in percent (%). Enter absolute value (e.g., 18.5). Realistic range: -20 to +50." />}
                          {!hasRoce && <TimerOverrideInput manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} label="ROCE (%)" overrideKey="roce" value={manualOverrides.roce} onChange={handleOverrideChange} info="Return on Capital Employed (ROCE) in percent (%). Enter absolute value (e.g., 20.0). Realistic range: -10 to +60." />}
                          {!hasRoa && <TimerOverrideInput manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} label="ROA (%)" overrideKey="roa" value={manualOverrides.roa} onChange={handleOverrideChange} info="Return on Assets (ROA) in percent (%). Enter absolute value (e.g., 8.5). Realistic range: -10 to +30." />}
                          {!hasNetMargin && <TimerOverrideInput manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} label="Net Margin (%)" overrideKey="net_margin" value={manualOverrides.net_margin} onChange={handleOverrideChange} info="Net Profit Margin in percent (%). Enter absolute value (e.g., 10.5). Realistic range: -20 to +50." />}
                          {!hasOperatingMargin && <TimerOverrideInput manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} label="Op. Margin (%)" overrideKey="operating_margin" value={manualOverrides.operating_margin} onChange={handleOverrideChange} info="Operating Margin in percent (%). Enter absolute value (e.g., 15.0). Realistic range: -20 to +60." />}
                          {!hasInventoryDays && <TimerOverrideInput manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} label="Inventory Days" overrideKey="inventory_days" value={manualOverrides.inventory_days} onChange={handleOverrideChange} info="Inventory Days (Days Sales of Inventory). Enter absolute value (e.g., 45). Realistic range: 5 to 300." />}
                          {!hasReceivableDays && <TimerOverrideInput manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} label="Receivable Days" overrideKey="receivable_days" value={manualOverrides.receivable_days} onChange={handleOverrideChange} info="Receivable Days (Days Sales Outstanding). Enter absolute value (e.g., 30). Realistic range: 5 to 150." />}
                          {!hasPayableDays && <TimerOverrideInput manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} label="Payable Days" overrideKey="payable_days" value={manualOverrides.payable_days} onChange={handleOverrideChange} info="Payable Days (Days Payable Outstanding). Enter absolute value (e.g., 60). Realistic range: 10 to 200." />}
                      </div>
                  )}

                  {/* Financial Health */}
                  {(!hasDebtToEquity || !hasInterestCoverage || !hasFreeCashFlow || !hasCurrentRatio) && (
                      <div className="space-y-3 break-inside-avoid mb-6">
                          <div className="text-[10px] font-bold text-purple-500 mb-2 border-b border-border-default pb-1 uppercase tracking-wider">Financial Health</div>
                          {!hasDebtToEquity && <TimerOverrideInput manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} label="Debt to Equity" overrideKey="debt_to_equity" value={manualOverrides.debt_to_equity} onChange={handleOverrideChange} info="Debt to Equity Ratio. Enter absolute value (e.g., 0.5). Realistic range: 0 to 5." />}
                          {!hasInterestCoverage && <TimerOverrideInput manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} label="Interest Coverage" overrideKey="interest_coverage" value={manualOverrides.interest_coverage} onChange={handleOverrideChange} info="Interest Coverage Ratio. Enter absolute value (e.g., 6.5). Realistic range: -5 to 50." />}
                          {!hasFreeCashFlow && <TimerOverrideInput manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} label="Free Cash Flow (Cr)" overrideKey="free_cash_flow" value={manualOverrides.free_cash_flow} onChange={handleOverrideChange} info="Free Cash Flow in Crores (INR). Enter absolute value (e.g., 1500)." />}
                          {!hasCurrentRatio && <TimerOverrideInput manualLastUpdated={manualLastUpdated} expiryConfigs={expiryConfigs} label="Current Ratio" overrideKey="current_ratio" value={manualOverrides.current_ratio} onChange={handleOverrideChange} info="Current Ratio. Enter absolute value (e.g., 1.5). Realistic range: 0.2 to 5.0." />}
                      </div>
                  )}

                  {/* Removed Risk Section */}
              </div>
          )}
      </div>
  );

  // --- Dynamic Coverage & Credits Calculation ---
  // Dynamic maxCards = total cards tracked for the current category
  const maxCards = cards.length;
  // activeCardsCount: count all cards that have a valid numeric score.
  // Cards with no data are already removed from rawScores by the engine.
  // Valid scores can range from 0 (Strong Bearish) to 100 (Strong Bullish).
  const activeCardsCount = Object.values(compositeData.rawScores || {}).filter(v => v !== null && v !== undefined && !isNaN(v) && v >= 0).length;
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
          
          const isManual = manualOverrides && manualOverrides[id] !== undefined && manualOverrides[id] !== null && manualOverrides[id] !== '';
          const cardMeta = {
              hasLiveData: !isManual,
              isManual: isManual,
              lastUpdated: resolveTime(!isManual, isManual ? null : id) ? new Date(resolveTime(!isManual, isManual ? null : id)).getTime() : Date.now(),
              sourcePipeline: isManual ? 'manual' : 'upstox'
          };
          const cCard = computeCardConfidence(cardMeta, 'fundamentals');

          return { id, module: cardName, normalized, credit, creditAllocation: credit, score, cCard };
      });

  const totalCredits = cardsForHeader.reduce((acc, c) => acc + c.credit, 0);
  const headerConfidence = computeHeaderConfidence(cardsForHeader, 31, 'fundamentals');

  // Silently Stream the Snapshot to SQLite backend
  useAiSync(
      selectedInstrument, 
      "Fundamentals", 
      {
          ...compositeData,
          cards: cardsForHeader
      }
  );

  const contextValue = React.useMemo(() => ({ instrumentKey: selectedInstrument, snapshots: historicalSnapshots }), [selectedInstrument, historicalSnapshots]);

  if (loading && !rawFundamentalsData) {
      return (
          <div className="w-full min-h-[80vh] flex flex-col items-center justify-center bg-background-base animate-in fade-in duration-500">
              <Loader size="lg" color="blue" />
              <p className="text-text-secondary mt-8 font-mono text-[11px] tracking-[0.2em] animate-pulse uppercase">
                  Synchronizing {selectedCategory} Pipeline...
              </p>
          </div>
      );
  }

  return (
    <div className="px-4 md:px-6 pt-2 pb-32 animate-in fade-in duration-500 w-full mx-auto min-h-screen">

      {/* HEADER SECTION */}
      <div className="relative z-50 isolate mb-6 mt-0">
          <GlobalHeader
              title="Fundamental Composite"
              score={compositeData.compositeScore}
              prevScore={prevCompositeScore} // Calculated from historical snapshots
              regime={{ ...compositeData.regime, confidence: headerConfidence }}
              isIndex={isIndex}
              sections={compositeData.sections}
              tailwinds={compositeData.tailwinds}
              headwinds={compositeData.headwinds}
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
              masterPayload={compositeData.nestedTreePayload}
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
      </div>
    </div>
  );
}

