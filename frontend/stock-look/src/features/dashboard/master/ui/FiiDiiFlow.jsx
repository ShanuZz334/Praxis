import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, ReferenceLine } from 'recharts';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import axiosInstance from '@/shared/utils/axiosInstance';
import Loader from '@/shared/components/ui/Loader';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboardContext } from '@/shared/context/DashboardContext';

const FiiDiiFlow = React.memo(function FiiDiiFlow({ liveFiiDiiFlow: propFlow }) {
    const context = useDashboardContext();
    const liveFiiDiiFlow = propFlow || context?.fiiDiiFlow;
    const [historyOffset, setHistoryOffset] = useState(0);
    const [historicalFlow, setHistoricalFlow] = useState(null);
    const [loadingHistory, setLoadingHistory] = useState(false);

    useEffect(() => {
        if (historyOffset === 0) {
            setHistoricalFlow(null);
            return;
        }

        const fetchHistory = async () => {
            setLoadingHistory(true);
            try {
                // skip = offset (e.g., offset 1 = skip 1 = yesterday)
                const res = await axiosInstance.get(`/api/flow/history?skip=${historyOffset}&limit=1`);
                if (res.data?.success && res.data.data.length > 0) {
                    const record = res.data.data[0];
                    setHistoricalFlow({
                        fii: record.fii,
                        dii: record.dii,
                        timestamp: new Date(record.timestamp).getTime()
                    });
                }
            } catch (error) {
                console.error("Failed to fetch historical flow:", error);
            } finally {
                setLoadingHistory(false);
            }
        };

        fetchHistory();
    }, [historyOffset]);

    const fiiDiiFlow = historyOffset === 0 ? liveFiiDiiFlow : historicalFlow;

    const isLoading = !fiiDiiFlow || Object.keys(fiiDiiFlow.fii || {}).length === 0 || loadingHistory;

    const { fii, dii } = fiiDiiFlow || {};
    
    // We want to combine the segments into a single chart format
    // Keys might be "NSE_EQ|CASH" or "INDEX_FUTURES"
    const formatSegmentName = (key) => {
        if (key.includes('CASH') || key === 'CASH') return 'Cash';
        if (key.includes('INDEX_FUTURES')) return 'Idx Fut';
        if (key.includes('STOCK_FUTURES')) return 'Stk Fut';
        if (key.includes('INDEX_OPTIONS')) return 'Idx Opt';
        if (key.includes('STOCK_OPTIONS')) return 'Stk Opt';
        return key.split('|').pop();
    };

    const segments = new Set([...Object.keys(fii || {}), ...Object.keys(dii || {})]);
    
    const chartData = Array.from(segments).map(seg => {
        const fNet = fii?.[seg]?.net || 0;
        const dNet = dii?.[seg]?.net; // undefined if not present
        return {
            name: formatSegmentName(seg),
            fii: fNet !== 0 ? fNet : null,
            dii: (dNet !== 0 && dNet !== undefined) ? dNet : null,
            originalFii: fNet,
            originalDii: dNet || 0,
            hasDii: dNet !== undefined,
            net: fNet + (dNet || 0),
            originalKey: seg
        };
    }).sort((a, b) => {
        const order = ['Cash', 'Idx Fut', 'Idx Opt', 'Stk Fut', 'Stk Opt'];
        const idxA = order.indexOf(a.name);
        const idxB = order.indexOf(b.name);
        return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
    });
    
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-[#0f1219]/95 border border-[#ffffff20] p-3 rounded-xl shadow-2xl text-[11px] backdrop-blur-md z-50 min-w-[130px]">
                    <p className="font-bold mb-2 text-white border-b border-[#ffffff15] pb-2 uppercase tracking-wider">{data.name}</p>
                    <div className="flex flex-col gap-1.5 mt-2">
                        <div className="flex justify-between items-center gap-4">
                            <span className="text-text-tertiary">FII:</span> 
                            <span className={`font-medium ${data.originalFii > 0 ? 'text-[#10b981]' : data.originalFii < 0 ? 'text-[#ef4444]' : 'text-text-secondary'}`}>
                                ₹{data.originalFii.toFixed(2)} Cr
                            </span>
                        </div>
                        {data.hasDii && (
                            <>
                                <div className="flex justify-between items-center gap-4">
                                    <span className="text-text-tertiary">DII:</span> 
                                    <span className={`font-medium ${data.originalDii > 0 ? 'text-[#10b981]' : data.originalDii < 0 ? 'text-[#ef4444]' : 'text-text-secondary'}`}>
                                        ₹{data.originalDii.toFixed(2)} Cr
                                    </span>
                                </div>
                                <div className="mt-1 pt-1.5 border-t border-[#ffffff15] flex justify-between items-center gap-4">
                                    <span className="text-text-secondary font-semibold">Net:</span>
                                    <span className={`font-bold ${data.net > 0 ? 'text-[#10b981]' : data.net < 0 ? 'text-[#ef4444]' : 'text-text-secondary'}`}>
                                        ₹{data.net.toFixed(2)} Cr
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-background-card border border-border-default rounded-xl p-4 flex flex-col h-full shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="shrink-0">
                    <h3 className="text-[13px] font-bold text-text-primary uppercase tracking-wide">Institutional Flow</h3>
                    <p className="text-[11px] text-text-secondary mt-1">FII / DII Segmented (₹ Cr)</p>
                </div>
                
                {/* History Navigation */}
                <div className="flex items-center bg-[#ffffff08] rounded-md border border-[#ffffff10] px-1 mx-2">
                    <button 
                        onClick={() => setHistoryOffset(prev => prev + 1)}
                        className="p-0.5 hover:bg-white/10 rounded-sm text-text-tertiary hover:text-white transition-colors"
                        title="Previous Day"
                    >
                        <ChevronLeft className="w-3 h-3" />
                    </button>
                    <span className="text-[9px] font-mono px-2 text-text-secondary w-20 text-center">
                        {fiiDiiFlow?.timestamp ? new Date(fiiDiiFlow.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'Live'}
                        {loadingHistory && '...'}
                    </span>
                    <button 
                        onClick={() => setHistoryOffset(prev => Math.max(0, prev - 1))}
                        disabled={historyOffset === 0}
                        className="p-0.5 hover:bg-white/10 rounded-sm text-text-tertiary hover:text-white transition-colors disabled:opacity-30"
                        title="Next Day"
                    >
                        <ChevronRight className="w-3 h-3" />
                    </button>
                </div>

                <div className="flex gap-3 shrink-0">
                    <span className="flex items-center gap-1.5 text-[10px] font-medium text-text-secondary">
                        <span className="w-2 h-2 rounded-sm bg-[#10b981] shadow-[0_0_5px_rgba(16,185,129,0.4)]"></span> Inflow
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] font-medium text-text-secondary">
                        <span className="w-2 h-2 rounded-sm bg-[#ef4444] shadow-[0_0_5px_rgba(239,68,68,0.4)]"></span> Outflow
                    </span>
                </div>
            </div>
            
            <div className="flex-1 min-h-[150px] w-full relative mt-2">
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div 
                            key="loader"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-0 flex items-center justify-center opacity-70"
                        >
                            <Loader size="sm" color="blue" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="chart"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.4 }}
                            className="w-full h-full"
                        >
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }} barGap={3}>
                                    <defs>
                                        <linearGradient id="fiiPos" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#10b981" stopOpacity={1}/>
                                            <stop offset="100%" stopColor="#047857" stopOpacity={0.7}/>
                                        </linearGradient>
                                        <linearGradient id="fiiNeg" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.7}/>
                                            <stop offset="100%" stopColor="#b91c1c" stopOpacity={1}/>
                                        </linearGradient>
                                        <linearGradient id="diiPos" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#34d399" stopOpacity={1}/>
                                            <stop offset="100%" stopColor="#059669" stopOpacity={0.6}/>
                                        </linearGradient>
                                        <linearGradient id="diiNeg" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#f87171" stopOpacity={0.6}/>
                                            <stop offset="100%" stopColor="#dc2626" stopOpacity={1}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="#ffffff0a" />
                                    <ReferenceLine y={0} stroke="#ffffff20" />
                                    
                                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#888', fontWeight: 500 }} axisLine={false} tickLine={false} dy={5} />
                                    <YAxis 
                                        tick={{ fontSize: 9, fill: '#666' }} 
                                        axisLine={false} 
                                        tickLine={false} 
                                        dx={-5}
                                        tickFormatter={(val) => {
                                            if (Math.abs(val) >= 1000) return `${(val / 1000).toFixed(1)}k`;
                                            return val;
                                        }}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff05', radius: 4 }} />
                                    <Bar dataKey="fii" radius={3} barSize={14} minPointSize={3} isAnimationActive={false}>
                                        {chartData.map((entry, index) => (
                                            <Cell 
                                                key={`cell-fii-${index}`} 
                                                fill={entry.fii === null ? 'transparent' : (entry.originalFii > 0 ? 'url(#fiiPos)' : 'url(#fiiNeg)')} 
                                            />
                                        ))}
                                    </Bar>
                                    <Bar dataKey="dii" radius={3} barSize={14} minPointSize={3} isAnimationActive={false}>
                                        {chartData.map((entry, index) => (
                                            <Cell 
                                                key={`cell-dii-${index}`} 
                                                fill={entry.dii === null ? 'transparent' : (entry.originalDii > 0 ? 'url(#diiPos)' : 'url(#diiNeg)')} 
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
});

export default FiiDiiFlow;
