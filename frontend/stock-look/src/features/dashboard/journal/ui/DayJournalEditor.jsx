import React, { useState, useEffect } from 'react';
import { useJournalNotes } from '../data/useJournalNotes';
import { Lock, Save, Edit3 } from 'lucide-react';
import dayjs from 'dayjs';
import RichTextEditor from '@/shared/components/ui/Inputs/RichTextEditor';

const TRADING_SECTIONS = [
  { id: 'preMarket', label: 'Pre-Market' },
  { id: 'inMarket', label: 'In-Market' },
  { id: 'postMarket', label: 'Post-Market' },
  { id: 'lessonsLearned', label: 'Lessons Learned' },
  { id: 'aiInsights', label: 'AI Insights' }
];

const OFFDAY_SECTIONS = [
  { id: 'weeklyReview', label: 'Weekly Review' },
  { id: 'marketAnalysis', label: 'Market Analysis' },
  { id: 'lessonsLearned', label: 'Lessons Learned' },
  { id: 'aiInsights', label: 'AI Insights' }
];

export function DayJournalEditor({ date, isOffDay }) {
  const SECTIONS = isOffDay ? OFFDAY_SECTIONS : TRADING_SECTIONS;
  const { notes, saveNotes, loading } = useJournalNotes(date);
  
  // Important: when isOffDay changes (e.g. between selected days), reset the active tab
  const [activeTab, setActiveTab] = useState(SECTIONS[0].id);
  
  useEffect(() => {
    setActiveTab(SECTIONS[0].id);
  }, [isOffDay]);

  const [localNotes, setLocalNotes] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (notes) {
      setLocalNotes(notes);
    } else {
      setLocalNotes({});
    }
  }, [notes]);

  const isPast = dayjs(date).startOf('day').isBefore(dayjs().startOf('day'));

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveNotes(localNotes);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e) => {
    setLocalNotes(prev => ({
      ...prev,
      [activeTab]: e.target.value
    }));
  };

  return (
    <div className="flex flex-col h-full bg-background-card rounded-xl border border-border-default shadow-sm overflow-hidden flex-1">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border-default bg-background-surface/50">
        <h3 className="text-lg font-bold text-text-primary flex items-center">
          <Edit3 className="w-5 h-5 mr-2 text-text-tertiary" />
          Journal Notes
        </h3>
        {isPast ? (
          <div className="flex items-center text-text-secondary text-xs font-medium px-3 py-1.5 bg-background-elevated rounded-md border border-border-default shadow-sm">
            <Lock className="w-3.5 h-3.5 mr-1.5 text-text-tertiary" />
            Read-Only
          </div>
        ) : (
          <button 
            onClick={handleSave}
            disabled={isSaving || loading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Notes'}
          </button>
        )}
      </div>

      <div className="flex border-b border-border-default overflow-x-auto bg-background-card">
        {SECTIONS.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveTab(section.id)}
            className={`px-5 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
              activeTab === section.id 
                ? 'border-blue-500 text-blue-500 bg-blue-500/5' 
                : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-default hover:bg-white/5'
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>

      <div className="flex-1 p-5 bg-background-surface/30">
        <RichTextEditor
          className="w-full h-full custom-scrollbar"
          value={localNotes[activeTab] || ''}
          onChange={(val) => setLocalNotes(prev => ({ ...prev, [activeTab]: val }))}
          readOnly={isPast}
          placeholder={isPast ? "No notes recorded." : `Write your ${SECTIONS.find(s => s.id === activeTab)?.label.toLowerCase()} notes here...`}
        />
      </div>
    </div>
  );
}
