/**
 * @file FundamentalGrid.jsx
 * @purpose Renders the grid of Fundamental Cards, supporting multiple view modes.
 */

import React, { useMemo } from 'react';
import { cleanNum } from '@/lib/utils';
import FundamentalCard from './FundamentalCard';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';

// Company Cards
import PERatioCard from './PERatioCard';
import ForwardPECard from './ForwardPECard';
import PBRatioCard from './PBRatioCard';
import EVEbitdaCard from './EVEbitdaCard';

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
import CreditGrowthCard from './CreditGrowthCard';
import CorpDebtCard from './CorpDebtCard';
import PolicyTailwindsCard from './PolicyTailwindsCard';
import CrudeCard from './CrudeCard';
import GlobalLiqCard from './GlobalLiqCard';
import SovereignRiskCard from './SovereignRiskCard';
import NPACard from './NPACard';
import ReformMomentumCard from './ReformMomentumCard';

// New Institutional Cards
import AnalystConsensusCard from './AnalystConsensusCard';
import CorporateActionsCard from './CorporateActionsCard';
import CashConversionCycleCard from './CashConversionCycleCard';
import CreditRatingCard from './CreditRatingCard';
import SectorDashboardCard from './SectorDashboardCard';

import { FUNDAMENTAL_SECTIONS } from '../data/fundamentalData';

// IDs that are handled by specialized hardcoded cards
const HARDCODED_IDS = new Set([
  // Company
  CARD_REGISTRY.pe_ratio.id, CARD_REGISTRY.forward_pe.id, CARD_REGISTRY.pb_ratio.id, CARD_REGISTRY.ev_ebitda.id, CARD_REGISTRY.earnings_yield.id,
  CARD_REGISTRY.dividend_yield.id, CARD_REGISTRY.earnings_trend.id, CARD_REGISTRY.fii_dii_flow.id,
  CARD_REGISTRY.eps_growth.id, CARD_REGISTRY.revenue_growth.id, CARD_REGISTRY.profit_growth.id, CARD_REGISTRY.gdp_growth.id,
  CARD_REGISTRY.roe.id, CARD_REGISTRY.roce.id, CARD_REGISTRY.roa.id, CARD_REGISTRY.net_margin.id, CARD_REGISTRY.operating_margin.id,
  CARD_REGISTRY.debt_to_equity.id, CARD_REGISTRY.interest_coverage.id, CARD_REGISTRY.free_cash_flow.id, CARD_REGISTRY.current_ratio.id,
  CARD_REGISTRY.promoter_holding.id, CARD_REGISTRY.smart_money_flow.id, CARD_REGISTRY.earnings_quality.id,
  CARD_REGISTRY.relative_valuation.id, CARD_REGISTRY.eps_yoy.id, CARD_REGISTRY.forward_eps.id, CARD_REGISTRY.profit_margin.id,
  CARD_REGISTRY.analyst_consensus.id, CARD_REGISTRY.corporate_actions.id, CARD_REGISTRY.cash_conversion.id, CARD_REGISTRY.credit_rating.id,
  // Index legacy
  CARD_REGISTRY.advance_decline.id, CARD_REGISTRY.india_vix.id,
  // New Index Cards & Macro
  CARD_REGISTRY.nifty_pe.id, CARD_REGISTRY.nifty_pb.id, CARD_REGISTRY.mcap_gdp.id, CARD_REGISTRY.gdp.id, CARD_REGISTRY.cpi.id, CARD_REGISTRY.repo.id, CARD_REGISTRY.fiscal_deficit.id, CARD_REGISTRY.fii.id, CARD_REGISTRY.dii.id, CARD_REGISTRY.fii_trend.id, CARD_REGISTRY.system_liquidity.id, CARD_REGISTRY.mf_flows.id, CARD_REGISTRY.sector_dashboard.id, CARD_REGISTRY.credit_growth.id, CARD_REGISTRY.corp_debt.id, CARD_REGISTRY.policy_tailwinds.id, CARD_REGISTRY.crude.id, CARD_REGISTRY.global_liq.id, CARD_REGISTRY.sovereign_risk.id, CARD_REGISTRY.npa.id, CARD_REGISTRY.reform_momentum.id
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
        case CARD_REGISTRY.pe_ratio.id: return <PERatioCard key={cardId} cardId={cardId} data={data} manualOverride={manualOverrides?.pe_ratio} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : CARD_REGISTRY.pe_ratio.id)} />;
        case CARD_REGISTRY.forward_pe.id: return <ForwardPECard key={cardId} cardId={cardId} data={data} manualOverride={manualOverrides?.forward_pe} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : CARD_REGISTRY.forward_pe.id)} />;
        case CARD_REGISTRY.pb_ratio.id: return <PBRatioCard key={cardId} cardId={cardId} data={data} manualOverride={manualOverrides?.pb_ratio} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : CARD_REGISTRY.pb_ratio.id)} />;
        case CARD_REGISTRY.ev_ebitda.id: return <EVEbitdaCard key={cardId} cardId={cardId} data={data} manualOverride={manualOverrides?.ev_ebitda} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : CARD_REGISTRY.ev_ebitda.id)} />;
        case CARD_REGISTRY.earnings_yield.id: return <EarningsYieldCard key={cardId} cardId={cardId} data={data} manualOverride={manualOverrides?.earnings_yield} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : CARD_REGISTRY.earnings_yield.id)} />;
        case CARD_REGISTRY.earnings_trend.id: return <EarningsTrendCard key={cardId} cardId={cardId} data={data} manualOverride={manualOverrides?.earnings_trend} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : CARD_REGISTRY.earnings_trend.id)} />;
        case CARD_REGISTRY.fii_dii_flow.id: return <FIIDIIFlowCard key={cardId} cardId={cardId} data={data} manualOverrides={manualOverrides} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : CARD_REGISTRY.fii_dii_flow.id)} />;
        case CARD_REGISTRY.eps_growth.id: return <EPSGrowthCard key={cardId} cardId={cardId} data={data} manualOverride={manualOverrides?.eps_growth} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : CARD_REGISTRY.eps_growth.id)} />;
        case CARD_REGISTRY.revenue_growth.id: return <RevenueGrowthCard key={cardId} cardId={cardId} data={data} manualOverride={manualOverrides?.revenue_growth} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : CARD_REGISTRY.revenue_growth.id)} />;
        case CARD_REGISTRY.profit_growth.id: return <ProfitGrowthCard key={cardId} cardId={cardId} data={data} manualOverride={manualOverrides?.profit_growth} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : CARD_REGISTRY.profit_growth.id)} />;
        case CARD_REGISTRY.gdp_growth.id: return <GDPGrowthCard key={cardId} cardId={cardId} data={data} manualOverride={manualOverrides?.gdp_growth} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : CARD_REGISTRY.gdp_growth.id)} />;
        case CARD_REGISTRY.advance_decline.id: return <AdvanceDeclineCard key={cardId} cardId={cardId} data={data} manualOverride={manualOverrides?.advance_decline} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : CARD_REGISTRY.advance_decline.id)} />;
        case CARD_REGISTRY.india_vix.id: return <VolatilityCard key={cardId} cardId={cardId} data={data} manualOverride={manualOverrides?.india_vix} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : CARD_REGISTRY.india_vix.id)} />;
        case CARD_REGISTRY.roe.id: return <ROECard key={cardId} cardId={cardId} data={data} manualOverride={manualOverrides?.roe} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : CARD_REGISTRY.roe.id)} />;
        case CARD_REGISTRY.roce.id: return <ROCECard key={cardId} cardId={cardId} data={data} manualOverride={manualOverrides?.roce} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : CARD_REGISTRY.roce.id)} />;
        case CARD_REGISTRY.roa.id: return <ROACard key={cardId} cardId={cardId} data={data} manualOverride={manualOverrides?.roa} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : CARD_REGISTRY.roa.id)} />;
        case CARD_REGISTRY.net_margin.id: return <NetMarginCard key={cardId} cardId={cardId} data={data} manualOverride={manualOverrides?.net_margin} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : CARD_REGISTRY.net_margin.id)} />;
        case CARD_REGISTRY.operating_margin.id: return <OperatingMarginCard key={cardId} cardId={cardId} data={data} manualOverride={manualOverrides?.operating_margin} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : CARD_REGISTRY.operating_margin.id)} />;
        case CARD_REGISTRY.debt_to_equity.id: return <DebtToEquityCard key={cardId} cardId={cardId} data={data} manualOverride={manualOverrides?.debt_to_equity} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : CARD_REGISTRY.debt_to_equity.id)} />;
        case CARD_REGISTRY.interest_coverage.id: return <InterestCoverageCard key={cardId} cardId={cardId} data={data} manualOverride={manualOverrides?.interest_coverage} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : CARD_REGISTRY.interest_coverage.id)} />;
        case CARD_REGISTRY.free_cash_flow.id: return <FreeCashFlowCard key={cardId} cardId={cardId} data={data} manualOverride={manualOverrides?.free_cash_flow} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : CARD_REGISTRY.free_cash_flow.id)} />;
        case CARD_REGISTRY.current_ratio.id: return <CurrentRatioCard key={cardId} cardId={cardId} data={data} manualOverride={manualOverrides?.current_ratio} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : CARD_REGISTRY.current_ratio.id)} />;
        case CARD_REGISTRY.promoter_holding.id: return <PromoterHoldingCard key={cardId} cardId={cardId} data={data} lastUpdated={(isLive) => resolveTime(isLive, null)} />;
        case CARD_REGISTRY.smart_money_flow.id: return <SmartMoneyFlowCard key={cardId} cardId={cardId} data={data} lastUpdated={(isLive) => resolveTime(isLive, null)} />;
        case CARD_REGISTRY.earnings_quality.id: return <EarningsQualityCard key={cardId} cardId={cardId} data={data} lastUpdated={(isLive) => resolveTime(isLive, null)} />;
        case CARD_REGISTRY.relative_valuation.id: return <RelativeValuationCard key={cardId} cardId={cardId} data={data} lastUpdated={(isLive) => resolveTime(isLive, null)} />;
        case CARD_REGISTRY.analyst_consensus.id: return <AnalystConsensusCard key={cardId} cardId={cardId} manualOverrides={manualOverrides} lastUpdated={(isLive) => resolveTime(isLive, null)} />;
        case CARD_REGISTRY.corporate_actions.id: return <CorporateActionsCard key={cardId} cardId={cardId} data={data} lastUpdated={(isLive) => resolveTime(isLive, null)} />;
        case CARD_REGISTRY.cash_conversion.id: return <CashConversionCycleCard key={cardId} cardId={cardId} data={data} manualOverrides={manualOverrides} lastUpdated={(isLive) => resolveTime(isLive, null)} />;
        case CARD_REGISTRY.credit_rating.id: return <CreditRatingCard key={cardId} cardId={cardId} manualOverrides={manualOverrides} lastUpdated={(isLive) => resolveTime(isLive, null)} />;
        case CARD_REGISTRY.nifty_pe.id: return <NiftyPECard key={cardId} cardId={cardId} data={data} manualOverride={manualOverrides?.nifty_pe} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : CARD_REGISTRY.nifty_pe.id)} />;
        case CARD_REGISTRY.nifty_pb.id: return <NiftyPBCard key={cardId} cardId={cardId} data={data} manualOverride={manualOverrides?.nifty_pb} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : CARD_REGISTRY.nifty_pb.id)} />;
        case CARD_REGISTRY.mcap_gdp.id: return <IndexMCapGDPCard key={cardId} cardId={cardId} data={data} manualOverride={manualOverrides?.mcap_gdp} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : CARD_REGISTRY.mcap_gdp.id)} />;
        case CARD_REGISTRY.dividend_yield.id: return selectedCategory === 'Indices'
            ? <IndexDividendYieldCard key={cardId} cardId={cardId} data={data} manualOverride={manualOverrides?.dividend_yield} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : CARD_REGISTRY.dividend_yield.id)} />
            : <DividendYieldCard key={cardId} cardId={cardId} data={data} manualOverride={manualOverrides?.dividend_yield} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : CARD_REGISTRY.dividend_yield.id)} />;
        case CARD_REGISTRY.eps_yoy.id: return <EPSYoYCard key={cardId} cardId={cardId} data={data} manualOverride={manualOverrides?.eps_yoy} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : CARD_REGISTRY.eps_yoy.id)} />;
        case CARD_REGISTRY.forward_eps.id: return <ForwardEPSCard key={cardId} cardId={cardId} data={data} manualOverride={manualOverrides?.forward_eps} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : CARD_REGISTRY.forward_eps.id)} />;
        case CARD_REGISTRY.profit_margin.id: return <ProfitMarginCard key={cardId} cardId={cardId} data={data} manualOverride={manualOverrides?.profit_margin} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : CARD_REGISTRY.profit_margin.id)} />;
        case CARD_REGISTRY.gdp.id: return <GDPCard key={cardId} cardId={cardId} data={data} manualOverride={manualOverrides?.gdp} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : CARD_REGISTRY.gdp.id)} />;
        case CARD_REGISTRY.cpi.id: return <CPICard key={cardId} cardId={cardId} data={data} manualOverride={manualOverrides?.cpi} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : CARD_REGISTRY.cpi.id)} />;
        case CARD_REGISTRY.repo.id: return <RepoCard key={cardId} cardId={cardId} data={data} manualOverride={manualOverrides?.repo} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : CARD_REGISTRY.repo.id)} />;
        case CARD_REGISTRY.fiscal_deficit.id: return <FiscalDeficitCard key={cardId} cardId={cardId} data={data} manualOverride={manualOverrides?.fiscal_deficit} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : CARD_REGISTRY.fiscal_deficit.id)} />;
        case CARD_REGISTRY.fii.id: return <FIICard key={cardId} cardId={cardId} data={data} manualOverride={manualOverrides?.fii} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : CARD_REGISTRY.fii.id)} />;
        case CARD_REGISTRY.dii.id: return <DIICard key={cardId} cardId={cardId} data={data} manualOverride={manualOverrides?.dii} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : CARD_REGISTRY.dii.id)} />;
        case CARD_REGISTRY.fii_trend.id: return <FIITrendCard key={cardId} cardId={cardId} data={data} manualOverride={manualOverrides?.fii_trend} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : CARD_REGISTRY.fii_trend.id)} />;
        case CARD_REGISTRY.system_liquidity.id: return <SystemLiquidityCard key={cardId} cardId={cardId} data={data} manualOverride={manualOverrides?.system_liquidity} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : CARD_REGISTRY.system_liquidity.id)} />;
        case CARD_REGISTRY.mf_flows.id: return <MFFlowsCard key={cardId} cardId={cardId} data={data} manualOverride={manualOverrides?.mf_flows} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : CARD_REGISTRY.mf_flows.id)} />;
        case CARD_REGISTRY.sector_dashboard.id: return <SectorDashboardCard key={cardId} cardId={cardId} data={data} manualOverrides={manualOverrides} lastUpdated={(isLive) => resolveTime(isLive, null)} />;
        case CARD_REGISTRY.credit_growth.id: return <CreditGrowthCard key={cardId} cardId={cardId} data={data} manualOverride={manualOverrides?.credit_growth} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : CARD_REGISTRY.credit_growth.id)} />;
        case CARD_REGISTRY.corp_debt.id: return <CorpDebtCard key={cardId} cardId={cardId} data={data} manualOverride={manualOverrides?.corp_debt} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : CARD_REGISTRY.corp_debt.id)} />;
        case CARD_REGISTRY.policy_tailwinds.id: return <PolicyTailwindsCard key={cardId} cardId={cardId} data={data} manualOverride={manualOverrides?.policy_tailwinds} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : CARD_REGISTRY.policy_tailwinds.id)} />;
        case CARD_REGISTRY.crude.id: return <CrudeCard key={cardId} cardId={cardId} data={data} manualOverride={manualOverrides?.crude} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : CARD_REGISTRY.crude.id)} />;
        case CARD_REGISTRY.global_liq.id: return <GlobalLiqCard key={cardId} cardId={cardId} data={data} manualOverride={manualOverrides?.global_liq} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : CARD_REGISTRY.global_liq.id)} />;
        case CARD_REGISTRY.sovereign_risk.id: return <SovereignRiskCard key={cardId} cardId={cardId} data={data} manualOverride={manualOverrides?.sovereign_risk} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : CARD_REGISTRY.sovereign_risk.id)} />;
        case CARD_REGISTRY.npa.id: return <NPACard key={cardId} cardId={cardId} data={data} manualOverride={manualOverrides?.npa} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : CARD_REGISTRY.npa.id)} />;
        case CARD_REGISTRY.reform_momentum.id: return <ReformMomentumCard key={cardId} cardId={cardId} data={data} manualOverride={manualOverrides?.reform_momentum} lastUpdated={(isLive) => resolveTime(isLive, isLive ? null : CARD_REGISTRY.reform_momentum.id)} />;
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
