import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/shared/context/ThemeContext';
import { 
    MessageSquare, 
    ChevronDown, 
    ChevronRight, 
    LayoutDashboard,
    TrendingUp,
    LineChart,
    CandlestickChart,
    Calendar,
    Globe,
    X,
    LayoutTemplate,
    Layers,
    MessageCircle,
    Plus,
    Trash2
} from 'lucide-react';

import paiLogoLight from '@/assets/images/pai 2-bgless.png';
import paiLogoDark from '@/assets/images/pai 3-bgless.png';

const INITIAL_SECTIONS = [
    {
        id: 'assistant',
        label: 'Assistant',
        icon: MessageSquare,
        subSections: [
            {
                id: 'assist_general',
                label: 'General',
                chats: [
                    { id: 'assist_global', title: 'Global Chat', type: 'manual' }
                ]
            }
        ]
    },
    {
        id: 'master',
        label: 'Master Dashboard',
        icon: LayoutDashboard,
        subSections: [
            {
                id: 'master_general',
                label: 'General',
                chats: [
                    { id: 'master_header', title: 'Page Header Insight', type: 'header' },
                    { id: 'master_manual', title: 'Manual Chat', type: 'manual' }
                ]
            },
            {
                id: 'master_widgets',
                label: 'Widgets',
                chats: [
                    { id: 'market_heatmap', title: 'Market Heatmap', type: 'card' },
                    { id: 'fii_dii_flow_master', title: 'FII/DII Flow', type: 'card' },
                    { id: 'options_pulse', title: 'Options Pulse', type: 'card' },
                    { id: 'sector_rotation', title: 'Sector Rotation', type: 'card' },
                    { id: 'volume_shockers', title: 'Volume Shockers', type: 'card' },
                    { id: 'catalyst_calendar', title: 'Catalyst Calendar', type: 'card' }
                ]
            }
        ]
    },
    {
        id: 'fundamental',
        label: 'Fundamental',
        icon: TrendingUp,
        subSections: [
            {
                id: 'fund_general',
                label: 'General',
                chats: [
                    { id: 'fundamentals_index_header', title: 'Index Header Insight', type: 'header' },
                    { id: 'fundamentals_company_header', title: 'Company Header Insight', type: 'header' },
                    { id: 'fund_manual', title: 'Manual Chat', type: 'manual' }
                ]
            },
            {
                id: 'fundamental_valuation',
                label: 'Valuation',
                chats: [
                    { id: 'pe_ratio', title: 'P/E Ratio', type: 'card' },
                    { id: 'forward_pe', title: 'Forward P/E', type: 'card' },
                    { id: 'pb_ratio', title: 'P/B Ratio', type: 'card' },
                    { id: 'ev_ebitda', title: 'EV/EBITDA', type: 'card' },
                    { id: 'earnings_yield', title: 'Earnings Yield', type: 'card' },
                    { id: 'relative_valuation', title: 'Relative Valuation', type: 'card' },
                    { id: 'dividend_yield', title: 'Dividend Yield', type: 'card' },
                    { id: 'nifty_pe', title: 'Nifty P/E', type: 'card' },
                    { id: 'nifty_pb', title: 'Nifty P/B', type: 'card' },
                    { id: 'mcap_gdp', title: 'MCap/GDP (Buffett)', type: 'card' }
                ]
            },
            {
                id: 'fundamental_earnings',
                label: 'Earnings',
                chats: [
                    { id: 'eps_growth', title: 'EPS Growth', type: 'card' },
                    { id: 'revenue_growth', title: 'Revenue Growth', type: 'card' },
                    { id: 'profit_growth', title: 'Profit Growth', type: 'card' },
                    { id: 'earnings_trend', title: 'Earnings Trend', type: 'card' },
                    { id: 'earnings_quality', title: 'Earnings Quality', type: 'card' },
                    { id: 'eps_yoy', title: 'EPS YoY', type: 'card' },
                    { id: 'forward_eps', title: 'Forward EPS', type: 'card' },
                    { id: 'profit_margin', title: 'Profit Margin', type: 'card' }
                ]
            },
            {
                id: 'fundamental_corporate',
                label: 'Corporate',
                chats: [
                    { id: 'roe', title: 'ROE', type: 'card' },
                    { id: 'roce', title: 'ROCE', type: 'card' },
                    { id: 'roa', title: 'ROA', type: 'card' },
                    { id: 'net_margin', title: 'Net Margin', type: 'card' },
                    { id: 'operating_margin', title: 'Operating Margin', type: 'card' },
                    { id: 'debt_to_equity', title: 'Debt to Equity', type: 'card' },
                    { id: 'interest_coverage', title: 'Interest Coverage', type: 'card' },
                    { id: 'free_cash_flow', title: 'Free Cash Flow', type: 'card' },
                    { id: 'current_ratio', title: 'Current Ratio', type: 'card' },
                    { id: 'credit_growth', title: 'Credit Growth', type: 'card' },
                    { id: 'corp_debt', title: 'Corporate Debt', type: 'card' }
                ]
            },
            {
                id: 'fundamental_ownership___flow',
                label: 'Ownership & Flow',
                chats: [
                    { id: 'promoter_holding', title: 'Promoter Holding', type: 'card' },
                    { id: 'smart_money_flow', title: 'Smart Money Flow', type: 'card' },
                    { id: 'fii_dii_flow', title: 'FII/DII Flow', type: 'card' }
                ]
            },
            {
                id: 'fundamental_macro',
                label: 'Macro',
                chats: [
                    { id: 'gdp_growth', title: 'GDP Growth', type: 'card' },
                    { id: 'gdp', title: 'GDP', type: 'card' },
                    { id: 'cpi', title: 'CPI', type: 'card' },
                    { id: 'repo', title: 'Repo Rate', type: 'card' },
                    { id: 'fiscal_deficit', title: 'Fiscal Deficit', type: 'card' }
                ]
            },
            {
                id: 'fundamental_liquidity',
                label: 'Liquidity',
                chats: [
                    { id: 'fii', title: 'FII', type: 'card' },
                    { id: 'dii', title: 'DII', type: 'card' },
                    { id: 'fii_trend', title: 'FII Trend', type: 'card' },
                    { id: 'system_liquidity', title: 'System Liquidity', type: 'card' },
                    { id: 'mf_flows', title: 'MF Flows', type: 'card' },
                    { id: 'advance_decline', title: 'Advance/Decline', type: 'card' }
                ]
            },
            {
                id: 'fundamental_risk',
                label: 'Risk',
                chats: [
                    { id: 'policy_tailwinds', title: 'Policy Tailwinds', type: 'card' },
                    { id: 'sovereign_risk', title: 'Sovereign Risk', type: 'card' },
                    { id: 'npa', title: 'NPA', type: 'card' },
                    { id: 'reform_momentum', title: 'Reform Momentum', type: 'card' },
                    { id: 'india_vix', title: 'India VIX', type: 'card' }
                ]
            },
            {
                id: 'fundamental_global',
                label: 'Global',
                chats: [
                    { id: 'crude', title: 'Crude Oil', type: 'card' },
                    { id: 'global_liq', title: 'Global Liquidity', type: 'card' }
                ]
            },
            {
                id: 'fundamental_general',
                label: 'General',
                chats: [
                    { id: 'peer_comparison', title: 'Peer Comparison', type: 'card' },
                    { id: 'analyst_consensus', title: 'Analyst Consensus', type: 'card' },
                    { id: 'corporate_actions', title: 'Corporate Actions', type: 'card' },
                    { id: 'cash_conversion', title: 'Cash Conversion Cycle', type: 'card' },
                    { id: 'credit_rating', title: 'Credit Rating', type: 'card' },
                    { id: 'sector_dashboard', title: 'Sector Dashboard', type: 'card' }
                ]
            }
        ]
    },
    {
        id: 'technical',
        label: 'Technical',
        icon: LineChart,
        subSections: [
            {
                id: 'tech_general',
                label: 'General',
                chats: [
                    { id: 'technical_index_header', title: 'Index Header Insight', type: 'header' },
                    { id: 'technical_company_header', title: 'Company Header Insight', type: 'header' },
                    { id: 'tech_manual', title: 'Manual Chat', type: 'manual' }
                ]
            },
            {
                id: 'technical_momentum',
                label: 'Momentum',
                chats: [
                    { id: 'rsi', title: 'RSI', type: 'card' },
                    { id: 'macd', title: 'MACD', type: 'card' },
                    { id: 'stoch_rsi', title: 'Stoch RSI', type: 'card' },
                    { id: 'williams_r', title: 'Williams %R', type: 'card' }
                ]
            },
            {
                id: 'technical_volatility',
                label: 'Volatility',
                chats: [
                    { id: 'bb_20_2', title: 'Bollinger Bands', type: 'card' },
                    { id: 'atr', title: 'ATR', type: 'card' },
                    { id: 'kc', title: 'Keltner Channel', type: 'card' }
                ]
            },
            {
                id: 'technical_trend',
                label: 'Trend',
                chats: [
                    { id: 'ema_20', title: 'EMA 20', type: 'card' },
                    { id: 'ema_50', title: 'EMA 50', type: 'card' },
                    { id: 'ema_200', title: 'EMA 200', type: 'card' },
                    { id: 'sma_50', title: 'SMA 50', type: 'card' },
                    { id: 'sma_200', title: 'SMA 200', type: 'card' },
                    { id: 'adx', title: 'ADX', type: 'card' },
                    { id: 'supertrend', title: 'Supertrend', type: 'card' }
                ]
            },
            {
                id: 'technical_volume',
                label: 'Volume',
                chats: [
                    { id: 'cmf', title: 'CMF', type: 'card' },
                    { id: 'volume_sma', title: 'Volume SMA', type: 'card' },
                    { id: 'obv', title: 'OBV', type: 'card' },
                    { id: 'vwap', title: 'VWAP', type: 'card' }
                ]
            },
            {
                id: 'technical_structure',
                label: 'Structure',
                chats: [
                    { id: 'support', title: 'Support', type: 'card' },
                    { id: 'resistance', title: 'Resistance', type: 'card' },
                    { id: 'trendline', title: 'Trendline', type: 'card' },
                    { id: 'pivot', title: 'Pivot Points', type: 'card' },
                    { id: 'fibonacci', title: 'Fibonacci', type: 'card' }
                ]
            },
            {
                id: 'technical_breadth',
                label: 'Breadth',
                chats: [
                    { id: 'ad_line', title: 'A/D Line', type: 'card' },
                    { id: 'nh_nl', title: 'New Highs / New Lows', type: 'card' },
                    { id: 'breadth_ratio', title: 'Breadth Ratio', type: 'card' },
                    { id: 'trin', title: 'TRIN', type: 'card' },
                    { id: 'mcclellan', title: 'McClellan Oscillator', type: 'card' }
                ]
            },
            {
                id: 'technical_general',
                label: 'General',
                chats: [
                    { id: 'beta_correlation', title: 'Beta Correlation', type: 'card' }
                ]
            }
        ]
    },
    {
        id: 'options',
        label: 'Options',
        icon: CandlestickChart,
        subSections: [
            {
                id: 'opt_general',
                label: 'General',
                chats: [
                    { id: 'options_header', title: 'Page Header Insight', type: 'header' },
                    { id: 'opt_manual', title: 'Manual Chat', type: 'manual' }
                ]
            },
            {
                id: 'options_volatility',
                label: 'Volatility',
                chats: [
                    { id: 'atm_iv', title: 'ATM IV', type: 'card' },
                    { id: 'iv_rank', title: 'IV Rank', type: 'card' },
                    { id: 'iv_percentile', title: 'IV Percentile', type: 'card' }
                ]
            },
            {
                id: 'options_open_interest',
                label: 'Open Interest',
                chats: [
                    { id: 'total_call_oi', title: 'Total Call OI', type: 'card' },
                    { id: 'total_put_oi', title: 'Total Put OI', type: 'card' },
                    { id: 'oi_change', title: 'OI Change', type: 'card' }
                ]
            },
            {
                id: 'options_greeks',
                label: 'Greeks',
                chats: [
                    { id: 'delta', title: 'Delta', type: 'card' },
                    { id: 'gamma', title: 'Gamma', type: 'card' },
                    { id: 'theta', title: 'Theta', type: 'card' },
                    { id: 'vega', title: 'Vega', type: 'card' }
                ]
            },
            {
                id: 'options_put_call_ratio',
                label: 'Put-Call Ratio',
                chats: [
                    { id: 'pcr_oi', title: 'PCR OI', type: 'card' },
                    { id: 'pcr_volume', title: 'PCR Volume', type: 'card' }
                ]
            },
            {
                id: 'options_market_positioning',
                label: 'Market Positioning',
                chats: [
                    { id: 'max_pain', title: 'Max Pain', type: 'card' }
                ]
            },
            {
                id: 'options_general',
                label: 'General',
                chats: [
                    { id: 'fno_ban', title: 'F&O Ban Status', type: 'card' }
                ]
            }
        ]
    },
    {
        id: 'events',
        label: 'Events',
        icon: Calendar,
        subSections: [
            {
                id: 'events_general',
                label: 'General',
                chats: [
                    { id: 'events_header', title: 'Page Header Insight', type: 'header' },
                    { id: 'events_manual', title: 'Manual Chat', type: 'manual' }
                ]
            }
        ]
    },
    {
        id: 'global',
        label: 'Global Macro',
        icon: Globe,
        subSections: [
            {
                id: 'glob_general',
                label: 'General',
                chats: [
                    { id: 'foreign_header', title: 'Page Header Insight', type: 'header' },
                    { id: 'glob_manual', title: 'Manual Chat', type: 'manual' }
                ]
            },
            {
                id: 'foreign_us_markets',
                label: 'US Markets',
                chats: [
                    { id: 'sp_futures', title: 'S&P 500', type: 'card' },
                    { id: 'nasdaq_futures', title: 'Nasdaq 100', type: 'card' },
                    { id: 'dow_futures', title: 'Dow Futures', type: 'card' }
                ]
            },
            {
                id: 'foreign_currency',
                label: 'Currency',
                chats: [
                    { id: 'dxy', title: 'Dollar Index (DXY)', type: 'card' },
                    { id: 'usd_inr', title: 'USD/INR', type: 'card' },
                    { id: 'eurusd', title: 'EUR/USD', type: 'card' },
                    { id: 'usdjpy', title: 'USD/JPY', type: 'card' }
                ]
            },
            {
                id: 'foreign_rates___volatility',
                label: 'Rates & Volatility',
                chats: [
                    { id: 'us_10y_yield', title: 'US 10Y Yield', type: 'card' },
                    { id: 'vix_global', title: 'VIX (CBOE)', type: 'card' },
                    { id: 'move', title: 'MOVE Index', type: 'card' }
                ]
            },
            {
                id: 'foreign_commodities',
                label: 'Commodities',
                chats: [
                    { id: 'brent_crude_oil', title: 'Brent Crude Oil', type: 'card' },
                    { id: 'gold', title: 'Gold', type: 'card' },
                    { id: 'silver', title: 'Silver', type: 'card' },
                    { id: 'copper', title: 'Copper', type: 'card' },
                    { id: 'natgas', title: 'Natural Gas', type: 'card' },
                    { id: 'wheat', title: 'Wheat', type: 'card' },
                    { id: 'aluminum', title: 'Aluminum', type: 'card' }
                ]
            },
            {
                id: 'foreign_digital_assets',
                label: 'Digital Assets',
                chats: [
                    { id: 'bitcoin', title: 'Bitcoin', type: 'card' }
                ]
            },
            {
                id: 'foreign_global_indices',
                label: 'Global Indices',
                chats: [
                    { id: 'nikkei', title: 'Nikkei 225', type: 'card' },
                    { id: 'ftse', title: 'FTSE 100', type: 'card' },
                    { id: 'dax', title: 'DAX 40', type: 'card' },
                    { id: 'hangseng', title: 'Hang Seng', type: 'card' },
                    { id: 'shanghai', title: 'Shanghai Composite', type: 'card' },
                    { id: 'cac40', title: 'CAC 40', type: 'card' },
                    { id: 'eurostoxx', title: 'Euro Stoxx 50', type: 'card' }
                ]
            }
        ]
    }
];

export default function PaiSidebar({ activeChatId, onSelectChat }) {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const [sections, setSections] = useState(INITIAL_SECTIONS);
    const [chatToDelete, setChatToDelete] = useState(null); // { sectionId, subSectionId, chat }
    
    // Default open pages
    const [openSections, setOpenSections] = useState(
        INITIAL_SECTIONS.reduce((acc, section) => ({ ...acc, [section.id]: true }), {})
    );

    // Default closed subSections
    const [openSubSections, setOpenSubSections] = useState({});

    const toggleSection = (id) => {
        setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const toggleSubSection = (id) => {
        setOpenSubSections(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleAddSubChat = (sectionId, subSectionId, baseChat) => {
        setSections(prev => prev.map(section => {
            if (section.id !== sectionId) return section;
            
            const newSubSections = section.subSections.map(subSection => {
                if (subSection.id !== subSectionId) return subSection;

                // Extract original base title by stripping existing numbers if any (e.g., "PE Ratio 1" -> "PE Ratio")
                const baseTitleMatch = baseChat.title.match(/^(.*?)( \d+)?$/);
                const pureBaseTitle = baseTitleMatch ? baseTitleMatch[1] : baseChat.title;

                const subChats = subSection.chats.filter(c => c.title.startsWith(pureBaseTitle));
                const nextNumber = subChats.length; 
                
                const newChat = {
                    id: `${baseChat.id}_${Date.now()}`,
                    title: `${pureBaseTitle} ${nextNumber}`,
                    type: baseChat.type,
                    isSubChat: true
                };

                const lastIndex = subSection.chats.findLastIndex(c => c.title.startsWith(pureBaseTitle));
                const newChats = [...subSection.chats];
                newChats.splice(lastIndex > -1 ? lastIndex + 1 : newChats.length, 0, newChat);

                return { ...subSection, chats: newChats };
            });

            return { ...section, subSections: newSubSections };
        }));
    };

    return (
        <div className="w-56 h-full bg-background-card border-r border-border-default/40 flex flex-col shrink-0">
            {/* Header & Close Button Area */}
            <div className="h-[72px] shrink-0 border-b border-border-default/20 flex items-center justify-center">
                <div className="flex items-center justify-center px-2 cursor-pointer w-full" onClick={() => navigate('/dashboard/home')} title="Return to Master Dashboard">
                    <img 
                        src={theme === 'dark' ? paiLogoDark : paiLogoLight} 
                        alt="Praxis AI" 
                        className="h-11 w-auto object-contain transition-transform duration-300 hover:scale-110"
                    />
                </div>
            </div>

            {/* Chat History List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
                {sections.map((section) => {
                    const isOpen = openSections[section.id];
                    const Icon = section.icon;

                    return (
                        <div key={section.id} className="space-y-1">
                            {/* Section Header (Page Level) */}
                            <button 
                                onClick={() => toggleSection(section.id)}
                                className="w-full flex items-center justify-between px-2 py-1 group"
                            >
                                <div className="flex items-center gap-2">
                                    <Icon size={14} className="text-text-tertiary group-hover:text-text-secondary transition-colors" />
                                    <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider group-hover:text-text-secondary transition-colors">
                                        {section.label}
                                    </span>
                                </div>
                                {isOpen ? (
                                    <ChevronDown size={14} className="text-text-tertiary" />
                                ) : (
                                    <ChevronRight size={14} className="text-text-tertiary" />
                                )}
                            </button>

                            {/* Section's SubSections */}
                            {isOpen && (
                                <div className="space-y-1 ml-1 border-l border-border-default/20 pl-2 mt-1">
                                    {section.subSections.map(subSection => {
                                        const isSubOpen = openSubSections[subSection.id];
                                        return (
                                            <div key={subSection.id} className="space-y-0.5">
                                                {/* SubSection Header */}
                                                <button 
                                                    onClick={() => toggleSubSection(subSection.id)}
                                                    className="w-full flex items-center justify-between px-2 py-1 group rounded-lg hover:bg-background-elevated transition-colors"
                                                >
                                                    <span className="text-[10.5px] font-semibold text-text-secondary/70 uppercase tracking-wide group-hover:text-text-primary transition-colors">
                                                        {subSection.label}
                                                    </span>
                                                    {isSubOpen ? (
                                                        <ChevronDown size={12} className="text-text-tertiary" />
                                                    ) : (
                                                        <ChevronRight size={12} className="text-text-tertiary" />
                                                    )}
                                                </button>

                                                {/* Chats under SubSection */}
                                                {isSubOpen && (
                                                    <div className="space-y-0.5 ml-2 border-l border-border-default/10 pl-2 mt-1">
                                                        {subSection.chats.map(chat => {
                                                            const isActive = activeChatId === chat.id;
                                                            return (
                                                                <div
                                                                    key={chat.id}
                                                                    className={`w-full flex items-center justify-between px-2 py-1 rounded-lg transition-colors group ${
                                                                        isActive 
                                                                            ? 'bg-blue-500/10 text-blue-500 font-medium' 
                                                                            : 'text-text-secondary hover:bg-background-elevated hover:text-text-primary'
                                                                    }`}
                                                                >
                                                                    <button
                                                                        onClick={() => onSelectChat(chat.id, chat.title)}
                                                                        className="flex items-center gap-2 flex-1 min-w-0"
                                                                    >
                                                                        <span className="truncate text-left text-[11.5px]" title={chat.title}>{chat.title}</span>
                                                                    </button>
                                                                    
                                                                    {/* Actions (visible on hover) */}
                                                                    <div className="opacity-0 group-hover:opacity-100 flex items-center shrink-0 transition-opacity">
                                                                        <button 
                                                                            title="New Thread"
                                                                            onClick={() => handleAddSubChat(section.id, subSection.id, chat)}
                                                                            className="p-1 text-text-tertiary hover:text-blue-500 hover:bg-blue-500/10 rounded-md transition-all"
                                                                        >
                                                                            <Plus size={13} />
                                                                        </button>
                                                                        <button 
                                                                            title={chat.isSubChat ? "Manage Chat" : "Clear Chat History"}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setChatToDelete({ sectionId: section.id, subSectionId: subSection.id, chat });
                                                                            }}
                                                                            className="p-1 text-text-tertiary hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all"
                                                                        >
                                                                            <Trash2 size={13} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Delete/Clear Modal */}
            {chatToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-background-card border border-border-default rounded-xl p-5 w-80 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <h3 className="text-[15px] font-bold text-text-primary mb-2">
                            {chatToDelete.chat.isSubChat ? 'Manage Chat' : 'Clear Chat History'}
                        </h3>
                        <p className="text-[13px] text-text-secondary mb-5">
                            {chatToDelete.chat.isSubChat 
                                ? `What would you like to do with "${chatToDelete.chat.title}"?`
                                : `Are you sure you want to clear the history for "${chatToDelete.chat.title}"? This cannot be undone.`
                            }
                        </p>
                        <div className="flex justify-end gap-2">
                            <button 
                                onClick={() => setChatToDelete(null)}
                                className="px-3 py-1.5 rounded-lg text-[13px] font-medium text-text-secondary hover:bg-background-elevated transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => {
                                    // Here you would also call an API to actually clear the history of this chat
                                    setChatToDelete(null);
                                }}
                                className="px-3 py-1.5 rounded-lg text-[13px] font-medium bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors"
                            >
                                Clear History
                            </button>
                            {chatToDelete.chat.isSubChat && (
                                <button 
                                    onClick={() => {
                                        setSections(prev => prev.map(s => {
                                            if (s.id !== chatToDelete.sectionId) return s;
                                            
                                            const newSubSections = s.subSections.map(sub => {
                                                if (sub.id !== chatToDelete.subSectionId) return sub;
                                                return {
                                                    ...sub,
                                                    chats: sub.chats.filter(c => c.id !== chatToDelete.chat.id)
                                                };
                                            });

                                            return { ...s, subSections: newSubSections };
                                        }));
                                        if (activeChatId === chatToDelete.chat.id) {
                                            onSelectChat(null, '');
                                        }
                                        setChatToDelete(null);
                                    }}
                                    className="px-3 py-1.5 rounded-lg text-[13px] font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                                >
                                    Delete Chat
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
