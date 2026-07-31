/**
 * @file TechnicalGrid.jsx
 * @purpose Renders the grid of technical indicator cards.
 */

import React from "react";
import { useTheme } from '@/shared/context/ThemeContext';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';
import TechnicalCard from "./TechnicalCard";
import { technicalSections } from "@/features/dashboard/technical/engine/technicalHelper";
import RSICard from './RSICard';
import MACDCard from './MACDCard';
import StochRSICard from './StochRSICard';
import WilliamsRCard from './WilliamsRCard';
import BBCard from "./BBCard";
import ATRCard from "./ATRCard";
import KCCard from "./KCCard";
import CmfCard from "./CmfCard";
import VolumeSmaCard from "./VolumeSmaCard";
import ObvCard from "./ObvCard";
import VwapCard from "./VwapCard";
import SupportCard from "./SupportCard";
import ResistanceCard from "./ResistanceCard";
import TrendlineCard from "./TrendlineCard";
import PivotCard from "./PivotCard";
import FibonacciCard from "./FibonacciCard";
import EMA20Card from "./EMA20Card";
import EMA50Card from "./EMA50Card";
import EMA200Card from "./EMA200Card";
import SMA50Card from "./SMA50Card";
import SMA200Card from "./SMA200Card";
import ADXCard from "./ADXCard";
import SupertrendCard from "./SupertrendCard";
import BreadthRatioCard from "./BreadthRatioCard";
import McClellanCard from "./McClellanCard";
import ADLineCard from "./ADLineCard";
import NhnlCard from "./NhnlCard";
import TrinCard from "./TrinCard";
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import BetaCorrelationCard from "./BetaCorrelationCard";

const HARDCODED_IDS = [
    CARD_REGISTRY.rsi.id,CARD_REGISTRY.macd.id,CARD_REGISTRY.stoch_rsi.id,CARD_REGISTRY.williams_r.id,CARD_REGISTRY.bb_20_2.id,CARD_REGISTRY.atr.id,CARD_REGISTRY.kc.id,CARD_REGISTRY.cmf.id,
    CARD_REGISTRY.volume_sma.id,CARD_REGISTRY.obv.id,CARD_REGISTRY.vwap.id,CARD_REGISTRY.support.id,CARD_REGISTRY.resistance.id,CARD_REGISTRY.trendline.id,CARD_REGISTRY.pivot.id,
    CARD_REGISTRY.fibonacci.id,CARD_REGISTRY.ema_20.id,CARD_REGISTRY.ema_50.id,CARD_REGISTRY.ema_200.id,CARD_REGISTRY.sma_50.id,CARD_REGISTRY.sma_200.id,CARD_REGISTRY.adx.id,
    CARD_REGISTRY.supertrend.id,CARD_REGISTRY.breadth_ratio.id,CARD_REGISTRY.mcclellan.id,CARD_REGISTRY.ad_line.id,CARD_REGISTRY.nh_nl.id,CARD_REGISTRY.trin.id,
    CARD_REGISTRY.beta_correlation.id
];

export default function TechnicalGrid({
    manualOverrides, resolveTime, cards, onCardClick,
    viewMode = "sectioned", sortMode = "score_desc",
    searchQuery = "", controls, data, indicatorParams, onOpenSettings, isIndex = false
}) {
    const { useOrbNav } = useTheme();
    const gridClass = `grid grid-cols-1 md:grid-cols-2 ${useOrbNav ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-2.5 md:gap-4 items-start`;

    const sortCards = (list, mode) => {
        const arr = [...list];
        const hasScore = (c) => c.score !== undefined && c.score !== null && !isNaN(c.score);

        return arr.sort((a, b) => {
            const aValid = hasScore(a);
            const bValid = hasScore(b);

            // Always push un-scored items to the bottom
            if (aValid && !bValid) return -1;
            if (!aValid && bValid) return 1;
            if (!aValid && !bValid) return 0;

            if (mode === 'score_desc') {
                if (!aValid && !bValid) return 0;
                const diff = b.score - a.score;
                return diff !== 0 ? diff : (b.creditAllocation || 0) - (a.creditAllocation || 0);
            }
            if (mode === 'score_asc') {
                if (!aValid && !bValid) return 0;
                const diff = a.score - b.score;
                return diff !== 0 ? diff : (b.creditAllocation || 0) - (a.creditAllocation || 0);
            }
            if (mode === 'rel_desc') {
                const diff = (b.creditAllocation || 0) - (a.creditAllocation || 0);
                if (diff !== 0) return diff;
                if (!aValid && !bValid) return 0;
                return b.score - a.score;
            }
            if (mode === 'rel_asc') {
                const diff = (a.creditAllocation || 0) - (b.creditAllocation || 0);
                if (diff !== 0) return diff;
                if (!aValid && !bValid) return 0;
                return a.score - b.score;
            }
            return 0;
        });
    };

    const grouped = React.useMemo(() => {
        const map = {};
        cards.forEach(card => {
            const sec = card.category || "Other";
            if (!map[sec]) map[sec] = [];
            map[sec].push(card);
        });
        return map;
    }, [cards]);

    const SECTION_ORDER = technicalSections.map(s => s.id).filter(id => {
        if (isIndex && id === 'Volume') return false;
        if (!isIndex && id === 'Breadth') return false;
        return true;
    });

    return (
        <div className="space-y-6">
            {viewMode === "sectioned" && (
                <div className="lg:hidden flex overflow-x-auto gap-2 pb-2 -mx-1 px-1 custom-scrollbar-hidden sticky top-0 bg-background-app/80 backdrop-blur-md z-30 py-3">
                    {SECTION_ORDER.map(section => {
                        if (!grouped[section]?.length) return null;
                        return (
                            <button key={section}
                                onClick={() => { const el = document.getElementById(`section-${section}`); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                                className="shrink-0 px-3 py-1.5 rounded-full bg-background-elevated border border-border-subtle text-[11px] font-bold text-text-secondary hover:text-text-primary hover:border-border-default transition-all whitespace-nowrap">
                                {section}
                            </button>
                        );
                    })}
                </div>
            )}

            {viewMode === "flat" ? (() => {
                const renderList = [
                    { id: CARD_REGISTRY.rsi.id,          node: <RSICard cardId={CARD_REGISTRY.rsi.id} data={data} manualOverride={manualOverrides?.rsi} lastUpdated={resolveTime(!!data?.rsi, CARD_REGISTRY.rsi.id)} indicatorParams={indicatorParams} onOpenSettings={onOpenSettings} /> },
                    { id: CARD_REGISTRY.macd.id,         node: <MACDCard cardId={CARD_REGISTRY.macd.id} data={data} manualOverride={manualOverrides?.macd} lastUpdated={resolveTime(!!data?.macd, CARD_REGISTRY.macd.id)} indicatorParams={indicatorParams} onOpenSettings={onOpenSettings} /> },
                    { id: CARD_REGISTRY.stoch_rsi.id,    node: <StochRSICard cardId={CARD_REGISTRY.stoch_rsi.id} data={data} manualOverride={manualOverrides?.stoch_rsi} lastUpdated={resolveTime(!!data?.stoch_rsi, CARD_REGISTRY.stoch_rsi.id)} indicatorParams={indicatorParams} onOpenSettings={onOpenSettings} /> },
                    { id: CARD_REGISTRY.williams_r.id,   node: <WilliamsRCard cardId={CARD_REGISTRY.williams_r.id} data={data} manualOverride={manualOverrides?.williams_r} lastUpdated={resolveTime(!!data?.williams_r, CARD_REGISTRY.williams_r.id)} indicatorParams={indicatorParams} onOpenSettings={onOpenSettings} /> },
                    { id: CARD_REGISTRY.bb_20_2.id,      node: <BBCard cardId={CARD_REGISTRY.bb_20_2.id} data={data} manualOverride={manualOverrides?.bb_20_2} lastUpdated={resolveTime(!!data?.bb_20_2, CARD_REGISTRY.bb_20_2.id)} indicatorParams={indicatorParams} onOpenSettings={onOpenSettings} /> },
                    { id: CARD_REGISTRY.atr.id,          node: <ATRCard cardId={CARD_REGISTRY.atr.id} data={data} manualOverride={manualOverrides?.atr} lastUpdated={resolveTime(!!data?.atr, CARD_REGISTRY.atr.id)} indicatorParams={indicatorParams} onOpenSettings={onOpenSettings} /> },
                    { id: CARD_REGISTRY.kc.id,           node: <KCCard cardId={CARD_REGISTRY.kc.id} data={data} manualOverride={manualOverrides?.kc} lastUpdated={resolveTime(!!data?.kc, CARD_REGISTRY.kc.id)} indicatorParams={indicatorParams} onOpenSettings={onOpenSettings} /> },
                    ...(!isIndex ? [
                        { id: CARD_REGISTRY.cmf.id,          node: <CmfCard cardId={CARD_REGISTRY.cmf.id} data={data} manualOverride={manualOverrides?.cmf} lastUpdated={resolveTime(!!data?.cmf, CARD_REGISTRY.cmf.id)} /> },
                        { id: CARD_REGISTRY.volume_sma.id,   node: <VolumeSmaCard cardId={CARD_REGISTRY.volume_sma.id} data={data} manualOverride={manualOverrides?.volume_sma} lastUpdated={resolveTime(!!data?.volume_sma, CARD_REGISTRY.volume_sma.id)} /> },
                        { id: CARD_REGISTRY.obv.id,          node: <ObvCard cardId={CARD_REGISTRY.obv.id} data={data} manualOverride={manualOverrides?.obv} lastUpdated={resolveTime(!!data?.obv, CARD_REGISTRY.obv.id)} /> },
                        { id: CARD_REGISTRY.vwap.id,         node: <VwapCard cardId={CARD_REGISTRY.vwap.id} data={data} manualOverride={manualOverrides?.vwap} lastUpdated={resolveTime(!!data?.vwap, CARD_REGISTRY.vwap.id)} /> },
                    ] : []),
                    { id: CARD_REGISTRY.support.id,      node: <SupportCard cardId={CARD_REGISTRY.support.id} data={data} manualOverride={manualOverrides?.support} lastUpdated={resolveTime(!!data?.support, CARD_REGISTRY.support.id)} /> },
                    { id: CARD_REGISTRY.resistance.id,   node: <ResistanceCard cardId={CARD_REGISTRY.resistance.id} data={data} manualOverride={manualOverrides?.resistance} lastUpdated={resolveTime(!!data?.resistance, CARD_REGISTRY.resistance.id)} /> },
                    { id: CARD_REGISTRY.trendline.id,    node: <TrendlineCard cardId={CARD_REGISTRY.trendline.id} data={data} manualOverride={manualOverrides?.trendline} lastUpdated={resolveTime(!!data?.trendline, CARD_REGISTRY.trendline.id)} /> },
                    { id: CARD_REGISTRY.pivot.id,        node: <PivotCard cardId={CARD_REGISTRY.pivot.id} data={data} manualOverride={manualOverrides?.pivot} lastUpdated={resolveTime(!!data?.pivot, CARD_REGISTRY.pivot.id)} /> },
                    { id: CARD_REGISTRY.fibonacci.id,    node: <FibonacciCard cardId={CARD_REGISTRY.fibonacci.id} data={data} manualOverride={manualOverrides?.fibonacci} lastUpdated={resolveTime(!!data?.fibonacci, CARD_REGISTRY.fibonacci.id)} /> },
                    { id: CARD_REGISTRY.ema_20.id,       node: <EMA20Card cardId={CARD_REGISTRY.ema_20.id} data={data} lastUpdated={resolveTime(!!data?.ema_20, CARD_REGISTRY.ema_20.id)} /> },
                    { id: CARD_REGISTRY.ema_50.id,       node: <EMA50Card cardId={CARD_REGISTRY.ema_50.id} data={data} lastUpdated={resolveTime(!!data?.ema_50, CARD_REGISTRY.ema_50.id)} /> },
                    { id: CARD_REGISTRY.ema_200.id,      node: <EMA200Card cardId={CARD_REGISTRY.ema_200.id} data={data} lastUpdated={resolveTime(!!data?.ema_200, CARD_REGISTRY.ema_200.id)} /> },
                    { id: CARD_REGISTRY.sma_50.id,       node: <SMA50Card cardId={CARD_REGISTRY.sma_50.id} data={data} manualOverride={manualOverrides?.sma_50} lastUpdated={resolveTime(!!data?.sma_50, CARD_REGISTRY.sma_50.id)} /> },
                    { id: CARD_REGISTRY.sma_200.id,      node: <SMA200Card cardId={CARD_REGISTRY.sma_200.id} data={data} manualOverride={manualOverrides?.sma_200} lastUpdated={resolveTime(!!data?.sma_200, CARD_REGISTRY.sma_200.id)} /> },
                    { id: CARD_REGISTRY.adx.id,          node: <ADXCard cardId={CARD_REGISTRY.adx.id} data={data} manualOverride={manualOverrides?.adx} lastUpdated={resolveTime(!!data?.adx, CARD_REGISTRY.adx.id)} indicatorParams={indicatorParams} onOpenSettings={onOpenSettings} /> },
                    { id: CARD_REGISTRY.supertrend.id,   node: <SupertrendCard cardId={CARD_REGISTRY.supertrend.id} data={data} manualOverride={manualOverrides?.supertrend} lastUpdated={resolveTime(!!data?.supertrend, CARD_REGISTRY.supertrend.id)} indicatorParams={indicatorParams} onOpenSettings={onOpenSettings} /> },
                    ...(isIndex ? [
                        { id: CARD_REGISTRY.breadth_ratio.id, node: <BreadthRatioCard cardId={CARD_REGISTRY.breadth_ratio.id} data={data} manualOverride={manualOverrides?.breadth_ratio} lastUpdated={resolveTime(data?.breadth?.breadthRatio !== undefined && data?.breadth?.breadthRatio !== null, CARD_REGISTRY.breadth_ratio.id)} /> },
                        { id: CARD_REGISTRY.mcclellan.id,    node: <McClellanCard cardId={CARD_REGISTRY.mcclellan.id} data={data} manualOverride={manualOverrides?.mcclellan} lastUpdated={resolveTime(!!data?.mcclellan, CARD_REGISTRY.mcclellan.id)} /> },
                        { id: CARD_REGISTRY.ad_line.id,      node: <ADLineCard cardId={CARD_REGISTRY.ad_line.id} data={data} manualOverride={manualOverrides?.ad_line} lastUpdated={resolveTime(data?.breadth?.netAdvances !== undefined && data?.breadth?.netAdvances !== null, CARD_REGISTRY.ad_line.id)} /> },
                        { id: CARD_REGISTRY.nh_nl.id,        node: <NhnlCard cardId={CARD_REGISTRY.nh_nl.id} data={data} manualOverride={manualOverrides?.nh_nl} lastUpdated={resolveTime(data?.breadth?.nhnlRatio !== undefined && data?.breadth?.nhnlRatio !== null, CARD_REGISTRY.nh_nl.id)} /> },
                        { id: CARD_REGISTRY.trin.id,         node: <TrinCard cardId={CARD_REGISTRY.trin.id} data={data} manualOverride={manualOverrides?.trin} lastUpdated={resolveTime(!!data?.trin, CARD_REGISTRY.trin.id)} /> }
                    ] : []),
                    { id: CARD_REGISTRY.beta_correlation.id, node: <BetaCorrelationCard cardId={CARD_REGISTRY.beta_correlation.id} data={data} manualOverride={manualOverrides?.beta_correlation} lastUpdated={resolveTime(!!data?.beta, CARD_REGISTRY.beta_correlation.id)} /> }
                ];
                const excludeIds = renderList.map(item => item.id);
                const flatWithData = renderList.map(item => {
                    const cData = cards.find(c => c.id === item.id);
                    const fallbackCredit = getIndicatorConfig(item.id)?.creditScore ?? 5;
                    return { 
                        ...item, 
                        ...(cData || { normalized: 0 }),
                        creditAllocation: cData?.creditAllocation ?? fallbackCredit
                    };
                });
                const dynamicCards = cards
                    .filter(card => !excludeIds.includes(card.id) && !card.id.startsWith('dummy_'))
                    .map(card => ({ id: card.id, ...card, node: <TechnicalCard key={card.id} card={card} onClick={() => onCardClick(card)} /> }));
                flatWithData.push(...dynamicCards);
                const filteredFlatWithData = flatWithData.filter(item => cards.some(c => c.id === item.id));
                const sortedFlat = sortCards(filteredFlatWithData, sortMode);
                return (
                    <div className={gridClass}>
                        {sortedFlat.map(item => <React.Fragment key={item.id}>{item.node}</React.Fragment>)}
                        {cards.length === 0 && searchQuery && (
                            <div className="col-span-4 p-12 text-center text-text-tertiary italic">No technicals found for "{searchQuery}"</div>
                        )}
                    </div>
                );
            })() : (
                <div className="space-y-6 md:space-y-10">
                    {SECTION_ORDER.map((section) => {
                        const hardcodedCounts = { 'Trend':7, 'Momentum':4, 'Volatility':4, 'Volume':4, 'Structure':5, 'Breadth':5 };
                        const expectedIds = {
                            'Trend': [CARD_REGISTRY.ema_20.id, CARD_REGISTRY.ema_50.id, CARD_REGISTRY.ema_200.id, CARD_REGISTRY.sma_50.id, CARD_REGISTRY.sma_200.id, CARD_REGISTRY.adx.id, CARD_REGISTRY.supertrend.id, CARD_REGISTRY.beta_correlation.id],
                            'Momentum': [CARD_REGISTRY.rsi.id, CARD_REGISTRY.macd.id, CARD_REGISTRY.stoch_rsi.id, CARD_REGISTRY.williams_r.id],
                            'Volatility': [CARD_REGISTRY.bb_20_2.id, CARD_REGISTRY.atr.id, CARD_REGISTRY.kc.id],
                            'Volume': isIndex ? [] : [CARD_REGISTRY.cmf.id, CARD_REGISTRY.volume_sma.id, CARD_REGISTRY.obv.id, CARD_REGISTRY.vwap.id],
                            'Structure': [CARD_REGISTRY.support.id, CARD_REGISTRY.resistance.id, CARD_REGISTRY.trendline.id, CARD_REGISTRY.pivot.id, CARD_REGISTRY.fibonacci.id],
                            'Breadth': isIndex ? [CARD_REGISTRY.ad_line.id, CARD_REGISTRY.nh_nl.id, CARD_REGISTRY.breadth_ratio.id, CARD_REGISTRY.trin.id, CARD_REGISTRY.mcclellan.id] : []
                        }[section] || [];

                        const rawList = grouped[section];
                        const validDynamicCards = rawList ? rawList.filter(c => !c.id?.startsWith('dummy_')) : [];
                        
                        if (expectedIds.length === 0 && validDynamicCards.length === 0) return null;
                        const sectionCards = sortCards(validDynamicCards, sortMode);

                        return (
                            <div key={section} id={`section-${section}`} className="animate-in fade-in slide-in-from-bottom-4 duration-500 scroll-mt-20">
                                <div className="flex items-center justify-center gap-4 mb-3 md:mb-6">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-bold text-text-primary uppercase tracking-widest">{section}</span>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded border border-border-default bg-background-surface text-text-tertiary font-mono shadow-sm">
                                            {expectedIds.length + sectionCards.length}
                                        </span>
                                    </div>
                                </div>
                                <div className={gridClass}>
                                    {section === 'Trend' && (<>
                                        <EMA20Card cardId={CARD_REGISTRY.ema_20.id} data={data} manualOverride={manualOverrides?.ema_20} lastUpdated={resolveTime(!!data?.ema_20, CARD_REGISTRY.ema_20.id)} />
                                        <EMA50Card cardId={CARD_REGISTRY.ema_50.id} data={data} manualOverride={manualOverrides?.ema_50} lastUpdated={resolveTime(!!data?.ema_50, CARD_REGISTRY.ema_50.id)} />
                                        <EMA200Card cardId={CARD_REGISTRY.ema_200.id} data={data} manualOverride={manualOverrides?.ema_200} lastUpdated={resolveTime(!!data?.ema_200, CARD_REGISTRY.ema_200.id)} />
                                        <SMA50Card cardId={CARD_REGISTRY.sma_50.id} data={data} manualOverride={manualOverrides?.sma_50} lastUpdated={resolveTime(!!data?.sma_50, CARD_REGISTRY.sma_50.id)} />
                                        <SMA200Card cardId={CARD_REGISTRY.sma_200.id} data={data} manualOverride={manualOverrides?.sma_200} lastUpdated={resolveTime(!!data?.sma_200, CARD_REGISTRY.sma_200.id)} />
                                        <ADXCard cardId={CARD_REGISTRY.adx.id} data={data} manualOverride={manualOverrides?.adx} lastUpdated={resolveTime(!!data?.adx, CARD_REGISTRY.adx.id)} indicatorParams={indicatorParams} onOpenSettings={onOpenSettings} />
                                        <SupertrendCard cardId={CARD_REGISTRY.supertrend.id} data={data} manualOverride={manualOverrides?.supertrend} lastUpdated={resolveTime(!!data?.supertrend, CARD_REGISTRY.supertrend.id)} indicatorParams={indicatorParams} onOpenSettings={onOpenSettings} />
                                        <BetaCorrelationCard cardId={CARD_REGISTRY.beta_correlation.id} data={data} manualOverride={manualOverrides?.beta_correlation} lastUpdated={resolveTime(!!data?.beta, CARD_REGISTRY.beta_correlation.id)} />
                                    </>)}
                                    {section === 'Momentum' && (<>
                                        <RSICard cardId={CARD_REGISTRY.rsi.id} data={data} manualOverride={manualOverrides?.rsi} lastUpdated={resolveTime(!!data?.rsi, CARD_REGISTRY.rsi.id)} indicatorParams={indicatorParams} onOpenSettings={onOpenSettings} />
                                        <MACDCard cardId={CARD_REGISTRY.macd.id} data={data} manualOverride={manualOverrides?.macd} lastUpdated={resolveTime(!!data?.macd, CARD_REGISTRY.macd.id)} indicatorParams={indicatorParams} onOpenSettings={onOpenSettings} />
                                        <StochRSICard cardId={CARD_REGISTRY.stoch_rsi.id} data={data} manualOverride={manualOverrides?.stoch_rsi} lastUpdated={resolveTime(!!data?.stoch_rsi, CARD_REGISTRY.stoch_rsi.id)} indicatorParams={indicatorParams} onOpenSettings={onOpenSettings} />
                                        <WilliamsRCard cardId={CARD_REGISTRY.williams_r.id} data={data} manualOverride={manualOverrides?.williams_r} lastUpdated={resolveTime(!!data?.williams_r, CARD_REGISTRY.williams_r.id)} indicatorParams={indicatorParams} onOpenSettings={onOpenSettings} />
                                    </>)}
                                    {section === 'Volatility' && (<>
                                        <BBCard cardId={CARD_REGISTRY.bb_20_2.id} data={data} manualOverride={manualOverrides?.bb_20_2} lastUpdated={resolveTime(!!data?.bb_20_2, CARD_REGISTRY.bb_20_2.id)} indicatorParams={indicatorParams} onOpenSettings={onOpenSettings} />
                                        <ATRCard cardId={CARD_REGISTRY.atr.id} data={data} manualOverride={manualOverrides?.atr} lastUpdated={resolveTime(!!data?.atr, CARD_REGISTRY.atr.id)} indicatorParams={indicatorParams} onOpenSettings={onOpenSettings} />
                                        <KCCard cardId={CARD_REGISTRY.kc.id} data={data} manualOverride={manualOverrides?.kc} lastUpdated={resolveTime(!!data?.kc, CARD_REGISTRY.kc.id)} indicatorParams={indicatorParams} onOpenSettings={onOpenSettings} />
                                    </>)}
                                    {section === 'Volume' && (<>
                                        <CmfCard cardId={CARD_REGISTRY.cmf.id} data={data} manualOverride={manualOverrides?.cmf} lastUpdated={resolveTime(!!data?.cmf, CARD_REGISTRY.cmf.id)} />
                                        <VolumeSmaCard cardId={CARD_REGISTRY.volume_sma.id} data={data} manualOverride={manualOverrides?.volume_sma} lastUpdated={resolveTime(!!data?.volume_sma, CARD_REGISTRY.volume_sma.id)} />
                                        <ObvCard cardId={CARD_REGISTRY.obv.id} data={data} manualOverride={manualOverrides?.obv} lastUpdated={resolveTime(!!data?.obv, CARD_REGISTRY.obv.id)} />
                                        <VwapCard cardId={CARD_REGISTRY.vwap.id} data={data} manualOverride={manualOverrides?.vwap} lastUpdated={resolveTime(!!data?.vwap, CARD_REGISTRY.vwap.id)} />
                                    </>)}
                                    {section === 'Structure' && (<>
                                        <SupportCard cardId={CARD_REGISTRY.support.id} data={data} manualOverride={manualOverrides?.support} lastUpdated={resolveTime(!!data?.support, CARD_REGISTRY.support.id)} />
                                        <ResistanceCard cardId={CARD_REGISTRY.resistance.id} data={data} manualOverride={manualOverrides?.resistance} lastUpdated={resolveTime(!!data?.resistance, CARD_REGISTRY.resistance.id)} />
                                        <TrendlineCard cardId={CARD_REGISTRY.trendline.id} data={data} manualOverride={manualOverrides?.trendline} lastUpdated={resolveTime(!!data?.trendline, CARD_REGISTRY.trendline.id)} />
                                        <PivotCard cardId={CARD_REGISTRY.pivot.id} data={data} manualOverride={manualOverrides?.pivot} lastUpdated={resolveTime(!!data?.pivot, CARD_REGISTRY.pivot.id)} />
                                        <FibonacciCard cardId={CARD_REGISTRY.fibonacci.id} data={data} manualOverride={manualOverrides?.fibonacci} lastUpdated={resolveTime(!!data?.fibonacci, CARD_REGISTRY.fibonacci.id)} />
                                    </>)}
                                    {section === 'Breadth' && (<>
                                        <ADLineCard cardId={CARD_REGISTRY.ad_line.id} data={data} manualOverride={manualOverrides?.ad_line} lastUpdated={resolveTime(data?.breadth?.netAdvances !== undefined && data?.breadth?.netAdvances !== null, CARD_REGISTRY.ad_line.id)} />
                                        <NhnlCard cardId={CARD_REGISTRY.nh_nl.id} data={data} manualOverride={manualOverrides?.nh_nl} lastUpdated={resolveTime(data?.breadth?.nhnlRatio !== undefined && data?.breadth?.nhnlRatio !== null, CARD_REGISTRY.nh_nl.id)} />
                                        <BreadthRatioCard cardId={CARD_REGISTRY.breadth_ratio.id} data={data} manualOverride={manualOverrides?.breadth_ratio} lastUpdated={resolveTime(data?.breadth?.breadthRatio !== undefined && data?.breadth?.breadthRatio !== null, CARD_REGISTRY.breadth_ratio.id)} />
                                        <TrinCard cardId={CARD_REGISTRY.trin.id} data={data} manualOverride={manualOverrides?.trin} lastUpdated={resolveTime(!!data?.trin, CARD_REGISTRY.trin.id)} />
                                        <McClellanCard cardId={CARD_REGISTRY.mcclellan.id} data={data} manualOverride={manualOverrides?.mcclellan} lastUpdated={resolveTime(!!data?.mcclellan, CARD_REGISTRY.mcclellan.id)} />
                                    </>)}
                                    {sectionCards.filter(card => !HARDCODED_IDS.includes(card.id) && !card.id.startsWith('dummy_')).map(card => (
                                        <TechnicalCard key={card.id} card={card} onClick={() => onCardClick(card)} />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
