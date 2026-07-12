# Praxis Dashboard Card Guidelines

When refactoring, updating, or building new indicator cards in the Praxis dashboard, you MUST follow these established architectural, UX, and logic patterns:

## 1. Engine Modeling & Logic
- **Robust Scoring**: Every card needs an "industry-grade" computational engine (similar to `PERatioCard` and `ForwardPECard`). 
- **AI Insights**: Generate dynamic, human-readable insights based on the mathematical relationships of the data (e.g., comparing trailing vs forward multiples), not just static strings.
- **Fail-safes**: If Upstox live data is missing, the component must seamlessly fallback to manual overrides without breaking the app.

## 2. Manual Overrides Placement
- **Zero Clutter Rule**: ONLY expose an input box on the backside if the core metric is completely missing from Upstox (e.g. Forward P/E). 
- **NO Fallbacks & NO Comparisons**: NEVER create manual input boxes for "Fallbacks" or "Historical/Sector Averages" if the primary metric is already fetched from Upstox. The user trusts the Upstox data and strictly wants zero unnecessary inputs.
- **NEVER** place input boxes or manual form components directly inline on the individual indicator cards.
- **ONLY** place manual input fields on the "Backside" of the `GlobalHeader` via the `fundamentalManualForm` in `FundamentalPage.jsx`.
- **Keep it Clean**: Only expose the inputs in the GlobalHeader that actively correspond to cards we have built or explicitly mapped. Do not clutter the UI with inputs for metrics that aren't fully wired up yet.
- **Focus Bug Prevention**: Ensure the `OverrideInput` component (or any input wrapper) is defined **outside** the main page render function so React doesn't destroy and recreate it on every keystroke, preventing focus loss.

## 3. UI Alignment & Layout
- **Pencil Icon Alignment**: For any manually overridden metric shown on the cards, the pencil (`<Edit2 />`) icon must appear **before** (to the left of) the numerical value, e.g., `✏️ 18.50`. This ensures all numerical values remain cleanly right-aligned in their column.

## 4. Timestamp & Date Synchronization
- **Live Data (Upstox)**: When a card sources data from the Upstox API (`isLiveData`), the card's `lastUpdated` prop must reflect the exact time the API call succeeded.
- **Manual Data**: When a card uses a manual fallback, the card's `lastUpdated` prop must reflect the precise time the user last typed an edit into the GlobalHeader info panel.
- Ensure the `resolveTime` pattern (e.g., in `FundamentalGrid.jsx`) successfully passes down either `liveTime` or `manualTime` to the card based on the presence of real data.
