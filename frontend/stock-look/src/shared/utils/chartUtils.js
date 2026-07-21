/**
 * @file chartUtils.js
 * @purpose Comprehensive chart data processing and formatting utilities.
 * @responsibilities
 * - Statistical calculations (bands, moving averages, normalization).
 * - Data formatting (numbers, dates, deltas).
 * - Color zone determination based on metric thresholds.
 * - Tooltip context generation for market insights.
 * - Data smoothing and regime detection.
 * @key_exports
 * - calculateStatisticalBands, calculateMovingAverage, smoothData
 * - formatNumber, formatChartDate
 * - getColorZone, getZoneColor, getRegime
 * - calculateDelta, normalizeData, getTooltipContext
 * @dependencies
 * - None (pure utility functions)
 * @lifecycle
 * - Used by all chart components across the application.
 * @date 2026-02-04
 */

// =============================
// Statistical Calculations
// =============================


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

// =============================
// Color Zone Utilities
// =============================
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

// =============================
// Data Calculations
// =============================
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

// =============================
// Formatting Utilities
// =============================
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

// =============================
// Tooltip Context
// =============================
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

// =============================
// Advanced Calculations
// =============================
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


export function normalizeData(value, min, max) {
  if (max === min) return 0;
  return ((value - min) / (max - min)) * 2 - 1;
}


export function getRegime(value, thresholds = { high: 0.3, low: -0.3 }) {
  if (value > thresholds.high) return 'risk-on';
  if (value < thresholds.low) return 'risk-off';
  return 'neutral';
}


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

// =============================
// Supertrend Calculation
// =============================

export function calculateSupertrend(data, period = 10, multiplier = 3) {
    if (!data || data.length < period) return { up: [], down: [] };
    
    // 1. Calculate True Range (TR)
    const tr = [0];
    for (let i = 1; i < data.length; i++) {
        const high = data[i].high;
        const low = data[i].low;
        const prevClose = data[i-1].close;
        const currentTr = Math.max(
            high - low,
            Math.abs(high - prevClose),
            Math.abs(low - prevClose)
        );
        tr.push(currentTr);
    }
    
    // 2. Calculate Average True Range (ATR) using RMA (Wilder's Smoothing)
    const atr = [tr[0]];
    for (let i = 1; i < data.length; i++) {
        const currentAtr = (atr[i-1] * (period - 1) + tr[i]) / period;
        atr.push(currentAtr);
    }
    
    // 3. Calculate Supertrend Bands
    const upSeries = [];
    const downSeries = [];
    
    let finalUpper = 0;
    let finalLower = 0;
    let prevFinalUpper = 0;
    let prevFinalLower = 0;
    let supertrend = 1; // 1 for up, -1 for down
    let prevSupertrend = 1;
    
    for (let i = 0; i < data.length; i++) {
        if (i < period) {
            continue;
        }
        
        const close = data[i].close;
        const high = data[i].high;
        const low = data[i].low;
        const prevClose = data[i-1].close;
        
        const basicUpper = (high + low) / 2 + multiplier * atr[i];
        const basicLower = (high + low) / 2 - multiplier * atr[i];
        
        if (basicUpper < prevFinalUpper || prevClose > prevFinalUpper) {
            finalUpper = basicUpper;
        } else {
            finalUpper = prevFinalUpper;
        }
        
        if (basicLower > prevFinalLower || prevClose < prevFinalLower) {
            finalLower = basicLower;
        } else {
            finalLower = prevFinalLower;
        }
        
        if (prevSupertrend === 1 && close <= finalUpper) {
            supertrend = -1;
        } else if (prevSupertrend === -1 && close >= finalLower) {
            supertrend = 1;
        } else {
            supertrend = prevSupertrend;
        }
        
        const time = data[i].time;
        
        if (supertrend === 1) {
            upSeries.push({ time, value: finalLower });
        } else {
            downSeries.push({ time, value: finalUpper });
        }
        
        prevFinalUpper = finalUpper;
        prevFinalLower = finalLower;
        prevSupertrend = supertrend;
    }
    
    return { up: upSeries, down: downSeries };
}

// =============================
// VWAP Calculation
// =============================
export function calculateVWAP(data) {
    if (!data || data.length === 0) return [];
    
    const vwapSeries = [];
    let cumulativeVolume = 0;
    let cumulativeVolumePrice = 0;
    let currentDay = null;
    
    for (let i = 0; i < data.length; i++) {
        const item = data[i];
        
        // Extract day from unix timestamp or time object to handle intraday resets
        let itemDay = null;
        if (typeof item.time === 'number') {
            const date = new Date(item.time * 1000); // lightweight charts unix is usually seconds
            itemDay = date.getUTCFullYear() + '-' + date.getUTCMonth() + '-' + date.getUTCDate();
        } else if (item.time && typeof item.time === 'object' && item.time.year) {
            itemDay = `${item.time.year}-${item.time.month}-${item.time.day}`;
        } else if (typeof item.time === 'string') {
            const date = new Date(item.time);
            itemDay = date.getUTCFullYear() + '-' + date.getUTCMonth() + '-' + date.getUTCDate();
        }
        
        // Reset at start of new day
        if (itemDay !== currentDay) {
            cumulativeVolume = 0;
            cumulativeVolumePrice = 0;
            currentDay = itemDay;
        }
        
        const typicalPrice = (item.high + item.low + item.close) / 3;
        const volume = item.volume || 0;
        
        cumulativeVolume += volume;
        cumulativeVolumePrice += (typicalPrice * volume);
        
        if (cumulativeVolume > 0) {
            vwapSeries.push({ time: item.time, value: cumulativeVolumePrice / cumulativeVolume });
        }
    }
    
    return vwapSeries;
}

// =============================
// EMA Calculation
// =============================
export function calculateEMA(data, period) {
    if (!data || data.length < period) return [];
    
    const emaSeries = [];
    const multiplier = 2 / (period + 1);
    
    // Calculate initial SMA for first EMA point
    let sum = 0;
    for (let i = 0; i < period; i++) {
        sum += data[i].close;
    }
    let prevEma = sum / period;
    
    // We can output the SMA as the first point
    emaSeries.push({ time: data[period - 1].time, value: prevEma });
    
    for (let i = period; i < data.length; i++) {
        const currentEma = (data[i].close - prevEma) * multiplier + prevEma;
        emaSeries.push({ time: data[i].time, value: currentEma });
        prevEma = currentEma;
    }
    
    return emaSeries;
}

// =============================
// CPR Calculation (Central Pivot Range)
// =============================
export function calculateCPR(data) {
    if (!data || data.length === 0) return { tc: [], p: [], bc: [] };
    
    const dailyData = {};
    
    // 1. Group data by day to find daily High, Low, Close
    for (let i = 0; i < data.length; i++) {
        const item = data[i];
        let itemDay = null;
        if (typeof item.time === 'number') {
            const date = new Date(item.time * 1000);
            itemDay = date.getUTCFullYear() + '-' + date.getUTCMonth() + '-' + date.getUTCDate();
        } else if (item.time && typeof item.time === 'object' && item.time.year) {
            itemDay = `${item.time.year}-${item.time.month}-${item.time.day}`;
        } else if (typeof item.time === 'string') {
            const date = new Date(item.time);
            itemDay = date.getUTCFullYear() + '-' + date.getUTCMonth() + '-' + date.getUTCDate();
        }
        
        if (!itemDay) continue;
        
        if (!dailyData[itemDay]) {
            dailyData[itemDay] = { high: item.high, low: item.low, close: item.close, items: [] };
        } else {
            dailyData[itemDay].high = Math.max(dailyData[itemDay].high, item.high);
            dailyData[itemDay].low = Math.min(dailyData[itemDay].low, item.low);
            dailyData[itemDay].close = item.close; // Will end up being the last close of the day
        }
        dailyData[itemDay].items.push(item);
    }
    
    const tcSeries = [];
    const pSeries = [];
    const bcSeries = [];
    
    const days = Object.keys(dailyData);
    
    // 2. Calculate CPR for each day using PREVIOUS day's HLC
    for (let i = 1; i < days.length; i++) {
        const prevDay = dailyData[days[i - 1]];
        const currentDay = dailyData[days[i]];
        
        const pivot = (prevDay.high + prevDay.low + prevDay.close) / 3;
        const bc = (prevDay.high + prevDay.low) / 2;
        const tc = (pivot - bc) + pivot;
        
        // Ensure TC is always the higher value and BC is lower (Standard CPR convention)
        const topCentral = Math.max(tc, bc);
        const bottomCentral = Math.min(tc, bc);
        
        // Project across all intraday bars of the current day
        for (const item of currentDay.items) {
            tcSeries.push({ time: item.time, value: topCentral });
            pSeries.push({ time: item.time, value: pivot });
            bcSeries.push({ time: item.time, value: bottomCentral });
        }
    }
    
    return { tc: tcSeries, p: pSeries, bc: bcSeries };
}
