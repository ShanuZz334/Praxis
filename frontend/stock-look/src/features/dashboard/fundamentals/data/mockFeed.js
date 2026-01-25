const subscribers = [];

/* ======================================================
   INITIAL STATE (REALISTIC BASE VALUES – INDIA)
====================================================== */
const state = {
  // ===== Valuation =====
  nifty_pe: 21.5,
  forward_pe: 20.2,
  nifty_pb: 3.9,
  earnings_yield: 4.7,
  mcap_gdp: 118,

  // ===== Earnings =====
  eps_yoy: 12.5,
  forward_eps: 14.8,
  earnings_revision: 0.3,
  sector_earnings: 0.4,
  profit_margin: 14.5,

  // ===== Macro =====
  gdp: 6.6,
  cpi: 5.4,
  repo: 6.5,
  policy_stance: 0,
  fiscal_deficit: 5.6,
  current_account: -1.1,

  // ===== Liquidity & Flows =====
  fii: 1800,
  dii: 1200,
  fii_trend: 0.3,
  system_liquidity: 42000,
  mf_flows: 9500,

  // ===== Sector =====
  sector_valuation: 0.2,
  sector_growth: 8.5,
  sector_concentration: 58,
  cyc_def: 2.5,

  // ===== Corporate =====
  corp_debt: 55,
  credit_growth: 14.2,
  tax_env: 0.2,
  policy_tailwinds: 0.3,

  // ===== Global =====
  global_growth: 0.1,
  crude: 84,
  usdinr: 83.1,
  global_liq: 0.15,

  // ===== Risk =====
  sovereign_risk: -0.1,
  npa: 3.2,
  reform_momentum: 0.4,
};

/* ======================================================
   DRIFT PROFILES (THIS IS THE KEY PART)
====================================================== */
const DRIFT = {
  // Valuation (slow, sticky)
  nifty_pe: 0.03,
  forward_pe: 0.03,
  nifty_pb: 0.02,
  earnings_yield: 0.02,
  mcap_gdp: 0.15,

  // Earnings (medium)
  eps_yoy: 0.12,
  forward_eps: 0.12,
  earnings_revision: 0.05,
  sector_earnings: 0.05,
  profit_margin: 0.08,

  // Macro (very slow)
  gdp: 0.02,
  cpi: 0.03,
  repo: 0.01,
  policy_stance: 0.02,
  fiscal_deficit: 0.02,
  current_account: 0.02,

  // Liquidity (fast)
  fii: 350,
  dii: 250,
  fii_trend: 0.08,
  system_liquidity: 1800,
  mf_flows: 500,

  // Sector
  sector_valuation: 0.06,
  sector_growth: 0.12,
  sector_concentration: 0.1,
  cyc_def: 0.15,

  // Corporate
  corp_debt: 0.05,
  credit_growth: 0.1,
  tax_env: 0.05,
  policy_tailwinds: 0.04,


  // Global
  global_growth: 0.05,
  crude: 0.4,
  usdinr: 0.08,
  global_liq: 0.06,

  // Risk
  sovereign_risk: 0.04,
  npa: 0.05,
  reform_momentum: 0.04,
};

/* ======================================================
   LIVE TICK (REALISTIC BEHAVIOUR)
====================================================== */
function tick() {
  Object.keys(state).forEach((k) => {
    const vol = DRIFT[k] ?? 0.05;

    // Random walk with slight mean reversion
    const delta = (Math.random() - 0.5) * vol;
    state[k] += delta;

    // Soft mean reversion for macro stability
    if (k === "gdp") state[k] = clamp(state[k], 5.5, 7.5);
    if (k === "cpi") state[k] = clamp(state[k], 4.5, 6.5);
    if (k === "repo") state[k] = clamp(state[k], 5.5, 7.5);
    if (k === "usdinr") state[k] = clamp(state[k], 80, 86);
    if (k === "crude") state[k] = clamp(state[k], 65, 110);
  });

  const snapshot = {
    timestamp: Date.now(),
    data: { ...state },
  };

  subscribers.forEach((cb) => cb(snapshot));
}

/* ======================================================
   SUBSCRIPTION API (REAL-TIME STYLE)
====================================================== */
export function subscribeFundamentalFeed(cb) {
  subscribers.push(cb);

  // Immediate snapshot (like real API)
  cb({
    timestamp: Date.now(),
    data: { ...state },
  });

  return () => {
    const i = subscribers.indexOf(cb);
    if (i !== -1) subscribers.splice(i, 1);
  };
}

/* ======================================================
   UTIL
====================================================== */
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/* ======================================================
   START FEED
====================================================== */
setInterval(tick, 2000);
