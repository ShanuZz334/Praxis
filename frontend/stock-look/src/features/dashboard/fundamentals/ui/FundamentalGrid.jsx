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
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 md:gap-4">
        {sortedFlat.map(card => (
          <FundamentalCard
            key={card.id}
            card={card}
            onClick={() => onCardClick(card)}
          />
        ))}
        {cards.length === 0 && (
          <div className="col-span-full text-center py-12 text-text-tertiary italic">
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
    <div className="space-y-6">
      {/* Category Navigator (Mobile/Tablet Only) */}
      {viewMode === "sectioned" && (
        <div className="lg:hidden flex overflow-x-auto gap-2 pb-2 -mx-1 px-1 custom-scrollbar-hidden sticky top-0 bg-background-app/80 backdrop-blur-md z-30 py-3">
          {FUNDAMENTAL_SECTIONS.map(section => {
            if (!sections[section.id]?.length) return null;
            return (
              <button
                key={section.id}
                onClick={() => {
                  const el = document.getElementById(`section-${section.id}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="shrink-0 px-3 py-1.5 rounded-full bg-background-elevated border border-border-subtle text-[11px] font-bold text-text-secondary hover:text-text-primary hover:border-border-default transition-all whitespace-nowrap"
              >
                {section.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="space-y-8 md:space-y-12">
        {FUNDAMENTAL_SECTIONS.map(section => {
          const rawList = sections[section.id];
          if (!rawList || rawList.length === 0) return null;

          const sectionCards = sortCards(rawList);

          return (
            <div key={section.id} id={`section-${section.id}`} className="animate-in fade-in slide-in-from-bottom-4 duration-500 scroll-mt-20">
              {/* Section Header */}
              <div className="flex items-center justify-center gap-4 mb-4 md:mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-text-primary uppercase tracking-widest">{section.label}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded border border-border-default bg-background-surface text-text-tertiary font-mono shadow-sm">
                    {sectionCards.length}
                  </span>
                </div>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 md:gap-4">
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
    </div>
  );
}
