/**
 * Adds explicit cardId props to TechnicalGrid.jsx and OptionsGrid.jsx.
 */
const fs = require('fs');
const path = require('path');

// ── TechnicalGrid: patch every card JSX instance ──────────────────────────
const TECH_PATH = path.resolve(__dirname, 'frontend/stock-look/src/features/dashboard/technical/ui/TechnicalGrid.jsx');
let techContent = fs.readFileSync(TECH_PATH, 'utf8');

// Mapping of id used in the grid → cardId string to inject
const TECH_MAP = {
    'ema_20': 'ema_20', 'ema_50': 'ema_50', 'ema_200': 'ema_200',
    'sma_50': 'sma_50', 'sma_200': 'sma_200', 'adx': 'adx',
    'supertrend': 'supertrend', 'beta_correlation': 'beta_correlation',
    'rsi': 'rsi', 'macd': 'macd', 'stoch_rsi': 'stoch_rsi', 'williams_r': 'williams_r',
    'bb_20_2': 'bb_20_2', 'atr': 'atr', 'kc': 'kc',
    'cmf': 'cmf', 'volume_sma': 'volume_sma', 'obv': 'obv', 'vwap': 'vwap',
    'support': 'support', 'resistance': 'resistance', 'trendline': 'trendline',
    'pivot': 'pivot', 'fibonacci': 'fibonacci',
    'ad_line': 'ad_line', 'nh_nl': 'nh_nl',
    'breadth_ratio': 'breadth_ratio', 'trin': 'trin', 'mcclellan': 'mcclellan',
};

// For sectioned view: JSX like <RSICard data={...} ... /> → <RSICard cardId="rsi" data={...} ... />
// For flat view: JSX like { id: 'rsi', node: <RSICard ... /> } → <RSICard cardId="rsi" ... />
// Strategy: replace <ComponentNameCard (without cardId=) to add cardId="xxx"
const COMPONENT_TO_ID = {
    'EMA20Card': 'ema_20', 'EMA50Card': 'ema_50', 'EMA200Card': 'ema_200',
    'SMA50Card': 'sma_50', 'SMA200Card': 'sma_200', 'ADXCard': 'adx',
    'SupertrendCard': 'supertrend', 'BetaCorrelationCard': 'beta_correlation',
    'RSICard': 'rsi', 'MACDCard': 'macd', 'StochRSICard': 'stoch_rsi', 'WilliamsRCard': 'williams_r',
    'BBCard': 'bb_20_2', 'ATRCard': 'atr', 'KCCard': 'kc',
    'CmfCard': 'cmf', 'VolumeSmaCard': 'volume_sma', 'ObvCard': 'obv', 'VwapCard': 'vwap',
    'SupportCard': 'support', 'ResistanceCard': 'resistance', 'TrendlineCard': 'trendline',
    'PivotCard': 'pivot', 'FibonacciCard': 'fibonacci',
    'ADLineCard': 'ad_line', 'NhnlCard': 'nh_nl',
    'BreadthRatioCard': 'breadth_ratio', 'TrinCard': 'trin', 'McClellanCard': 'mcclellan',
};

Object.entries(COMPONENT_TO_ID).forEach(([comp, cid]) => {
    // Match opening JSX tag that doesn't already have cardId
    const regex = new RegExp(`(<${comp}\\b)(?!([^>]*cardId))`, 'g');
    techContent = techContent.replace(regex, `$1 cardId="${cid}"`);
});
fs.writeFileSync(TECH_PATH, techContent, 'utf8');
console.log('✅ TechnicalGrid patched');

// ── OptionsGrid: patch every card JSX instance ────────────────────────────
const OPTS_PATH = path.resolve(__dirname, 'frontend/stock-look/src/features/dashboard/options/ui/OptionsGrid.jsx');
let optsContent = fs.readFileSync(OPTS_PATH, 'utf8');

const OPTS_COMP = {
    'AtmIvCard': 'atm_iv', 'IvRankCard': 'iv_rank', 'IvPercentileCard': 'iv_percentile',
    'TotalCallOpenInterestCard': 'total_call_oi', 'TotalPutOpenInterestCard': 'total_put_oi',
    'OpenInterestChangeCard': 'oi_change', 'DeltaCard': 'delta', 'GammaCard': 'gamma',
    'ThetaCard': 'theta', 'VegaCard': 'vega',
    'PcrOiCard': 'pcr_oi', 'PcrVolumeCard': 'pcr_volume', 'MaxPainCard': 'max_pain',
    'FnOBanCard': 'fno_ban',
};

Object.entries(OPTS_COMP).forEach(([comp, cid]) => {
    const regex = new RegExp(`(<${comp}\\b)(?!([^>]*cardId))`, 'g');
    optsContent = optsContent.replace(regex, `$1 cardId="${cid}"`);
});
fs.writeFileSync(OPTS_PATH, optsContent, 'utf8');
console.log('✅ OptionsGrid patched');

console.log('\nDone — TechnicalGrid and OptionsGrid have explicit cardId on every card.');
