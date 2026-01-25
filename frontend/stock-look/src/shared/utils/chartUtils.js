/**
 * Chart Utilities
 * Shared utilities for chart data processing, formatting, and calculations
 */

/**
 * Calculate statistical bands (mean ± standard deviations)
 */
export function calculateStatisticalBands(data, periods = [5, 10]) {
  const bands = {};
  
  periods.forEach(period => {
    const slice = data.slice(-period * 252); // Assuming daily data, ~252 trading days/year
    const values = slice.map(d => d.value);
    
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    bands[`${period}Y`] = {
      mean,
      stdDev,
      upper1: mean + stdDev,
      upper2: mean + 2 * stdDev,
      lower1: mean - stdDev,
      lower2: mean - 2 * stdDev,
    };
  });
  
  return bands;
}

/**
 * Determine color zone based on value and thresholds
 */
export function getColorZone(value, config) {
  const { type = 'pe', inverted = false } = config;
  
  // PE/PB zones (higher = more expensive)
  if (type === 'pe' || type === 'pb') {
    if (inverted) {
      if (value < -0.5) return 'bull-strong';
      if (value < -0.2) return 'bull-weak';
      if (value < 0.2) return 'neutral';
      if (value < 0.5) return 'bear-weak';
      return 'bear-strong';
    } else {
      if (value > 0.5) return 'bear-strong';
      if (value > 0.2) return 'bear-weak';
      if (value > -0.2) return 'neutral';
      if (value > -0.5) return 'bull-weak';
      return 'bull-strong';
    }
  }
  
  // Growth zones (higher = better)
  if (type === 'growth') {
    if (value > 0.5) return 'bull-strong';
    if (value > 0.2) return 'bull-weak';
    if (value > -0.2) return 'neutral';
    if (value > -0.5) return 'bear-weak';
    return 'bear-strong';
  }
  
  // Default normalized (-1 to 1)
  if (value > 0.5) return inverted ? 'bear-strong' : 'bull-strong';
  if (value > 0.2) return inverted ? 'bear-weak' : 'bull-weak';
  if (value > -0.2) return 'neutral';
  if (value > -0.5) return inverted ? 'bull-weak' : 'bear-weak';
  return inverted ? 'bull-strong' : 'bear-strong';
}

/**
 * Get color for a zone
 */
export function getZoneColor(zone) {
  const colors = {
    'bull-strong': 'var(--bull-strong, #22c55e)',
    'bull-weak': 'var(--bull-weak, #86efac)',
    'neutral': 'var(--neutral, #fbbf24)',
    'bear-weak': 'var(--bear-weak, #fca5a5)',
    'bear-strong': 'var(--bear-strong, #ef4444)',
  };
  return colors[zone] || colors.neutral;
}

/**
 * Calculate delta vs previous period
 */
export function calculateDelta(current, previous) {
  if (!previous || previous === 0) return null;
  
  const delta = current - previous;
  const deltaPercent = (delta / Math.abs(previous)) * 100;
  
  return {
    absolute: delta,
    percent: deltaPercent,
    direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat',
  };
}

/**
 * Format number for display
 */
export function formatNumber(value, options = {}) {
  const {
    decimals = 2,
    suffix = '',
    prefix = '',
    compact = false,
  } = options;
  
  if (value === null || value === undefined) return '—';
  
  let formatted = value;
  
  if (compact && Math.abs(value) >= 1000) {
    if (Math.abs(value) >= 10000000) {
      formatted = (value / 10000000).toFixed(decimals) + ' Cr';
    } else if (Math.abs(value) >= 100000) {
      formatted = (value / 100000).toFixed(decimals) + ' L';
    } else {
      formatted = (value / 1000).toFixed(decimals) + 'K';
    }
  } else {
    formatted = value.toFixed(decimals);
  }
  
  return `${prefix}${formatted}${suffix}`;
}

/**
 * Generate tooltip context ("why this matters")
 */
export function getTooltipContext(metricId, value, normalized) {
  const contexts = {
    nifty_pe: {
      high: 'Market trading at premium valuations - exercise caution',
      neutral: 'Valuations in fair range - stock-specific opportunities',
      low: 'Market trading at attractive valuations - potential entry point',
    },
    eps_yoy: {
      high: 'Strong earnings growth - supportive for market rally',
      neutral: 'Moderate earnings growth - selective opportunities',
      low: 'Weak earnings growth - headwind for market',
    },
    fii: {
      high: 'Strong foreign inflows - positive momentum',
      neutral: 'Balanced foreign flows - neutral stance',
      low: 'Foreign outflows - near-term pressure',
    },
    gdp: {
      high: 'Robust economic growth - supportive macro backdrop',
      neutral: 'Moderate growth - stable environment',
      low: 'Slowing growth - macro headwind',
    },
    cpi: {
      high: 'Elevated inflation - risk of rate hikes',
      neutral: 'Inflation within target - stable policy',
      low: 'Benign inflation - room for policy easing',
    },
  };
  
  const metric = contexts[metricId];
  if (!metric) return 'Monitor this metric for market insights';
  
  if (normalized > 0.25) return metric.high;
  if (normalized < -0.25) return metric.low;
  return metric.neutral;
}

/**
 * Calculate moving average
 */
export function calculateMovingAverage(data, period) {
  if (data.length < period) return [];
  
  const result = [];
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const avg = slice.reduce((sum, d) => sum + d.value, 0) / period;
    result.push({
      date: data[i].date,
      value: avg,
    });
  }
  return result;
}

/**
 * Normalize data to -1 to 1 range
 */
export function normalizeData(value, min, max) {
  if (max === min) return 0;
  return ((value - min) / (max - min)) * 2 - 1;
}

/**
 * Get regime from normalized value
 */
export function getRegime(value, thresholds = { high: 0.3, low: -0.3 }) {
  if (value > thresholds.high) return 'risk-on';
  if (value < thresholds.low) return 'risk-off';
  return 'neutral';
}

/**
 * Format date for charts
 */
export function formatChartDate(date, format = 'short') {
  const d = new Date(date);
  
  if (format === 'short') {
    return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  }
  
  if (format === 'long') {
    return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  }
  
  if (format === 'month') {
    return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short' });
  }
  
  return d.toLocaleDateString('en-IN');
}

/**
 * Smooth data using exponential moving average
 */
export function smoothData(data, alpha = 0.3) {
  if (data.length === 0) return [];
  
  const smoothed = [data[0]];
  
  for (let i = 1; i < data.length; i++) {
    const value = alpha * data[i].value + (1 - alpha) * smoothed[i - 1].value;
    smoothed.push({
      ...data[i],
      value,
    });
  }
  
  return smoothed;
}
