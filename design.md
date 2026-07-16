# Praxis — Design System & UI Brief
> **For use with Google Stitch AI Design Tool**
> This document defines every visual, typographic, color, layout, and component standard for the **Praxis** trading intelligence dashboard. Use this as the single source of truth when generating any screen, component, or flow.

---

## 1. Brand Identity

| Property | Value |
|---|---|
| **Product Name** | Praxis |
| **Tagline** | Institutional-grade market intelligence |
| **Audience** | Indian retail/professional traders (NSE/BSE) |
| **Personality** | Precise, data-dense, premium, dark-tech |
| **Default Mode** | **Dark mode** — light mode exists but is secondary |
| **Brand Fonts** | "Rancho" (cursive) for brand logo wordmark only |

---

## 2. Color Palette

### 2.1 Core Background Scale (Dark Mode)
| Token | Hex | Usage |
|---|---|---|
| `--bg-app` | `#02050e` | Page/root background — deep navy-black |
| `--bg-card` | `#0b1220` | Card & panel backgrounds |
| `--bg-surface` | `rgba(255,255,255,0.02)` | Subtle inset surfaces (inputs, chips) |
| `--bg-elevated` | `#0b1220` | Elevated overlays, tooltips |

### 2.2 Border Scale (Dark Mode)
| Token | Value | Usage |
|---|---|---|
| `--border-default` | `rgba(255,255,255,0.15)` | Primary card borders |
| `--border-subtle` | `rgba(255,255,255,0.08)` | Internal dividers |
| `--border-subtle-faint` | `rgba(255,255,255,0.05)` | Hairlines, ghost separators |
| `--border-active` | `rgba(59,130,246,0.5)` | Focus rings, selected states |

### 2.3 Text Scale (Dark Mode)
| Token | Value | Usage |
|---|---|---|
| `--text-primary` | `rgba(255,255,255,0.9)` | Headlines, values |
| `--text-secondary` | `rgba(255,255,255,0.6)` | Labels, descriptions |
| `--text-tertiary` | `rgba(255,255,255,0.4)` | Timestamps, meta info |
| `--text-brand` | `#60a5fa` | Links, active highlights |

### 2.4 Praxis Standard Palette (Semantic Colors)
| Name | Hex | Token | When to Use |
|---|---|---|---|
| **Praxis Blue** | `#2E5BFF` | `--color-praxis-blue` | Brand accent, exceptional scores |
| **Praxis Green** | `#22C55E` | `--color-praxis-green` | Bullish signals, positive, strong |
| **Praxis Amber** | `#F59E0B` | `--color-praxis-amber` | Neutral/caution, balanced states |
| **Praxis Red** | `#E5484D` | `--color-praxis-red` | Bearish signals, risk, danger |
| **Praxis Violet** | `#8B5CF6` | `--color-praxis-violet` | Gradient end, AI/ML indicators |
| **Praxis Cyan** | `#06B6D4` | `--color-praxis-cyan` | Data highlights, live feed |
| **Praxis Neutral** | `#94A3B8` | `--color-praxis-neutral` | Neutral signal states |

### 2.5 State / Signal Colors
| State | Main Color | Surface | Text (Dark) | Text (Light) |
|---|---|---|---|---|
| **Bullish** | `#22C55E` | `rgba(34,197,94,0.10)` | `#22C55E` | `#16A34A` |
| **Bearish** | `#E5484D` | `rgba(229,72,77,0.10)` | `#E5484D` | `#D92D20` |
| **Neutral** | `#94A3B8` | `rgba(148,163,184,0.10)` | `#94A3B8` | `#475569` |
| **Warning** | `#F59E0B` | `rgba(245,158,11,0.10)` | `#F59E0B` | `#B45309` |

### 2.6 Composite Score Color Mapping (7-Level Scale)
| Score Range | Label | Color |
|---|---|---|
| 90-100 | EXCEPTIONAL | `#2E5BFF` (Praxis Blue) |
| 75-89 | STRONG | `#22C55E` (Green) |
| 60-74 | CONSTRUCTIVE | `#22C55E` (lighter green) |
| 45-59 | BALANCED | `#F59E0B` (Amber) |
| 30-44 | WEAK | `#F79009` (Orange) |
| 15-29 | HIGH RISK | `#F04438` (Orange-Red) |
| 0-14 | EXTREME RISK | `#E5484D` (Red) |

### 2.7 Gradient
| Token | Value | Usage |
|---|---|---|
| `--gradient-start` | `#3b82f6` | Gradient border start / glow left |
| `--gradient-end` | `#8b5cf6` | Gradient border end / glow right |
| Gradient String | `linear-gradient(to right, #3b82f6, #8b5cf6)` | Card gradient borders, score bars |

---

## 3. Typography

### 3.1 Font Stack
| Role | Family | Weight(s) | Usage |
|---|---|---|---|
| **Primary UI** | `Inter` | 300, 400, 500, 600, 700, 800 | All UI text |
| **Monospace** | `JetBrains Mono` | 500, 600 | Scores, timestamps, codes, tickers |
| **Brand Wordmark** | `Rancho` (cursive) | 400 | Logo only — never in body text |

### 3.2 Type Scale
| Label | Size | Weight | Letter Spacing | Usage |
|---|---|---|---|---|
| Giant Score | 4xl-7xl | 900 (black) | Tight (-0.04em) | Main composite number |
| Section Label | 10-11px | 700 | Wide (+0.1em) UPPERCASE | Section headers |
| Card Title | 14px (sm) | 700 | Normal | Card h3 titles |
| Category | 10px | 400 | Normal | Card subtitle / category |
| Body | 14px | 400 | Normal | Descriptions, paragraphs |
| Mono Value | 12-14px | 600 | Normal | All numeric data |
| Timestamp | 10px | 400 | Wider | lastUpdated, snapshot times |
| Badge | 10px | 700 | Wide UPPERCASE | Mode badges (AUTO / MANUAL) |

---

## 4. Spacing & Layout

### 4.1 App Shell
```
+----------------------------------------------------------+
|  NAVBAR (top bar — full width, ~56px tall)               |
+-----------+----------------------------------------------+
|           |                                              |
| SIDEBAR   |   PAGE CONTENT (scrollable)                  |
| 69px      |   max-width: 1600px, centered, px-4/px-6     |
| collapsed |   pt-2, pb-32                                |
| 200px     |                                              |
| expanded  |                                              |
+-----------+----------------------------------------------+
```

### 4.2 Grid System
- **Card grids**: Responsive CSS grid — 1 col (mobile) -> 2 col (md) -> 3 col (lg) -> 4 col (xl)
- **Header sections**: 3-column grid on large screens (lg:grid-cols-3)
- **Gap**: gap-4 (16px) standard, gap-6 (24px) for page-level sections
- **Card padding**: p-4 (16px) mobile, p-6 (24px) desktop

### 4.3 Border Radius
| Level | Value | Usage |
|---|---|---|
| Xl | rounded-xl (12px) | Standard cards |
| 2xl | rounded-2xl (16px) | GlobalHeader, large panels |
| Full | rounded-full | Pills, badges, dots |

---

## 5. Navigation

### 5.1 Sidebar Menu Items (in order)
| ID | Key | Label | Icon | Route |
|---|---|---|---|---|
| 01 | `dashboard` | DASHBOARD | LayoutDashboard | `/dashboard/home` |
| 02 | `fundamental` | FUNDAMENTAL | BookOpen | `/dashboard/fundamental` |
| 03 | `technical` | TECHNICAL | TrendingUp | `/dashboard/technical` |
| 04 | `options` | OPTIONS | Settings2 | `/dashboard/options` |
| 04a | `pai` | PAI | Custom circular AI logo | `/dashboard/pai` |
| 05 | `events` | EVENTS | CalendarDays | `/dashboard/events` |
| 06 | `globalstructure` | GLOBAL | Globe | `/dashboard/globalstructure` |
| 07 | `wallet` | WALLET | Wallet | `/dashboard/wallet` |
| 08 | `journal` | JOURNAL | Notebook | `/dashboard/journal` |
| 09 | `manual` | MANUAL | FileText | `/dashboard/manual` |
| 11 | `logout` | LOGOUT | LogOut | `/logout` |

### 5.2 Sidebar Visual States
- **Collapsed width**: 69px (icon-only)
- **Expanded width**: 200px (icon + label)
- **Active item**: `text-blue-700`, icon scales up (scale-110)
- **Hover**: `text-blue-400`, icon scales (scale-115), label slides right (translate-x-2)
- **PAI item**: Uses custom round AI logo — golden glow on hover
- **Logout**: Red text `text-red-500/80`, red hover bg `bg-red-500/[0.08]`
- **User avatar** at bottom — circular, 32x32, with border

### 5.3 Navbar
- Fixed top, full width
- Houses: Praxis logo (left), theme toggle (dark/light), stock search, notification bell, user menu
- Background: subtle translucent with backdrop blur

---

## 6. Page Architecture — GlobalHeader

Every intelligence page (Fundamental, Technical, Options, Global) uses the **GlobalHeader** as the top module. It is a three-column panel.

### 6.1 GlobalHeader Layout (3 Columns)
```
+------------------+-----------------------+---------------------+
|  A. GAUGE        |  B. AI INSIGHT        |  C. SIGNAL INTEGRITY|
|                  |                       |                     |
|  Big score num   |  AI Market Regime     |  * Monitor Active   |
|  e.g. "72"       |  narrative text       |  Coverage: 12/12 XX |
|  "STRONG"        |                       |  Snapshot: Jul 14   |
|                  |                       |  -------------------|
|  Section bars    |                       |  R CREDITS   BULLS  |
|  (divergence)    |                       |  92          3      |
|                  |                       |  BEARS    NEUTRAL   |
|                  |                       |  2           7      |
+------------------+-----------------------+---------------------+
|  TAILWINDS (left half) | KEY RISKS (right half)               |
+----------------------------------------------------------------------+
|  CONTROLS: Search bar | View toggle | Sort | Custom widget          |
+----------------------------------------------------------------------+
```

### 6.2 Column A — Composite Gauge
- **Title label**: 10-11px, uppercase, muted, tracking wide (e.g. "FUNDAMENTAL COMPOSITE")
- **Score number**: 60-70px, JetBrains Mono or Inter Black, tight tracking
- **State label**: (e.g. "STRONG") colored per 7-level scale, font-bold, uppercase
- **Sub-label**: `/ 100.00` in tiny faded mono text below score
- **Delta pill**: Small badge showing `+2.3% vs prev` — green/red, shown only when historical data exists
- **Section bars**: Divergence bars (colored horizontal bars) for sub-sections, visible on desktop only

### 6.3 Column B — AI Insight Section
- Full height panel showing the market regime narrative
- Animated pulse gradient left border
- Action badge: "BULLISH" / "BEARISH" / "NEUTRAL" large colored badge
- Confidence % chip
- Narrative text block: 3-4 lines of human-readable insight

### 6.4 Column C — Signal Integrity
- **Title**: "SIGNAL INTEGRITY" — uppercase, muted label, 10px
- **Live indicator**: Green pulsing dot + "Monitor Active" | right: freshness time "Offline Sync"
- **Coverage bar**: Label "Coverage" + count e.g. "12/12" -> filled blue progress bar (h-1.5, rounded)
- **Snapshot**: "Snapshot: Jul 14" — 10px muted mono, right-aligned
- **Stats row (4-column grid)**:

| R CREDITS | BULLS | BEARS | NEUTRAL |
|---|---|---|---|
| 92 (white) | 3 (green) | 2 (red) | 7 (amber) |

  - Labels: 10px uppercase muted, value: large text-xl+ bold font
  - **Bulls label is hoverable** — shows tooltip popup: "BULLS BREAKDOWN" with list of bullish indicator names

### 6.5 Tailwinds & Risks Row
- Two equal columns below the top 3-panel row
- **Top Tailwinds**: Emerald arrow-up icon, bulleted list of positive drivers
- **Key Risks**: Red arrow-down icon, bulleted list of risk factors
- Each item: `text-xs`, indicator name + impact tag

### 6.6 Controls Row
- Full-width row at bottom of GlobalHeader
- Contains: Search input (glass style), View toggle (Flat/Sectioned), Sort dropdown, plus page-specific widgets (e.g. Timeframe selector for Technicals)
- The header flips via a rotate icon button to reveal the **Manual Data Overrides form** on the back face

---

## 7. Indicator Card Component

The standard card used across all intelligence pages.

### 7.1 Card Structure
```
+------------------------------------------------------------+
|  Title + Category              [AUTO*] [CR: 8]            |  <- Header
|  "P/E Ratio"                   "Valuation"                |
+------------------------------------------------------------+
|                                                            |
|   pencil 24.50     -> PRIMARY VALUE (large mono)          |  <- Body
|   "Sector Avg: 22.0 | Hist: 18.5"                        |
|                                                            |
|   Signal: BEARISH *                                        |  <- Signal state
|                                                            |
|   "Trading at 31% premium to hist. avg."                  |  <- AI insight
|                                                            |
|  [Score Range Bar] red===orange===yellow===green          |
|                          ^ pointer at 62                   |
|   Low 0          Avg 50          High 100                  |
|                                                            |
|   Last Updated: 3:27 PM                                   |  <- Footer
+------------------------------------------------------------+
```

### 7.2 Card Header Rules
- **Title**: 14px, font-bold, text-text-primary
- **Category**: 10px, text-text-secondary
- **Mode badge**: Small colored dot + AUTO (green dot) or MANUAL (yellow dot), font-mono font-bold 10px uppercase
- **Credit badge**: [8] — bordered pill, mono, shows the card's R-credit weight
- **Settings gear icon**: Appears if the indicator has configurable parameters (Technicals only)
- **Missing inputs warning**: Yellow count badge if manual inputs are pending

### 7.3 Card Body — Value Display
- **Primary value**: Large mono font, text-xl or larger
- **Pencil icon (Edit2)** appears **before** the value if the data is a manual override — e.g. `pencil 24.50`
- **Comparison row**: `Sector Avg: 22.0 | Hist: 18.5` — smaller, muted
- **Signal state line**: `"BULLISH *"` in state color, font-bold
- **AI Insight**: text-xs text-text-secondary — 1-2 sentence dynamic narrative

### 7.4 Score Range Bar
- Horizontal gradient bar: Red (left) -> Orange -> Yellow -> Green (right)
- Blue triangle pointer indicates current score position
- Score number below pointer
- Labels: `Low 0`, `Avg 50`, `High 100` in 9px mono

### 7.5 Card Footer
- `Last Updated: 3:27 PM` — 10px, right-aligned, text-text-tertiary, JetBrains Mono

### 7.6 Card Flip (Back Face)
- Cards support a flip animation revealing additional detail
- Back: Recharts line chart of historical values, labeled axes
- Same title + credit shown on back header

### 7.7 Card States
| State | Visual Cue |
|---|---|
| AUTO (live data) | Green dot in mode badge |
| MANUAL (user input) | Yellow dot, pencil icon before value |
| Loading | Skeleton shimmer |
| Error/No data | Muted dash with grey border |

---

## 8. Page Index

### 8.1 Dashboard Home (`/dashboard/home`)
**Purpose**: Praxis Composite command center
**Sections**:
- GlobalHeader: "Praxis Composite" — sections show TECH / FUND / OPT / GLOB / EVT sub-scores
- LiveMarketTicker — scrolling horizontal ticker strip (Nifty 50, Nifty Bank, etc.)
- **Instrument Selector**: Category toggle (Indices / Companies) + searchable stock dropdown
- **Expiry Selector**: Shown only if the selected instrument has F&O options

### 8.2 Fundamental Page (`/dashboard/fundamental`)
**Purpose**: Deep financial health analysis of a stock
**Header**: "Fundamental Composite" — 12/12 card coverage typical
**Card Categories**:
- Valuation (P/E, Forward P/E, P/B, Earnings Yield)
- Growth (EPS Growth, Revenue Growth, Profit Growth)
- Profitability (ROE, ROCE, Net Margin, Operating Margin)
- Financial Health (D/E Ratio, Interest Coverage, FCF, Current Ratio)
- Market Structure (Dividend Yield, Earnings Trend, FII/DII Flow, Market Cap/GDP)
**Data Source**: Mix of Upstox live + manual overrides for forward-looking metrics
**Note**: Forward P/E, Sector Averages are manual-only inputs — shown on GlobalHeader backside form

### 8.3 Technical Page (`/dashboard/technical`)
**Purpose**: Price action and momentum analysis
**Header**: "Technical Composite" — Timeframe selector (1m / 30m / Daily) in controls row
**Card Categories**:
- Trend (EMA 20/50/200, SMA 50/200, ADX, Supertrend)
- Momentum (RSI, MACD, Stoch RSI, Williams %R)
- Volume (CMF, OBV, VWAP, Volume SMA)
- Volatility (Bollinger Bands, ATR, Keltner Channels)
- Structure & Breadth (Support, Resistance, Trendline, Fibonacci, Pivot Points)
- Index Breadth (A/D Line, McClellan Oscillator, NH/NL, TRIN, Breadth Ratio)
**Data Source**: Upstox OHLC streaming — manual fallback via GlobalHeader flip form

### 8.4 Options Page (`/dashboard/options`)
**Purpose**: Options chain sentiment and Greeks analysis
**Header**: "Options Sentiment" — Expiry selector in controls row
**Card Categories**:
- Open Interest (Total Call OI, Total Put OI, OI Change)
- PCR (PCR by OI, PCR by Volume)
- Max Pain (Max Pain Strike)
- Volatility (ATM IV, IV Rank, IV Percentile)
- Greeks (Delta, Gamma, Theta, Vega)
**Data Source**: NSE Option Chain via Upstox API — manual fallback for IV Rank/Percentile

### 8.5 PAI Page (`/dashboard/pai`)
**Purpose**: Praxis AI assistant — conversational trading intelligence
**Visual**: Full-screen chat interface with custom AI avatar (golden round logo)
**Style**: Dark glass-morphism chat bubbles, typing indicators, premium feel

### 8.6 Events Page (`/dashboard/events`)
**Purpose**: Upcoming market catalysts (earnings, RBI policy, results calendar)
**Layout**: Calendar + timeline cards
**Cards**: Company name, event type, date/time, expected impact, history

### 8.7 Global Page (`/dashboard/globalstructure`)
**Purpose**: Macro global indicators (US markets, commodities, FX, bonds)
**Card Categories**: USD/INR, DXY, US 10Y Yield, S&P Futures, Nasdaq Futures, Dow Futures, Gold, Silver, Brent Crude, Bitcoin, India VIX, GDP Growth

### 8.8 Wallet Page (`/dashboard/wallet`)
**Purpose**: R-Credits balance, subscription tier, usage analytics

### 8.9 Journal Page (`/dashboard/journal`)
**Purpose**: Trade journal — log entries with score snapshots, notes, P&L

### 8.10 Manual Page (`/dashboard/manual`)
**Purpose**: User guide — documentation for all Praxis modules and scoring methodology

---

## 9. UI Component Library

### 9.1 Card (base)
- Background: `--bg-card` (#0b1220)
- Border: 1px solid --border-default
- Border-radius: rounded-xl
- Shadow: 0 8px 24px rgba(0,0,0,0.45)
- Hover: Optional gradient border via `card-gradient-border` class

### 9.2 Gradient Border Card
- background: linear-gradient(#0b1220, #0b1220) padding-box, linear-gradient(to right, #3b82f6, #8b5cf6) border-box

### 9.3 Pill / Badge
- Rounded-full, px-2 py-0.5, text-[10px]
- Variants: Blue (active), Green (bullish), Red (bearish), Amber (warning), Grey (neutral)

### 9.4 Progress Bar (Coverage)
- Height: h-1.5, rounded-full
- Track: bg-background-surface/50 border border-border-subtle
- Fill: bg-blue-500, animated width transition 700ms ease-out

### 9.5 Segmented Control (CardSegmented)
- Pill-shaped container, bg-background-surface
- Active segment: bg-blue-500/10 text-blue-400 border border-blue-500/20
- Inactive: text-text-secondary hover:text-text-primary

### 9.6 Search Input
- bg-background-surface border border-border-default rounded-xl
- Left icon: magnifying glass
- Placeholder: text-text-tertiary
- Focus: border-accent-primary

### 9.7 Dropdown (UiverseDropdown)
- Custom searchable dropdown
- Background: --bg-card
- Options list: max-height scrollable, keyboard navigable
- Active option: blue highlight

### 9.8 Flip Card Container
- CSS 3D flip — transform-style: preserve-3d
- rotateY(180deg) for back face
- Trigger: small rotate-icon button in top-right of card/header
- Back face: Manual form or detail chart

### 9.9 Portal Tooltip
- Rendered via React Portal (z-50+)
- Background: --bg-tooltip (#0b1220) with border
- Arrow pointer, animated fade-in
- Hover-triggered on Bulls/Bears count labels

### 9.10 Scrollbar
- Width: 6px
- Thumb: rgba(255,255,255,0.15) -> hover rgba(255,255,255,0.25)
- Border-radius: 99px

### 9.11 Theme Toggle
- Sun / Moon icon toggle
- Switches data-theme attribute on html between "dark" and "light"

---

## 10. Animations & Motion

| Class | Keyframe | Duration | Usage |
|---|---|---|---|
| `animate-float-slow` | float-slow | 20s infinite | Background orbs |
| `animate-float-delayed` | float-delayed | 25s, 2s delay | Background orbs |
| `animate-float-reverse` | float-reverse | 22s, 1s delay | Background orbs |
| `animate-float-medium` | float-medium | 18s, 3s delay | Background orbs |
| `animate-float-fast` | float-fast | 15s, 1.5s delay | Background orbs |
| `animate-pulse-slow` | pulse-slow | 8s infinite | Background orbs |
| `animate-drift` | drift | 30s, 4s delay | Background VFX |
| `animate-in fade-in` | tailwind animate-in | 500ms | Page entry |
| `animate-in slide-in-from-bottom-4` | tailwind animate-in | 500ms | GlobalHeader entry |
| `pulse` | CSS pulse | 2s | Live indicator green dot |

**Micro-interactions**:
- Hover: scale(1.05-1.15) on icons and interactive elements — transition-all duration-300
- Active nav item: icon scale-110
- Score bar pointer: transition-all duration-500 ease-out
- Sidebar collapse: transition-[width] duration-300 ease-in-out
- Coverage bar fill: transition-all duration-700 ease-out

---

## 11. Scoring System Reference

### 11.1 Signal States (Card level — normalized score)
| Normalized | Label | Color |
|---|---|---|
| > 0.2 | Bullish | Praxis Green #22C55E |
| < -0.2 | Bearish | Praxis Red #E5484D |
| -0.2 to 0.2 | Neutral | Praxis Neutral #94A3B8 |

### 11.2 Reliability Tiers (Credit Allocation)
| Reliability | Credit Points | Tier Label |
|---|---|---|
| >= 0.95 | 12 | Elite — Immutable Law |
| >= 0.85 | 8 | Prime — Core Driver |
| >= 0.70 | 5 | Strategic — Tactical Setup |
| >= 0.45 | 3 | Standard — Retail Confirmation |
| < 0.45 | 1 | Micro — Fringe Data |

### 11.3 R Credits
- R Credits = sum of creditScore for all active cards on a page
- Shown in Signal Integrity block as the total weight of the analysis
- Range: ~50-150 credits per page depending on coverage

---

## 12. Key Indicator Registry (by Page)

### Fundamentals (12 indicators)
`pe_ratio`, `forward_pe`, `pb_ratio`, `earnings_yield`, `eps_growth`, `revenue_growth`, `profit_growth`, `roe`, `roce`, `net_margin`, `debt_to_equity`, `free_cash_flow`

### Technicals (28 indicators)
`rsi`, `macd`, `stoch_rsi`, `williams_r`, `ema_20`, `ema_50`, `ema_200`, `sma_50`, `sma_200`, `adx`, `supertrend`, `cmf`, `obv`, `vwap`, `volume_sma`, `bb_20_2`, `atr`, `kc`, `support`, `resistance`, `trendline`, `pivot`, `fibonacci`, `breadth_ratio`, `ad_line`, `mcclellan`, `nh_nl`, `trin`

### Options (14 indicators)
`total_call_oi`, `total_put_oi`, `oi_change`, `pcr_oi`, `pcr_volume`, `max_pain`, `atm_iv`, `iv_rank`, `iv_percentile`, `delta`, `gamma`, `theta`, `vega`

### Global Macro (16 indicators)
`advance_decline`, `india_vix`, `index_pcr`, `index_macd`, `index_200dma`, `brent_crude_oil`, `gold`, `silver`, `vix`, `bitcoin`, `sp_futures`, `nasdaq_futures`, `dow_futures`, `usd_inr`, `dxy`, `us_10y_yield`

---

## 13. Design Do's and Don'ts

### Do
- Use `#02050e` as the true page background — not pure black
- Put the pencil (Edit2) icon **before** manual values, not after
- Show AUTO / MANUAL mode badges on every card header
- Keep numerical values right-aligned within their grid column
- Use JetBrains Mono for all score values and timestamps
- Animate live data indicators with a gentle CSS pulse
- Apply card-gradient-border (blue to violet) as the premium hover state for cards
- Show BULLS / BEARS / NEUTRAL count breakdown in the Signal Integrity section
- Render Bulls/Bears breakdown as a hoverable tooltip (not always-visible)
- Keep manual input forms exclusively on the GlobalHeader back face (never on cards)

### Don't
- Don't use plain generic colors without mapping to Praxis palette
- Don't show manual override inputs inline on the card face
- Don't use white backgrounds in dark mode — use #0b1220 for cards
- Don't use sans-serif for numeric scores — always use JetBrains Mono
- Don't put pencil icon after the value — it must always precede the number
- Don't show the Signal Integrity bottom block (credits/bulls/bears) if totalCredits is 0
- Don't put AI insight in static strings — it should feel like computed, contextual text

---

## 14. Screen Examples for Stitch

### Screen 1: Dashboard Home
- Left sidebar (expanded 200px) with all nav items
- Top navbar with Praxis logo, search bar, and theme toggle
- GlobalHeader 3-panel at 0 score (loading state)
- Instrument category toggle (Indices / Companies)
- Stock search dropdown
- Background: dark nebula-like gradient blobs (slow animation)

### Screen 2: Fundamental Page (Loaded State)
- GlobalHeader with score "78" -> "STRONG" in green
- Signal Integrity: 12/12 coverage, 92 R Credits, 7 Bulls, 2 Bears, 3 Neutral
- Grid of 12 indicator cards in 4-column layout
- One card showing manual override (yellow dot + pencil icon before value)
- One card in BEARISH state (red signal state, negative score bar position)

### Screen 3: Technical Page (Timeframe Selector visible)
- GlobalHeader with "Technical Composite" title
- Timeframe segmented control in controls row: 1m | 30m | Daily
- Grid of momentum/trend/volume cards
- Some cards with settings gear icon in header

### Screen 4: Options Page (Chain Loaded)
- GlobalHeader: "Options Sentiment", expiry selector visible
- OI & PCR cards with large numerical display
- Greeks cards (Delta, Gamma, Theta, Vega) with smaller values
- ATM IV card showing live data (green AUTO dot)

### Screen 5: Indicator Card Flip States
- Front: Full card with score, signal, AI insight, score bar
- Back: Line chart (Recharts) showing historical values over time
- Flip button in top-right corner

### Screen 6: GlobalHeader Flip — Manual Override Form
- Back of GlobalHeader shows the data entry form
- Organized in 3-4 column grid by category
- Input fields: labeled, minimal, monospaced values
- "Clear All" red button in top right
- "Close" flip button

---

## 15. Tech Stack Context

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite |
| Styling | TailwindCSS v4 + custom CSS variables |
| Icons | Lucide React + React Icons (lu) |
| Charts | Recharts (LineChart, ResponsiveContainer) |
| Routing | React Router DOM v6 |
| State | React Context + useState/useMemo |
| Fonts | Google Fonts (Inter, Rancho, JetBrains Mono) |
| Animation | tw-animate-css + CSS keyframes |
| Data | Upstox WebSocket API + Manual Overrides |

---

*End of Praxis Design Brief — Version 1.0, July 2026*
