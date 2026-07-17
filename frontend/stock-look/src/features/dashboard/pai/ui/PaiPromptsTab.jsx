import React, { useState } from 'react';
import { LayoutDashboard, LineChart, Activity, Briefcase, ChevronDown, ChevronRight, MessageSquare, FileText } from 'lucide-react';

const PAGE_CATEGORIES = [
    { id: 'master', label: 'Master Dashboard', icon: LayoutDashboard },
    { id: 'fundamental', label: 'Fundamentals', icon: Briefcase },
    { id: 'technical', label: 'Technicals', icon: LineChart },
    { id: 'options', label: 'Options Chain', icon: Activity },
    { id: 'foreign', label: 'Global Structure', icon: Globe },
];

const MOCK_CARDS = {
    'master': ['Overall Market Pulse', 'Nifty Summary', 'BankNifty Summary'],
    'fundamental': ['P/E Ratio Card', 'Forward P/E Card', 'EPS Growth Card', 'ROE Card', 'ROCE Card', 'Debt to Equity Card', 'Intrinsic Value Card'],
    'technical': ['RSI Card', 'MACD Card', 'Moving Averages Card', 'Bollinger Bands Card'],
    'options': ['Put Call Ratio Card', 'Max Pain Card', 'IV Percentile Card'],
    'foreign': ['FII/DII Activity', 'Global Indices', 'Currency Impact']
};

export default function PaiPromptsTab() {
    const [activePage, setActivePage] = useState('fundamental');
    const [expandedPages, setExpandedPages] = useState({ 'fundamental': true });
    const [activePrompt, setActivePrompt] = useState('Page Header Insight');

    const togglePage = (pageId) => {
        setExpandedPages(prev => ({
            ...prev,
            [pageId]: !prev[pageId]
        }));
    };

    const selectPrompt = (pageId, promptName) => {
        setActivePage(pageId);
        setActivePrompt(promptName);
    };

    const isHeaderPrompt = activePrompt === 'Page Header Insight';

    return (
        <div className="animate-in fade-in duration-300 flex flex-col lg:flex-row gap-5 h-[calc(100vh-200px)]">
            
            {/* Left Sidebar: Tree View */}
            <div className="w-full lg:w-64 shrink-0 flex flex-col border border-border-default/40 rounded-xl bg-background-card overflow-hidden">
                <div className="p-3 border-b border-border-default/40 bg-background-surface/30">
                    <h2 className="text-[14px] font-bold text-text-primary px-1">App Pages & Cards</h2>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                    {PAGE_CATEGORIES.map(page => {
                        const isExpanded = expandedPages[page.id];
                        const prompts = ['Page Header Insight', ...(MOCK_CARDS[page.id] || [])];
                        
                        return (
                            <div key={page.id} className="flex flex-col">
                                <button
                                    onClick={() => togglePage(page.id)}
                                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                                        isExpanded ? 'bg-background-surface/40' : 'hover:bg-background-surface/20'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <page.icon size={16} className={isExpanded ? 'text-blue-500' : 'text-text-tertiary'} />
                                        <span className={`text-[13px] font-medium ${isExpanded ? 'text-text-primary' : 'text-text-secondary'}`}>
                                            {page.label}
                                        </span>
                                    </div>
                                    {isExpanded ? (
                                        <ChevronDown size={14} className="text-text-tertiary" />
                                    ) : (
                                        <ChevronRight size={14} className="text-text-tertiary" />
                                    )}
                                </button>
                                
                                {/* Children / Cards */}
                                {isExpanded && (
                                    <div className="flex flex-col mt-1 ml-4 pl-3 border-l border-border-default/30 space-y-1">
                                        {prompts.map(prompt => {
                                            const isSelected = activePage === page.id && activePrompt === prompt;
                                            return (
                                                <button
                                                    key={prompt}
                                                    onClick={() => selectPrompt(page.id, prompt)}
                                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                                                        isSelected 
                                                            ? 'bg-blue-600/10 text-blue-500 font-medium' 
                                                            : 'text-text-tertiary hover:bg-background-surface hover:text-text-primary'
                                                    }`}
                                                >
                                                    {prompt === 'Page Header Insight' ? (
                                                        <MessageSquare size={13} />
                                                    ) : (
                                                        <FileText size={13} />
                                                    )}
                                                    <span className="text-[12px] truncate">{prompt}</span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Right Content: Single Prompt Editor */}
            <div className="flex-1 min-w-0 flex flex-col bg-background-card border border-border-default/40 rounded-xl overflow-hidden">
                <div className="p-5 border-b border-border-default/40 bg-background-surface/30">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[12px] font-medium text-blue-500 uppercase tracking-wider">{PAGE_CATEGORIES.find(p => p.id === activePage)?.label}</span>
                        <ChevronRight size={12} className="text-text-tertiary" />
                        <span className="text-[12px] text-text-tertiary">{activePrompt}</span>
                    </div>
                    <h2 className="text-[18px] font-bold text-text-primary mt-1">{activePrompt}</h2>
                    <p className="text-[13px] text-text-secondary mt-1">
                        {isHeaderPrompt 
                            ? `Configure the overarching summary paragraph prompt generated at the top of the ${activePage} page.` 
                            : `Configure the specific AI insight instructions for the ${activePrompt}.`
                        }
                    </p>
                </div>

                <div className="flex-1 p-5 flex flex-col">
                    <label className="block text-[13px] font-semibold text-text-primary mb-3 flex items-center gap-2">
                        <MessageSquare size={16} className="text-blue-500" />
                        System Instruction
                    </label>
                    <textarea
                        key={`${activePage}-${activePrompt}`}
                        defaultValue={
                            isHeaderPrompt 
                                ? `Analyze the overall ${activePage} structure based on the provided aggregate data and output a 2-sentence highly professional summary...`
                                : `You are analyzing the ${activePrompt}. Keep the insight under 1 sentence. Focus on the trend compared to historical averages.`
                        }
                        className="flex-1 w-full bg-background-app border border-border-default/50 rounded-xl p-4 text-[14px] text-text-primary leading-relaxed focus:border-blue-500/50 outline-none custom-scrollbar resize-none shadow-inner"
                    />
                    <div className="mt-4 flex justify-end">
                        <button className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[13px] font-medium rounded-lg transition-colors shadow-md">
                            Save Prompt
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Temporary icon for Globe since we only imported a few
function Globe(props) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
}
