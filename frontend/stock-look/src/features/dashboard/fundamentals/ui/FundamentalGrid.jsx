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
import AdvanceDeclineCard from './AdvanceDeclineCard';
import VolatilityCard from './VolatilityCard';
import IndexPCRCard from './IndexPCRCard';
import MACDTrendCard from './MACDTrendCard';
import MovingAverageCard from './MovingAverageCard';

// IDs that are handled by specialized hardcoded cards
const HARDCODED_IDS = new Set([
  'pe_ratio', 'forward_pe', 'pb_ratio', 'earnings_yield',
  'market_cap_gdp', 'dividend_yield', 'earnings_trend', 'fii_dii_flow',
  'eps_growth', 'revenue_growth', 'profit_growth', 'gdp_growth',
  'roe', 'roce', 'net_margin', 'operating_margin',
  'debt_to_equity', 'interest_coverage', 'free_cash_flow', 'current_ratio',
  'advance_decline', 'india_vix', 'index_pcr', 'index_macd', 'index_200dma'
]);

// =============================
// Main Component
// =============================
export default function FundamentalGrid({ cards, viewMode, sortMode = "score_desc", onCardClick, controls, data, snapshot, selectedCategory, manualOverrides, lastUpdated, manualLastUpdated }) {

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
        return arr.sort((a, b) => (b.score || 0) - (a.score || 0));
      case 'score_asc':
        return arr.sort((a, b) => (a.score || 0) - (b.score || 0));
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

  const getHardcodedNode = (cardId) => {
      switch (cardId) {
          case 'pe_ratio': return <PERatioCard key={cardId} data={data} manualOverride={selectedCategory === "Indices" ? manualOverrides?.index_pe : manualOverrides?.pe_ratio} lastUpdated={resolveTime(true)} />;
          case 'forward_pe': return <ForwardPECard key={cardId} data={data} manualOverride={manualOverrides?.forward_pe} lastUpdated={resolveTime(false)} />;
          case 'pb_ratio': return <PBRatioCard key={cardId} data={data} manualOverride={selectedCategory === "Indices" ? manualOverrides?.index_pb : manualOverrides?.pb_ratio} lastUpdated={resolveTime(true)} />;
          case 'earnings_yield': return <EarningsYieldCard key={cardId} data={data} manualOverride={manualOverrides?.earnings_yield} lastUpdated={resolveTime(true)} />;
          case 'market_cap_gdp': return <MarketCapGDPCard key={cardId} data={data} manualOverride={manualOverrides?.market_cap_gdp} lastUpdated={resolveTime(false)} />;
          case 'dividend_yield': return <DividendYieldCard key={cardId} data={data} manualOverride={selectedCategory === "Indices" ? manualOverrides?.index_div_yield : manualOverrides?.dividend_yield} lastUpdated={resolveTime(true)} />;
          case 'earnings_trend': return <EarningsTrendCard key={cardId} data={data} manualOverride={manualOverrides?.earnings_trend} lastUpdated={resolveTime(false)} />;
          case 'fii_dii_flow': return <FIIDIIFlowCard key={cardId} data={{ ...data, manualDiiFlow: manualOverrides?.dii_flow }} manualOverride={manualOverrides?.fii_flow} lastUpdated={resolveTime(false)} />;
          case 'eps_growth': return <EPSGrowthCard key={cardId} data={data} manualOverride={manualOverrides?.eps_growth} lastUpdated={resolveTime(true)} />;
          case 'revenue_growth': return <RevenueGrowthCard key={cardId} data={data} manualOverride={manualOverrides?.revenue_growth} lastUpdated={resolveTime(true)} />;
          case 'profit_growth': return <ProfitGrowthCard key={cardId} data={data} manualOverride={manualOverrides?.profit_growth} lastUpdated={resolveTime(true)} />;
          case 'gdp_growth': return <GDPGrowthCard key={cardId} data={data} manualOverride={manualOverrides?.gdp_growth} lastUpdated={resolveTime(false)} />;
          case 'roe': return <ROECard key={cardId} data={data} manualOverride={manualOverrides?.roe} lastUpdated={resolveTime(true)} />;
          case 'roce': return <ROCECard key={cardId} data={data} manualOverride={manualOverrides?.roce} lastUpdated={resolveTime(true)} />;
          case 'net_margin': return <NetMarginCard key={cardId} data={data} manualOverride={manualOverrides?.net_margin} lastUpdated={resolveTime(true)} />;
          case 'operating_margin': return <OperatingMarginCard key={cardId} data={data} manualOverride={manualOverrides?.operating_margin} lastUpdated={resolveTime(true)} />;
          case 'debt_to_equity': return <DebtToEquityCard key={cardId} data={data} manualOverride={manualOverrides?.debt_to_equity} lastUpdated={resolveTime(true)} />;
          case 'interest_coverage': return <InterestCoverageCard key={cardId} data={data} manualOverride={manualOverrides?.interest_coverage} lastUpdated={resolveTime(true)} />;
          case 'free_cash_flow': return <FreeCashFlowCard key={cardId} data={data} manualOverride={manualOverrides?.free_cash_flow} lastUpdated={resolveTime(true)} />;
          case 'current_ratio': return <CurrentRatioCard key={cardId} data={data} manualOverride={manualOverrides?.current_ratio} lastUpdated={resolveTime(true)} />;
          case 'advance_decline': return <AdvanceDeclineCard key={cardId} data={data} manualOverride={selectedCategory === "Indices" ? manualOverrides?.ad_ratio : manualOverrides?.advance_decline} lastUpdated={resolveTime(false)} />;
          case 'india_vix': return <VolatilityCard key={cardId} data={data} manualOverride={manualOverrides?.india_vix} lastUpdated={resolveTime(false)} />;
          case 'index_pcr': return <IndexPCRCard key={cardId} data={data} manualOverride={manualOverrides?.index_pcr} lastUpdated={resolveTime(false)} />;
          case 'index_macd': return <MACDTrendCard key={cardId} data={data} manualOverride={manualOverrides?.index_macd} lastUpdated={resolveTime(false)} />;
          case 'index_200dma': return <MovingAverageCard key={cardId} data={data} manualOverride={manualOverrides?.index_200dma} lastUpdated={resolveTime(false)} />;
          default: return null;
      }
  }

  /* ------------------------------------------------------------
     FLAT VIEW
     ------------------------------------------------------------ */
  if (viewMode === 'flat') {
    const renderList = [];

    renderList.push({ id: 'pe_ratio', node: getHardcodedNode('pe_ratio') });
    if (selectedCategory !== "Indices") renderList.push({ id: 'forward_pe', node: getHardcodedNode('forward_pe') });
    renderList.push({ id: 'pb_ratio', node: getHardcodedNode('pb_ratio') });
    if (selectedCategory !== "Indices") renderList.push({ id: 'earnings_yield', node: getHardcodedNode('earnings_yield') });
    renderList.push({ id: 'market_cap_gdp', node: getHardcodedNode('market_cap_gdp') });
    renderList.push({ id: 'dividend_yield', node: getHardcodedNode('dividend_yield') });
    if (selectedCategory !== "Indices") renderList.push({ id: 'earnings_trend', node: getHardcodedNode('earnings_trend') });
    renderList.push({ id: 'fii_dii_flow', node: getHardcodedNode('fii_dii_flow') });
    renderList.push({ id: 'eps_growth', node: getHardcodedNode('eps_growth') });
    if (selectedCategory !== "Indices") {
      renderList.push({ id: 'revenue_growth', node: getHardcodedNode('revenue_growth') });
      renderList.push({ id: 'profit_growth', node: getHardcodedNode('profit_growth') });
    }
    renderList.push({ id: 'gdp_growth', node: getHardcodedNode('gdp_growth') });

    if (selectedCategory === "Indices") {
      renderList.push({ id: 'india_vix', node: getHardcodedNode('india_vix') });
      renderList.push({ id: 'index_pcr', node: getHardcodedNode('index_pcr') });
      renderList.push({ id: 'index_macd', node: getHardcodedNode('index_macd') });
      renderList.push({ id: 'index_200dma', node: getHardcodedNode('index_200dma') });
    }

    if (selectedCategory !== "Indices") {
      renderList.push({ id: 'roe', node: getHardcodedNode('roe') });
      renderList.push({ id: 'roce', node: getHardcodedNode('roce') });
      renderList.push({ id: 'net_margin', node: getHardcodedNode('net_margin') });
      renderList.push({ id: 'operating_margin', node: getHardcodedNode('operating_margin') });
      renderList.push({ id: 'debt_to_equity', node: getHardcodedNode('debt_to_equity') });
      renderList.push({ id: 'interest_coverage', node: getHardcodedNode('interest_coverage') });
      renderList.push({ id: 'free_cash_flow', node: getHardcodedNode('free_cash_flow') });
      renderList.push({ id: 'current_ratio', node: getHardcodedNode('current_ratio') });
    }

    // Merge data from cards array so they can be sorted
    const flatWithData = renderList.map(item => {
        const cData = cards.find(c => c.id === item.id) || { normalized: 0, creditAllocation: 0 };
        return { ...item, ...cData };
    });

    // Add generic cards
    const dynamicCards = cards.filter(card => !HARDCODED_IDS.has(card.id)).map(card => ({
        id: card.id,
        ...card,
        node: <FundamentalCard key={card.id} card={card} onClick={() => onCardClick(card)} />
    }));
    flatWithData.push(...dynamicCards);

    // Filter by search if needed (currently search is handled higher up, but we render based on `sortedFlat`)
    // If the card doesn't exist in `cards` array, it means it was filtered out by the search bar.
    const filteredFlatWithData = flatWithData.filter(item => cards.some(c => c.id === item.id));

    const sortedFlat = sortCards(filteredFlatWithData);

    return (
      <div>
        {SearchControls}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 md:gap-4 items-start">
          {sortedFlat.map(item => (
            <React.Fragment key={item.id}>{item.node}</React.Fragment>
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
          {FUNDAMENTAL_SECTIONS.map(section => (
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
          ))}
        </div>
      )}

      {/* Sections Map */}
      <div className="space-y-6 md:space-y-12">
        {FUNDAMENTAL_SECTIONS.map(section => {
          const hardcodedCounts = {
            'Valuation': selectedCategory !== "Indices" ? 4 : 4,
            'Earnings': selectedCategory !== "Indices" ? 3 : 1,
            'Macro': 1,
            'Liquidity': 1,
            'Sector': selectedCategory !== "Indices" ? 3 : 2,
            'Corporate': selectedCategory !== "Indices" ? 4 : 2,
            'Global': selectedCategory !== "Indices" ? 4 : 1,
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
                
                {/* 1. Valuation */}
                {section.id === 'Valuation' && (
                  <>
                    {getHardcodedNode('pe_ratio')}
                    {selectedCategory !== "Indices" && getHardcodedNode('forward_pe')}
                    {getHardcodedNode('pb_ratio')}
                    {selectedCategory !== "Indices" ? getHardcodedNode('earnings_yield') : getHardcodedNode('dividend_yield')}
                    {selectedCategory === "Indices" && getHardcodedNode('market_cap_gdp')}
                  </>
                )}

                {/* 2. Earnings */}
                {section.id === 'Earnings' && (
                  <>
                    {getHardcodedNode('eps_growth')}
                    {selectedCategory !== "Indices" && (
                      <>
                        {getHardcodedNode('revenue_growth')}
                        {getHardcodedNode('profit_growth')}
                      </>
                    )}
                  </>
                )}

                {/* 3. Macro */}
                {section.id === 'Macro' && getHardcodedNode('gdp_growth')}

                {/* 4. Liquidity */}
                {section.id === 'Liquidity' && getHardcodedNode('fii_dii_flow')}

                {/* 5. Sector (Mkt Breadth/Valuation) */}
                {section.id === 'Sector' && (
                  <>
                    {selectedCategory !== "Indices" ? (
                      <>
                        {getHardcodedNode('market_cap_gdp')}
                        {getHardcodedNode('dividend_yield')}
                        {getHardcodedNode('earnings_trend')}
                      </>
                    ) : (
                      <>
                        {getHardcodedNode('advance_decline')}
                        {getHardcodedNode('index_pcr')}
                      </>
                    )}
                  </>
                )}

                {/* 6. Corporate (Profitability/Momentum) */}
                {section.id === 'Corporate' && (
                  <>
                    {selectedCategory !== "Indices" ? (
                      <>
                        <ROECard data={data} manualOverride={manualOverrides?.roe} lastUpdated={data ? liveTime : manualTime} />
                        <ROCECard data={data} manualOverride={manualOverrides?.roce} lastUpdated={data ? liveTime : manualTime} />
                        <NetMarginCard data={data} manualOverride={manualOverrides?.net_margin} lastUpdated={data ? liveTime : manualTime} />
                        <OperatingMarginCard data={data} manualOverride={manualOverrides?.operating_margin} lastUpdated={data ? liveTime : manualTime} />
                      </>
                    ) : (
                      <>
                        <MACDTrendCard data={data} manualOverride={manualOverrides?.index_macd} lastUpdated={manualTime} />
                        <MovingAverageCard data={data} manualOverride={manualOverrides?.index_200dma} lastUpdated={manualTime} />
                      </>
                    )}
                  </>
                )}

                {/* 7. Global (Financial Health/Risk) */}
                {section.id === 'Global' && (
                  <>
                    {selectedCategory !== "Indices" ? (
                      <>
                        <DebtToEquityCard data={data} manualOverride={manualOverrides?.debt_to_equity} lastUpdated={data ? liveTime : manualTime} />
                        <InterestCoverageCard data={data} manualOverride={manualOverrides?.interest_coverage} lastUpdated={data ? liveTime : manualTime} />
                        <FreeCashFlowCard data={data} manualOverride={manualOverrides?.free_cash_flow} lastUpdated={data ? liveTime : manualTime} />
                        <CurrentRatioCard data={data} manualOverride={manualOverrides?.current_ratio} lastUpdated={data ? liveTime : manualTime} />
                      </>
                    ) : (
                      <VolatilityCard data={data} manualOverride={manualOverrides?.india_vix} lastUpdated={manualTime} />
                    )}
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
