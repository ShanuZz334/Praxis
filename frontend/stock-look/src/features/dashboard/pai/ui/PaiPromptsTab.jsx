import React, { useState, useEffect, useCallback } from 'react';
import { LayoutDashboard, LineChart, Activity, Briefcase, ChevronDown, ChevronRight, MessageSquare, FileText, Save, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { useCardPrompt } from '@/shared/hooks/useCardInsight';
import cardInventory from '../../../../../card-inventory.json';

// Page structure matching the dashboard nav
const PAGE_CATEGORIES = [
    { id: 'Master',           label: 'Master Dashboard',   icon: LayoutDashboard },
    { id: 'Fundamentals',     label: 'Fundamentals',        icon: Briefcase },
    { id: 'Technical Analysis', label: 'Technical Analysis', icon: LineChart },
    { id: 'Options Analysis', label: 'Options Analysis',    icon: Activity },
    { id: 'Foreign Markets',  label: 'Foreign Markets',     icon: Globe },
];

// Header prompt entries per page (not in card-inventory.json — these are page-level)
const PAGE_HEADERS = {
    'Master':             [{ targetId: 'master_header',                     displayName: 'Master Dashboard Header' }],
    'Fundamentals':       [{ targetId: 'fundamentals_header_index',          displayName: 'Header — Index Mode'    },
                           { targetId: 'fundamentals_header_company',        displayName: 'Header — Company Mode'  }],
    'Technical Analysis': [{ targetId: 'technical_header_index',             displayName: 'Header — Index Mode'    },
                           { targetId: 'technical_header_company',           displayName: 'Header — Company Mode'  }],
    'Options Analysis':   [{ targetId: 'options_header',                     displayName: 'Options Header'         }],
    'Foreign Markets':    [{ targetId: 'foreign_header',                     displayName: 'Foreign Markets Header' }],
};

// Build the full sidebar tree from real card-inventory.json
function buildTree() {
    const tree = {};
    PAGE_CATEGORIES.forEach(p => {
        tree[p.id] = {
            headers: PAGE_HEADERS[p.id] || [],
            cards: cardInventory
                .filter(c => c.page === p.id)
                .map(c => ({ targetId: c.targetId, displayName: c.card, applicability: c.applicability }))
        };
    });
    return tree;
}

const TREE = buildTree();

// ─── Prompt Editor (real) ────────────────────────────────────────────────────
function PromptEditor({ targetId, displayName, page, isHeaderPrompt, applicability }) {
    const {
        systemInstruction,
        setSystemInstruction,
        isDefault,
        isLoading,
        isSaving,
        fetchPrompt,
        savePrompt
    } = useCardPrompt(targetId);

    const [saveStatus, setSaveStatus] = useState(null); // 'saved' | 'error'

    useEffect(() => {
        if (targetId) fetchPrompt();
    }, [targetId]);

    const handleSave = async () => {
        try {
            await savePrompt({ displayName, page, isHeaderPrompt, applicability });
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus(null), 3000);
        } catch {
            setSaveStatus('error');
            setTimeout(() => setSaveStatus(null), 3000);
        }
    };

    return (
        <div className="flex-1 p-5 flex flex-col">
            <label className="block text-[13px] font-semibold text-text-primary mb-1 flex items-center gap-2">
                <MessageSquare size={16} className="text-blue-500" />
                System Instruction
                {isDefault && (
                    <span className="text-[10px] font-normal text-text-tertiary bg-background-surface px-2 py-0.5 rounded-full border border-border-subtle">
                        No custom prompt saved — using default
                    </span>
                )}
                {!isDefault && (
                    <span className="text-[10px] font-normal text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                        Custom prompt active
                    </span>
                )}
            </label>

            <p className="text-[11px] text-text-tertiary mb-3">
                This instruction is sent to the AI Gateway when generating the insight for <strong className="text-text-secondary">{displayName}</strong>.
                Leave blank to use the default template.
            </p>

            {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 size={20} className="animate-spin text-text-tertiary" />
                </div>
            ) : (
                <textarea
                    value={systemInstruction}
                    onChange={e => setSystemInstruction(e.target.value)}
                    placeholder={`e.g. You are Praxis, an elite Indian market analyst. When analyzing the ${displayName}, focus on its relationship to historical Nifty valuations and mention the current macro environment. Keep insight under 2 sentences.`}
                    className="flex-1 w-full bg-background-app border border-border-default/50 rounded-xl p-4 text-[13px] text-text-primary leading-relaxed focus:border-blue-500/50 outline-none custom-scrollbar resize-none shadow-inner font-mono"
                />
            )}

            <div className="mt-4 flex items-center justify-between">
                <span className="text-[11px] text-text-tertiary font-mono">
                    targetId: <span className="text-blue-400">{targetId}</span>
                </span>
                <div className="flex items-center gap-3">
                    {saveStatus === 'saved' && (
                        <span className="flex items-center gap-1 text-[12px] text-emerald-400">
                            <CheckCircle size={13} /> Saved
                        </span>
                    )}
                    {saveStatus === 'error' && (
                        <span className="flex items-center gap-1 text-[12px] text-red-400">
                            <AlertCircle size={13} /> Save failed
                        </span>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={isSaving || isLoading}
                        className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-[13px] font-medium rounded-lg transition-colors shadow-md"
                    >
                        {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                        Save Prompt
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function PaiPromptsTab() {
    const [expandedPages, setExpandedPages] = useState({ 'Fundamentals': true });
    const [selected, setSelected] = useState({
        targetId: 'nifty_pe',
        displayName: 'Nifty P/E',
        page: 'Fundamentals',
        isHeaderPrompt: false,
        applicability: 'index_only'
    });

    const togglePage = useCallback((pageId) => {
        setExpandedPages(prev => ({ ...prev, [pageId]: !prev[pageId] }));
    }, []);

    const selectEntry = useCallback((entry, page, isHeader) => {
        setSelected({
            targetId: entry.targetId,
            displayName: entry.displayName,
            page,
            isHeaderPrompt: isHeader || false,
            applicability: entry.applicability || 'both'
        });
    }, []);

    return (
        <div className="animate-in fade-in duration-300 flex flex-col lg:flex-row gap-5 h-[calc(100vh-200px)]">

            {/* Left Sidebar — real tree from card-inventory.json */}
            <div className="w-full lg:w-64 shrink-0 flex flex-col border border-border-default/40 rounded-xl bg-background-card overflow-hidden">
                <div className="p-3 border-b border-border-default/40 bg-background-surface/30">
                    <h2 className="text-[14px] font-bold text-text-primary px-1">
                        Pages & Cards
                        <span className="ml-2 text-[10px] font-normal text-text-tertiary">({cardInventory.length} cards)</span>
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                    {PAGE_CATEGORIES.map(page => {
                        const isExpanded = expandedPages[page.id];
                        const pageData = TREE[page.id];
                        const totalCount = pageData.headers.length + pageData.cards.length;

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
                                        <span className="text-[10px] text-text-tertiary bg-background-elevated px-1.5 py-0.5 rounded-full">
                                            {totalCount}
                                        </span>
                                    </div>
                                    {isExpanded ? (
                                        <ChevronDown size={14} className="text-text-tertiary" />
                                    ) : (
                                        <ChevronRight size={14} className="text-text-tertiary" />
                                    )}
                                </button>

                                {isExpanded && (
                                    <div className="flex flex-col mt-1 ml-4 pl-3 border-l border-border-default/30 space-y-0.5">
                                        {/* Page header prompts */}
                                        {pageData.headers.map(h => {
                                            const isSelected = selected.targetId === h.targetId;
                                            return (
                                                <button
                                                    key={h.targetId}
                                                    onClick={() => selectEntry(h, page.id, true)}
                                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                                                        isSelected
                                                            ? 'bg-purple-600/10 text-purple-400 font-medium'
                                                            : 'text-text-tertiary hover:bg-background-surface hover:text-text-primary'
                                                    }`}
                                                >
                                                    <MessageSquare size={12} className={isSelected ? 'text-purple-400' : ''} />
                                                    <span className="text-[11px] truncate">{h.displayName}</span>
                                                </button>
                                            );
                                        })}

                                        {/* Card prompts */}
                                        {pageData.cards.map(card => {
                                            const isSelected = selected.targetId === card.targetId;
                                            return (
                                                <button
                                                    key={card.targetId}
                                                    onClick={() => selectEntry(card, page.id, false)}
                                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                                                        isSelected
                                                            ? 'bg-blue-600/10 text-blue-400 font-medium'
                                                            : 'text-text-tertiary hover:bg-background-surface hover:text-text-primary'
                                                    }`}
                                                >
                                                    <FileText size={12} className={isSelected ? 'text-blue-400' : ''} />
                                                    <span className="text-[11px] truncate">{card.displayName}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Right Content — real prompt editor */}
            <div className="flex-1 min-w-0 flex flex-col bg-background-card border border-border-default/40 rounded-xl overflow-hidden">
                <div className="p-5 border-b border-border-default/40 bg-background-surface/30">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[12px] font-medium text-blue-500 uppercase tracking-wider">
                            {selected.page}
                        </span>
                        <ChevronRight size={12} className="text-text-tertiary" />
                        <span className="text-[12px] text-text-tertiary">{selected.displayName}</span>
                        {selected.isHeaderPrompt && (
                            <span className="text-[10px] px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded-full border border-purple-500/20">
                                Page Header
                            </span>
                        )}
                    </div>
                    <h2 className="text-[18px] font-bold text-text-primary mt-1">{selected.displayName}</h2>
                    <p className="text-[12px] text-text-secondary mt-1">
                        {selected.isHeaderPrompt
                            ? `Controls the summary insight shown at the top of the ${selected.page} page.`
                            : `Controls the AI insight generated when a user expands this card.`
                        }
                    </p>
                </div>

                <PromptEditor
                    key={selected.targetId}
                    targetId={selected.targetId}
                    displayName={selected.displayName}
                    page={selected.page}
                    isHeaderPrompt={selected.isHeaderPrompt}
                    applicability={selected.applicability}
                />
            </div>
        </div>
    );
}

function Globe(props) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
}
