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
  weeklyReview: `<h4><strong>Institutional Weekly Performance &amp; Macro Retrospective</strong></h4>
<p><strong>1. Executive Financial Metrics:</strong></p>
<ul>
  <li><strong>Net Realized P&amp;L:</strong> +₹0.00 | <strong>Win Rate:</strong> 0.0%</li>
  <li><strong>Profit Factor:</strong> 0.0 | <strong>Total Executions:</strong> 0 Trades</li>
  <li><strong>Average Risk:Reward Ratio:</strong> 1 : 0.0</li>
  <li><strong>Max Drawdown / Portfolio Heat:</strong> -₹0.00 (-0.0%)</li>
</ul>
<p><strong>2. Setup Distribution &amp; Execution Quality:</strong></p>
<ul>
  <li><strong>A+ High-Confluence Trades:</strong> Fully aligned with 4-Pillar Matrix (EMA, VWAP, Supertrend, RSI).</li>
  <li><strong>Sub-Optimal / Impulsive Setups:</strong> Logged any premature entries or chases for immediate elimination.</li>
  <li><strong>Execution Discipline Score:</strong> 0 / 10</li>
</ul>
<p><strong>3. Macro Regime &amp; Sector Rotation:</strong></p>
<ul>
  <li><strong>Index Trend Structure:</strong> NIFTY &amp; BANKNIFTY positioning relative to 20 &amp; 50 EMA.</li>
  <li><strong>Institutional Flows:</strong> FII / DII net cash accumulation vs derivative index positioning.</li>
  <li><strong>Volatility Environment:</strong> India VIX shifts and weekend theta decay behavior.</li>
</ul>
<p><strong>4. Behavioral &amp; Psychological Audit:</strong></p>
<ul>
  <li><strong>Cognitive Capital &amp; Fatigue:</strong> Maintained peak focus during active market windows.</li>
  <li><strong>Emotional Equilibrium:</strong> Zero tilt, revenge trading, or hesitation on verified setups.</li>
</ul>
<p><strong>5. High-Impact Strategic Directives for Next Week:</strong></p>
<ul>
  <li><strong>Capital Allocation:</strong> Strictly enforce max daily loss budget.</li>
  <li><strong>Tactical Focus:</strong> Prioritize opening 15m CPR reclaims and avoid mid-day chop.</li>
</ul>`,

  marketAnalysis: `<h4><strong>Macroeconomic &amp; Market Structure Deep-Dive</strong></h4>
<p><strong>1. Benchmark Index Regimes &amp; Trend Health:</strong></p>
<ul>
  <li><strong>NIFTY 50:</strong> Position relative to 20, 50, and 200 EMA. Direction of 20 EMA slope.</li>
  <li><strong>BANKNIFTY:</strong> High-beta banking leadership, PSU vs Private Bank divergence.</li>
  <li><strong>Market Breadth:</strong> Advance/Decline ratio, % of Nifty 500 stocks trading above 50 DMA.</li>
</ul>
<p><strong>2. Institutional Liquidity &amp; Derivatives Positioning:</strong></p>
<ul>
  <li><strong>FII &amp; DII Activity:</strong> Net cash market flows (₹ Cr) and Index Futures Long/Short ratio.</li>
  <li><strong>Option Chain Architecture:</strong> Max Pain strike, Put-Call Ratio (PCR OI), gamma flip level.</li>
</ul>
<p><strong>3. Sectoral Rotation &amp; Relative Strength:</strong></p>
<ul>
  <li><strong>Leading Sectors (Outperforming):</strong> High institutional accumulation &amp; momentum.</li>
  <li><strong>Lagging Sectors (Underperforming):</strong> Capital distribution &amp; defensive rotation.</li>
</ul>
<p><strong>4. Global Tailwinds &amp; Intermarket Dynamics:</strong></p>
<ul>
  <li><strong>Currency &amp; Commodities:</strong> USD/INR exchange rate, Dollar Index (DXY), Brent Crude.</li>
  <li><strong>Sovereign Spreads:</strong> US 10Y Treasury Yield, India 10Y G-Sec yield trend.</li>
</ul>`,

  preMarket: `<h4><strong>Institutional Pre-Market Strategic Gameplan</strong></h4>
<p><strong>1. Overnight Global Sentiment &amp; Macro Clues:</strong></p>
<ul>
  <li><strong>GIFT Nifty Open Implication:</strong> Flat / Gap-Up / Gap-Down (+/- 00 pts).</li>
  <li><strong>Global Cues:</strong> S&amp;P 500 Futures, US 10Y Yields, DXY (Dollar Index), Brent Crude.</li>
  <li><strong>Market Catalysts:</strong> Scheduled earnings, RBI/Fed commentary, macro data releases.</li>
</ul>
<p><strong>2. Structural Levels &amp; Confluence Architecture:</strong></p>
<ul>
  <li><strong>Pivot Framework:</strong> Central Pivot Range (CPR) Width: Narrow / Average / Wide.</li>
  <li><strong>Major Demand Zones (Support):</strong> S1 @ 00,000 | S2 @ 00,000</li>
  <li><strong>Major Supply Zones (Resistance):</strong> R1 @ 00,000 | R2 @ 00,000</li>
</ul>
<p><strong>3. Risk Budget &amp; Sizing Constraints:</strong></p>
<ul>
  <li><strong>Max Daily Loss Limit:</strong> ₹0,000 (Non-negotiable terminal auto-lock).</li>
  <li><strong>Max Risk Per Trade:</strong> ₹0,000 (0.5% - 1.0% of active capital).</li>
  <li><strong>Position Sizing Limit:</strong> Max 0 lots / contracts per entry.</li>
</ul>
<p><strong>4. Primary Execution Scenarios:</strong></p>
<ul>
  <li><strong>Plan A (Trend Continuation):</strong> Sustained trade above CPR &amp; VWAP &rarr; Long momentum.</li>
  <li><strong>Plan B (Mean Reversion / Fade):</strong> Rejection at major resistance with negative delta &rarr; Short to VWAP.</li>
</ul>`,

  inMarket: `<h4><strong>In-Market Real-Time Execution Log</strong></h4>
<p><strong>1. Live Trade Executions &amp; Setup Audit:</strong></p>
<ul>
  <li><strong>Ticker &amp; Instrument:</strong> [ e.g. NIFTY 24500 CE - LONG ]</li>
  <li><strong>Confluence Rating:</strong> 4/4 Confluence (EMA + VWAP + Supertrend + RSI Momentum).</li>
  <li><strong>Entry Trigger &amp; Price:</strong> 15m breakout candle close @ ₹000.00</li>
  <li><strong>Stop Loss &amp; Target:</strong> Hard stop in terminal @ ₹000.00 | Target @ ₹000.00 (1:2 R:R)</li>
</ul>
<p><strong>2. In-Trade Psychology &amp; Stress Telemetry:</strong></p>
<ul>
  <li><strong>Emotional Pulse:</strong> Calm, detached, zero urge to micromanage or widen stop loss.</li>
  <li><strong>Patience Grade:</strong> 10 / 10 (Waited for confirmed candle close before firing order).</li>
  <li><strong>Cognitive Capital:</strong> High focus, no distraction.</li>
</ul>
<p><strong>3. Order Flow &amp; Intraday Telemetry:</strong></p>
<ul>
  <li><strong>Cumulative Volume Delta (CVD):</strong> Positive absorption by buyers at key support.</li>
  <li><strong>Option Chain Shifts:</strong> Heavy Put writing at round strike supporting price floor.</li>
</ul>`,

  postMarket: `<h4><strong>Post-Market Performance &amp; Execution Audit</strong></h4>
<p><strong>1. Financial Accounting &amp; Session Stats:</strong></p>
<ul>
  <li><strong>Gross Realized P&amp;L:</strong> ₹0.00 | <strong>Net P&amp;L (Post-Brokerage):</strong> ₹0.00</li>
  <li><strong>Executions Taken:</strong> 0 Trades (0 Winners | 0 Losers)</li>
  <li><strong>Execution Discipline Score:</strong> A+ / A / B / C / F</li>
</ul>
<p><strong>2. Tactical Process Audit:</strong></p>
<ul>
  <li><strong>What Worked Flawlessly:</strong> Respected stop loss without hesitation, executed high-probability setup.</li>
  <li><strong>Process Friction / Slippage:</strong> Minor hesitation on entry or partial profit-taking before target.</li>
</ul>
<p><strong>3. Cognitive &amp; Psychological Audit:</strong></p>
<ul>
  <li><strong>Tilt / Revenge Trading Incidents:</strong> Zero (100% disciplined emotional equilibrium).</li>
  <li><strong>Energy &amp; Mental Depletion:</strong> High cognitive reserve preserved for tomorrow.</li>
</ul>
<p><strong>4. Forward Carry &amp; Overnight Preparation:</strong></p>
<ul>
  <li><strong>Levels to Carry Forward:</strong> Previous Day High (PDH), Previous Day Low (PDL), Closing VWAP.</li>
  <li><strong>Watchlist Priorities:</strong> Top relative strength leaders showing institutional accumulation.</li>
</ul>`,

  lessonsLearned: `<h4><strong>Codified Trading Rules &amp; Behavioral Lessons</strong></h4>
<p><strong>1. Tactical Lessons from Today's Price Action:</strong></p>
<ul>
  <li>Never chase an extended move after 3 consecutive green bars without a VWAP retest.</li>
  <li>Always place stop orders inside the terminal immediately upon fill confirmation.</li>
</ul>
<p><strong>2. Psychological &amp; Behavioral Rules to Codify:</strong></p>
<ul>
  <li><strong>The 15-Minute Rule:</strong> Step away from all screens immediately after closing a losing trade.</li>
  <li><strong>Execution Over P&amp;L:</strong> Grade performance strictly by rule compliance, never solely by dollar outcome.</li>
</ul>
<p><strong>3. Process Improvement Action:</strong></p>
<ul>
  <li>Review the 4-Pillar Confluence checklist before every trade entry.</li>
</ul>`,

  aiInsights: `<h4><strong>PAI Neural Session &amp; Behavioral Synthesis</strong></h4>
<p><strong>1. Session Telemetry &amp; Macro Environment:</strong></p>
<ul>
  <li><strong>Market Volatility Regime:</strong> Balanced / Expanding / Compressed</li>
  <li><strong>Systemic Risk Assessment:</strong> Low / Elevated / Extreme</li>
  <li><strong>Dominant Trend Alignment:</strong> Bullish / Bearish / Neutral Consolidation</li>
</ul>
<p><strong>2. Model Calibration &amp; Predictive Performance:</strong></p>
<ul>
  <li><strong>PACE Directional Accuracy:</strong> 0.0% across closed prediction bars.</li>
  <li><strong>Net Close Bias:</strong> +0.00 (Assessing target overshoot vs undershoot).</li>
  <li><strong>Active Bayesian Shrinkage:</strong> 0% calibration weight applied.</li>
</ul>
<p><strong>3. Behavioral Discipline &amp; Cognitive Audit:</strong></p>
<ul>
  <li><strong>Rules Adherence Grade:</strong> A+ (Strict adherence to entry &amp; stop rules).</li>
  <li><strong>Impulsive Bias Check:</strong> Zero FOMO or unconfirmed premature entries.</li>
  <li><strong>Risk-Per-Trade Integrity:</strong> Position sizing capped strictly at budget.</li>
</ul>
<p><strong>4. Quantitative Directives for Next Session:</strong></p>
<ul>
  <li><strong>Key Boundary Focus:</strong> Monitor VWAP pivot and central pivot levels on the open.</li>
  <li><strong>Execution Guardrail:</strong> Hard terminal lock upon hitting max daily loss ceiling.</li>
</ul>`
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
    <div className="flex flex-col h-full bg-white dark:bg-background-card/80 backdrop-blur-xl rounded-2xl border border-border-default/60 shadow-lg overflow-hidden flex-1 transition-all">
      {/* ── Top Header ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-default/40 bg-slate-50/70 dark:bg-background-surface/40">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400">
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
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
              Unsaved
            </span>
          ) : lastSavedTime ? (
            <span className="text-[11px] text-text-tertiary hidden sm:flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              Saved at {lastSavedTime}
            </span>
          ) : null}

          {/* Toggle Lock / Unlock for historical dates */}
          {isPast && (
            <button
              onClick={() => setIsUnlocked(!isUnlocked)}
              className={`p-1.5 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                isUnlocked 
                  ? 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20' 
                  : 'bg-slate-100 dark:bg-white/5 border-border-default text-text-tertiary hover:text-text-primary'
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
      <div className="px-5 py-2.5 border-b border-border-default/40 bg-slate-50/40 dark:bg-background-surface/20 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
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
                  ? 'bg-blue-600/15 border-blue-500/40 text-blue-600 dark:text-blue-400 shadow-sm' 
                  : 'bg-transparent border-transparent text-text-secondary hover:text-text-primary hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-text-tertiary'}`} />
              <span>{section.label}</span>
              {hasContent && (
                <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-blue-600 dark:bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.8)]' : 'bg-emerald-500 dark:bg-emerald-400'}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Editor Canvas ─────────────────────────────────────────── */}
      <div className="flex-1 p-5 bg-transparent dark:bg-background-surface/10 relative flex flex-col gap-3 min-h-[360px]">
        {/* Helper Banner / Template Inserter when tab is empty */}
        {isTabEmpty && (!isPast || isUnlocked) && (
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40 text-xs shadow-xs">
            <div className="flex items-center gap-2.5 text-slate-800 dark:text-purple-200 font-medium">
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
              <span>No notes entered yet for <strong>{SECTIONS.find(s => s.id === activeTab)?.label}</strong>.</span>
            </div>
            {SECTION_TEMPLATES[activeTab] && (
              <button
                onClick={handleInsertTemplate}
                className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white border border-purple-600 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-white" />
                <span>Insert {SECTIONS.find(s => s.id === activeTab)?.label} Template</span>
              </button>
            )}
          </div>
        )}

        {/* AI Insights Action Button when on aiInsights tab */}
        {activeTab === 'aiInsights' && (!isPast || isUnlocked) && (
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-transparent border border-purple-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
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
                    
                    // Format markdown headings and bullet points into rich HTML
                    let formattedHtml = brief
                      .replace(/^### (.*?)$/gm, '<h3 style="color:#8b5cf6; margin-top:14px; margin-bottom:6px; font-weight:bold; font-size:14px;">$1</h3>')
                      .replace(/^#### (.*?)$/gm, '<h4 style="color:#3b82f6; margin-top:10px; margin-bottom:4px; font-weight:bold; font-size:12px;">$1</h4>')
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/^- (.*?)$/gm, '<li style="margin-bottom:3px;">$1</li>')
                      .replace(/\n\n/g, '<br/>');

                    formattedHtml = formattedHtml.replace(/((?:<li style="margin-bottom:3px;">.*?<\/li>\s*)+)/gs, '<ul style="padding-left:18px; margin-bottom:10px;">$1</ul>');

                    const newContent = (localNotes[activeTab] ? localNotes[activeTab] + '<br/><br/>' : '') + `<div style="padding:16px; border-left:4px solid #8b5cf6; background:rgba(139,92,246,0.06); border-radius:10px; margin-bottom:12px;">${formattedHtml}</div>`;
                    handleContentChange(newContent);
                    toast.success('PAI Global Session Review Generated', { id: toastId });
                  } else {
                    toast.error('Analysis failed', { id: toastId, description: 'No telemetry generated.' });
                  }
                } catch (err) {
                  const detail = err.response?.data?.details || err.response?.data?.error || err.message;
                  toast.error('Analysis Failed', { id: toastId, description: detail });
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white border border-purple-600 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span>Generate AI Review</span>
            </button>
          </div>
        )}

        {/* Rich Text Editor */}
        <div className="flex-1 flex flex-col min-h-[260px] bg-white dark:bg-background-elevated/20 rounded-xl border border-border-default/60 overflow-hidden focus-within:border-blue-500/40 transition-colors shadow-xs">
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
