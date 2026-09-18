import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import axiosInstance from '@/shared/utils/axiosInstance';
import { cn, cleanNum } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import sectorPeers from '@/shared/config/sectorPeers.json';
import { FO_EQUITIES } from '@/shared/utils/foInstruments';

// Simple global cache for peer data so we don't refetch on every toggle or mount
const peerCache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export default function PeerComparisonTable({ data, selectedInstrument }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [insightData, setInsightData] = useState({ isLoading: false, text: null, error: null, model: null });
    const [fallbackPeerRatios, setFallbackPeerRatios] = useState([]);
    const [loadingPeers, setLoadingPeers] = useState(false);

    const currentKey = selectedInstrument?.value || selectedInstrument || null;
    const currentSymbol = FO_EQUITIES.find(e => e.value === currentKey)?.label || data?.company_profile?.company_name || data?.screener?.symbol || currentKey?.split('|')[1] || "Current Stock";

    // 1. Primary Source: Live Screener Domestic Industry Peers Table
    const screenerPeers = data?.screener?.peers || [];
    const hasScreenerPeers = Array.isArray(screenerPeers) && screenerPeers.length > 0;

    const extractRatio = (ratios, names) => {
        if (!Array.isArray(ratios)) return null;
        const match = ratios.find(r => names.some(n => r.name?.toLowerCase().includes(n) || r.name?.toLowerCase() === n));
        return cleanNum(match?.company_value);
    };

    const currentStock = {
        symbol: currentSymbol,
        cmp: data?.quote?.last_price || (data?.screener?.ratios?.['Current Price'] ? parseFloat(data.screener.ratios['Current Price']) : null),
        pe: extractRatio(data?.ratios, ['p/e', 'pe ratio', 'price to earnings']) ?? (data?.screener?.ratios?.['Stock P/E'] ? parseFloat(data.screener.ratios['Stock P/E']) : null),
        marketCapCr: data?.marketCap ?? (data?.screener?.ratios?.['Market Cap'] ? parseFloat(data.screener.ratios['Market Cap']) : null),
        divYieldPct: data?.dividendYield ?? (data?.screener?.ratios?.['Dividend Yield'] ? parseFloat(data.screener.ratios['Dividend Yield']) : null),
        rocePct: extractRatio(data?.ratios, ['roce', 'return on capital']) ?? (data?.screener?.ratios?.['ROCE'] ? parseFloat(data.screener.ratios['ROCE']) : null),
        isCurrentStock: true
    };

    // 2. Fallback: If no Screener peers, use legacy Upstox peer iteration
    useEffect(() => {
        if (hasScreenerPeers || !currentKey) return;
        let isSubscribed = true;

        const fetchFallbackPeers = async () => {
            const peerKeys = sectorPeers[currentKey] || [];
            if (peerKeys.length === 0) {
                if (isSubscribed) {
                    setFallbackPeerRatios([]);
                    setLoadingPeers(false);
                }
                return;
            }

            setLoadingPeers(true);
            const promises = peerKeys.map(async (peerKey) => {
                const cached = peerCache.get(peerKey);
                if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
                    return cached.data;
                }
                try {
                    const res = await axiosInstance.get(`/api/v1/upstox/fundamentals?instrument_key=${encodeURIComponent(peerKey)}`);
                    const pData = res.data?.data;
                    const ratios = pData?.ratios || [];
                    const pSymbol = FO_EQUITIES.find(e => e.value === peerKey)?.label || pData?.company_profile?.company_name || peerKey.split('|')[1] || "Unknown";

                    const pMapped = {
                        symbol: pSymbol,
                        cmp: pData?.quote?.last_price || null,
                        pe: extractRatio(ratios, ['p/e', 'pe ratio']),
                        marketCapCr: pData?.marketCap || null,
                        divYieldPct: pData?.dividendYield || null,
                        rocePct: extractRatio(ratios, ['roce']),
                    };
                    peerCache.set(peerKey, { timestamp: Date.now(), data: pMapped });
                    return pMapped;
                } catch (err) {
                    const pSymbol = FO_EQUITIES.find(e => e.value === peerKey)?.label || peerKey.split('|')[1] || "Unknown";
                    return { symbol: pSymbol, failed: true };
                }
            });

            const results = await Promise.all(promises);
            if (isSubscribed) {
                setFallbackPeerRatios(results);
                setLoadingPeers(false);
            }
        };

        fetchFallbackPeers();

        return () => { isSubscribed = false; };
    }, [currentKey, hasScreenerPeers]);

    // Build unified peers array
    const displayPeers = hasScreenerPeers
        ? [
            currentStock,
            ...screenerPeers.map(p => ({
                symbol: p.companyName,
                cmp: parseFloat(p.cmp) || null,
                pe: parseFloat(p.pe) || null,
                marketCapCr: parseFloat(p.marketCapCr) || null,
                divYieldPct: parseFloat(p.divYieldPct) || null,
                rocePct: parseFloat(p.rocePct) || null,
                qtrProfitVarPct: parseFloat(p.qtrProfitVarPct) || null,
                isCurrentStock: false
            }))
          ]
        : [currentStock, ...fallbackPeerRatios];

    const formatNum = (num, suffix = '', isDec = true) => {
        if (num === null || num === undefined || isNaN(num)) return '--';
        return `${isDec ? Number(num).toFixed(2) : Math.round(num)}${suffix}`;
    };

    const formatMarketCap = (val) => {
        if (val === null || val === undefined || isNaN(val)) return '--';
        const n = Number(val);
        const abs = Math.abs(n);
        const sign = n < 0 ? '-' : '';
        if (abs >= 100000) return `${sign}${(abs / 100000).toFixed(2)}L Cr`;
        if (abs >= 1000) return `${sign}${(abs / 1000).toFixed(2)}k Cr`;
        return `${sign}${abs.toFixed(0)} Cr`;
    };

    // AI Insight Trigger
    useEffect(() => {
        let isSubscribed = true;
        if (isExpanded && !insightData.text && !insightData.isLoading && !insightData.error && !loadingPeers) {
            setInsightData(prev => ({ ...prev, isLoading: true, error: null }));
            const controller = new AbortController();
            
            axiosInstance.post('/api/v1/intelligence/card-insight', {
                metric: 'Peer Comparison',
                value: displayPeers, 
                stockSymbol: currentSymbol || 'Unknown',
                module: 'Fundamentals',
                isPeerComparison: true
            }, { signal: controller.signal })
            .then(res => {
                if (!isSubscribed) return;
                if (res.data.error || res.data.insight === null) {
                    setInsightData(prev => ({ ...prev, isLoading: false, error: "AI insight unavailable" }));
                } else {
                    setInsightData(prev => ({ ...prev, isLoading: false, text: res.data.insight, model: res.data.model }));
                }
            })
            .catch(err => {
                if (!isSubscribed) return;
                setInsightData(prev => ({ ...prev, isLoading: false, error: "AI insight unavailable" }));
            });
        }
        return () => { isSubscribed = false; };
    }, [isExpanded, currentKey, loadingPeers, displayPeers.length]);

    if (!hasScreenerPeers && (!currentKey || (sectorPeers[currentKey] || []).length === 0)) {
        return null;
    }

    return (
        <div className="mt-6 pt-4 border-t border-border-subtle cursor-pointer" onDoubleClick={() => setIsExpanded(!isExpanded)}>
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                        Domestic Industry Peer Comparison
                    </h3>
                    {data?.screener?.sector?.industry && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950/40 border border-blue-800/40 text-blue-400 font-medium">
                            {data.screener.sector.industry}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1.5" title="Screener.in Live Pipeline">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-mono font-bold tracking-wider text-emerald-400 uppercase">
                        {hasScreenerPeers ? 'LIVE SCREENER' : 'AUTO'}
                    </span>
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-800 text-[10px] text-text-tertiary uppercase tracking-wider">
                            <th className="py-2.5 px-3 font-medium">Company</th>
                            <th className="py-2.5 px-3 font-medium text-right">CMP (₹)</th>
                            <th className="py-2.5 px-3 font-medium text-right">P/E</th>
                            <th className="py-2.5 px-3 font-medium text-right">Market Cap (Cr)</th>
                            <th className="py-2.5 px-3 font-medium text-right">Div Yield</th>
                            <th className="py-2.5 px-3 font-medium text-right">ROCE</th>
                            {hasScreenerPeers && <th className="py-2.5 px-3 font-medium text-right">Profit Var %</th>}
                        </tr>
                    </thead>
                    <tbody className="text-xs divide-y divide-slate-800/60">
                        {displayPeers.map((p, i) => {
                            const isCurrent = p.isCurrentStock || i === 0;
                            const isFailed = p.failed;
                            return (
                                <tr 
                                    key={p.symbol || i} 
                                    className={cn(
                                        "hover:bg-background-elevated/50 transition-colors", 
                                        isCurrent && "bg-blue-900/15 font-semibold"
                                    )}
                                >
                                    <td className="py-2.5 px-3">
                                        <div className="flex items-center gap-2">
                                            {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />}
                                            <span className={cn(
                                                "whitespace-nowrap", 
                                                isCurrent ? "text-blue-400 font-bold" : (isFailed ? "text-text-tertiary" : "text-text-secondary")
                                            )}>
                                                {p.symbol}
                                            </span>
                                            {isCurrent && loadingPeers && <span className="w-3 h-3 ml-2 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />}
                                        </div>
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-mono text-text-secondary">{p.cmp !== null && p.cmp !== undefined && !isNaN(p.cmp) ? `₹${formatNum(p.cmp, '')}` : '--'}</td>
                                    <td className="py-2.5 px-3 text-right font-mono text-text-secondary">{isFailed ? 'unavail' : formatNum(p.pe, 'x')}</td>
                                    <td className="py-2.5 px-3 text-right font-mono text-text-secondary" title={p.marketCapCr ? `₹${Number(p.marketCapCr).toLocaleString('en-IN')} Crores` : undefined}>
                                        {formatMarketCap(p.marketCapCr)}
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-mono text-text-secondary">{formatNum(p.divYieldPct, '%')}</td>
                                    <td className="py-2.5 px-3 text-right font-mono text-text-secondary">{formatNum(p.rocePct, '%')}</td>
                                    {hasScreenerPeers && (
                                        <td className={cn(
                                            "py-2.5 px-3 text-right font-mono",
                                            p.qtrProfitVarPct > 0 ? "text-emerald-400" : (p.qtrProfitVarPct < 0 ? "text-rose-400" : "text-text-secondary")
                                        )}>
                                            {p.qtrProfitVarPct !== null && !isNaN(p.qtrProfitVarPct) ? `${p.qtrProfitVarPct > 0 ? '+' : ''}${p.qtrProfitVarPct.toFixed(1)}%` : '--'}
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            
            {/* AI Insight Section */}
            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                        <div className="mt-3 mb-2 border-t border-border-subtle" />
                        <div className="pt-2 pb-2">
                            <h4 className="text-[10px] uppercase tracking-wider text-text-tertiary mb-2 flex items-center gap-1.5">
                                <Sparkles size={11} className="text-blue-400" /> Praxis Intelligence
                            </h4>
                            {insightData.isLoading ? (
                                <div className="space-y-2">
                                    <div className="h-2 bg-border-default/50 rounded w-full animate-pulse" />
                                    <div className="h-2 bg-border-default/50 rounded w-5/6 animate-pulse" />
                                </div>
                            ) : insightData.error ? (
                                <p className="text-[10px] text-text-tertiary italic">{insightData.error}</p>
                            ) : insightData.text ? (
                                <div className="text-[11px] text-text-secondary leading-relaxed space-y-2" dangerouslySetInnerHTML={{ __html: insightData.text }} />
                            ) : (
                                <p className="text-[10px] text-text-tertiary italic">Double-click again to refresh.</p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
