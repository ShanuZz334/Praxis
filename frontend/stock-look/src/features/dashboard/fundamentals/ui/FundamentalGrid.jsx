/**
 * @file FundamentalGrid.jsx
 * @purpose Renders the grid of Fundamental Cards, supporting multiple view modes.
 * @responsibilities
 * - Supports 'Flat' view (all cards ranked) and 'Sectioned' view (categorized).
 * - Handles complex sorting logic (Strongest/Weakest/Reliability).
 * - Provides category navigation for Mobile.
 * @key_exports
 * - FundamentalGrid (Default Component)
 * @dependencies
 * - FundamentalCard: Metric display.
 * - fundamentalData: For section definitions.
 * @lifecycle
 * - Rendered in FundamentalPage.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React, { useMemo } from 'react';
import FundamentalCard from './FundamentalCard';
import PERatioCard from './PERatioCard';
import ForwardPECard from './ForwardPECard';
import PBRatioCard from './PBRatioCard';
import MarketCapGDPCard from './MarketCapGDPCard';
import DividendYieldCard from './DividendYieldCard';
import EarningsTrendCard from './EarningsTrendCard';
import FIIDIIFlowCard from './FIIDIIFlowCard';
import { FUNDAMENTAL_SECTIONS } from '../data/fundamentalData';
import EarningsYieldCard from './EarningsYieldCard';
import EPSGrowthCard from './EPSGrowthCard';
import RevenueGrowthCard from './RevenueGrowthCard';
import ProfitGrowthCard from './ProfitGrowthCard';
import GDPGrowthCard from './GDPGrowthCard';
import ROECard from './ROECard';
import ROCECard from './ROCECard';
import NetMarginCard from './NetMarginCard';
import OperatingMarginCard from './OperatingMarginCard';
import DebtToEquityCard from './DebtToEquityCard';
import InterestCoverageCard from './InterestCoverageCard';
import FreeCashFlowCard from './FreeCashFlowCard';
import CurrentRatioCard from './CurrentRatioCard';

// IDs that are handled by specialized hardcoded cards
const HARDCODED_IDS = new Set([
  'pe_ratio', 'forward_pe', 'pb_ratio', 'earnings_yield',
  'market_cap_gdp', 'dividend_yield', 'earnings_trend', 'fii_dii_flow',
  'eps_growth', 'revenue_growth', 'profit_growth', 'gdp_growth',
  'roe', 'roce', 'net_margin', 'operating_margin',
  'debt_to_equity', 'interest_coverage', 'free_cash_flow', 'current_ratio',
]);

// =============================
// Main Component
// =============================
export default function FundamentalGrid({ cards, viewMode, sortMode = "score_desc", onCardClick, controls, data, selectedCategory, manualOverrides, lastUpdated, manualLastUpdated }) {

  // Resolve the correct timestamp for each card:
  // - Live (AUTO) cards show when the API data was last fetched
  // - Manual cards show when the override was last changed
  const liveTime   = lastUpdated       || '--:--';
  const manualTime = manualLastUpdated || '--:--';
  // For cards where we don't know the source yet, show whichever is newer (non-placeholder)
  const resolveTime = (isLive) => isLive ? liveTime : manualTime;

  // --- Logic: Sorting ---
  const sortCards = (list) => {
    const arr = [...list];
    switch (sortMode) {
      case 'score_desc':
        return arr.sort((a, b) => (b.normalized || 0) - (a.normalized || 0));
      case 'score_asc':
        return arr.sort((a, b) => (a.normalized || 0) - (b.normalized || 0));
      case 'rel_desc':
        return arr.sort((a, b) => (b.creditAllocation || 0) - (a.creditAllocation || 0));
      case 'rel_asc':
        return arr.sort((a, b) => (a.creditAllocation || 0) - (b.creditAllocation || 0));
      default:
        return arr;
    }
  };

  // --- Logic: Grouping ---
  const sections = useMemo(() => {
    if (viewMode !== 'sectioned') return null;

    const groups = {};
    FUNDAMENTAL_SECTIONS.forEach(sec => { groups[sec.id] = []; });
    groups['Other'] = [];

    cards.forEach(card => {
      const key = card.category || 'Other';
      if (groups[key]) groups[key].push(card);
      else groups['Other'].push(card);
    });

    return groups;
  }, [cards, viewMode]);

  /* ------------------------------------------------------------
     SEARCH CONTROLS (rendered at top)
     ------------------------------------------------------------ */
  const SearchControls = controls ? (
    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-3">
      <div className="relative group w-full md:w-64 transition-all focus-within:md:w-80 shrink-0">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <input
          type="text"
          value={controls.search || ''}
          onChange={(e) => controls.onSearchChange(e.target.value)}
          placeholder="Filter metrics..."
          className="w-full pl-9 pr-4 py-2 bg-background-app border border-border-subtle rounded-lg text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-blue-500/50 transition-all"
        />
      </div>
    </div>
  ) : null;

  /* ------------------------------------------------------------
     FLAT VIEW
     ------------------------------------------------------------ */
  if (viewMode === 'flat') {
    const sortedFlat = sortCards(cards);
    return (
      <div>
        {SearchControls}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 md:gap-4 items-start">
          {/* Hardcoded specialized cards */}
          <PERatioCard
            data={{ ...data, manualPeHist: manualOverrides?.pe_hist, manualPeSector: manualOverrides?.pe_sector }}
            manualOverride={manualOverrides?.pe_ratio}
            lastUpdated={data ? liveTime : manualTime}
          />
          {selectedCategory !== "Indices" && (
            <ForwardPECard 
              data={{ ...data, manualProjectedEps: manualOverrides?.projected_eps }} 
              manualOverride={manualOverrides?.forward_pe} 
              lastUpdated={data ? liveTime : manualTime} 
            />
          )}
          <PBRatioCard data={data} manualOverride={manualOverrides?.pb_ratio} lastUpdated={data ? liveTime : manualTime} />
          {selectedCategory !== "Indices" && <EarningsYieldCard data={data} manualOverride={manualOverrides?.earnings_yield} lastUpdated={data ? liveTime : manualTime} />}
          <MarketCapGDPCard data={data} manualOverride={manualOverrides?.market_cap_gdp} lastUpdated={manualTime} />
          <DividendYieldCard data={data} manualOverride={manualOverrides?.dividend_yield} lastUpdated={data ? liveTime : manualTime} />
          {selectedCategory !== "Indices" && <EarningsTrendCard data={data} manualOverride={manualOverrides?.earnings_trend} lastUpdated={manualTime} />}
          <FIIDIIFlowCard data={data} manualOverride={manualOverrides?.fii_dii_flow} lastUpdated={manualTime} />
          <EPSGrowthCard data={data} manualOverride={manualOverrides?.eps_growth} lastUpdated={data ? liveTime : manualTime} />
          {selectedCategory !== "Indices" && <RevenueGrowthCard data={data} manualOverride={manualOverrides?.revenue_growth} lastUpdated={data ? liveTime : manualTime} />}
          {selectedCategory !== "Indices" && <ProfitGrowthCard data={data} manualOverride={manualOverrides?.profit_growth} lastUpdated={data ? liveTime : manualTime} />}
          <GDPGrowthCard data={data} manualOverride={manualOverrides?.gdp_growth} lastUpdated={manualTime} />
          {selectedCategory !== "Indices" && (
            <>
              <ROECard data={data} manualOverride={manualOverrides?.roe} lastUpdated={data ? liveTime : manualTime} />
              <ROCECard data={data} manualOverride={manualOverrides?.roce} lastUpdated={data ? liveTime : manualTime} />
              <NetMarginCard data={data} manualOverride={manualOverrides?.net_margin} lastUpdated={data ? liveTime : manualTime} />
              <OperatingMarginCard data={data} manualOverride={manualOverrides?.operating_margin} lastUpdated={data ? liveTime : manualTime} />
              <DebtToEquityCard data={data} manualOverride={manualOverrides?.debt_to_equity} lastUpdated={data ? liveTime : manualTime} />
              <InterestCoverageCard data={data} manualOverride={manualOverrides?.interest_coverage} lastUpdated={data ? liveTime : manualTime} />
              <FreeCashFlowCard data={data} manualOverride={manualOverrides?.free_cash_flow} lastUpdated={data ? liveTime : manualTime} />
              <CurrentRatioCard data={data} manualOverride={manualOverrides?.current_ratio} lastUpdated={data ? liveTime : manualTime} />
            </>
          )}
          {/* Remaining dynamic cards that aren't hardcoded above */}
          {sortedFlat.filter(card => !HARDCODED_IDS.has(card.id)).map(card => (
            <FundamentalCard
              key={card.id}
              card={card}
              onClick={() => onCardClick(card)}
            />
          ))}
          {cards.length === 0 && (
            <div className="col-span-full text-center py-12 text-text-tertiary italic">
              No metrics match your search.
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------
     SECTIONED VIEW
     ------------------------------------------------------------ */
  return (
    <div className="space-y-6">

      {/* Mobile/Tablet Navigator */}
      {viewMode === "sectioned" && (
        <div className="lg:hidden flex overflow-x-auto gap-2 pb-2 -mx-1 px-1 custom-scrollbar-hidden sticky top-0 bg-background-app/80 backdrop-blur-md z-30 py-3">
          {FUNDAMENTAL_SECTIONS.map(section => {
            if (!sections[section.id]?.length && !['Valuation','Market Health','Growth','Profitability','Financial Health'].includes(section.id)) return null;
            return (
              <button
                key={section.id}
                onClick={() => {
                  const el = document.getElementById(`section-${section.id}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="shrink-0 px-3 py-1.5 rounded-full bg-background-elevated border border-border-subtle text-[11px] font-bold text-text-secondary hover:text-text-primary hover:border-border-default transition-all whitespace-nowrap"
              >
                {section.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Sections Map */}
      <div className="space-y-6 md:space-y-12">
        {FUNDAMENTAL_SECTIONS.map(section => {
          const hardcodedCounts = {
            'Valuation': selectedCategory !== "Indices" ? 4 : 2,
            'Market Health': selectedCategory !== "Indices" ? 4 : 3,
            'Growth': selectedCategory !== "Indices" ? 4 : 2,
            'Profitability': selectedCategory !== "Indices" ? 4 : 0,
            'Financial Health': selectedCategory !== "Indices" ? 4 : 0,
          };
          const hardcodedCount = hardcodedCounts[section.id] || 0;
          const rawList = sections ? sections[section.id] : [];
          const validDynamicCards = rawList ? rawList.filter(c => !HARDCODED_IDS.has(c.id)) : [];

          if (hardcodedCount === 0 && validDynamicCards.length === 0) return null;

          const sectionCards = sortCards(validDynamicCards);

          return (
            <div key={section.id} id={`section-${section.id}`} className="animate-in fade-in slide-in-from-bottom-4 duration-500 scroll-mt-20">
              {/* Header */}
              <div className="flex items-center justify-center gap-4 mb-3 md:mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-text-primary uppercase tracking-widest">{section.label}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded border border-border-default bg-background-surface text-text-tertiary font-mono shadow-sm">
                    {sectionCards.length + hardcodedCount}
                  </span>
                </div>
              </div>

              {/* Card Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 md:gap-4 items-start">
                {section.id === 'Valuation' && (
                  <>
                    <PERatioCard
                      data={{ ...data, manualPeHist: manualOverrides?.pe_hist, manualPeSector: manualOverrides?.pe_sector }}
                      manualOverride={manualOverrides?.pe_ratio}
                      lastUpdated={data ? liveTime : manualTime}
                    />
                    {selectedCategory !== "Indices" && (
                      <ForwardPECard 
                        data={{ ...data, manualProjectedEps: manualOverrides?.projected_eps }} 
                        manualOverride={manualOverrides?.forward_pe} 
                        lastUpdated={data ? liveTime : manualTime} 
                      />
                    )}
                    <PBRatioCard data={data} manualOverride={manualOverrides?.pb_ratio} lastUpdated={data ? liveTime : manualTime} />
                    {selectedCategory !== "Indices" && <EarningsYieldCard data={data} manualOverride={manualOverrides?.earnings_yield} lastUpdated={data ? liveTime : manualTime} />}
                  </>
                )}
                {section.id === 'Market Health' && (
                  <>
                    <MarketCapGDPCard data={data} manualOverride={manualOverrides?.market_cap_gdp} lastUpdated={manualTime} />
                    <DividendYieldCard data={data} manualOverride={manualOverrides?.dividend_yield} lastUpdated={data ? liveTime : manualTime} />
                    {selectedCategory !== "Indices" && <EarningsTrendCard data={data} manualOverride={manualOverrides?.earnings_trend} lastUpdated={manualTime} />}
                    <FIIDIIFlowCard data={data} manualOverride={manualOverrides?.fii_dii_flow} lastUpdated={manualTime} />
                  </>
                )}
                {section.id === 'Growth' && (
                  <>
                    <EPSGrowthCard data={data} manualOverride={manualOverrides?.eps_growth} lastUpdated={data ? liveTime : manualTime} />
                    {selectedCategory !== "Indices" && <RevenueGrowthCard data={data} manualOverride={manualOverrides?.revenue_growth} lastUpdated={data ? liveTime : manualTime} />}
                    {selectedCategory !== "Indices" && <ProfitGrowthCard data={data} manualOverride={manualOverrides?.profit_growth} lastUpdated={data ? liveTime : manualTime} />}
                    <GDPGrowthCard data={data} manualOverride={manualOverrides?.gdp_growth} lastUpdated={manualTime} />
                  </>
                )}
                {section.id === 'Profitability' && selectedCategory !== "Indices" && (
                  <>
                    <ROECard data={data} manualOverride={manualOverrides?.roe} lastUpdated={data ? liveTime : manualTime} />
                    <ROCECard data={data} manualOverride={manualOverrides?.roce} lastUpdated={data ? liveTime : manualTime} />
                    <NetMarginCard data={data} manualOverride={manualOverrides?.net_margin} lastUpdated={data ? liveTime : manualTime} />
                    <OperatingMarginCard data={data} manualOverride={manualOverrides?.operating_margin} lastUpdated={data ? liveTime : manualTime} />
                  </>
                )}
                {section.id === 'Financial Health' && selectedCategory !== "Indices" && (
                  <>
                    <DebtToEquityCard data={data} manualOverride={manualOverrides?.debt_to_equity} lastUpdated={data ? liveTime : manualTime} />
                    <InterestCoverageCard data={data} manualOverride={manualOverrides?.interest_coverage} lastUpdated={data ? liveTime : manualTime} />
                    <FreeCashFlowCard data={data} manualOverride={manualOverrides?.free_cash_flow} lastUpdated={data ? liveTime : manualTime} />
                    <CurrentRatioCard data={data} manualOverride={manualOverrides?.current_ratio} lastUpdated={data ? liveTime : manualTime} />
                  </>
                )}
                {/* Any additional dynamic cards not in hardcoded list */}
                {sectionCards.map(card => (
                  <FundamentalCard
                    key={card.id}
                    card={card}
                    onClick={() => onCardClick(card)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
