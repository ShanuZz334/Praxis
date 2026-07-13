/**
 * @file scoreColors.js
 * @purpose Canonical Praxis color palettes — single source of truth for ALL dashboards.
 *
 * TABLE 1 — Composite Score Palette (main composite number & label only)
 *   0–14   Extreme Risk  #D92D20
 *   15–29  High Risk     #F04438
 *   30–44  Weak          #F79009
 *   45–59  Balanced      #FACC15
 *   60–74  Constructive  #22C55E
 *   75–89  Strong        #16A34A
 *   90–100 Exceptional   #2E5BFF
 *
 * TABLE 2 — Indicator/Section Palette (section tubes, cards, individual indicators)
 *   0–20   Poor          #E5484D
 *   21–40  Weak          #F59E0B
 *   41–60  Balanced      #94A3B8
 *   61–80  Strong        #22C55E
 *   81–100 Exceptional   #2E5BFF
 */

// ─── Table 1: Composite Score Palette ────────────────────────────────────────
const COMPOSITE_TIERS = [
    { min: 90, label: 'Exceptional', hex: '#2E5BFF' },
    { min: 75, label: 'Strong',      hex: '#16A34A' },
    { min: 60, label: 'Constructive',hex: '#22C55E' },
    { min: 45, label: 'Balanced',    hex: '#FACC15' },
    { min: 30, label: 'Weak',        hex: '#F79009' },
    { min: 15, label: 'High Risk',   hex: '#F04438' },
    { min: 0,  label: 'Extreme Risk',hex: '#D92D20' },
];

/**
 * Returns the label and hex color for a COMPOSITE score (main gauge number).
 * @param {number|null} score — 0 to 100
 * @returns {{ label: string, hex: string }}
 */
export function getCompositeColor(score) {
    if (score === null || score === undefined || isNaN(score)) {
        return { label: '—', hex: '#4B5563' };
    }
    const tier = COMPOSITE_TIERS.find(t => score >= t.min);
    return tier || { label: 'Extreme Risk', hex: '#D92D20' };
}

// ─── Table 2: Indicator / Section Palette ────────────────────────────────────
const INDICATOR_TIERS = [
    { min: 81, label: 'Exceptional', hex: '#2E5BFF' },
    { min: 61, label: 'Strong',      hex: '#22C55E' },
    { min: 41, label: 'Balanced',    hex: '#94A3B8' },
    { min: 21, label: 'Weak',        hex: '#F59E0B' },
    { min: 0,  label: 'Poor',        hex: '#E5484D' },
];

/**
 * Returns the label and hex color for a SECTION or CARD indicator score.
 * @param {number|null} score — 0 to 100
 * @returns {{ label: string, hex: string }}
 */
export function getIndicatorColor(score) {
    if (score === null || score === undefined || isNaN(score)) {
        return { label: '—', hex: '#374151' };
    }
    const tier = INDICATOR_TIERS.find(t => score >= t.min);
    return tier || { label: 'Poor', hex: '#E5484D' };
}
