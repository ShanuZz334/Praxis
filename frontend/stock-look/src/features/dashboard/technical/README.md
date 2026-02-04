/**
 * @file README.md
 * @purpose Documentation for centralized weights and credits configuration system.
 * @date 2026-02-04
 */

# Technical Page - Centralized Configuration Integration

## Current Status

The Technical page has been updated to use centralized configuration for weights and credits.

## Files Updated

### 1. Configuration Files (NEW)
- `src/config/tradingModes.js` - Trading mode definitions
- `src/config/weights/technicalWeights.js` - 167 indicator weights
- `src/config/credits/technicalCredits.js` - 167 indicator credits  
- `src/config/weights/sectionWeights.js` - Section weights
- `src/config/weights/index.js` - Unified getter
- `src/config/credits/index.js` - Unified getter

### 2. Integration Files
- `src/features/dashboard/technical/engine/technicalConfigAdapter.js` - Mode-aware adapter

### 3. Core Files (UPDATED)
- `src/features/dashboard/technical/ui/TechnicalPage.jsx` - Import TOTAL_TECHNICAL_CREDITS from config
- `src/features/dashboard/technical/engine/technicalHelper.js` - Import technicalSections from config
- `src/features/dashboard/technical/engine/indicatorsConfig.js` - Dynamic total calculation

## How It Works

### Data Flow

```
User Preferences → Trading Mode → Config Adapter → Technical Page → UI Components
```

1. **User preferences** determine trading mode (Balanced/Aggressive/Conservative)
2. **Config adapter** (`technicalConfigAdapter.js`) merges:
   - Base indicator metadata from `indicatorsConfig.js`
   - Mode-specific weights from `config/weights/technicalWeights.js`
   - Mode-specific credits from `config/credits/technicalCredits.js`
3. **Technical page** uses the merged config
4. **UI components** display weight/credit values from the data

### Current Implementation

**TechnicalPage.jsx** (Line 30):
```javascript
import { TOTAL_TECHNICAL_CREDITS } from "@/config/credits/technicalCredits";
```

**technicalHelper.js** (To be updated):
```javascript
import { technicalSections } from '@/config/weights/sectionWeights.js';
```

**indicatorsConfig.js** (Line 271):
```javascript
export const TOTAL_TECHNICAL_CREDITS = technicalIndicatorsConfig.reduce(
    (sum, indicator) => sum + (indicator.creditAllocation || 0), 0
);
```

## UI Components (No Changes Needed)

The following files correctly read from the data object and require NO changes:

- `TechnicalCard.jsx` - Reads `card.creditAllocation`
- `TechnicalGrid.jsx` - Sorts by `creditAllocation`
- `TechnicalModal.jsx` - Displays `card.weight` as "Impact"
- `TechnicalMetricsDesk.jsx` - Uses data as-is
- `TechnicalInterpretationDesk.jsx` - Uses data as-is
- `TechnicalHistoryChart.jsx` - Uses data as-is

## Trading Mode Support

### To Enable Mode-Based Weights/Credits

Update `TechnicalPage.jsx` to use the adapter:

```javascript
import { getTechnicalConfig } from "@/features/dashboard/technical/engine/technicalConfigAdapter";

// Instead of:
const technicalCards = useMemo(() => generateLiveTechnicalData(), []);

// Use:
const technicalCards = useMemo(() => {
    const baseData = generateLiveTechnicalData();
    const config = getTechnicalConfig(userPreferences);
    // Merge mode-specific weights/credits
    return baseData.map((card, i) => ({
        ...card,
        weight: config[i]?.weight || card.weight,
        creditAllocation: config[i]?.creditAllocation || card.creditAllocation
    }));
}, [userPreferences]);
```

## Verification Checklist

- [x] Created centralized config files
- [x] Created section weights config
- [x] Created config adapter
- [x] Updated TOTAL_TECHNICAL_CREDITS import
- [x] Dynamic total calculation in indicatorsConfig.js
- [ ] Update technicalHelper.js to import section weights
- [ ] Update TechnicalPage.jsx to use config adapter (optional - for mode support)
- [ ] Test build
- [ ] Test runtime with different modes

## Benefits

✅ **No Hardcoded Values**: All weights/credits in centralized config  
✅ **Trading Mode Support**: Easy to switch strategies  
✅ **Dynamic Totals**: Auto-calculate sums  
✅ **Maintainability**: Single source of truth  
✅ **Backward Compatible**: Existing code works without changes
