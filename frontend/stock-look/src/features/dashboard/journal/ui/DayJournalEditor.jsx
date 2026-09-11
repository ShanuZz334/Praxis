import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useJournalNotes } from '../data/useJournalNotes';
import { Lock, Unlock, Save, Edit3, Sun, Zap, BarChart2, Target, Brain, Sparkles, Check, CheckCircle2 } from 'lucide-react';
import dayjs from 'dayjs';
import RichTextEditor from '@/shared/components/ui/Inputs/RichTextEditor';
import { toast } from 'sonner';

const TRADING_SECTIONS = [
  { id: 'preMarket', label: 'Pre-Market', icon: Sun, desc: 'Preparation & Key Levels' },
  { id: 'inMarket', label: 'In-Market', icon: Zap, desc: 'Execution & Discipline' },
  { id: 'postMarket', label: 'Post-Market', icon: BarChart2, desc: 'Session Review & PnL' },
  { id: 'lessonsLearned', label: 'Lessons', icon: Target, desc: 'Rules for Tomorrow' },
  { id: 'aiInsights', label: 'AI Synthesis', icon: Brain, desc: 'PAI Neural Review' }
];

const OFFDAY_SECTIONS = [
  { id: 'weeklyReview', label: 'Weekly Review', icon: BarChart2, desc: 'Macro Trend & Flows' },
  { id: 'marketAnalysis', label: 'Market Analysis', icon: Sun, desc: 'Sector Alignment' },
  { id: 'lessonsLearned', label: 'Lessons', icon: Target, desc: 'Rule Refinements' },
  { id: 'aiInsights', label: 'AI Synthesis', icon: Brain, desc: 'PAI Neural Review' }
];

const SECTION_TEMPLATES = {
  preMarket: `<h4><strong>🌅 Pre-Market Plan</strong></h4><p><strong>Market Bias:</strong> Bullish / Neutral / Bearish</p><p><strong>Key Levels:</strong> Support @ 23,450 | Resistance @ 23,700</p><p><strong>Daily Risk Budget:</strong> Max ₹5,000 / 1% total capital</p><p><strong>Focus Instruments:</strong> NIFTY, BANKNIFTY</p><p><strong>Catalysts & Macro:</strong> DXY stable, US yields softened overnight</p>`,
  inMarket: `<h4><strong>⚡ In-Market Execution Log</strong></h4><p><strong>Setup Trigger:</strong> 15m VWAP bounce with volume surge</p><p><strong>Execution Discipline:</strong> 9 / 10</p><p><strong>Emotional State:</strong> Calm & patient during pullback</p><p><strong>Intraday Observations:</strong> Heavy call writing noticed at 23,600 strike</p>`,
  postMarket: `<h4><strong>📊 Post-Market Performance Review</strong></h4><p><strong>Session Outcome:</strong> Net disciplined session following strategy</p><p><strong>What Worked Well:</strong> Followed stop loss without hesitation</p><p><strong>Mistakes / Leaks:</strong> Chased secondary breakout without pullback</p><p><strong>Net Takeaway:</strong> Stick to primary morning momentum window</p>`,
  lessonsLearned: `<h4><strong>🎯 Core Lessons & Rules</strong></h4><p><strong>Rule to Enforce Tomorrow:</strong> No fresh options buying after 2:30 PM</p><p><strong>Psychological Correction:</strong> Avoid looking at unrealized P&L during trade</p>`,
  weeklyReview: `<h4><strong>📅 Weekly Performance Synthesis</strong></h4><p><strong>Weekly P&L & Win Rate:</strong> +₹18,500 (68% Win Rate)</p><p><strong>Best Setup:</strong> BankNifty expiry mean reversion</p><p><strong>Key Area for Improvement:</strong> Position sizing consistency</p>`,
  marketAnalysis: `<h4><strong>🌐 Macro & Market Structure</strong></h4><p><strong>Market Regime:</strong> Trending Bullish above 20 EMA</p><p><strong>Institutional Flows:</strong> FIIs turned net buyers (+₹1,200 Cr)</p><p><strong>Sector Leaders:</strong> IT, Auto outperforming</p>`
};

export function DayJournalEditor({ date, isOffDay }) {
  const SECTIONS = isOffDay ? OFFDAY_SECTIONS : TRADING_SECTIONS;
  const { notes, saveNotes, loading } = useJournalNotes(date);
  
  const [activeTab, setActiveTab] = useState(SECTIONS[0].id);
  const [localNotes, setLocalNotes] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [isUnlocked, setIsUnlocked] = useState(true);

  // When day changes, sync notes
  useEffect(() => {
    setActiveTab(SECTIONS[0].id);
  }, [isOffDay, date]);

  useEffect(() => {
    if (notes) {
      setLocalNotes(notes);
      setHasUnsavedChanges(false);
    } else {
      setLocalNotes({});
      setHasUnsavedChanges(false);
    }
  }, [notes]);

  const activeContent = localNotes[activeTab] || '';
  const isTabEmpty = useMemo(() => {
    if (!activeContent) return true;
    const stripped = activeContent.replace(/<[^>]*>?/gm, '').trim();
    return stripped.length === 0;
  }, [activeContent]);

  const wordCount = useMemo(() => {
    if (!activeContent) return 0;
    const text = activeContent.replace(/<[^>]*>?/gm, ' ').trim();
    return text ? text.split(/\s+/).filter(Boolean).length : 0;
  }, [activeContent]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await saveNotes(localNotes);
      setHasUnsavedChanges(false);
      setLastSavedTime(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));
      toast.success('Journal entries saved successfully');
    } catch (err) {
      toast.error('Failed to save journal', { description: err.message });
    } finally {
      setIsSaving(false);
    }
  }, [saveNotes, localNotes]);

  // Keyboard shortcut Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  const handleContentChange = (val) => {
    setLocalNotes(prev => ({
      ...prev,
      [activeTab]: val
    }));
    setHasUnsavedChanges(true);
  };

  const handleInsertTemplate = () => {
    const template = SECTION_TEMPLATES[activeTab];
    if (template) {
      handleContentChange(template);
      toast.success(`${SECTIONS.find(s => s.id === activeTab)?.label} template inserted`);
    }
  };

  const isPast = dayjs(date).startOf('day').isBefore(dayjs().startOf('day'));

  return (
    <div className="flex flex-col h-full bg-background-card/80 backdrop-blur-xl rounded-2xl border border-border-default/60 shadow-lg overflow-hidden flex-1 transition-all">
      {/* ── Top Header ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-default/40 bg-background-surface/40">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Edit3 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">Trader's Journal & Reflection</h3>
              {isPast && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Historical Entry
                </span>
              )}
            </div>
            <p className="text-[11px] text-text-secondary">Document preparation, execution psychology, and session takeaways</p>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2.5">
          {/* Status badge */}
          {hasUnsavedChanges ? (
            <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Unsaved
            </span>
          ) : lastSavedTime ? (
            <span className="text-[11px] text-text-tertiary hidden sm:flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              Saved at {lastSavedTime}
            </span>
          ) : null}

          {/* Toggle Lock / Unlock for historical dates */}
          {isPast && (
            <button
              onClick={() => setIsUnlocked(!isUnlocked)}
              className={`p-1.5 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                isUnlocked 
                  ? 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20' 
                  : 'bg-white/5 border-border-default text-text-tertiary hover:text-text-primary'
              }`}
              title={isUnlocked ? 'Switch to Read-Only' : 'Unlock for Editing'}
            >
              {isUnlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span className="text-[10px] hidden md:inline">{isUnlocked ? 'Editable' : 'Locked'}</span>
            </button>
          )}

          {/* Save Button */}
          <button 
            onClick={handleSave}
            disabled={isSaving || loading || (isPast && !isUnlocked)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow-blue-500/20 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Notes'}</span>
          </button>
        </div>
      </div>

      {/* ── Segmented Navigation Pills ────────────────────────────── */}
      <div className="px-5 py-2.5 border-b border-border-default/40 bg-background-surface/20 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {SECTIONS.map(section => {
          const Icon = section.icon;
          const isSelected = activeTab === section.id;
          const sectionContent = localNotes[section.id];
          const hasContent = Boolean(sectionContent && sectionContent.replace(/<[^>]*>?/gm, '').trim().length > 0);

          return (
            <button
              key={section.id}
              onClick={() => setActiveTab(section.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 border ${
                isSelected 
                  ? 'bg-blue-600/15 border-blue-500/40 text-blue-400 shadow-sm' 
                  : 'bg-transparent border-transparent text-text-secondary hover:text-text-primary hover:bg-white/5'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-400' : 'text-text-tertiary'}`} />
              <span>{section.label}</span>
              {hasContent && (
                <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.8)]' : 'bg-emerald-400'}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Editor Canvas ─────────────────────────────────────────── */}
      <div className="flex-1 p-5 bg-background-surface/10 relative flex flex-col gap-3 min-h-[360px]">
        {/* Helper Banner / Template Inserter when tab is empty */}
        {isTabEmpty && (!isPast || isUnlocked) && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-background-elevated/40 border border-border-default/50 text-xs">
            <div className="flex items-center gap-2 text-text-secondary">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>No notes entered yet for <strong>{SECTIONS.find(s => s.id === activeTab)?.label}</strong>.</span>
            </div>
            {SECTION_TEMPLATES[activeTab] && (
              <button
                onClick={handleInsertTemplate}
                className="px-2.5 py-1 rounded-lg bg-purple-600/15 hover:bg-purple-600/25 text-purple-300 border border-purple-500/30 text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Sparkles className="w-3 h-3" />
                <span>Insert {SECTIONS.find(s => s.id === activeTab)?.label} Template</span>
              </button>
            )}
          </div>
        )}

        {/* AI Insights Action Button when on aiInsights tab */}
        {activeTab === 'aiInsights' && (!isPast || isUnlocked) && (
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-transparent border border-purple-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Brain className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wide">PAI Neural Trading Analyst</h4>
                <p className="text-[11px] text-text-secondary">Synthesize market context, execution discipline, and session statistics</p>
              </div>
            </div>

            <button 
              onClick={async () => {
                const toastId = toast.loading('PAI analyzing session telemetry & execution flow...');
                try {
                  const { default: axiosInstance } = await import('@/shared/utils/axiosInstance');
                  const res = await axiosInstance.post('/api/v1/pace/analyst/journal');
                  if (res.data?.success || res.data?.brief) {
                    const brief = res.data.brief || res.data.message || 'Session analysis completed.';
                    const newContent = (localNotes[activeTab] ? localNotes[activeTab] + '<br/><br/>' : '') + `<div style="padding:12px; border-left:3px solid #8b5cf6; background:rgba(139,92,246,0.08); border-radius:6px;"><h4><strong>🧠 PAI Neural Review (${dayjs(date).format('MMM D, YYYY')}):</strong></h4><p>${brief}</p></div>`;
                    handleContentChange(newContent);
                    toast.success('PAI Global Session Review Generated', { id: toastId });
                  } else {
                    toast.error('Analysis failed', { id: toastId, description: 'No telemetry generated.' });
                  }
                } catch (err) {
                  toast.error('Analysis Failed', { id: toastId, description: err.message });
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Generate AI Review</span>
            </button>
          </div>
        )}

        {/* Rich Text Editor */}
        <div className="flex-1 flex flex-col min-h-[260px] bg-background-elevated/20 rounded-xl border border-border-default/40 overflow-hidden focus-within:border-blue-500/40 transition-colors">
          <RichTextEditor
            className="w-full h-full custom-scrollbar flex-1"
            value={localNotes[activeTab] || ''}
            onChange={handleContentChange}
            readOnly={isPast && !isUnlocked}
            placeholder={
              isPast && !isUnlocked 
                ? "No notes recorded for this section." 
                : `Document your ${SECTIONS.find(s => s.id === activeTab)?.label.toLowerCase()} thoughts, rules, or execution feedback...`
            }
          />
        </div>

        {/* Footer info strip */}
        <div className="flex items-center justify-between text-[11px] text-text-tertiary px-1 pt-1 font-mono">
          <div className="flex items-center gap-3">
            <span>Word count: <strong>{wordCount}</strong> words</span>
            <span>Est. Read: <strong>{Math.max(1, Math.ceil(wordCount / 200))} min</strong></span>
          </div>
          <div className="flex items-center gap-1 text-[10px]">
            <span>Shortcut:</span>
            <kbd className="px-1.5 py-0.5 rounded bg-background-elevated border border-border-default font-mono text-[9px] text-text-secondary">Ctrl</kbd>
            <span>+</span>
            <kbd className="px-1.5 py-0.5 rounded bg-background-elevated border border-border-default font-mono text-[9px] text-text-secondary">S</kbd>
            <span>to save</span>
          </div>
        </div>
      </div>
    </div>
  );
}
