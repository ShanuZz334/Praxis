# Chart Components

This directory contains all chart and data visualization components used throughout the application.

## Quick Import

Use the barrel export for cleaner imports:

```javascript
import { 
  BuffettIndicatorChart, 
  EPSGrowthChart,
  SectorHeatmap 
} from '@/shared/components/charts';
```

## Available Charts

### Main Charts
- **AdvancedCandlestickChart** - Advanced candlestick chart with indicators
- **CandleChart** - Basic candlestick chart
- **Sparkline** - Mini trend line chart

### Earnings
- **EPSGrowthChart** - EPS growth visualization
- **EarningsRevisionFlow** - Earnings revision flow chart

### Liquidity
- **FIIDIIFlowChart** - FII/DII flow visualization
- **LiquidityGauge** - Market liquidity gauge

### Macro
- **CPIInflationGauge** - CPI inflation gauge
- **GDPGrowthChart** - GDP growth chart
- **PolicyRateCycleChart** - Policy rate cycle visualization

### Risk
- **MarketStressRadar** - Market stress indicator

### Sector
- **SectorEarningsMatrix** - Sector earnings matrix
- **SectorHeatmap** - Sector performance heatmap

### Valuation
- **BuffettIndicatorChart** - Buffett indicator (Market Cap to GDP)
- **EarningsYieldChart** - Earnings yield visualization
- **ForwardPEChart** - Forward P/E ratio chart
- **MeanReversionBandChart** - Mean reversion bands
- **PBRatioChart** - Price-to-Book ratio chart

## Utilities

- **ChartControls** - Chart control buttons (timeframe, etc.)
- **ChartSkeleton** - Loading skeleton for charts
- **ChartTooltip** - Custom tooltip component
- **ChartWrapper** - Wrapper component with common functionality

## Usage Example

```javascript
import { BuffettIndicatorChart } from '@/shared/components/charts';

function MyComponent() {
  return (
    <BuffettIndicatorChart 
      data={marketData}
      timeframe="1Y"
    />
  );
}
```
