# Praxis Dashboard — Scoring Engine Architecture Reference

> **Gold Standard established by:** Fundamentals Page migration (July 2026)
> **Must be followed for:** Technicals, Options, Events, Global pages

---

## Core Files

| File | Purpose |
|---|---|
| `src/shared/thresholds/fundamentalThresholds.js` | Master config registry — all bands, weights, biasMap, confidence values per metric |
| `src/shared/weights/fundamentalWeights.js` | Section & card weights — used by composite engine for score blending |
| `src/features/dashboard/fundamentals/engine/scoringEngine.js` | Pure JS scoring functions — no React, importable by both frontend and Node backend |
| `src/features/dashboard/fundamentals/engine/FundamentalCompositeEngine.js` | Composite score aggregator — blends section scores into a single composite |

---

## Architecture Patterns — MUST FOLLOW ON ALL PAGES

### 1. Threshold Registry Pattern
Every metric has a named key in FUNDAMENTAL_THRESHOLDS:

  metric_key: {
      absoluteBands: [ { above: X, score: N, label: '...' }, ..., { else: true, score: N } ],
      biasMap: DEFAULT_BIAS_MAP,
      confidence: { always: N },
      factorWeights: { f1: 0.5, f2: 0.3, f3: 0.2 },
      comparativeBands: [...],
      trendAdjust: { ... },
  }

### 2. resolveBand() Helper
Resolves a score from an absoluteBands array by walking entries top-down.

### 3. applyBiasMap() — Single Source of Truth for Bias Labels
NEVER write hardcoded if/else bias blocks. Always:
  const bias = applyBiasMap(score, T.biasMap);

DEFAULT_BIAS_MAP: >= 80 Strong Bullish | >= 62 Bullish | >= 42 Neutral | >= 25 Bearish | else Strong Bearish

### 4. Score Function Signature
  export function scoreXxx(value, comparativeValue) { ... }
  Returns: { score: 0-100, bias: string, confidence: number|string, ...labels }

### 5. AI Insight Function
  export function generateAiInsightXxx(scoreObj, val) { ... }
  Returns a single human-readable string.

---

## Profile / Toggle System

### Trading Profiles
| Profile    | Key          | Focus |
|------------|--------------|-------|
| Intraday   | intraday     | Momentum > Fundamentals; short signals |
| Swing      | swing        | Balance of technicals + fundamentals (2-10 days) |
| Positional | positional   | Fundamentals dominate; macro + quality |

### Weight Multipliers per Profile (in fundamentalWeights.js profileMultipliers)
  intraday:   { valuation: 0.5, growth: 0.6, technicals: 1.8, flow: 1.5, macro: 0.4 }
  swing:      { valuation: 1.0, growth: 1.0, technicals: 1.2, flow: 1.2, macro: 0.8 }
  positional: { valuation: 1.4, growth: 1.5, technicals: 0.6, flow: 0.8, macro: 1.3 }

### Context
- File: src/context/ProfileContext.jsx
- Hook: useProfile() -> { profile, setProfile }
- profile values: 'intraday' | 'swing' | 'positional'
- Persistence: localStorage key: praxis_trading_profile
- Connected to: Settings toggle + all dashboard composite engines + prompt templates

### Prompt Templates
- Location: src/shared/prompts/ (intradayPrompt.js, swingPrompt.js, positionalPrompt.js)
- Used by: Dashboard page headers (AI summary section)
- Pattern: const { promptTemplate } = useProfile();

---

## Migration Checklist for New Pages

For each new page (Technicals, Options, Events, Global):
- [ ] Create src/shared/thresholds/[page]Thresholds.js
- [ ] Create src/shared/weights/[page]Weights.js
- [ ] Create src/features/dashboard/[page]/engine/[page]ScoringEngine.js
- [ ] Wire all score functions to T = [PAGE]_THRESHOLDS.xxx
- [ ] Use applyBiasMap everywhere — zero hardcoded if/else bias blocks
- [ ] Create [Page]CompositeEngine.js following FundamentalCompositeEngine pattern
- [ ] Apply profileMultipliers[profile] to section weights at composite level
- [ ] Connect page header to useProfile() for prompt template selection

---

## Completed Pages

| Page         | Scoring Engine | Threshold Registry | Weights File | Profile-Aware |
|--------------|----------------|--------------------|--------------|---------------|
| Fundamentals | DONE           | DONE               | DONE         | IN PROGRESS   |
| Technicals   | TODO           | TODO               | TODO         | TODO          |
| Options      | TODO           | TODO               | TODO         | TODO          |
| Events       | TODO           | TODO               | TODO         | TODO          |
| Global       | TODO           | TODO               | TODO         | TODO          |
