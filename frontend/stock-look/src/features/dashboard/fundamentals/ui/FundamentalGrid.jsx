import React, { useMemo } from 'react';
import FundamentalCard from './FundamentalCard';
import { FUNDAMENTAL_SECTIONS } from '../data/fundamentalData';

export default function FundamentalGrid({ cards, viewMode, sortMode = "score_desc", onCardClick }) {

  // --- Sorting Logic ---
  const sortCards = (list) => {
    const arr = [...list];
    switch (sortMode) {
      case 'score_desc': // Strongest (Bullish) descending
        return arr.sort((a, b) => (b.normalized || 0) - (a.normalized || 0));
      case 'score_asc': // Weakest (Bearish) ascending (most negative first)
        return arr.sort((a, b) => (a.normalized || 0) - (b.normalized || 0));
      case 'rel_desc': // High Credit
        return arr.sort((a, b) => (b.creditAllocation || 0) - (a.creditAllocation || 0));
      case 'rel_asc': // Low Credit
        return arr.sort((a, b) => (a.creditAllocation || 0) - (b.creditAllocation || 0));
      default:
        return arr;
    }
  };

  // Group cards by section for "Sectioned" view
  const sections = useMemo(() => {
    if (viewMode !== 'sectioned') return null;

    // Initialize groups based on constant order
    const groups = {};
    FUNDAMENTAL_SECTIONS.forEach(sec => {
      groups[sec.id] = [];
    });
    // Add "Other" fallback
    groups['Other'] = [];

    cards.forEach(card => {
      const key = card.category || 'Other';
      if (groups[key]) groups[key].push(card);
      else groups['Other'].push(card);
    });

    return groups;
  }, [cards, viewMode]);

  /* ------------------------------------------------------------
     RENDER: FLAT VIEW
     ------------------------------------------------------------ */
  if (viewMode === 'flat') {
    const sortedFlat = sortCards(cards);
    return (
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
        {sortedFlat.map(card => (
          <FundamentalCard
            key={card.id}
            card={card}
            onClick={() => onCardClick(card)}
          />
        ))}
        {cards.length === 0 && (
          <div className="col-span-full text-center py-12 text-[var(--text-muted)] italic">
            No metrics match your search.
          </div>
        )}
      </div>
    );
  }

  /* ------------------------------------------------------------
     RENDER: SECTIONED VIEW
     ------------------------------------------------------------ */
  return (
    <div className="space-y-12">
      {FUNDAMENTAL_SECTIONS.map(section => {
        const rawList = sections[section.id];
        if (!rawList || rawList.length === 0) return null;

        const sectionCards = sortCards(rawList);

        return (
          <div key={section.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Section Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px flex-1 bg-gradient-to-r from-[var(--border-main)] to-transparent" />
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest">{section.label}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-card)] text-[var(--text-muted)] font-mono border border-[var(--border-main)]">
                  {sectionCards.length}
                </span>
              </div>
              <div className="h-px flex-1 bg-gradient-to-l from-[var(--border-main)] to-transparent" />
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
              {sectionCards.map(card => (
                <FundamentalCard
                  key={card.id}
                  card={card}
                  onClick={() => onCardClick(card)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
