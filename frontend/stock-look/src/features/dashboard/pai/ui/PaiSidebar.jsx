import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import { useTheme } from '@/shared/context/ThemeContext';
import axiosInstance from '@/shared/utils/axiosInstance';
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
            },
            {
                id: 'assist_contexts',
                label: 'QChat Contexts',
                chats: [
                    { id: 'qchat_global', title: 'Global QChat', type: 'header' },
                    { id: 'qchat_fundamentals', title: 'Fundamentals Context', type: 'header' },
                    { id: 'qchat_technicals', title: 'Technicals Context', type: 'header' },
                    { id: 'qchat_options', title: 'Options Context', type: 'header' },
                    { id: 'qchat_global_macros', title: 'Global Macros Context', type: 'header' },
                    { id: 'qchat_events', title: 'Events Context', type: 'header' },
                    { id: CARD_REGISTRY.master_qchat.id, title: 'Dashboard Context', type: 'header' },
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
                    { id: CARD_REGISTRY.praxis_composite_header.id, title: 'Page Header Insight', type: 'header' },
                    { id: CARD_REGISTRY.master_manual_chat.id, title: 'Manual Chat', type: 'manual' }
                ]
            },
            {
                id: 'master_widgets',
                label: 'Widgets',
                chats: [
                    { id: CARD_REGISTRY.market_heatmap.id, title: 'Market Heatmap', type: 'card' },
                    { id: CARD_REGISTRY.fii_dii_flow_master.id, title: 'FII/DII Flow', type: 'card' },
                    { id: CARD_REGISTRY.options_pulse.id, title: 'Options Pulse', type: 'card' },
                    { id: CARD_REGISTRY.sector_rotation.id, title: 'Sector Rotation', type: 'card' },
                    { id: CARD_REGISTRY.volume_shockers.id, title: 'Volume Shockers', type: 'card' },
                    { id: CARD_REGISTRY.catalyst_calendar.id, title: 'Catalyst Calendar', type: 'card' }
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
                    { id: CARD_REGISTRY.fundamentals_index_header.id, title: 'Index Header Insight', type: 'header' },
                    { id: CARD_REGISTRY.fundamentals_company_header.id, title: 'Company Header Insight', type: 'header' },
                    { id: CARD_REGISTRY.fund_manual.id, title: 'Manual Chat', type: 'manual' }
                ]
            },
            {
                id: 'fundamental_valuation',
                label: 'Valuation',
                chats: [
                    { id: CARD_REGISTRY.pe_ratio.id, title: 'P/E Ratio', type: 'card' },
                    { id: CARD_REGISTRY.forward_pe.id, title: 'Forward P/E', type: 'card' },
                    { id: CARD_REGISTRY.pb_ratio.id, title: 'P/B Ratio', type: 'card' },
                    { id: CARD_REGISTRY.ev_ebitda.id, title: 'EV/EBITDA', type: 'card' },
                    { id: CARD_REGISTRY.earnings_yield.id, title: 'Earnings Yield', type: 'card' },
                    { id: CARD_REGISTRY.relative_valuation.id, title: 'Relative Valuation', type: 'card' },
                    { id: CARD_REGISTRY.dividend_yield.id, title: 'Dividend Yield', type: 'card' },
                    { id: CARD_REGISTRY.nifty_pe.id, title: 'Nifty P/E', type: 'card' },
                    { id: CARD_REGISTRY.nifty_pb.id, title: 'Nifty P/B', type: 'card' },
                    { id: CARD_REGISTRY.mcap_gdp.id, title: 'MCap/GDP (Buffett)', type: 'card' }
                ]
            },
            {
                id: 'fundamental_earnings',
                label: 'Earnings',
                chats: [
                    { id: CARD_REGISTRY.eps_growth.id, title: 'EPS Growth', type: 'card' },
                    { id: CARD_REGISTRY.revenue_growth.id, title: 'Revenue Growth', type: 'card' },
                    { id: CARD_REGISTRY.profit_growth.id, title: 'Profit Growth', type: 'card' },
                    { id: CARD_REGISTRY.earnings_trend.id, title: 'Earnings Trend', type: 'card' },
                    { id: CARD_REGISTRY.earnings_quality.id, title: 'Earnings Quality', type: 'card' },
                    { id: CARD_REGISTRY.eps_yoy.id, title: 'EPS YoY', type: 'card' },
                    { id: CARD_REGISTRY.forward_eps.id, title: 'Forward EPS', type: 'card' },
                    { id: CARD_REGISTRY.profit_margin.id, title: 'Profit Margin', type: 'card' }
                ]
            },
            {
                id: 'fundamental_corporate',
                label: 'Corporate',
                chats: [
                    { id: CARD_REGISTRY.roe.id, title: 'ROE', type: 'card' },
                    { id: CARD_REGISTRY.roce.id, title: 'ROCE', type: 'card' },
                    { id: CARD_REGISTRY.roa.id, title: 'ROA', type: 'card' },
                    { id: CARD_REGISTRY.net_margin.id, title: 'Net Margin', type: 'card' },
                    { id: CARD_REGISTRY.operating_margin.id, title: 'Operating Margin', type: 'card' },
                    { id: CARD_REGISTRY.debt_to_equity.id, title: 'Debt to Equity', type: 'card' },
                    { id: CARD_REGISTRY.interest_coverage.id, title: 'Interest Coverage', type: 'card' },
                    { id: CARD_REGISTRY.free_cash_flow.id, title: 'Free Cash Flow', type: 'card' },
                    { id: CARD_REGISTRY.current_ratio.id, title: 'Current Ratio', type: 'card' },
                    { id: CARD_REGISTRY.credit_growth.id, title: 'Credit Growth', type: 'card' },
                    { id: CARD_REGISTRY.corp_debt.id, title: 'Corporate Debt', type: 'card' }
                ]
            },
            {
                id: 'fundamental_ownership___flow',
                label: 'Ownership & Flow',
                chats: [
                    { id: CARD_REGISTRY.promoter_holding.id, title: 'Promoter Holding', type: 'card' },
                    { id: CARD_REGISTRY.smart_money_flow.id, title: 'Smart Money Flow', type: 'card' },
                    { id: CARD_REGISTRY.fii_dii_flow.id, title: 'FII/DII Flow', type: 'card' }
                ]
            },
            {
                id: 'fundamental_macro',
                label: 'Macro',
                chats: [
                    { id: CARD_REGISTRY.gdp_growth.id, title: 'GDP Growth', type: 'card' },
                    { id: CARD_REGISTRY.gdp.id, title: 'GDP', type: 'card' },
                    { id: CARD_REGISTRY.cpi.id, title: 'CPI', type: 'card' },
                    { id: CARD_REGISTRY.repo.id, title: 'Repo Rate', type: 'card' },
                    { id: CARD_REGISTRY.fiscal_deficit.id, title: 'Fiscal Deficit', type: 'card' }
                ]
            },
            {
                id: 'fundamental_liquidity',
                label: 'Liquidity',
                chats: [
                    { id: CARD_REGISTRY.fii.id, title: 'FII', type: 'card' },
                    { id: CARD_REGISTRY.dii.id, title: 'DII', type: 'card' },
                    { id: CARD_REGISTRY.fii_trend.id, title: 'FII Trend', type: 'card' },
                    { id: CARD_REGISTRY.system_liquidity.id, title: 'System Liquidity', type: 'card' },
                    { id: CARD_REGISTRY.mf_flows.id, title: 'MF Flows', type: 'card' },
                    { id: CARD_REGISTRY.advance_decline.id, title: 'Advance/Decline', type: 'card' }
                ]
            },
            {
                id: 'fundamental_risk',
                label: 'Risk',
                chats: [
                    { id: CARD_REGISTRY.policy_tailwinds.id, title: 'Policy Tailwinds', type: 'card' },
                    { id: CARD_REGISTRY.sovereign_risk.id, title: 'Sovereign Risk', type: 'card' },
                    { id: CARD_REGISTRY.npa.id, title: 'NPA', type: 'card' },
                    { id: CARD_REGISTRY.reform_momentum.id, title: 'Reform Momentum', type: 'card' },
                    { id: CARD_REGISTRY.india_vix.id, title: 'India VIX', type: 'card' }
                ]
            },
            {
                id: 'fundamental_global',
                label: 'Global',
                chats: [
                    { id: CARD_REGISTRY.crude.id, title: 'Crude Oil', type: 'card' },
                    { id: CARD_REGISTRY.global_liq.id, title: 'Global Liquidity', type: 'card' }
                ]
            },
            {
                id: 'fundamental_general',
                label: 'General',
                chats: [
                    { id: CARD_REGISTRY.peer_comparison.id, title: 'Peer Comparison', type: 'card' },
                    { id: CARD_REGISTRY.analyst_consensus.id, title: 'Analyst Consensus', type: 'card' },
                    { id: CARD_REGISTRY.corporate_actions.id, title: 'Corporate Actions', type: 'card' },
                    { id: CARD_REGISTRY.cash_conversion.id, title: 'Cash Conversion Cycle', type: 'card' },
                    { id: CARD_REGISTRY.credit_rating.id, title: 'Credit Rating', type: 'card' },
                    { id: CARD_REGISTRY.sector_dashboard.id, title: 'Sector Dashboard', type: 'card' }
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
                    { id: CARD_REGISTRY.technical_index_header.id, title: 'Index Header Insight', type: 'header' },
                    { id: CARD_REGISTRY.technical_company_header.id, title: 'Company Header Insight', type: 'header' },
                    { id: CARD_REGISTRY.tech_manual.id, title: 'Manual Chat', type: 'manual' }
                ]
            },
            {
                id: 'technical_momentum',
                label: 'Momentum',
                chats: [
                    { id: CARD_REGISTRY.rsi.id, title: 'RSI', type: 'card' },
                    { id: CARD_REGISTRY.macd.id, title: 'MACD', type: 'card' },
                    { id: CARD_REGISTRY.stoch_rsi.id, title: 'Stoch RSI', type: 'card' },
                    { id: CARD_REGISTRY.williams_r.id, title: 'Williams %R', type: 'card' }
                ]
            },
            {
                id: 'technical_volatility',
                label: 'Volatility',
                chats: [
                    { id: CARD_REGISTRY.bb_20_2.id, title: 'Bollinger Bands', type: 'card' },
                    { id: CARD_REGISTRY.atr.id, title: 'ATR', type: 'card' },
                    { id: CARD_REGISTRY.kc.id, title: 'Keltner Channel', type: 'card' }
                ]
            },
            {
                id: 'technical_trend',
                label: 'Trend',
                chats: [
                    { id: CARD_REGISTRY.ema_20.id, title: 'EMA 20', type: 'card' },
                    { id: CARD_REGISTRY.ema_50.id, title: 'EMA 50', type: 'card' },
                    { id: CARD_REGISTRY.ema_200.id, title: 'EMA 200', type: 'card' },
                    { id: CARD_REGISTRY.sma_50.id, title: 'SMA 50', type: 'card' },
                    { id: CARD_REGISTRY.sma_200.id, title: 'SMA 200', type: 'card' },
                    { id: CARD_REGISTRY.adx.id, title: 'ADX', type: 'card' },
                    { id: CARD_REGISTRY.supertrend.id, title: 'Supertrend', type: 'card' }
                ]
            },
            {
                id: 'technical_volume',
                label: 'Volume',
                chats: [
                    { id: CARD_REGISTRY.cmf.id, title: 'CMF', type: 'card' },
                    { id: CARD_REGISTRY.volume_sma.id, title: 'Volume SMA', type: 'card' },
                    { id: CARD_REGISTRY.obv.id, title: 'OBV', type: 'card' },
                    { id: CARD_REGISTRY.vwap.id, title: 'VWAP', type: 'card' }
                ]
            },
            {
                id: 'technical_structure',
                label: 'Structure',
                chats: [
                    { id: CARD_REGISTRY.support.id, title: 'Support', type: 'card' },
                    { id: CARD_REGISTRY.resistance.id, title: 'Resistance', type: 'card' },
                    { id: CARD_REGISTRY.trendline.id, title: 'Trendline', type: 'card' },
                    { id: CARD_REGISTRY.pivot.id, title: 'Pivot Points', type: 'card' },
                    { id: CARD_REGISTRY.fibonacci.id, title: 'Fibonacci', type: 'card' }
                ]
            },
            {
                id: 'technical_breadth',
                label: 'Breadth',
                chats: [
                    { id: CARD_REGISTRY.ad_line.id, title: 'A/D Line', type: 'card' },
                    { id: CARD_REGISTRY.nh_nl.id, title: 'New Highs / New Lows', type: 'card' },
                    { id: CARD_REGISTRY.breadth_ratio.id, title: 'Breadth Ratio', type: 'card' },
                    { id: CARD_REGISTRY.trin.id, title: 'TRIN', type: 'card' },
                    { id: CARD_REGISTRY.mcclellan.id, title: 'McClellan Oscillator', type: 'card' }
                ]
            },
            {
                id: 'technical_general',
                label: 'General',
                chats: [
                    { id: CARD_REGISTRY.beta_correlation.id, title: 'Beta Correlation', type: 'card' }
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
                    { id: CARD_REGISTRY.options_index_header.id, title: 'Index Header Insight', type: 'header' },
                    { id: CARD_REGISTRY.options_company_header.id, title: 'Company Header Insight', type: 'header' },
                    { id: CARD_REGISTRY.options_manual.id, title: 'Manual Chat', type: 'manual' }
                ]
            },
            {
                id: 'options_volatility',
                label: 'Volatility',
                chats: [
                    { id: CARD_REGISTRY.atm_iv.id, title: 'ATM IV', type: 'card' },
                    { id: CARD_REGISTRY.iv_rank.id, title: 'IV Rank', type: 'card' },
                    { id: CARD_REGISTRY.iv_percentile.id, title: 'IV Percentile', type: 'card' }
                ]
            },
            {
                id: 'options_open_interest',
                label: 'Open Interest',
                chats: [
                    { id: CARD_REGISTRY.total_call_oi.id, title: 'Total Call OI', type: 'card' },
                    { id: CARD_REGISTRY.total_put_oi.id, title: 'Total Put OI', type: 'card' },
                    { id: CARD_REGISTRY.oi_change.id, title: 'OI Change', type: 'card' }
                ]
            },
            {
                id: 'options_greeks',
                label: 'Greeks',
                chats: [
                    { id: CARD_REGISTRY.delta.id, title: 'Delta', type: 'card' },
                    { id: CARD_REGISTRY.gamma.id, title: 'Gamma', type: 'card' },
                    { id: CARD_REGISTRY.theta.id, title: 'Theta', type: 'card' },
                    { id: CARD_REGISTRY.vega.id, title: 'Vega', type: 'card' }
                ]
            },
            {
                id: 'options_put_call_ratio',
                label: 'Put-Call Ratio',
                chats: [
                    { id: CARD_REGISTRY.pcr_oi.id, title: 'PCR OI', type: 'card' },
                    { id: CARD_REGISTRY.pcr_volume.id, title: 'PCR Volume', type: 'card' }
                ]
            },
            {
                id: 'options_market_positioning',
                label: 'Market Positioning',
                chats: [
                    { id: CARD_REGISTRY.max_pain.id, title: 'Max Pain', type: 'card' }
                ]
            },
            {
                id: 'options_general',
                label: 'General',
                chats: [
                    { id: CARD_REGISTRY.fno_ban.id, title: 'F&O Ban Status', type: 'card' }
                ]
            },
            {
                id: 'options_widgets',
                label: 'Widgets',
                chats: [
                    { id: CARD_REGISTRY.options_prodesk.id, title: 'ProDesk Action Signal', type: 'widget' },
                    { id: CARD_REGISTRY.options_chain_table.id, title: 'Options Chain', type: 'widget' },
                    { id: CARD_REGISTRY.options_history_chart.id, title: 'Options History', type: 'widget' }
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

export default function PaiSidebar({ activeChatId, onSelectChat, onChatCleared }) {
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
                                                                        onClick={() => onSelectChat(chat.id, chat.title, chat.type)}
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
                                onClick={async () => {
                                    const scope = chatToDelete.chat.type === 'header' ? 'page' : 'card';
                                    try {
                                        await axiosInstance.delete(`/api/v1/ai-prompts/thread/${chatToDelete.chat.id}`, { params: { scope } });
                                        if (onChatCleared) onChatCleared();
                                    } catch (err) {
                                        console.error('Failed to clear chat history:', err);
                                    }
                                    setChatToDelete(null);
                                }}
                                className="px-3 py-1.5 rounded-lg text-[13px] font-medium bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors"
                            >
                                Clear History
                            </button>
                            {chatToDelete.chat.isSubChat && (
                                <button 
                                    onClick={async () => {
                                        const scope = chatToDelete.chat.type === 'header' ? 'page' : 'card';
                                        try {
                                            await axiosInstance.delete(`/api/v1/ai-prompts/thread/${chatToDelete.chat.id}`, { params: { scope } });
                                        } catch (err) {
                                            console.error('Failed to delete chat:', err);
                                        }

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
                                        } else if (onChatCleared) {
                                            onChatCleared();
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
