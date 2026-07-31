import React, { useState, useEffect } from 'react';
import { useJournalNotes } from '../data/useJournalNotes';
import { Lock, Save, Edit3 } from 'lucide-react';
import dayjs from 'dayjs';

const SECTIONS = [
  { id: 'preMarket', label: 'Pre-Market' },
  { id: 'inMarket', label: 'In-Market' },
  { id: 'postMarket', label: 'Post-Market' },
  { id: 'lessonsLearned', label: 'Lessons Learned' },
  { id: 'aiInsights', label: 'AI Insights' }
];

export function DayJournalEditor({ date }) {
  const { notes, saveNotes, loading } = useJournalNotes(date);
  const [activeTab, setActiveTab] = useState(SECTIONS[0].id);
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
      {isPast && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex items-center text-amber-500 text-sm font-semibold">
          <Lock className="w-4 h-4 mr-2" />
          🔒 Past entries are locked
        </div>
      )}
      
      <div className="flex items-center justify-between px-5 py-4 border-b border-border-default bg-background-surface/50">
        <h3 className="text-lg font-bold text-text-primary flex items-center">
          <Edit3 className="w-5 h-5 mr-2 text-text-tertiary" />
          Journal Notes
        </h3>
        {!isPast && (
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
        <textarea
          className="w-full h-full min-h-[250px] p-4 rounded-xl border border-border-default focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 resize-none outline-none text-text-primary bg-background-card disabled:bg-background-surface disabled:text-text-tertiary disabled:opacity-70 transition-all shadow-inner custom-scrollbar"
          value={localNotes[activeTab] || ''}
          onChange={handleChange}
          readOnly={isPast}
          placeholder={isPast ? "No notes recorded." : `Write your ${SECTIONS.find(s => s.id === activeTab)?.label.toLowerCase()} notes here...`}
        />
      </div>
    </div>
  );
}
