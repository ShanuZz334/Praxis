/**
 * @file FundamentalGrid.jsx
 * @purpose Renders the grid of Fundamental Cards, supporting multiple view modes.
 */

import React, { useMemo } from 'react';
import { cleanNum } from '@/lib/utils';
import FundamentalCard from './FundamentalCard';

// Company Cards
import PERatioCard from './PERatioCard';
import ForwardPECard from './ForwardPECard';
import PBRatioCard from './PBRatioCard';
import EVEbitdaCard from './EVEbitdaCard';
import MarketCapGDPCard from './MarketCapGDPCard';
import DividendYieldCard from './DividendYieldCard';
import EarningsTrendCard from './EarningsTrendCard';
import FIIDIIFlowCard from './FIIDIIFlowCard';
import EarningsYieldCard from './EarningsYieldCard';
import EPSGrowthCard from './EPSGrowthCard';
import RevenueGrowthCard from './RevenueGrowthCard';
import ProfitGrowthCard from './ProfitGrowthCard';
import GDPGrowthCard from './GDPGrowthCard';
import ROECard from './ROECard';
import ROCECard from './ROCECard';
import ROACard from './ROACard';
import NetMarginCard from './NetMarginCard';
import OperatingMarginCard from './OperatingMarginCard';
import DebtToEquityCard from './DebtToEquityCard';
import InterestCoverageCard from './InterestCoverageCard';
import FreeCashFlowCard from './FreeCashFlowCard';
import CurrentRatioCard from './CurrentRatioCard';
import PromoterHoldingCard from './PromoterHoldingCard';
import SmartMoneyFlowCard from './SmartMoneyFlowCard';
import EarningsQualityCard from './EarningsQualityCard';
import RelativeValuationCard from './RelativeValuationCard';

// Index legacy cards
import AdvanceDeclineCard from './AdvanceDeclineCard';
import VolatilityCard from './VolatilityCard';

// 31 New Index Cards
import NiftyPECard from './NiftyPECard';
import NiftyPBCard from './NiftyPBCard';
import IndexMCapGDPCard from './IndexMCapGDPCard';
import IndexDividendYieldCard from './IndexDividendYieldCard';
import EPSYoYCard from './EPSYoYCard';
import ForwardEPSCard from './ForwardEPSCard';
import SectorEarningsCard from './SectorEarningsCard';
import ProfitMarginCard from './ProfitMarginCard';
import GDPCard from './GDPCard';
import CPICard from './CPICard';
import RepoCard from './RepoCard';
import FiscalDeficitCard from './FiscalDeficitCard';
import FIICard from './FIICard';
import DIICard from './DIICard';
import FIITrendCard from './FIITrendCard';
import SystemLiquidityCard from './SystemLiquidityCard';
import MFFlowsCard from './MFFlowsCard';
import SectorValuationCard from './SectorValuationCard';
import SectorGrowthCard from './SectorGrowthCard';
import SectorConcentrationCard from './SectorConcentrationCard';
import CycDefCard from './CycDefCard';
import CreditGrowthCard from './CreditGrowthCard';
import CorpDebtCard from './CorpDebtCard';
import PolicyTailwindsCard from './PolicyTailwindsCard';
import CrudeCard from './CrudeCard';
import GlobalLiqCard from './GlobalLiqCard';
import SovereignRiskCard from './SovereignRiskCard';
import NPACard from './NPACard';
import ReformMomentumCard from './ReformMomentumCard';

import { FUNDAMENTAL_SECTIONS } from '../data/fundamentalData';

// IDs that are handled by specialized hardcoded cards
const HARDCODED_IDS = new Set([
  // Company
  'pe_ratio', 'forward_pe', 'pb_ratio', 'ev_ebitda', 'earnings_yield',
  'market_cap_gdp', 'dividend_yield', 'earnings_trend', 'fii_dii_flow',
  'eps_growth', 'revenue_growth', 'profit_growth', 'gdp_growth',
  'roe', 'roce', 'roa', 'net_margin', 'operating_margin',
  'debt_to_equity', 'interest_coverage', 'free_cash_flow', 'current_ratio',
  'promoter_holding', 'smart_money_flow', 'earnings_quality',
  'relative_valuation', 'eps_yoy', 'forward_eps', 'profit_margin',
  // Index legacy
  'advance_decline', 'india_vix',
  // New Index Cards & Macro
  'nifty_pe', 'nifty_pb', 'mcap_gdp', 'dividend_yield', 'sector_earnings', 'gdp', 'cpi', 'repo', 'fiscal_deficit', 'fii', 'dii', 'fii_trend', 'system_liquidity', 'mf_flows', 'sector_valuation', 'sector_growth', 'sector_concentration', 'cyc_def', 'credit_growth', 'corp_debt', 'policy_tailwinds', 'crude', 'global_liq', 'sovereign_risk', 'npa', 'reform_momentum'
]);

export default function FundamentalGrid({ cards, viewMode, sortMode = "score_desc", onCardClick, data, selectedCategory, manualOverrides, resolveTime }) {

  const sortCards = (list) => {
    const arr = [...list];
    switch (sortMode) {
      case 'score_desc': return arr.sort((a, b) => (b.score || 0) - (a.score || 0));
      case 'score_asc': return arr.sort((a, b) => (a.score || 0) - (b.score || 0));
      default: return arr;
    }
  };

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

  const getHardcodedNode = (cardId) => {
    switch(cardId) {
        case 'pe_ratio': return <PERatioCard key={cardId} data={data} manualOverride={manualOverrides?.pe_ratio} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : 'pe_ratio')} />;
        case 'forward_pe': return <ForwardPECard key={cardId} data={data} manualOverride={manualOverrides?.forward_pe} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : 'forward_pe')} />;
        case 'pb_ratio': return <PBRatioCard key={cardId} data={data} manualOverride={manualOverrides?.pb_ratio} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : 'pb_ratio')} />;
        case 'ev_ebitda': return <EVEbitdaCard key={cardId} data={data} manualOverride={manualOverrides?.ev_ebitda} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : 'ev_ebitda')} />;
        case 'earnings_yield': return <EarningsYieldCard key={cardId} data={data} manualOverride={manualOverrides?.earnings_yield} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : 'earnings_yield')} />;
        case 'market_cap_gdp': return <MarketCapGDPCard key={cardId} data={data} manualOverride={manualOverrides?.market_cap_gdp} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : 'market_cap_gdp')} />;

        case 'earnings_trend': return <EarningsTrendCard key={cardId} data={data} manualOverride={manualOverrides?.earnings_trend} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : 'earnings_trend')} />;
        case 'fii_dii_flow': return <FIIDIIFlowCard key={cardId} data={data} manualOverride={manualOverrides?.fii_dii_flow} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : 'fii_dii_flow')} />;
        case 'eps_growth': return <EPSGrowthCard key={cardId} data={data} manualOverride={manualOverrides?.eps_growth} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : 'eps_growth')} />;
        case 'revenue_growth': return <RevenueGrowthCard key={cardId} data={data} manualOverride={manualOverrides?.revenue_growth} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : 'revenue_growth')} />;
        case 'profit_growth': return <ProfitGrowthCard key={cardId} data={data} manualOverride={manualOverrides?.profit_growth} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : 'profit_growth')} />;
        case 'gdp_growth': return <GDPGrowthCard key={cardId} data={data} manualOverride={manualOverrides?.gdp_growth} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : 'gdp_growth')} />;
        case 'advance_decline': return <AdvanceDeclineCard key={cardId} data={data} manualOverride={manualOverrides?.advance_decline} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : 'advance_decline')} />;
        case 'india_vix': return <VolatilityCard key={cardId} data={data} manualOverride={manualOverrides?.india_vix} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : 'india_vix')} />;
        case 'roe': return <ROECard key={cardId} data={data} manualOverride={manualOverrides?.roe} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : 'roe')} />;
        case 'roce': return <ROCECard key={cardId} data={data} manualOverride={manualOverrides?.roce} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : 'roce')} />;
        case 'roa': return <ROACard key={cardId} data={data} manualOverride={manualOverrides?.roa} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : 'roa')} />;
        case 'net_margin': return <NetMarginCard key={cardId} data={data} manualOverride={manualOverrides?.net_margin} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : 'net_margin')} />;
        case 'operating_margin': return <OperatingMarginCard key={cardId} data={data} manualOverride={manualOverrides?.operating_margin} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : 'operating_margin')} />;
        case 'debt_to_equity': return <DebtToEquityCard key={cardId} data={data} manualOverride={manualOverrides?.debt_to_equity} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : 'debt_to_equity')} />;
        case 'interest_coverage': return <InterestCoverageCard key={cardId} data={data} manualOverride={manualOverrides?.interest_coverage} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : 'interest_coverage')} />;
        case 'free_cash_flow': return <FreeCashFlowCard key={cardId} data={data} manualOverride={manualOverrides?.free_cash_flow} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : 'free_cash_flow')} />;
        case 'current_ratio': return <CurrentRatioCard key={cardId} data={data} manualOverride={manualOverrides?.current_ratio} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : 'current_ratio')} />;
        case 'promoter_holding': return <PromoterHoldingCard key={cardId} data={data} lastUpdated={(isLive) => resolveTime(isLive, null)} />;
        case 'smart_money_flow': return <SmartMoneyFlowCard key={cardId} data={data} lastUpdated={(isLive) => resolveTime(isLive, null)} />;
        case 'earnings_quality': return <EarningsQualityCard key={cardId} data={data} lastUpdated={(isLive) => resolveTime(isLive, null)} />;
        case 'relative_valuation': return <RelativeValuationCard key={cardId} data={data} lastUpdated={(isLive) => resolveTime(isLive, null)} />;
        case 'nifty_pe': return <NiftyPECard key={cardId} data={data} manualOverride={manualOverrides?.nifty_pe} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : 'nifty_pe')} />;
        case 'nifty_pb': return <NiftyPBCard key={cardId} data={data} manualOverride={manualOverrides?.nifty_pb} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : 'nifty_pb')} />;
        case 'mcap_gdp': return <IndexMCapGDPCard key={cardId} data={data} manualOverride={manualOverrides?.mcap_gdp} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : 'mcap_gdp')} />;
        case 'dividend_yield': return selectedCategory === 'Indices' ? <IndexDividendYieldCard key={cardId} data={data} manualOverride={manualOverrides?.dividend_yield} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : 'dividend_yield')} /> : <DividendYieldCard key={cardId} data={data} manualOverride={manualOverrides?.dividend_yield} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : 'dividend_yield')} />;
        case 'eps_yoy': return <EPSYoYCard key={cardId} data={data} manualOverride={manualOverrides?.eps_yoy} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : 'eps_yoy')} />;
        case 'forward_eps': return <ForwardEPSCard key={cardId} data={data} manualOverride={manualOverrides?.forward_eps} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : 'forward_eps')} />;
        case 'sector_earnings': return <SectorEarningsCard key={cardId} data={data} manualOverride={manualOverrides?.sector_earnings} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : 'sector_earnings')} />;
        case 'profit_margin': return <ProfitMarginCard key={cardId} data={data} manualOverride={manualOverrides?.profit_margin} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : 'profit_margin')} />;
        case 'gdp': return <GDPCard key={cardId} data={data} manualOverride={manualOverrides?.gdp} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : 'gdp')} />;
        case 'cpi': return <CPICard key={cardId} data={data} manualOverride={manualOverrides?.cpi} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : 'cpi')} />;
        case 'repo': return <RepoCard key={cardId} data={data} manualOverride={manualOverrides?.repo} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : 'repo')} />;
        case 'fiscal_deficit': return <FiscalDeficitCard key={cardId} data={data} manualOverride={manualOverrides?.fiscal_deficit} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : 'fiscal_deficit')} />;
        case 'fii': return <FIICard key={cardId} data={data} manualOverride={manualOverrides?.fii} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : 'fii')} />;
        case 'dii': return <DIICard key={cardId} data={data} manualOverride={manualOverrides?.dii} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : 'dii')} />;
        case 'fii_trend': return <FIITrendCard key={cardId} data={data} manualOverride={manualOverrides?.fii_trend} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : 'fii_trend')} />;
        case 'system_liquidity': return <SystemLiquidityCard key={cardId} data={data} manualOverride={manualOverrides?.system_liquidity} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : 'system_liquidity')} />;
        case 'mf_flows': return <MFFlowsCard key={cardId} data={data} manualOverride={manualOverrides?.mf_flows} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : 'mf_flows')} />;
        case 'sector_valuation': return <SectorValuationCard key={cardId} data={data} manualOverride={manualOverrides?.sector_valuation} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : 'sector_valuation')} />;
        case 'sector_growth': return <SectorGrowthCard key={cardId} data={data} manualOverride={manualOverrides?.sector_growth} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : 'sector_growth')} />;
        case 'sector_concentration': return <SectorConcentrationCard key={cardId} data={data} manualOverride={manualOverrides?.sector_concentration} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : 'sector_concentration')} />;
        case 'cyc_def': return <CycDefCard key={cardId} data={data} manualOverride={manualOverrides?.cyc_def} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : 'cyc_def')} />;
        case 'credit_growth': return <CreditGrowthCard key={cardId} data={data} manualOverride={manualOverrides?.credit_growth} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : 'credit_growth')} />;
        case 'corp_debt': return <CorpDebtCard key={cardId} data={data} manualOverride={manualOverrides?.corp_debt} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : 'corp_debt')} />;
        case 'policy_tailwinds': return <PolicyTailwindsCard key={cardId} data={data} manualOverride={manualOverrides?.policy_tailwinds} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : 'policy_tailwinds')} />;
        case 'crude': return <CrudeCard key={cardId} data={data} manualOverride={manualOverrides?.crude} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : 'crude')} />;
        case 'global_liq': return <GlobalLiqCard key={cardId} data={data} manualOverride={manualOverrides?.global_liq} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : 'global_liq')} />;
        case 'sovereign_risk': return <SovereignRiskCard key={cardId} data={data} manualOverride={manualOverrides?.sovereign_risk} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : 'sovereign_risk')} />;
        case 'npa': return <NPACard key={cardId} data={data} manualOverride={manualOverrides?.npa} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : 'npa')} />;
        case 'reform_momentum': return <ReformMomentumCard key={cardId} data={data} manualOverride={manualOverrides?.reform_momentum} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : 'reform_momentum')} />;
        default: return null;
    }
  }

  if (viewMode === 'flat') {
    const sortedFlat = sortCards(cards);
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 md:gap-4 items-start">
        {sortedFlat.map(card => (
          <React.Fragment key={card.id}>
            {HARDCODED_IDS.has(card.id) ? getHardcodedNode(card.id) : <FundamentalCard card={card} onClick={() => onCardClick(card)} />}
          </React.Fragment>
        ))}
        {cards.length === 0 && (
          <div className="col-span-full text-center py-12 text-text-tertiary italic">
            No metrics match your search.
          </div>
        )}
      </div>
    );
  }

  // Sectioned View
  return (
    <div className="space-y-6">
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

      <div className="space-y-6 md:space-y-12">
        {FUNDAMENTAL_SECTIONS.map(section => {
          const rawList = sections ? sections[section.id] : [];
          if (!rawList || rawList.length === 0) return null;
          
          const sectionCards = sortCards(rawList);
          
          return (
            <div key={section.id} id={`section-${section.id}`} className="animate-in fade-in slide-in-from-bottom-4 duration-500 scroll-mt-20">
              <div className="flex items-center justify-center gap-4 mb-3 md:mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-text-primary uppercase tracking-widest">{section.label}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded border border-border-default bg-background-surface text-text-tertiary font-mono shadow-sm">
                      {sectionCards.length}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 md:gap-4 items-start">
                {sectionCards.map(card => (
                  <React.Fragment key={card.id}>
                    {HARDCODED_IDS.has(card.id) ? getHardcodedNode(card.id) : <FundamentalCard card={card} onClick={() => onCardClick(card)} />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
