import React, { useState, useEffect } from 'react';
import { useDashboardContext } from '@/shared/context/DashboardContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import axiosInstance from '@/shared/utils/axiosInstance';

export default function FiiDiiFlow() {
    const { fiiDiiFlow: liveFiiDiiFlow } = useDashboardContext();
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

    
    if (!fiiDiiFlow) {
        return (
            <div className="bg-background-card border border-border-default rounded-xl p-4 flex flex-col h-full opacity-50">
                <h3 className="text-[13px] font-bold text-text-primary uppercase tracking-wide mb-1">Institutional Flow</h3>
                <p className="text-[11px] text-text-secondary">Waiting for socket data...</p>
            </div>
        );
    }

    const { fii, dii } = fiiDiiFlow;
    
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
            fii: fNet,
            dii: dNet || 0,
            hasDii: dNet !== undefined,
            net: fNet + (dNet || 0),
            originalKey: seg
        };
    }).sort((a, b) => b.net - a.net); // sort by biggest absolute flow? let's just sort by name or keep default
    
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-[#0f1219] border border-border-default p-3 rounded-lg shadow-2xl text-[11px] backdrop-blur-md z-50">
                    <p className="font-bold mb-2 text-text-primary border-b border-border-default pb-1">{payload[0].payload.name}</p>
                    <p className="text-text-secondary flex justify-between gap-4">
                        <span>FII:</span> 
                        <span className={payload[0].payload.fii > 0 ? 'text-emerald-400' : 'text-rose-400'}>₹{payload[0].payload.fii.toFixed(2)} Cr</span>
                    </p>
                    {payload[0].payload.hasDii && (
                        <>
                            <p className="text-text-secondary flex justify-between gap-4">
                                <span>DII:</span> 
                                <span className={payload[0].payload.dii > 0 ? 'text-emerald-400' : 'text-rose-400'}>₹{payload[0].payload.dii.toFixed(2)} Cr</span>
                            </p>
                            <p className="font-bold mt-2 pt-1 border-t border-border-default flex justify-between gap-4 text-text-primary">
                                <span>Net:</span>
                                <span className={payload[0].payload.net > 0 ? 'text-emerald-500' : 'text-rose-500'}>₹{payload[0].payload.net.toFixed(2)} Cr</span>
                            </p>
                        </>
                    )}
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
                <div className="flex items-center bg-[#ffffff05] rounded-md border border-white/10 px-1 mx-2">
                    <button 
                        onClick={() => setHistoryOffset(prev => prev + 1)}
                        className="p-0.5 hover:bg-white/10 rounded-sm text-text-tertiary hover:text-text-primary transition-colors"
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
                        className="p-0.5 hover:bg-white/10 rounded-sm text-text-tertiary hover:text-text-primary transition-colors disabled:opacity-30"
                        title="Next Day"
                    >
                        <ChevronRight className="w-3 h-3" />
                    </button>
                </div>

                <div className="flex gap-3 shrink-0">
                    <span className="flex items-center gap-1 text-[10px] text-text-tertiary">
                        <span className="w-2 h-2 rounded-sm bg-green-500"></span> Inflow
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-text-tertiary">
                        <span className="w-2 h-2 rounded-sm bg-red-500"></span> Outflow
                    </span>
                </div>
            </div>
            
            <div className="flex-1 min-h-[150px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                        <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#888' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 9, fill: '#888' }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff05' }} />
                        <Bar dataKey="fii" radius={[2, 2, 0, 0]} barSize={16}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-fii-${index}`} fill={entry.fii > 0 ? '#22c55e' : '#ef4444'} />
                            ))}
                        </Bar>
                        <Bar dataKey="dii" radius={[2, 2, 0, 0]} barSize={16}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-dii-${index}`} fill={entry.dii > 0 ? '#16a34a' : '#dc2626'} opacity={0.8} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
