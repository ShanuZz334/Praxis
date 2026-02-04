# Configuration Guide - Weights & Credits System

## Overview

The Stocky platform uses a centralized configuration system for weights and credits across all intelligence modules. This allows easy adjustment of trading strategies through **Trading Modes** without modifying code.

## Directory Structure

```
src/config/
├── tradingModes.js              # Trading mode definitions
├── weights/
│   ├── index.js                 # Unified weight getter
│   └── technicalWeights.js      # Technical indicators (167)
└── credits/
    ├── index.js                 # Unified credit getter
    └── technicalCredits.js      # Technical indicators (167)
```

## Trading Modes

### 1. Balanced (Default)
- **Description**: Equal weight distribution across all indicators
- **Risk Level**: Medium
- **Focus**: All-around analysis
- **Use Case**: General market conditions, diversified approach

### 2. Aggressive
- **Description**: Higher weights on momentum and trend-following indicators
- **Risk Level**: High
- **Focus**: Momentum & Trend
- **Multipliers**:
  - Momentum: 1.3x weight, 1.5x credits
  - Trend: 1.2x weight, 1.3x credits
  - Breakout: 1.4x weight, 1.6x credits
  - Structure: 0.8x weight
  - Traps: 0.6x credits
- **Use Case**: Strong trending markets, momentum plays

### 3. Conservative
- **Description**: Higher weights on structure, support/resistance, and mean-reversion
- **Risk Level**: Low
- **Focus**: Structure & Support
- **Multipliers**:
  - Structure: 1.3x weight, 1.4x credits
  - Fibonacci: 1.2x weight, 1.3x credits
  - Traps: 1.4x weight, 1.6x credits
  - Momentum: 0.7x weight, 0.6x credits
  - Breakout: 0.6x weight, 0.5x credits
- **Use Case**: Choppy markets, risk management focus

## How to Use

### Getting Weights for Current Mode

```javascript
import { getWeights } from '@/config/weights';

// In a component with user preferences
const weights = getWeights('technical', userPreferences);
const rsiWeight = weights.m_rsi; // Gets mode-adjusted weight
```

### Getting Credits for Current Mode

```javascript
import { getCredits } from '@/config/credits';

const credits = getCredits('technical', userPreferences);
const rsiCredit = credits.m_rsi; // Gets mode-adjusted credit
```

### Using the Adapter (Technical Page)

```javascript
import { getTechnicalConfig } from '@/features/dashboard/technical/engine/technicalConfigAdapter';

// Gets complete config with mode-specific weights/credits
const config = getTechnicalConfig(userPreferences);
```

## Modifying Configurations

### Adjusting Base Weights

Edit `src/config/weights/technicalWeights.js`:

```javascript
export const TECHNICAL_WEIGHTS = {
    'm_rsi': 0.05,  // Change this value
    // ...
};
```

### Adjusting Base Credits

Edit `src/config/credits/technicalCredits.js`:

```javascript
export const TECHNICAL_CREDITS = {
    'm_rsi': 3,  // Change this value
    // ...
};
```

### Adjusting Mode Multipliers

Edit the multipliers in `technicalWeights.js` or `technicalCredits.js`:

```javascript
export const MODE_MULTIPLIERS = {
    [TRADING_MODES.AGGRESSIVE]: {
        momentum: 1.3,  // Adjust multiplier
        // ...
    }
};
```

### Adding New Trading Modes

1. Add mode to `tradingModes.js`:
```javascript
export const TRADING_MODES = {
    BALANCED: 'balanced',
    AGGRESSIVE: 'aggressive',
    CONSERVATIVE: 'conservative',
    SCALPING: 'scalping'  // New mode
};
```

2. Add metadata:
```javascript
export const MODE_METADATA = {
    [TRADING_MODES.SCALPING]: {
        name: 'Scalping',
        description: 'Ultra-short-term trading focus',
        riskLevel: 'Very High',
        focus: 'Microstructure & Momentum',
        icon: '⚡'
    }
};
```

3. Add multipliers in weight/credit files:
```javascript
export const MODE_MULTIPLIERS = {
    [TRADING_MODES.SCALPING]: {
        microstructure: 1.8,
        momentum: 1.5,
        // ...
    }
};
```

## Technical Indicators Reference

### Categories

- **Trend** (t_*): EMA crosses, ADX, Supertrend, Ichimoku
- **Momentum** (m_*): RSI, MACD, Stochastic, ROC
- **Volatility** (v_*): ATR, Bollinger Bands, Historical Vol
- **Volume** (vol_*): OBV, Accumulation/Distribution, VWAP
- **Structure** (s_*): Swing points, Break of Structure, Support/Resistance
- **Breadth** (s_breadth, rs_*, sec_*): Market breadth, Relative strength, Sector rotation
- **Fibonacci** (f_*): Retracement levels, Extensions
- **Reversals** (r_*): Divergences, Exhaustion signals
- **VWAP** (vw_*): Anchored VWAP, Bands, Slope
- **Market Profile** (mp_*): Value Area, POC, Initial Balance
- **Breakouts** (bk_*): Breakout quality, Follow-through
- **Traps** (tp_*): Bull/Bear traps, Failed breakouts
- **Exhaustion** (ex_*): Trend age, Momentum decay
- **Microstructure** (ms_*): Candle patterns, Intraday behavior
- **Statistical** (st_*): Win rate, Sharpe ratio, Expectancy
- **Regime** (rg_*): Regime detection, Transition risk
- **Forecast** (fc_*): Probability, Expected returns
- **Governors** (gv_*): Final confidence adjustments

### Total Indicators: 167

## Best Practices

1. **Test Changes**: Always test weight/credit changes in development before production
2. **Document Changes**: Comment why you changed specific values
3. **Version Control**: Commit config changes separately from code changes
4. **Backup**: Keep backups of working configurations
5. **Gradual Adjustments**: Make small incremental changes rather than large jumps

## Future Enhancements

- [ ] Add Options page weights/credits
- [ ] Add Foreign Markets page weights/credits
- [ ] Add Fundamental page weights/credits
- [ ] Add Events page weights/credits
- [ ] Add Master Dashboard weights/credits
- [ ] Add UI for mode selection in settings
- [ ] Add mode performance tracking
- [ ] Add A/B testing framework for configurations
