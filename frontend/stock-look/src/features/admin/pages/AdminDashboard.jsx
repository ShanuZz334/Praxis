import React, { useState, useEffect } from "react";
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

// ============================================
// PROVIDER METADATA (Official APIs)
// ============================================
const PROVIDER_META = {
    // ---- Fundamentals & Market Data ----
    "FMP": { name: "Financial Modeling Prep", desc: "Detailed balance sheets & cash flow statements.", icon: Database },
    "TWELVEDATA": { name: "Twelve Data", desc: "International equity & ETF coverage.", icon: Globe },
    "ALPHAVANTAGE": { name: "Alpha Vantage", desc: "Advanced technical indicators & historical data.", icon: TrendingUp },
    "FINNHUB": { name: "Finnhub", desc: "Alternative data & sentiment analysis.", icon: Radar },
    "TIINGO": { name: "Tiingo", desc: "End-of-day prices & crypto feeds.", icon: Box },
    "IEXCLOUD": { name: "IEX Cloud", desc: "Institutional equity data & stats.", icon: Server },
    "YAHOO_FINANCE": { name: "Yahoo Finance API", desc: "Legacy pricing & volume fallback.", icon: BarChart3 },
    "SIMFIN": { name: "SimFin", desc: "Machine-readable fundamental data.", icon: FileText },
    "SEC_EDGAR": { name: "SEC EDGAR API", desc: "Official regulatory filings.", icon: Shield },

    // ---- Options & Derivatives ----
    "POLYGON": { name: "Polygon.io", desc: "Institutional-grade options chain data & NBBO.", icon: Layers },
    "ORATS": { name: "ORATS", desc: "Advanced options backtesting & implied volatility.", icon: Activity },
    "THETADATA": { name: "ThetaData", desc: "Tick-level historical options data.", icon: Database },
    "UNUSUAL_WHALES": { name: "Unusual Whales", desc: "Dark pool prints & options flow.", icon: Zap },
    "OPTIONMETRICS": { name: "OptionMetrics", desc: "Historical implied volatility surfaces.", icon: BarChart3 },

    // ---- Brokers & Execution ----
    "UPSTOX": { name: "Upstox", desc: "Primary Indian market data & order execution.", icon: ArrowRightLeft },
    "ZERODHA": { name: "Zerodha Kite", desc: "Indian market historical & live WebSocket.", icon: Briefcase },
    "ANGELONE": { name: "AngelOne SmartAPI", desc: "Trading execution & historical charting.", icon: ArrowRightLeft },
    "INTERACTIVE_BROKERS": { name: "Interactive Brokers", desc: "Global market access & portfolio.", icon: Globe },
    "CHARLES_SCHWAB": { name: "Charles Schwab", desc: "US Equities & Options routing.", icon: Briefcase },
    "ALPACA": { name: "Alpaca API", desc: "Algorithmic trading execution (US/Crypto).", icon: Cpu },

    // ---- Macro & Economic ----
    "FRED": { name: "FRED", desc: "Federal Reserve Economic Data.", icon: Activity },
    "WORLD_BANK": { name: "World Bank API", desc: "Global macro indicators & GDP.", icon: Globe },
    "OECD": { name: "OECD API", desc: "International economic statistics.", icon: BarChart3 },

    // ---- News & Sentiment ----
    "NEWSAPI": { name: "News API", desc: "Global financial news & event tracking.", icon: Newspaper },
    "BENZINGA": { name: "Benzinga Pro", desc: "Real-time financial news & squawk.", icon: Zap },
    "STOCKTWITS": { name: "StockTwits", desc: "Retail sentiment metrics & ticker volume.", icon: MessageCircle },
    "TWITTER": { name: "X (Twitter) API", desc: "Real-time social sentiment streams.", icon: MessageCircle },

    // ---- Alternative & Crypto ----
    "QUIVER_QUANT": { name: "Quiver Quant", desc: "Congress & Corporate insider trading.", icon: ShieldCheck },
    "GLASSNODE": { name: "Glassnode", desc: "Crypto on-chain analytics.", icon: Link },
    "COINGECKO": { name: "CoinGecko", desc: "Cryptocurrency pricing & market cap.", icon: Box },
};

// ============================================
// SCRAPER METADATA (Web Scrapers)
// ============================================
const SCRAPER_META = {
    "NSE_SCRAPER": { name: "NSE India Scraper", desc: "Live option chain & market breadth.", icon: Pickaxe },
    "BSE_SCRAPER": { name: "BSE India Scraper", desc: "Corporate announcements & delivery.", icon: Pickaxe },
    "INVESTING_COM": { name: "Investing.com", desc: "Global economic calendars & futures.", icon: Globe },
    "TRADINGVIEW": { name: "TradingView", desc: "Technical ideas & aggregated indicators.", icon: Activity },
    "SEC_CRAWLER": { name: "SEC Crawler", desc: "Automated 10-K/10-Q text extraction.", icon: Bot },
    "WSB_SCRAPER": { name: "WallStreetBets", desc: "Subreddit mentions & retail flow tracker.", icon: TerminalSquare },
    "GOOGLE_NEWS": { name: "Google News", desc: "Unofficial news aggregation fallback.", icon: Newspaper },
    "MONEYCONTROL": { name: "MoneyControl", desc: "Indian market news & bulk deals.", icon: FileText },
    "YAHOO_SCRAPER": { name: "Yahoo Options", desc: "Fallback options chain scraping.", icon: Layers },
    "FINVIZ": { name: "Finviz Scraper", desc: "Stock screener aggregates.", icon: Search },
};

const AdminDashboard = () => {
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [checking, setChecking] = useState(false);
    const [activeTab, setActiveTab] = useState("api"); // 'api' or 'scraper'
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState(null);

    const fetchProviderHealth = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get(API_PATHS.HEALTH.PROVIDERS);
            setProviders(res.data || []);
        } catch (err) {
            console.error("Failed to fetch provider health:", err);
            // Mock empty array on fail to allow rendering
            setProviders([]); 
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProviderHealth();
    }, []);

    const handleCheckConnection = async () => {
        setChecking(true);
        await fetchProviderHealth();
        // Simulate a tiny delay for visual feedback if response is too fast
        setTimeout(() => setChecking(false), 600);
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
                        Securely manage {Object.keys(PROVIDER_META).length} APIs and {Object.keys(SCRAPER_META).length} Scrapers
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
                {Object.entries(currentMeta).map(([key, meta]) => {
                    const healthData = providers.find(p => p.provider === key);
                    
                    return (
                        <div key={key} className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: `${Math.random() * 200}ms` }}>
                            <CredentialCard
                                providerKey={key}
                                meta={meta}
                                healthData={healthData}
                                onCheckConnection={handleCheckConnection}
                                checking={checking}
                                onConfigure={() => {
                                    setSelectedProvider(key);
                                    setIsModalOpen(true);
                                }}
                            />
                        </div>
                    );
                })}
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
