/**
 * @file TechnicalGrid.jsx
 * @purpose Renders the grid of technical indicator cards.
 */

import React from "react";
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
import VixCard from "./VixCard";
import TrinCard from "./TrinCard";

const HARDCODED_IDS = [
    'rsi','macd','stoch_rsi','williams_r','bb_20_2','atr','kc','cmf',
    'volume_sma','obv','vwap','support','resistance','trendline','pivot',
    'fibonacci','ema_20','ema_50','ema_200','sma_50','sma_200','adx',
    'supertrend','breadth_ratio','mcclellan','ad_line','nh_nl','trin'
];

export default function TechnicalGrid({
    manualOverrides, resolveTime, cards, onCardClick,
    viewMode = "sectioned", sortMode = "score_desc",
    searchQuery = "", controls, data, indicatorParams, onOpenSettings, isIndex = false
}) {
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
                    { id: 'rsi',          node: <RSICard data={data} manualOverride={manualOverrides?.rsi} lastUpdated={resolveTime(!!data?.rsi, 'rsi')} indicatorParams={indicatorParams} onOpenSettings={onOpenSettings} /> },
                    { id: 'macd',         node: <MACDCard data={data} manualOverride={manualOverrides?.macd} lastUpdated={resolveTime(!!data?.macd, 'macd')} indicatorParams={indicatorParams} onOpenSettings={onOpenSettings} /> },
                    { id: 'stoch_rsi',    node: <StochRSICard data={data} manualOverride={manualOverrides?.stoch_rsi} lastUpdated={resolveTime(!!data?.stoch_rsi, 'stoch_rsi')} indicatorParams={indicatorParams} onOpenSettings={onOpenSettings} /> },
                    { id: 'williams_r',   node: <WilliamsRCard data={data} manualOverride={manualOverrides?.williams_r} lastUpdated={resolveTime(!!data?.williams_r, 'williams_r')} indicatorParams={indicatorParams} onOpenSettings={onOpenSettings} /> },
                    { id: 'bb_20_2',      node: <BBCard data={data} manualOverride={manualOverrides?.bb_20_2} lastUpdated={resolveTime(!!data?.bb_20_2, 'bb_20_2')} indicatorParams={indicatorParams} onOpenSettings={onOpenSettings} /> },
                    { id: 'atr',          node: <ATRCard data={data} manualOverride={manualOverrides?.atr} lastUpdated={resolveTime(!!data?.atr, 'atr')} indicatorParams={indicatorParams} onOpenSettings={onOpenSettings} /> },
                    { id: 'kc',           node: <KCCard data={data} manualOverride={manualOverrides?.kc} lastUpdated={resolveTime(!!data?.kc, 'kc')} indicatorParams={indicatorParams} onOpenSettings={onOpenSettings} /> },
                    ...(!isIndex ? [
                        { id: 'cmf',          node: <CmfCard data={data} manualOverride={manualOverrides?.cmf} lastUpdated={resolveTime(!!data?.cmf, 'cmf')} /> },
                        { id: 'volume_sma',   node: <VolumeSmaCard data={data} manualOverride={manualOverrides?.volume_sma} lastUpdated={resolveTime(!!data?.volume_sma, 'volume_sma')} /> },
                        { id: 'obv',          node: <ObvCard data={data} manualOverride={manualOverrides?.obv} lastUpdated={resolveTime(!!data?.obv, 'obv')} /> },
                        { id: 'vwap',         node: <VwapCard data={data} manualOverride={manualOverrides?.vwap} lastUpdated={resolveTime(!!data?.vwap, 'vwap')} /> },
                    ] : []),
                    { id: 'support',      node: <SupportCard data={data} manualOverride={manualOverrides?.support} lastUpdated={resolveTime(!!data?.support, 'support')} /> },
                    { id: 'resistance',   node: <ResistanceCard data={data} manualOverride={manualOverrides?.resistance} lastUpdated={resolveTime(!!data?.resistance, 'resistance')} /> },
                    { id: 'trendline',    node: <TrendlineCard data={data} manualOverride={manualOverrides?.trendline} lastUpdated={resolveTime(!!data?.trendline, 'trendline')} /> },
                    { id: 'pivot',        node: <PivotCard data={data} manualOverride={manualOverrides?.pivot} lastUpdated={resolveTime(!!data?.pivot, 'pivot')} /> },
                    { id: 'fibonacci',    node: <FibonacciCard data={data} manualOverride={manualOverrides?.fibonacci} lastUpdated={resolveTime(!!data?.fibonacci, 'fibonacci')} /> },
                    { id: 'ema_20',       node: <EMA20Card data={data} lastUpdated={resolveTime(!!data?.ema_20, 'ema_20')} /> },
                    { id: 'ema_50',       node: <EMA50Card data={data} lastUpdated={resolveTime(!!data?.ema_50, 'ema_50')} /> },
                    { id: 'ema_200',      node: <EMA200Card data={data} lastUpdated={resolveTime(!!data?.ema_200, 'ema_200')} /> },
                    { id: 'sma_50',       node: <SMA50Card data={data} manualOverride={manualOverrides?.sma_50} lastUpdated={resolveTime(!!data?.sma_50, 'sma_50')} /> },
                    { id: 'sma_200',      node: <SMA200Card data={data} manualOverride={manualOverrides?.sma_200} lastUpdated={resolveTime(!!data?.sma_200, 'sma_200')} /> },
                    { id: 'adx',          node: <ADXCard data={data} manualOverride={manualOverrides?.adx} lastUpdated={resolveTime(!!data?.adx, 'adx')} indicatorParams={indicatorParams} onOpenSettings={onOpenSettings} /> },
                    { id: 'supertrend',   node: <SupertrendCard data={data} manualOverride={manualOverrides?.supertrend} lastUpdated={resolveTime(!!data?.supertrend, 'supertrend')} indicatorParams={indicatorParams} onOpenSettings={onOpenSettings} /> },
                    ...(isIndex ? [
                        { id: 'breadth_ratio', node: <BreadthRatioCard data={data} manualOverride={manualOverrides?.breadth_ratio} lastUpdated={resolveTime(!!data?.breadth_ratio, 'breadth_ratio')} /> },
                        { id: 'mcclellan',    node: <McClellanCard data={data} manualOverride={manualOverrides?.mcclellan} lastUpdated={resolveTime(!!data?.mcclellan, 'mcclellan')} /> },
                        { id: 'ad_line',      node: <ADLineCard data={data} manualOverride={manualOverrides?.ad_line} lastUpdated={resolveTime(!!data?.ad_line, 'ad_line')} /> },
                        { id: 'nh_nl',        node: <NhnlCard data={data} manualOverride={manualOverrides?.nh_nl} lastUpdated={resolveTime(!!data?.nh_nl, 'nh_nl')} /> },
                        { id: 'trin',         node: <TrinCard data={data} manualOverride={manualOverrides?.trin} lastUpdated={resolveTime(!!data?.trin, 'trin')} /> }
                    ] : []),

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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 md:gap-4 items-start">
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
                            'Trend': ['ema_20', 'ema_50', 'ema_200', 'sma_50', 'sma_200', 'adx', 'supertrend'],
                            'Momentum': ['rsi', 'macd', 'stoch_rsi', 'williams_r'],
                            'Volatility': ['bb_20_2', 'atr', 'kc'],
                            'Volume': isIndex ? [] : ['cmf', 'volume_sma', 'obv', 'vwap'],
                            'Structure': ['support', 'resistance', 'trendline', 'pivot', 'fibonacci'],
                            'Breadth': isIndex ? ['ad_line', 'nh_nl', 'breadth_ratio', 'trin', 'mcclellan'] : []
                        }[section] || [];

                        let missingCount = 0;
                        expectedIds.forEach(id => {
                            if (!data || (data[id] === undefined || data[id] === null || data[id] === '--')) {
                                missingCount++;
                            }
                        });

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
                                        {missingCount > 0 ? (
                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/30">
                                                {missingCount} missing
                                            </span>
                                        ) : (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded border border-border-default bg-emerald-500/10 text-emerald-500 font-mono shadow-sm border-emerald-500/30">
                                                100%
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 md:gap-4 items-start">
                                    {section === 'Trend' && (<>
                                        <EMA20Card data={data} manualOverride={manualOverrides?.ema_20} lastUpdated={resolveTime(!!data?.ema_20, 'ema_20')} />
                                        <EMA50Card data={data} manualOverride={manualOverrides?.ema_50} lastUpdated={resolveTime(!!data?.ema_50, 'ema_50')} />
                                        <EMA200Card data={data} manualOverride={manualOverrides?.ema_200} lastUpdated={resolveTime(!!data?.ema_200, 'ema_200')} />
                                        <SMA50Card data={data} manualOverride={manualOverrides?.sma_50} lastUpdated={resolveTime(!!data?.sma_50, 'sma_50')} />
                                        <SMA200Card data={data} manualOverride={manualOverrides?.sma_200} lastUpdated={resolveTime(!!data?.sma_200, 'sma_200')} />
                                        <ADXCard data={data} manualOverride={manualOverrides?.adx} lastUpdated={resolveTime(!!data?.adx, 'adx')} indicatorParams={indicatorParams} onOpenSettings={onOpenSettings} />
                                        <SupertrendCard data={data} manualOverride={manualOverrides?.supertrend} lastUpdated={resolveTime(!!data?.supertrend, 'supertrend')} indicatorParams={indicatorParams} onOpenSettings={onOpenSettings} />
                                    </>)}
                                    {section === 'Momentum' && (<>
                                        <RSICard data={data} manualOverride={manualOverrides?.rsi} lastUpdated={resolveTime(!!data?.rsi, 'rsi')} indicatorParams={indicatorParams} onOpenSettings={onOpenSettings} />
                                        <MACDCard data={data} manualOverride={manualOverrides?.macd} lastUpdated={resolveTime(!!data?.macd, 'macd')} indicatorParams={indicatorParams} onOpenSettings={onOpenSettings} />
                                        <StochRSICard data={data} manualOverride={manualOverrides?.stoch_rsi} lastUpdated={resolveTime(!!data?.stoch_rsi, 'stoch_rsi')} indicatorParams={indicatorParams} onOpenSettings={onOpenSettings} />
                                        <WilliamsRCard data={data} manualOverride={manualOverrides?.williams_r} lastUpdated={resolveTime(!!data?.williams_r, 'williams_r')} indicatorParams={indicatorParams} onOpenSettings={onOpenSettings} />
                                    </>)}
                                    {section === 'Volatility' && (<>
                                        <BBCard data={data} manualOverride={manualOverrides?.bb_20_2} lastUpdated={resolveTime(!!data?.bb_20_2, 'bb_20_2')} indicatorParams={indicatorParams} onOpenSettings={onOpenSettings} />
                                        <ATRCard data={data} manualOverride={manualOverrides?.atr} lastUpdated={resolveTime(!!data?.atr, 'atr')} indicatorParams={indicatorParams} onOpenSettings={onOpenSettings} />
                                        <KCCard data={data} manualOverride={manualOverrides?.kc} lastUpdated={resolveTime(!!data?.kc, 'kc')} indicatorParams={indicatorParams} onOpenSettings={onOpenSettings} />
                                    </>)}
                                    {section === 'Volume' && (<>
                                        <CmfCard data={data} manualOverride={manualOverrides?.cmf} lastUpdated={resolveTime(!!data?.cmf, 'cmf')} />
                                        <VolumeSmaCard data={data} manualOverride={manualOverrides?.volume_sma} lastUpdated={resolveTime(!!data?.volume_sma, 'volume_sma')} />
                                        <ObvCard data={data} manualOverride={manualOverrides?.obv} lastUpdated={resolveTime(!!data?.obv, 'obv')} />
                                        <VwapCard data={data} manualOverride={manualOverrides?.vwap} lastUpdated={resolveTime(!!data?.vwap, 'vwap')} />
                                    </>)}
                                    {section === 'Structure' && (<>
                                        <SupportCard data={data} manualOverride={manualOverrides?.support} lastUpdated={resolveTime(!!data?.support, 'support')} />
                                        <ResistanceCard data={data} manualOverride={manualOverrides?.resistance} lastUpdated={resolveTime(!!data?.resistance, 'resistance')} />
                                        <TrendlineCard data={data} manualOverride={manualOverrides?.trendline} lastUpdated={resolveTime(!!data?.trendline, 'trendline')} />
                                        <PivotCard data={data} manualOverride={manualOverrides?.pivot} lastUpdated={resolveTime(!!data?.pivot, 'pivot')} />
                                        <FibonacciCard data={data} manualOverride={manualOverrides?.fibonacci} lastUpdated={resolveTime(!!data?.fibonacci, 'fibonacci')} />
                                    </>)}
                                    {section === 'Breadth' && (<>
                                        <ADLineCard data={data} manualOverride={manualOverrides?.ad_line} lastUpdated={resolveTime(!!data?.ad_line, 'ad_line')} />
                                        <NhnlCard data={data} manualOverride={manualOverrides?.nh_nl} lastUpdated={resolveTime(!!data?.nh_nl, 'nh_nl')} />
                                        <BreadthRatioCard data={data} manualOverride={manualOverrides?.breadth_ratio} lastUpdated={resolveTime(!!data?.breadth_ratio, 'breadth_ratio')} />
                                        <TrinCard data={data} manualOverride={manualOverrides?.trin} lastUpdated={resolveTime(!!data?.trin, 'trin')} />
                                        <McClellanCard data={data} manualOverride={manualOverrides?.mcclellan} lastUpdated={resolveTime(!!data?.mcclellan, 'mcclellan')} />
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
