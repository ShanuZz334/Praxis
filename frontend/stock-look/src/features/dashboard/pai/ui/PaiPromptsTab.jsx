import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    LayoutDashboard, LineChart, Activity, Briefcase,
    ChevronDown, ChevronRight, MessageSquare, FileText,
    Save, CheckCircle, AlertCircle,
    BookOpen, Plus
} from 'lucide-react';
import { useCardPrompt } from '@/shared/hooks/useCardInsight';
import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
import Loader from '@/shared/components/ui/Loader';
import axiosInstance from '@/shared/utils/axiosInstance';

// ─── Inline Globe Icon ────────────────────────────────────────────────────────
function Globe(props) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 16} height={props.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
            <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
    );
}

// ─── Golden Rules (fetched from backend) ──────────
// Will be loaded via useEffect


// ═══════════════════════════════════════════════════════════════════════════════
// PAGE TREE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

const PAGE_CATEGORIES = [
    { id: 'Master',             label: 'Master Dashboard',   icon: LayoutDashboard },
    { id: 'Fundamentals',       label: 'Fundamentals',        icon: Briefcase        },
    { id: 'Technical',          label: 'Technical Analysis',  icon: LineChart        },
    { id: 'Options',            label: 'Options Analysis',    icon: Activity         },
    { id: 'Foreign',            label: 'Foreign Markets',     icon: Globe            },
    { id: 'Events',             label: 'Events',              icon: BookOpen         },
    { id: 'QChat',              label: 'QChat (Floating)',    icon: MessageSquare    },
];

/**
 * Header & Manual Chat prompt entries per page.
 * ⚠  targetIds MUST exactly match AiInsightSection.jsx resolveTargetId() output.
 */
const PAGE_HEADERS = {
    Master: [
        { targetId: 'praxis_composite_header',     displayName: 'Master Dashboard Header' },
        { targetId: 'master_manual_chat',          displayName: 'Manual Chat'              },
    ],
    Fundamentals: [
        { targetId: 'fundamentals_index_header',   displayName: 'Header — Index Mode'   },
        { targetId: 'fundamentals_company_header', displayName: 'Header — Company Mode' },
        { targetId: 'fund_manual',                 displayName: 'Manual Chat'            },
    ],
    Technical: [
        { targetId: 'technical_index_header',      displayName: 'Header — Index Mode'   },
        { targetId: 'technical_company_header',    displayName: 'Header — Company Mode' },
        { targetId: 'tech_manual',                 displayName: 'Manual Chat'            },
    ],
    Options: [
        { targetId: 'options_index_header',        displayName: 'Options Header — Index Mode'         },
        { targetId: 'options_company_header',      displayName: 'Options Header — Company Mode'         },
        { targetId: 'options_manual',              displayName: 'Manual Chat'            },
    ],
    Foreign: [
        { targetId: 'foreign_header',              displayName: 'Foreign Markets Header' },
        { targetId: 'global_manual',               displayName: 'Manual Chat'            },
    ],
    Events: [
        { targetId: 'events_header',               displayName: 'Events Header' },
    ],
    QChat: [
        { targetId: 'qchat_global',        displayName: 'Global QChat'         },
        { targetId: 'qchat_fundamentals',  displayName: 'Fundamentals Context' },
        { targetId: 'qchat_technical',     displayName: 'Technicals Context'   },
        { targetId: 'qchat_options',       displayName: 'Options Context'      },
        { targetId: 'master_qchat',        displayName: 'Master/Global Context'},
        { targetId: 'qchat_events',        displayName: 'Events Context'       },
    ],
};

function buildTree() {
    const tree = {};
    PAGE_CATEGORIES.forEach(p => {
        const cardsForPage = Object.values(CARD_REGISTRY).filter(c => c.page === p.id && c.type === 'card');
        
        const expandedCards = [];
        cardsForPage.forEach(c => {
            if (c.appliesTo === 'both') {
                expandedCards.push({ targetId: c.id + '_company', displayName: c.displayName + ' — Company Mode', applicability: 'company' });
                expandedCards.push({ targetId: c.id + '_index', displayName: c.displayName + ' — Index Mode', applicability: 'indices' });
            } else {
                expandedCards.push({ targetId: c.id, displayName: c.displayName, applicability: c.appliesTo });
            }
        });

        tree[p.id] = {
            headers: PAGE_HEADERS[p.id] || [],
            cards: expandedCards,
        };
    });
    return tree;
}

const TREE = buildTree();

// ═══════════════════════════════════════════════════════════════════════════════
// PROMPT EDITOR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function PromptEditor({ targetId, displayName, page, isHeaderPrompt, applicability }) {
    console.log("Rendering PromptEditor for", targetId, "isHeaderPrompt:", isHeaderPrompt);
    const {
        systemInstruction,
        setSystemInstruction,
        presets,
        setPresets,
        activePresetId,
        setActivePresetId,
        isDefault,
        isLoading,
        isSaving,
        fetchPrompt,
        savePrompt,
    } = useCardPrompt(targetId);

    const textareaRef       = useRef(null);
    const [saveStatus, setSaveStatus]         = useState(null);      // 'saved' | 'error'
    const [showRules, setShowRules]           = useState(false);

    // Decouple the tab being edited from the active dashboard mode
    const [editingPresetId, setEditingPresetId] = useState('default');

    // Sync editing tab when the active preset changes (e.g., on initial fetch)
    useEffect(() => {
        setEditingPresetId(activePresetId || 'default');
    }, [activePresetId, targetId]);

    // Fetch prompt whenever selected card changes
    useEffect(() => {
        if (targetId) fetchPrompt();
    }, [targetId]);

    const activeContent = isHeaderPrompt && editingPresetId !== 'default'
        ? (presets.find(p => p.id === editingPresetId)?.systemInstruction || '')
        : systemInstruction;

    const handleTextChange = (val) => {
        if (isHeaderPrompt && editingPresetId !== 'default') {
            setPresets(prev => prev.map(p => p.id === editingPresetId ? { ...p, systemInstruction: val } : p));
        } else {
            setSystemInstruction(val);
        }
    };

    // ── Save handler ─────────────────────────────────────────────────────────
    const handleSave = async (overrideActivePresetId = undefined) => {
        // Sync the edited content into the presets array for the current tab
        const latestPresets = presets.map(p =>
            p.id === editingPresetId ? { ...p, systemInstruction: activeContent } : p
        );

        // When editing the Default tab, activeContent IS the root systemInstruction.
        // When editing a named preset tab, the root systemInstruction stays as-is.
        const rootInstruction = (editingPresetId === 'default' || !isHeaderPrompt)
            ? activeContent
            : systemInstruction;

        try {
            await savePrompt({
                systemInstruction: rootInstruction,
                displayName,
                page,
                isHeaderPrompt,
                applicability,
                overrideActivePresetId,
                overridePresets: latestPresets
            });
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus(null), 3000);
        } catch {
            setSaveStatus('error');
            setTimeout(() => setSaveStatus(null), 3000);
        }
    };

    const handleSetCurrent = async () => {
        // Set activePresetId optimistically in state, then save with the explicit override
        setActivePresetId(editingPresetId);
        await handleSave(editingPresetId);
    };

    const addCustomPreset = async () => {
        const name = prompt("Enter a name for the new preset (e.g., 'Scalping'):");
        if (!name || !name.trim()) return;
        const id = 'custom_' + Date.now();
        // Start with the current Default content so the new preset has something useful
        const newPreset = { id, name: name.trim(), systemInstruction: systemInstruction, isCustom: true };
        const newPresets = [...presets, newPreset];
        setPresets(newPresets);
        setEditingPresetId(id);
        // Auto-save immediately so the preset persists without requiring a manual Save click
        try {
            await savePrompt({
                systemInstruction,
                displayName,
                page,
                isHeaderPrompt,
                applicability,
                overrideActivePresetId: activePresetId,   // don't change the active preset
                overridePresets: newPresets
            });
        } catch {
            // Silent — user will see stale state and can retry with Save Prompt
        }
    };

    const [goldenRules, setGoldenRules] = useState([]);

    useEffect(() => {
        axiosInstance.get('/api/v1/ai-prompts/golden-rules')
            .then(res => setGoldenRules(res.data))
            .catch(err => console.error('Failed to load golden rules', err));
    }, []);

    // ── Placeholder text ─────────────────────────────────────────────────────
    const placeholder = `e.g. You are Praxis, an elite Indian market analyst. Analyze {name} for {stockSymbol}. The current value is {value} with a score of {score}/100 and a {bias} bias. Provide a 2-sentence verdict focusing on near-term price action implications.`;

    return (
        <>
            <div className="absolute top-[22px] right-5 lg:right-6 pointer-events-none z-10">
                {isDefault ? (
                    <span className="text-[10px] font-medium text-text-tertiary bg-background-elevated/80 backdrop-blur-sm px-2.5 py-1 rounded-md border border-border-default/30 uppercase tracking-wider">
                        Using Default
                    </span>
                ) : (
                    <span className="text-[10px] font-medium text-blue-400 bg-blue-500/10 backdrop-blur-sm px-2.5 py-1 rounded-md border border-blue-500/20 uppercase tracking-wider">
                        Custom Prompt
                    </span>
                )}
            </div>
            <div className="flex-1 p-5 lg:p-6 flex flex-col gap-5 overflow-y-auto custom-scrollbar">

            {/* ── Golden Rules Banner ──────────────────────────────────────── */}
            <div className="border border-border-default/40 rounded-xl bg-background-elevated/50">
                <button
                    type="button"
                    onClick={() => setShowRules(prev => !prev)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-background-surface transition-colors cursor-pointer rounded-xl"
                >
                    <div className="flex items-center gap-2">
                        <BookOpen size={14} className="text-amber-500/80" />
                        <span className="text-[12px] font-medium text-text-secondary">
                            Golden Rules <span className="text-text-tertiary font-normal">— Enforced system-wide regardless of custom prompt</span>
                        </span>
                    </div>
                    {showRules
                        ? <ChevronDown size={14} className="text-text-tertiary" />
                        : <ChevronRight size={14} className="text-text-tertiary" />
                    }
                </button>
                <div className={`px-4 pb-4 pt-1 space-y-2.5 border-t border-border-default/30 ${showRules ? 'block' : 'hidden'}`}>
                    {goldenRules.map((rule, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-[12px] text-text-tertiary">
                            <span className="text-amber-500/60 font-mono mt-0.5 shrink-0">{idx + 1}.</span>
                            <span className="leading-relaxed">{rule}</span>
                        </div>
                    ))}
                </div>
            </div>



            {isLoading ? (
                <div className="flex-1 flex items-center justify-center min-h-[300px]">
                    <Loader size="sm" color="blue" />
                </div>
            ) : (
                <>
                    {/* ── Preset Tabs (Headers Only) ───────────────────────────────── */}
                    {(isHeaderPrompt || targetId === 'master_header') && (
                        <div className="flex items-center gap-2 mb-4 overflow-x-auto custom-scrollbar min-h-[36px]">
                            <button
                                onClick={() => setEditingPresetId('default')}
                                className={`px-3 py-1.5 text-[12px] font-medium transition-all whitespace-nowrap rounded-lg ${
                                    activePresetId === 'default'
                                        ? 'bg-blue-500/15 border border-blue-500/30 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.1)]'
                                        : editingPresetId === 'default'
                                            ? 'border border-blue-500/50 text-blue-400 bg-transparent'
                                            : 'border border-transparent text-text-secondary hover:text-text-primary hover:bg-background-elevated'
                                }`}
                            >
                                Default
                            </button>
                            {presets && presets.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => setEditingPresetId(p.id)}
                                    className={`px-3 py-1.5 text-[12px] font-medium transition-all whitespace-nowrap rounded-lg ${
                                        activePresetId === p.id
                                            ? 'bg-blue-500/15 border border-blue-500/30 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.1)]'
                                            : editingPresetId === p.id
                                                ? 'border border-blue-500/50 text-blue-400 bg-transparent'
                                                : 'border border-transparent text-text-secondary hover:text-text-primary hover:bg-background-elevated'
                                    }`}
                                >
                                    {p.name}
                                </button>
                            ))}
                            <button
                                onClick={addCustomPreset}
                                title="Add Custom Preset"
                                className="px-3 py-2 text-text-tertiary hover:text-text-primary transition-colors ml-2"
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                    )}

                    {/* ── Textarea ─────────────────────────────────────────────────── */}
                    <textarea
                        ref={textareaRef}
                        value={activeContent}
                        onChange={e => handleTextChange(e.target.value)}
                        placeholder={placeholder}
                        spellCheck={false}
                        className="flex-1 w-full min-h-[250px] bg-background-app/50 border border-border-default/40 focus:border-blue-500/50 rounded-xl p-5 text-[13px] text-text-primary leading-loose focus:outline-none custom-scrollbar resize-none font-mono transition-colors"
                    />
                </>
            )}

            {/* ── Footer: targetId + Save ─────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-2 gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider text-text-tertiary font-semibold">Target ID</span>
                    <code className="text-[11px] text-blue-400 font-mono">
                        {targetId}
                    </code>
                </div>
                <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                    {saveStatus === 'saved' && (
                        <span className="flex items-center gap-1.5 text-[12px] font-medium text-emerald-500 animate-in fade-in">
                            <CheckCircle size={14} /> Saved
                        </span>
                    )}
                    {saveStatus === 'error' && (
                        <span className="flex items-center gap-1.5 text-[12px] font-medium text-rose-500 animate-in fade-in">
                            <AlertCircle size={14} /> Failed
                        </span>
                    )}
                    
                    {isHeaderPrompt && editingPresetId !== activePresetId && (
                        <button
                            onClick={handleSetCurrent}
                            disabled={isSaving || isLoading}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-900/20 hover:bg-blue-900/40 border border-blue-500/30 text-blue-400 text-[13px] font-semibold rounded-xl transition-colors w-full sm:w-auto"
                        >
                            Set as Active Preset
                        </button>
                    )}

                    <button
                        onClick={() => handleSave()}
                        disabled={isSaving || isLoading}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-[13px] font-semibold rounded-xl transition-colors w-full sm:w-auto"
                    >
                        {isSaving ? <Loader size="xxs" color="white" /> : <Save size={15} />}
                        Save Prompt
                    </button>
                </div>
            </div>
        </div>
        </>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function PaiPromptsTab() {
    const [expandedPages, setExpandedPages] = useState({});
    const [selected, setSelected] = useState(null);

    const togglePage = useCallback((pageId) => {
        setExpandedPages(prev => ({ ...prev, [pageId]: !prev[pageId] }));
    }, []);

    const selectEntry = useCallback((entry, page, isHeader) => {
        setSelected({
            targetId:       entry.targetId,
            displayName:    entry.displayName,
            page,
            isHeaderPrompt: isHeader || false,
            applicability:  entry.applicability || 'both',
        });
    }, []);

    return (
        <div className="animate-in fade-in duration-300 flex flex-col lg:flex-row gap-5 h-[calc(100vh-200px)]">

            {/* ── Left Sidebar ─────────────────────────────────────────────── */}
            <div className="w-full lg:w-64 shrink-0 flex flex-col border border-border-default/40 rounded-xl bg-background-card overflow-hidden">
                <div className="p-3 border-b border-border-default/40 bg-background-surface/30">
                    <h2 className="text-[14px] font-bold text-text-primary px-1">
                        Pages &amp; Cards
                        <span className="ml-2 text-[10px] font-normal text-text-tertiary">
                            ({Object.keys(CARD_REGISTRY).length} cards)
                        </span>
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                    {PAGE_CATEGORIES.map(page => {
                        const isExpanded = expandedPages[page.id];
                        const pageData   = TREE[page.id];
                        const totalCount = pageData.headers.length + pageData.cards.length;

                        return (
                            <div key={page.id} className="flex flex-col">
                                {/* Page row */}
                                <button
                                    onClick={() => togglePage(page.id)}
                                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                                        isExpanded ? 'bg-background-surface/40' : 'hover:bg-background-surface/20'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <page.icon
                                            size={16}
                                            className={isExpanded ? 'text-blue-500' : 'text-text-tertiary'}
                                        />
                                        <span className={`text-[13px] font-medium ${isExpanded ? 'text-text-primary' : 'text-text-secondary'}`}>
                                            {page.label}
                                        </span>
                                        <span className="text-[10px] text-text-tertiary bg-background-elevated px-1.5 py-0.5 rounded-full">
                                            {totalCount}
                                        </span>
                                    </div>
                                    {isExpanded
                                        ? <ChevronDown size={14} className="text-text-tertiary" />
                                        : <ChevronRight size={14} className="text-text-tertiary" />
                                    }
                                </button>

                                {/* Children */}
                                {isExpanded && (
                                    <div className="flex flex-col mt-1 ml-4 pl-3 border-l border-border-default/30 space-y-0.5">

                                        {/* Page-level headers + manual chats (purple) */}
                                        {pageData.headers.map(h => {
                                            const isSel = selected?.targetId === h.targetId;
                                            const isChat = h.targetId.endsWith('_manual') || h.targetId.startsWith('qchat_');
                                            return (
                                                <button
                                                    key={h.targetId}
                                                    onClick={() => selectEntry(h, page.id, !isChat)}
                                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                                                        isSel
                                                            ? isChat
                                                                ? 'bg-teal-600/10 text-teal-400 font-medium'
                                                                : 'bg-purple-600/10 text-purple-400 font-medium'
                                                            : 'text-text-tertiary hover:bg-background-surface hover:text-text-primary'
                                                    }`}
                                                >
                                                    <MessageSquare size={12} className={isSel ? (isChat ? 'text-teal-400' : 'text-purple-400') : ''} />
                                                    <span className="text-[11px] truncate">{h.displayName}</span>
                                                </button>
                                            );
                                        })}

                                        {/* Card prompts (blue) */}
                                        {pageData.cards.map(card => {
                                            const isSel = selected?.targetId === card.targetId;
                                            return (
                                                <button
                                                    key={card.targetId}
                                                    onClick={() => selectEntry(card, page.id, false)}
                                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                                                        isSel
                                                            ? 'bg-blue-600/10 text-blue-400 font-medium'
                                                            : 'text-text-tertiary hover:bg-background-surface hover:text-text-primary'
                                                    }`}
                                                >
                                                    <FileText size={12} className={isSel ? 'text-blue-400' : ''} />
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

            {/* ── Right Content — enhanced prompt editor ───────────────────── */}
            <div className="flex-1 min-w-0 flex flex-col bg-background-card border border-border-default/40 rounded-xl overflow-hidden relative">
                {selected ? (
                    <>
                        {/* Breadcrumb header */}
                        <div className="p-5 border-b border-border-default/40 bg-background-surface/30 shrink-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[12px] font-medium text-blue-500 uppercase tracking-wider">
                                    {selected.page}
                                </span>
                                <ChevronRight size={12} className="text-text-tertiary" />
                                <span className="text-[12px] text-text-tertiary">{selected.displayName}</span>
                                {selected.isHeaderPrompt && !selected.targetId?.endsWith('_manual') && (
                                    <span className="text-[10px] px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded-full border border-purple-500/20">
                                        Page Header
                                    </span>
                                )}
                                {selected.targetId?.endsWith('_manual') && (
                                    <span className="text-[10px] px-2 py-0.5 bg-teal-500/10 text-teal-400 rounded-full border border-teal-500/20">
                                        Manual Chat
                                    </span>
                                )}
                                {selected.targetId?.startsWith('qchat_') && (
                                    <span className="text-[10px] px-2 py-0.5 bg-teal-500/10 text-teal-400 rounded-full border border-teal-500/20">
                                        QChat
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Editor — keyed by targetId so it fully remounts on selection change */}
                        <PromptEditor
                            key={selected.targetId}
                            targetId={selected.targetId}
                            displayName={selected.displayName}
                            page={selected.page}
                            isHeaderPrompt={selected.isHeaderPrompt}
                            applicability={selected.applicability}
                        />
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-text-tertiary gap-3">
                        <FileText size={32} className="opacity-20" />
                        <span className="text-[13px]">Select a card from the left panel to configure its AI instruction</span>
                    </div>
                )}
            </div>
        </div>
    );
}
