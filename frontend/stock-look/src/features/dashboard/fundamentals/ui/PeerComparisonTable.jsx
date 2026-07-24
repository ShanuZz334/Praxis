import React, { useState, useEffect, useContext } from 'react';
import { FundamentalContext } from '@/features/dashboard/fundamentals/ui/FundamentalContext';
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
    const [peerRatios, setPeerRatios] = useState([]);
    const [loadingPeers, setLoadingPeers] = useState(true);

    const currentKey = selectedInstrument?.value || selectedInstrument || null;
    const currentSymbol = FO_EQUITIES.find(e => e.value === currentKey)?.label || data?.company_profile?.company_name || currentKey?.split('|')[1] || "Current Stock";

    const extractRatio = (ratios, names) => {
        if (!Array.isArray(ratios)) return null;
        const match = ratios.find(r => names.some(n => r.name?.toLowerCase().includes(n) || r.name?.toLowerCase() === n));
        return cleanNum(match?.company_value);
    };

    const currentStock = {
        symbol: currentSymbol,
        pe: extractRatio(data?.ratios, ['p/e', 'pe ratio', 'price to earnings']),
        pb: extractRatio(data?.ratios, ['p/b', 'pb ratio', 'price to book']),
        roe: extractRatio(data?.ratios, ['roe', 'return on equity']),
        de: extractRatio(data?.ratios, ['debt to equity', 'd/e']),
        netMargin: extractRatio(data?.ratios, ['net margin', 'net profit margin', 'pat margin']),
    };

    useEffect(() => {
        if (!currentKey) return;
        let isSubscribed = true;

        const fetchPeers = async () => {
            const peerKeys = sectorPeers[currentKey] || [];
            if (peerKeys.length === 0) {
                if (isSubscribed) {
                    setPeerRatios([]);
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
                        pe: extractRatio(ratios, ['p/e', 'pe ratio', 'price to earnings']),
                        pb: extractRatio(ratios, ['p/b', 'pb ratio', 'price to book']),
                        roe: extractRatio(ratios, ['roe', 'return on equity']),
                        de: extractRatio(ratios, ['debt to equity', 'd/e']),
                        netMargin: extractRatio(ratios, ['net margin', 'net profit margin', 'pat margin']),
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
                setPeerRatios(results);
                setLoadingPeers(false);
            }
        };

        fetchPeers();

        return () => { isSubscribed = false; };
    }, [currentKey]);

    const allPeers = [currentStock, ...peerRatios];
    const peerKeys = sectorPeers[currentKey] || [];
    
    // Dynamic column visibility: Only show columns where at least one peer (or current stock) has data
    const hasDE = allPeers.some(p => p.de !== null && p.de !== undefined);
    const hasNetMargin = allPeers.some(p => p.netMargin !== null && p.netMargin !== undefined);

    useEffect(() => {
        let isSubscribed = true;
        if (isExpanded && !insightData.text && !insightData.isLoading && !insightData.error && !loadingPeers) {
            setInsightData(prev => ({ ...prev, isLoading: true, error: null }));
            const controller = new AbortController();
            
            axiosInstance.post('/api/v1/intelligence/card-insight', {
                metric: 'Peer Comparison',
                value: allPeers, 
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
    }, [isExpanded, currentKey, loadingPeers]);

    const formatNum = (num, suffix = '') => {
        if (num === null || num === undefined || isNaN(num)) return '--';
        return `${Number(num).toFixed(2)}${suffix}`;
    };

    if (!currentKey || peerKeys.length === 0) {
        return null; // Don't show the table at all in the snapshot if there are no configured peers
    }
    return (
        <div className="mt-6 pt-4 border-t border-border-subtle cursor-pointer" onDoubleClick={() => setIsExpanded(!isExpanded)}>
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Peer Comparison</h3>
                <div className="flex items-center gap-1.5" title="Curated List, Live Data">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="text-[10px] font-mono font-bold tracking-wider text-text-primary uppercase">AUTO</span>
                </div>
            </div>
            
            <div className="overflow-x-auto custom-scrollbar relative">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-border-default text-[10px] text-text-tertiary uppercase tracking-wider">
                            <th className="pb-2 pr-4 font-medium">Company</th>
                            <th className="pb-2 px-4 font-medium text-right">P/E</th>
                            <th className="pb-2 px-4 font-medium text-right">P/B</th>
                            <th className="pb-2 px-4 font-medium text-right">ROE</th>
                            {hasDE && <th className="pb-2 px-4 font-medium text-right">D/E</th>}
                            {hasNetMargin && <th className="pb-2 pl-4 font-medium text-right">Net Margin</th>}
                        </tr>
                    </thead>
                    <tbody className="text-xs">
                        {allPeers.map((p, i) => {
                            const isCurrent = i === 0;
                            const isFailed = p.failed;
                            return (
                                <tr key={p.symbol || i} className={cn("border-b border-border-subtle hover:bg-background-elevated/50 transition-colors", isCurrent && "bg-blue-900/10")}>
                                    <td className="py-2.5 pr-4">
                                        <div className="flex items-center gap-2">
                                            {isCurrent && <span className="w-1 h-1 rounded-full bg-blue-500 shrink-0" />}
                                            <span className={cn("font-medium whitespace-nowrap", isCurrent ? "text-blue-400" : (isFailed ? "text-text-tertiary" : "text-text-secondary"))}>{p.symbol}</span>
                                            {isCurrent && loadingPeers && <span className="w-3 h-3 ml-2 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />}
                                        </div>
                                    </td>
                                    <td className="py-2.5 px-4 text-right font-mono text-text-secondary">{isFailed ? 'unavail' : formatNum(p.pe, 'x')}</td>
                                    <td className="py-2.5 px-4 text-right font-mono text-text-secondary">{isFailed ? 'unavail' : formatNum(p.pb, 'x')}</td>
                                    <td className="py-2.5 px-4 text-right font-mono text-text-secondary">{isFailed ? 'unavail' : formatNum(p.roe, '%')}</td>
                                    {hasDE && <td className="py-2.5 px-4 text-right font-mono text-text-secondary">{isFailed ? 'unavail' : formatNum(p.de, 'x')}</td>}
                                    {hasNetMargin && <td className="py-2.5 pl-4 text-right font-mono text-text-secondary">{isFailed ? 'unavail' : formatNum(p.netMargin, '%')}</td>}
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
                            <h4 className="text-[10px] uppercase tracking-wider text-text-tertiary mb-2 flex items-center gap-2">
                                <span className="text-blue-400">✧</span> Praxis Intelligence
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
