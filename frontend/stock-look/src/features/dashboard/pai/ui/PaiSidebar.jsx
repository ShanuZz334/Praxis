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
                    { id: 'fund_header', title: 'Page Header Insight', type: 'header' },
                    { id: 'fund_manual', title: 'Manual Chat', type: 'manual' }
                ]
            },
            {
                id: 'fund_valuation',
                label: 'Valuation',
                chats: [
                    { id: 'fund_pe', title: 'PE Ratio', type: 'card' }
                ]
            },
            {
                id: 'fund_growth',
                label: 'Growth',
                chats: [
                    { id: 'fund_eps', title: 'EPS Growth', type: 'card' }
                ]
            },
            {
                id: 'fund_profit',
                label: 'Profitability',
                chats: [
                    { id: 'fund_roe', title: 'Return on Equity', type: 'card' }
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
                    { id: 'tech_header', title: 'Page Header Insight', type: 'header' },
                    { id: 'tech_manual', title: 'Manual Chat', type: 'manual' }
                ]
            },
            {
                id: 'tech_trend',
                label: 'Trend',
                chats: [
                    { id: 'tech_ema20', title: 'EMA 20', type: 'card' },
                    { id: 'tech_macd', title: 'MACD', type: 'card' }
                ]
            },
            {
                id: 'tech_momentum',
                label: 'Momentum',
                chats: [
                    { id: 'tech_rsi14', title: 'RSI 14', type: 'card' }
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
                    { id: 'opt_header', title: 'Page Header Insight', type: 'header' },
                    { id: 'opt_manual', title: 'Manual Chat', type: 'manual' }
                ]
            },
            {
                id: 'opt_sentiment',
                label: 'Sentiment',
                chats: [
                    { id: 'opt_pcr', title: 'PCR (OI)', type: 'card' }
                ]
            },
            {
                id: 'opt_flow',
                label: 'Flow',
                chats: [
                    { id: 'opt_maxpain', title: 'Max Pain', type: 'card' }
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
                    { id: 'events_main', title: 'Event Categorisations', type: 'header' },
                    { id: 'events_manual', title: 'Manual Chat', type: 'manual' }
                ]
            }
        ]
    },
    {
        id: 'global',
        label: 'Global',
        icon: Globe,
        subSections: [
            {
                id: 'glob_general',
                label: 'General',
                chats: [
                    { id: 'glob_header', title: 'Page Header Insight', type: 'header' },
                    { id: 'glob_manual', title: 'Manual Chat', type: 'manual' }
                ]
            },
            {
                id: 'glob_macro',
                label: 'Macro',
                chats: [
                    { id: 'glob_vix', title: 'India VIX', type: 'card' },
                    { id: 'glob_oil', title: 'Brent Crude Oil', type: 'card' }
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
