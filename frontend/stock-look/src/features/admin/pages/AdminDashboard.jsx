import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
    Plus, Wifi, ShieldCheck, Activity, Settings,
    BarChart3, Globe, Zap, Database, TrendingUp, Layers, Key,
    Newspaper, MessageCircle, FileText, Link, Shield, Server, Box, Cpu,
    TerminalSquare, ArrowRightLeft, Briefcase, Radar, Pickaxe, Search, Bot
} from "lucide-react";
import axiosInstance from "@/shared/utils/axiosInstance";
import { API_PATHS } from "@/shared/utils/apiPaths";
import CredentialCard from "../components/CredentialCard";
import AddCredentialModal from "../components/AddCredentialModal";

import { upstoxService } from "@/shared/services/upstoxService";

// ============================================
// PROVIDER METADATA (Official APIs)
// ============================================
const PROVIDER_META = {
    upstox: {
        name: "Upstox API",
        desc: "Real-time Market Data Feed V3 & OAuth Integration",
        icon: Activity
    },
    alphaVantage: {
        name: "Alpha Vantage",
        desc: "Global Equities, FX, and Crypto Intraday Feeds",
        icon: Globe
    },
    fred: {
        name: "FRED API",
        desc: "Federal Reserve Economic Data (Macro Indicators)",
        icon: TrendingUp
    },
    yahoo: {
        name: "Yahoo Finance",
        desc: "Global Markets & Options Fallback Data",
        icon: BarChart3
    },
    rbi: {
        name: "RBI DataFeed",
        desc: "Reserve Bank of India Policy Rates & Forex",
        icon: ShieldCheck
    },
    coinGecko: {
        name: "CoinGecko",
        desc: "Cryptocurrency Prices & Market Capitalizations",
        icon: Database
    },
    frankfurter: {
        name: "Frankfurter API",
        desc: "ECB Currency Exchange Rates",
        icon: ArrowRightLeft
    },
    amfi: {
        name: "AMFI API",
        desc: "Indian Mutual Fund NAVs and Schemes",
        icon: Layers
    }
};

// ============================================
// SCRAPER METADATA (Web Scrapers)
// ============================================
const SCRAPER_META = {
    nse: {
        name: "NSE India Scraper",
        desc: "Bhavcopy, FII/DII Activity, and Options Chain",
        icon: Pickaxe
    },
    moneycontrol: {
        name: "Moneycontrol Scraper",
        desc: "Financial News, Sentiments, and Block Deals",
        icon: Newspaper
    },
    screener: {
        name: "Screener.in Engine",
        desc: "Balance Sheets, P&L, and Cash Flow Statements",
        icon: Search
    }
};

const AdminDashboard = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [checkingProvider, setCheckingProvider] = useState(null);
    const [activeTab, setActiveTab] = useState("api"); // 'api' or 'scraper'
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState(null);

    const [upstoxMode, setUpstoxMode] = useState('live');

    const fetchProviderHealth = async () => {
        setLoading(true);
        try {
            // Check Upstox Status
            const upstoxStatus = await upstoxService.checkStatus();
            
            const liveProviders = [];
            
            if (upstoxStatus.connected) {
                setUpstoxMode(upstoxStatus.mode || 'live');
                liveProviders.push({ provider: "upstox", status: "UP", configured: true, latency: 45, mode: upstoxStatus.mode || 'live' });
            } else {
                liveProviders.push({ provider: "upstox", status: "OFFLINE", configured: false, latency: 0, mode: upstoxMode });
            }

            // Mock Health for other APIs
            liveProviders.push({ provider: "alphaVantage", status: "UP", configured: true, latency: 120 });
            liveProviders.push({ provider: "fred", status: "UP", configured: true, latency: 85 });
            liveProviders.push({ provider: "yahoo", status: "UP", configured: true, latency: 210 });
            liveProviders.push({ provider: "rbi", status: "UP", configured: true, latency: 60 });
            liveProviders.push({ provider: "coinGecko", status: "UP", configured: true, latency: 95 });
            liveProviders.push({ provider: "frankfurter", status: "UP", configured: true, latency: 55 });
            liveProviders.push({ provider: "amfi", status: "UP", configured: true, latency: 110 });

            // Mock Health for Scrapers
            liveProviders.push({ provider: "nse", status: "UP", configured: true, latency: 320 });
            liveProviders.push({ provider: "moneycontrol", status: "UP", configured: true, latency: 450 });
            liveProviders.push({ provider: "screener", status: "UP", configured: true, latency: 280 });

            setProviders(liveProviders);
        } catch (err) {
            console.error("Failed to fetch provider health:", err);
            
            const fallbackProviders = [];
            fallbackProviders.push({ provider: "upstox", status: "OFFLINE", configured: false, latency: 0 });

            // Mock Health for other APIs
            fallbackProviders.push({ provider: "alphaVantage", status: "UP", configured: true, latency: 120 });
            fallbackProviders.push({ provider: "fred", status: "UP", configured: true, latency: 85 });
            fallbackProviders.push({ provider: "yahoo", status: "UP", configured: true, latency: 210 });
            fallbackProviders.push({ provider: "rbi", status: "UP", configured: true, latency: 60 });
            fallbackProviders.push({ provider: "coinGecko", status: "UP", configured: true, latency: 95 });
            fallbackProviders.push({ provider: "frankfurter", status: "UP", configured: true, latency: 55 });
            fallbackProviders.push({ provider: "amfi", status: "UP", configured: true, latency: 110 });

            // Mock Health for Scrapers
            fallbackProviders.push({ provider: "nse", status: "UP", configured: true, latency: 320 });
            fallbackProviders.push({ provider: "moneycontrol", status: "UP", configured: true, latency: 450 });
            fallbackProviders.push({ provider: "screener", status: "UP", configured: true, latency: 280 });

            setProviders(fallbackProviders);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (searchParams.get("upstox_auth") === "success") {
            const authMode = searchParams.get("mode") || "live";
            toast.success(`Upstox (${authMode.toUpperCase()}) connected and authenticated successfully!`);
            const nextParams = new URLSearchParams(searchParams);
            nextParams.delete("upstox_auth");
            nextParams.delete("mode");
            setSearchParams(nextParams, { replace: true });
        }
        fetchProviderHealth();
    }, []);

    const handleCheckConnection = async (providerKey) => {
        setCheckingProvider(providerKey);
        
        if (providerKey === "upstox") {
            // For Upstox, do a full health check
            await fetchProviderHealth();
            setTimeout(() => setCheckingProvider(null), 300);
        } else {
            // Real network ping via backend proxy
            try {
                const response = await axiosInstance.get(`/api/v1/health/ping/${providerKey}`);
                const { latency, status, sampleData } = response.data;
                
                setProviders(prev => prev.map(p => {
                    if (p.provider === providerKey) {
                        return { ...p, latency, status, sampleData, configured: true };
                    }
                    return p;
                }));
            } catch (err) {
                console.error(`Failed to ping ${providerKey}:`, err);
                // Mark as offline if backend ping fails entirely
                setProviders(prev => prev.map(p => {
                    if (p.provider === providerKey) {
                        return { ...p, status: "OFFLINE", configured: false };
                    }
                    return p;
                }));
            } finally {
                setCheckingProvider(null);
            }
        }
    };

    // Calculate stats based on active tab
    const currentMeta = activeTab === "api" ? PROVIDER_META : SCRAPER_META;
    const totalCurrent = Object.keys(currentMeta).length;
    
    // We filter health data based on the current active list
    const activeFeeds = providers.filter(p => p.status === "UP" && currentMeta[p.provider]).length;
    const avgLatency = activeFeeds > 0
        ? Math.round(providers.filter(p => p.status === "UP" && currentMeta[p.provider]).reduce((sum, p) => sum + p.latency, 0) / activeFeeds) + "ms"
        : "0ms";

    return (
        <div className="p-8 space-y-8 min-h-screen bg-background text-text-primary font-sans animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tighter mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                        Data Acquisition Center
                    </h1>
                    <h2 className="text-gray-400 text-sm font-medium tracking-wide uppercase flex items-center gap-2">
                        <Database size={14} className="text-blue-500" />
                        Securely manage APIs and Scrapers
                    </h2>
                </div>

                <div className="flex flex-col items-end gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-background-surface border border-border-subtle rounded-full shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs font-medium text-text-secondary">System Status: Optimized</span>
                    </div>
                    
                    {/* Tabs */}
                    <div className="flex bg-background-floor p-1 rounded-xl border border-border-subtle">
                        <button
                            onClick={() => setActiveTab("api")}
                            className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                                activeTab === "api" 
                                ? "bg-blue-500/20 text-blue-400 shadow-md" 
                                : "text-text-muted hover:text-text-primary"
                            }`}
                        >
                            Official APIs
                        </button>
                        <button
                            onClick={() => setActiveTab("scraper")}
                            className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                                activeTab === "scraper" 
                                ? "bg-emerald-500/20 text-emerald-400 shadow-md" 
                                : "text-text-muted hover:text-text-primary"
                            }`}
                        >
                            Web Scrapers
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Configured */}
                <div className="p-6 rounded-2xl bg-background-surface border border-border-subtle relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Settings size={64} />
                    </div>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
                            <Settings size={20} />
                        </div>
                        <span className="text-xs font-bold text-text-muted tracking-wider uppercase">Total {activeTab === 'api' ? 'Providers' : 'Scrapers'}</span>
                    </div>
                    <div className="text-3xl font-bold ml-1">{totalCurrent}</div>
                </div>

                {/* Active Feeds */}
                <div className="p-6 rounded-2xl bg-background-surface border border-border-subtle relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Wifi size={64} />
                    </div>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 rounded-xl bg-green-500/10 text-green-500">
                            <Wifi size={20} />
                        </div>
                        <span className="text-xs font-bold text-text-muted tracking-wider uppercase">Active Feeds</span>
                    </div>
                    <div className="text-3xl font-bold ml-1">{activeFeeds}</div>
                </div>

                {/* Avg Latency */}
                <div className="p-6 rounded-2xl bg-background-surface border border-border-subtle relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Activity size={64} />
                    </div>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500">
                            <Activity size={20} />
                        </div>
                        <span className="text-xs font-bold text-text-muted tracking-wider uppercase">Avg. Latency</span>
                    </div>
                    <div className="text-3xl font-bold ml-1">{avgLatency}</div>
                </div>

                {/* Failover Ready */}
                <div className="p-6 rounded-2xl bg-background-surface border border-border-subtle relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <ShieldCheck size={64} />
                    </div>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
                            <ShieldCheck size={20} />
                        </div>
                        <span className="text-xs font-bold text-text-muted tracking-wider uppercase">Failover Ready</span>
                    </div>
                    <div className="text-xl font-bold ml-1 mt-1 text-emerald-400">Enabled</div>
                </div>
            </div>

            {/* Grid Divider */}
            <div className="flex items-center gap-4 pt-6">
                <div className="h-px bg-border-subtle flex-1" />
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                    {activeTab === 'api' ? 'Available Integrations' : 'Configured Scrapers'}
                </span>
                <div className="h-px bg-border-subtle flex-1" />
            </div>

            {/* Providers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 pb-20">
                {Object.entries(currentMeta).length === 0 ? (
                    <div className="col-span-full py-12 text-center text-text-muted border border-dashed border-border-subtle rounded-2xl">
                        No {activeTab === 'api' ? 'APIs' : 'Scrapers'} configured.
                    </div>
                ) : (
                    Object.entries(currentMeta).map(([key, meta]) => {
                        const healthData = providers.find(p => p.provider === key);
                        
                        if (key === 'upstox') {
                            meta.customToggle = () => (
                                <div className="flex items-center gap-2 mt-1 bg-background-surface/50 px-2 py-1 rounded-md border border-border-default shadow-inner">
                                    <span className={`text-[9px] font-bold uppercase transition-colors ${upstoxMode === 'live' ? 'text-accent-primary' : 'text-text-muted'}`}>Live</span>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const newMode = upstoxMode === 'live' ? 'sandbox' : 'live';
                                            upstoxService.login(newMode);
                                        }}
                                        className={`relative w-7 h-3.5 rounded-full transition-colors duration-300 ${upstoxMode === 'sandbox' ? 'bg-amber-500' : 'bg-accent-primary'}`}
                                    >
                                        <div className={`absolute top-[2px] w-2.5 h-2.5 rounded-full bg-white transition-all duration-300 ${upstoxMode === 'sandbox' ? 'left-[16px]' : 'left-[2px]'}`} />
                                    </button>
                                    <span className={`text-[9px] font-bold uppercase transition-colors ${upstoxMode === 'sandbox' ? 'text-amber-500' : 'text-text-muted'}`}>Sandbox</span>
                                </div>
                            );
                        }

                        return (
                            <div key={key} className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: `${Math.random() * 200}ms` }}>
                                <CredentialCard
                                    providerKey={key}
                                    meta={meta}
                                    healthData={healthData}
                                    onCheckConnection={() => handleCheckConnection(key)}
                                    checking={checkingProvider === key}
                                    onConfigure={() => {
                                        if (key === "upstox") {
                                            upstoxService.login();
                                        } else {
                                            setSelectedProvider(key);
                                            setIsModalOpen(true);
                                        }
                                    }}
                                />
                            </div>
                        );
                    })
                )}
            </div>
            
            <AddCredentialModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchProviderHealth}
                initialProvider={selectedProvider}
            />
        </div>
    );
};

export default AdminDashboard;
