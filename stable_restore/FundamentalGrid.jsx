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

// =============================
// Main Component
// =============================
export default function FundamentalGrid({ cards, viewMode, sortMode = "score_desc", onCardClick, controls }) {

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
     FLAT VIEW
     ------------------------------------------------------------ */
  if (viewMode === 'flat') {
    const sortedFlat = sortCards(cards);
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 md:gap-4 items-start">
        {/* Render our highly specialized indicator templates first */}
        <PERatioCard data={data} />
        {selectedCategory !== "Indices" && <ForwardPECard data={data} />}
        <PBRatioCard data={data} />
        {/* Market Health Cards */}
        <MarketCapGDPCard data={data} />
        <DividendYieldCard data={data} />
        {selectedCategory !== "Indices" && <EarningsTrendCard data={data} />}
        <FIIDIIFlowCard data={data} />
        {selectedCategory !== "Indices" && <EarningsYieldCard data={data} />}
        <EPSGrowthCard data={data} />
        {selectedCategory !== "Indices" && <RevenueGrowthCard data={data} />}
        {selectedCategory !== "Indices" && <ProfitGrowthCard data={data} />}
        <GDPGrowthCard data={data} />
        {selectedCategory !== "Indices" && (
          <>
            <ROECard data={data} />
            <ROCECard data={data} />
            <NetMarginCard data={data} />
            <OperatingMarginCard data={data} />
            {/* Financial Health Cards */}
            <DebtToEquityCard data={data} />
            <InterestCoverageCard data={data} />
            <FreeCashFlowCard data={data} />
            <CurrentRatioCard data={data} />
          </>
        )}

        {sortedFlat.map(card => {
          if (
            card.id === 'pe_ratio' ||
            card.id === 'forward_pe' ||
            card.id === 'pb_ratio' ||
            card.id === 'market_cap_gdp' ||
            card.id === 'dividend_yield' ||
            card.id === 'earnings_trend' ||
            card.id === 'fii_dii_flow' ||
            card.id === 'earnings_yield' ||
            card.id === 'eps_growth' ||
            card.id === 'revenue_growth' ||
            card.id === 'profit_growth' ||
            card.id === 'gdp_growth' ||
            card.id === 'roe' ||
            card.id === 'roce' ||
            card.id === 'net_margin' ||
            card.id === 'operating_margin' ||
            card.id === 'debt_to_equity' ||
            card.id === 'interest_coverage' ||
            card.id === 'free_cash_flow' ||
            card.id === 'current_ratio'
              card={card}
              onClick={() => onCardClick(card)}
            />
          );
        })}
        {cards.length === 0 && (
          <div className="col-span-full text-center py-12 text-text-tertiary italic">
            No metrics match your search.
          </div>
        {cards.length === 0 && (
          <div className="col-span-full text-center py-12 text-text-tertiary italic">
            No metrics match your search.
          </div>
        )}
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
            if (!sections[section.id]?.length) return null;
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
            'Valuation': 4,
            'Market Health': 4,
            'Growth': 4,
            'Profitability': 4,
            'Financial Health': 4
          };
          const hardcodedCount = hardcodedCounts[section.id] || 0;
          const rawList = sections[section.id];
          const validDynamicCards = rawList ? rawList.filter(c => !c.id?.startsWith('dummy_')) : [];
          
          if (hardcodedCount === 0 && validDynamicCards.length === 0) return null;

          const sectionCards = sortCards(validDynamicCards);

          return (
            <div key={section.id} id={`section-${section.id}`} className="animate-in fade-in slide-in-from-bottom-4 duration-500 scroll-mt-20">
              {/* Header */}
              <div className="flex items-center justify-center gap-4 mb-3 md:mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-text-primary uppercase tracking-widest">{section.label}</span>

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
                    <PERatioCard data={data} manualOverride={manualOverrides?.pe_ratio} />
                    {selectedCategory !== "Indices" && <ForwardPECard data={data} manualOverride={manualOverrides?.forward_pe} />}
                    <PBRatioCard data={data} manualOverride={manualOverrides?.pb_ratio} />
                    {selectedCategory !== "Indices" && <EarningsYieldCard data={data} manualOverride={manualOverrides?.earnings_yield} />}
                  </>
                )}
                {section.id === 'Market Health' && (
                  <>
                    <MarketCapGDPCard data={data} manualOverride={manualOverrides?.market_cap_gdp} />
                    <DividendYieldCard data={data} manualOverride={manualOverrides?.dividend_yield} />
                    {selectedCategory !== "Indices" && <EarningsTrendCard data={data} manualOverride={manualOverrides?.earnings_trend} />}
                    <FIIDIIFlowCard data={data} manualOverride={manualOverrides?.fii_dii_flow} />
                  </>
                )}
                {section.id === 'Growth' && (
                  <>
                    <EPSGrowthCard data={data} manualOverride={manualOverrides?.eps_growth} />
                    {selectedCategory !== "Indices" && <RevenueGrowthCard data={data} manualOverride={manualOverrides?.revenue_growth} />}
                    {selectedCategory !== "Indices" && <ProfitGrowthCard data={data} manualOverride={manualOverrides?.profit_growth} />}
                    <GDPGrowthCard data={data} manualOverride={manualOverrides?.gdp_growth} />
                  </>
                )}
                {section.id === 'Profitability' && selectedCategory !== "Indices" && (
                  <>
                    <ROECard data={data} manualOverride={manualOverrides?.roe} />
                    <ROCECard data={data} manualOverride={manualOverrides?.roce} />
                    <NetMarginCard data={data} manualOverride={manualOverrides?.net_margin} />
                    <OperatingMarginCard data={data} manualOverride={manualOverrides?.operating_margin} />
                  </>
                )}
                {section.id === 'Financial Health' && selectedCategory !== "Indices" && (
                  <>
                    <DebtToEquityCard data={data} manualOverride={manualOverrides?.debt_to_equity} />
                    <InterestCoverageCard data={data} manualOverride={manualOverrides?.interest_coverage} />
                    card.id === 'dividend_yield' ||
                    card.id === 'earnings_trend' ||
                    card.id === 'fii_dii_flow' ||
                    card.id === 'eps_growth' ||
                    card.id === 'revenue_growth' ||
                    card.id === 'profit_growth' ||
                    card.id === 'gdp_growth' ||
                    card.id === 'roe' ||
                    card.id === 'roce' ||
                    card.id === 'net_margin' ||
                    card.id === 'operating_margin' ||
                    card.id === 'debt_to_equity' ||
                    card.id === 'interest_coverage' ||
                    card.id === 'free_cash_flow' ||
                    card.id === 'current_ratio'
                  ) return null; // Prevent double rendering since we hardcoded these above
                  return (
                    <FundamentalCard
                      key={card.id}
                      card={card}
                      onClick={() => onCardClick(card)}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
