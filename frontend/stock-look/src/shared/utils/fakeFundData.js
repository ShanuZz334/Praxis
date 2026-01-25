import { generate10MinCandles } from "./fakeCandles";

/* =====================================================
   MARKET INDICES (WITH 10-MIN CANDLES)
===================================================== */

export const niftySeries = {
  symbol: "NIFTY 50",

  latest: 26186,
  change: +0.58,

  prevClose: 26032,
  prevOpen: 25990,
  prevHigh: 26220,
  prevLow: 25880,

  // 10-min candles × 5 trading days
  candles: generate10MinCandles(25950, 5),
};

export const bankNiftySeries = {
  symbol: "BANK NIFTY",

  latest: 56810,
  change: -0.42,

  prevClose: 57020,
  prevOpen: 56900,
  prevHigh: 57400,
  prevLow: 56350,

  // 10-min candles × 5 trading days
  candles: generate10MinCandles(56200, 5),
};

/* ---------- OPTIONS CE / PE (5 each + format) ---------- */

export const optionsSummary = {
  ce: [
    { symbol: "NIFTY 26500 CE", exp: "7 Nov", ltp: 248.5, change: +4.5 },
    { symbol: "NIFTY 26600 CE", exp: "7 Nov", ltp: 198.2, change: -2.1 },
    { symbol: "NIFTY 26800 CE", exp: "7 Nov", ltp: 142, change: +0.8 },
    { symbol: "NIFTY 26900 CE", exp: "7 Nov", ltp: 99.5, change: -1.5 },
    { symbol: "NIFTY 27000 CE", exp: "7 Nov", ltp: 76.8, change: +1.1 },
  ],

  pe: [
    { symbol: "NIFTY 26500 PE", exp: "7 Nov", ltp: 325.4, change: -3.2 },
    { symbol: "NIFTY 26600 PE", exp: "7 Nov", ltp: 290.8, change: -1.1 },
    { symbol: "NIFTY 26800 PE", exp: "7 Nov", ltp: 185.6, change: +1.1 },
    { symbol: "NIFTY 26900 PE", exp: "7 Nov", ltp: 149.9, change: -0.8 },
    { symbol: "NIFTY 27000 PE", exp: "7 Nov", ltp: 120.4, change: +0.4 },
  ],
};



/* ---------- MARKET MOVERS (10 each) ---------- */

export const movers = {
  topGainers: [
    { symbol: "ADANIENT", price: 3025, percent: 2.8 },
    { symbol: "TITAN", price: 3350, percent: 1.9 },
    { symbol: "LT", price: 3520, percent: 1.6 },
    { symbol: "HDFCBANK", price: 1720, percent: 1.1 },
    { symbol: "BAJAJFIN", price: 6890, percent: 0.9 },
    { symbol: "ASIANPAINT", price: 3120, percent: 0.6 },
    { symbol: "POWERGRID", price: 287, percent: 0.5 },
    { symbol: "NTPC", price: 198, percent: 0.4 },
    { symbol: "JSWSTEEL", price: 865, percent: 0.3 },
    { symbol: "MARUTI", price: 12350, percent: 0.2 },
  ],

  topLosers: [
    { symbol: "WIPRO", price: 410, percent: -2.3 },
    { symbol: "TECHM", price: 1214, percent: -1.8 },
    { symbol: "NESTLE", price: 24500, percent: -1.6 },
    { symbol: "INFY", price: 1140, percent: -1.1 },
    { symbol: "RELIANCE", price: 2540, percent: -0.9 },
    { symbol: "TCS", price: 3540, percent: -0.7 },
    { symbol: "ONGC", price: 198, percent: -0.5 },
    { symbol: "COALINDIA", price: 362, percent: -0.4 },
    { symbol: "ITC", price: 418, percent: -0.3 },
    { symbol: "SBIN", price: 692, percent: -0.2 },
  ],
};
export const worldMarkets = [
  { name: "SPX", value: 6870.39, change: 13.26, percent: 0.19 },
  { name: "DAX", value: 24028.14, change: 146.11, percent: 0.61 },
  { name: "NIKKEI", value: 50620, change: 10, percent: 0.02 },
  { name: "CAC", value: 8112.4, change: -15.9, percent: -0.20 },
  { name: "FTSE", value: 7540.3, change: 6.3, percent: 0.08 },

  // Extra 5 (scrollable)
  { name: "HANG SENG", value: 17890.4, change: 42.1, percent: 0.24 },
  { name: "NASDAQ", value: 18920.5, change: 112.4, percent: 0.59 },
  { name: "SHANGHAI", value: 3178.4, change: -4.2, percent: -0.13 },
  { name: "KOSPI", value: 2610.2, change: 8.1, percent: 0.31 },
  { name: "TAIEX", value: 20255.8, change: -12.5, percent: -0.06 },
];

export const accountOverview = {
  opening_balance: 125000,
  closing_balance: 78000,
  openTrades: 4,
  closedTrades: 18,
  profitToday: 2100,
  monthlyPnL: 18650,   // NEW
};
/* -------------------- FUNDAMENTAL GAUGE -------------------- */
export const fundamentalGaugeScore = {
  score: 32,     // Fundamental strength out of 100
  max: 100,
};

/* -------------------- FII / DII DATA -------------------- */
export const fiiDiiData = {
  fiiBuy: 1250,
  fiiSell: 890,
  diiBuy: 740,
  diiSell: 920,
  fiiNet: 1250 - 890, // +360
  diiNet: 740 - 920,  // -180

  highFii1M: 820,   // NEW (example)
  highDii1M: 540,   // NEW (example)
};

export const vixData = {
  value: 16.52,
  change: -0.32,
  avg30Day: 13.8,

  todayHigh: 15.1,
  todayLow: 13.9,

  high52Week: 29.5,
  low52Week: 10.2,
};

export const sectorPerformance = [
  { name: "IT", change: 1.8 },
  { name: "BANK", change: -0.5 },
  { name: "FMCG", change: 0.7 },
  { name: "METALS", change: -1.2 },
  { name: "AUTO", change: 1.3 },
  { name: "PHARMA", change: 0.4 },
  { name: "REALTY", change: 2.1 },
  { name: "MEDIA", change: -0.8 },
  { name: "OIL & GAS", change: 1.1 },
  { name: "PSU BANK", change: -0.4 },
];

export const macroData = [
  {
    label: "USD / INR",
    value: "₹83.12",
    history: [82.9, 83.1, 83.0, 83.2, 83.15, 83.12],
    color: "#4ade80"
  },
  {
    label: "India 10Y Bond Yield",
    value: "7.18%",
    history: [7.10, 7.12, 7.15, 7.20, 7.18, 7.18],
    color: "#60a5fa"
  },
  {
    label: "Crude Oil (Brent)",
    value: "$78.4",
    history: [79.2, 78.9, 78.6, 78.3, 78.5, 78.4],
    color: "#f87171"
  },
  {
    label: "Gold (MCX)",
    value: "₹63,420",
    history: [63400, 63500, 63300, 63250, 63450, 63420],
    color: "#facc15"
  },
  {
    label: "CPI Inflation",
    value: "5.1%",
    history: [5.3, 5.2, 5.15, 5.1, 5.1, 5.1],
    color: "#a78bfa"
  },
  {
    label: "GDP Growth",
    value: "6.7%",
    history: [6.5, 6.55, 6.6, 6.65, 6.7, 6.7],
    color: "#4ade80"
  }
];



export const sgxNifty = {
  value: 26280,
  change: +42,
  percent: +0.16,
  high: 26340,
  low: 26110,
  prevClose: 26238,
  trend: "Bullish",

  // NEW → 14-day history
  history: [25980, 26010, 26080, 26120, 26090, 26150, 26200, 
            26240, 26210, 26280, 26230, 26260, 26290, 26280]
};


/* -------------------- OPTION CHAIN SUMMARY -------------------- */
export const optionChainSummary = {
  pcr: 0.92,
  maxPain: 26700,

  highestOICE: {
    strike: 27000,
    oi: 12.5, // lakh OI
  },

  highestOIPE: {
    strike: 26500,
    oi: 14.8, // lakh OI
  },

  ivCE: 11.2,
  ivPE: 13.6,

  trend: "Neutral", // Bullish / Bearish / Neutral
};

export const sentimentData = {
  score: 61,
  bias: "Mildly Bullish",
  fearGreed: "Neutral",
  pcrSentiment: "Neutral",
  volatilityMood: "Calm",
  globalRisk: "Moderate",
  breadth: 56  // 56% of stocks advancing
};
/* ---------- NEW: Fundamental widgets fake data ---------- */

export const institutionalHoldings = {
  top3: [
    { name: "Foreign Inst.", holding: 22.4 },
    { name: "Mutual Funds", holding: 18.9 },
    { name: "Insurance", holding: 9.3 },
  ],
  netChange: 1.3,
  holdingHistory: [47, 48, 49, 50, 51, 50.6],
  fii1M: 5200,
  dii1M: 3100,
  promoterHold: 54.3,
  pledge: 1.1,
};

export const earningsCalendar = {
  upcoming: [
    { symbol: "RELI", company: "Reliance Ind", date: "2025-12-10", estimateChange: +1.2 },
    { symbol: "TCS", company: "Tata Consultancy", date: "2025-12-11", estimateChange: -0.4 },
    { symbol: "HDFC", company: "HDFC Bank", date: "2025-12-12", estimateChange: +0.6 },
    { symbol: "INFY", company: "Infosys", date: "2025-12-12", estimateChange: +0.1 },
    { symbol: "LT", company: "Larsen & Toubro", date: "2025-12-13", estimateChange: -0.3 },
  ],
};

export const economicEventsData = {
  events: [
    { name: "CPI (MoM)", country: "IN", date: "2025-12-10", impact: "High" },
    { name: "Unemployment Rate", country: "US", date: "2025-12-11", impact: "Medium" },
    { name: "Retail Sales", country: "EU", date: "2025-12-12", impact: "Low" },
    { name: "RBI Policy Decision", country: "IN", date: "2025-12-15", impact: "High" },
    { name: "FOMC Minutes", country: "US", date: "2025-12-16", impact: "Medium" },
  ],
};

export const liquidityMonitorData = {
    turnover: 24600,
  change: 2.8,
  turnoverHistory: [22000, 23500, 24000, 25000, 24600],
  cashVolume: 58000,
  foContracts: 12.5,
  delivery: 38,
  liqScore: 76,
  spread: 0.12,
volumeShock: +18,
liqRating: "High",


};

export const shortInterestData = {
  total: 128.4,
  change: -0.8,
  history: [130, 129, 128.5, 128.6, 128.4],
  daysToCover: 5.2,
};

export const volTermStructure = {
  iv1m: 12.4,
  iv3m: 13.2,
  iv6m: 14.8,
  history: [11.5, 12.0, 12.8, 13.5, 13.9, 14.8],
};

export const currencyStrength = {
  items: [
    { code: "USD", name: "US Dollar", change: +0.3, history: [82.8,82.9,83.0,83.05,83.1,83.12], color: "#4ade80" },
    { code: "EUR", name: "Euro", change: -0.2, history: [88.5,88.3,88.6,88.7,88.6,88.5], color: "#60a5fa" },
    { code: "JPY", name: "Yen", change: +0.1, history: [0.57,0.58,0.58,0.59,0.58,0.59], color: "#facc15" },
   {code: "GBP",name: "British Pound",change: -0.2,history: [103.5, 103.2, 103.0, 102.8, 102.9, 103.1],color: "#60a5fa"}

  ],
};

export const marketBreadthDeep = {
  advancing: 1824,
  declining: 1456,
  newHighs: 120,
  newLows: 34,
  ratio: "1.25",
};

export const pcrTrend = {
  current: 0.92,
  history: [0.98, 0.96, 0.94, 0.93, 0.91, 0.92],
  signal: "Neutral",
  avg5: 0.94,
  extreme: "0.80 (oversold)",
  zone: "Neutral Zone",

};

export const gsecYieldCurve = {
  tenors: [
    { tenor: "2Y", yield: 6.2, history: [6.1,6.12,6.15,6.18,6.19,6.2] },
    { tenor: "5Y", yield: 6.8, history: [6.6,6.65,6.7,6.75,6.78,6.8] },
    { tenor: "10Y", yield: 7.18, history: [7.0,7.05,7.1,7.15,7.16,7.18] },
  ],
};

export const globalSentimentComposite = {
  score: 58,
  overall: "Neutral",
  volRegime: "Normal",
  history: [52, 54, 55, 56, 57, 58],
};
// -------------------- OVERALL STOCKY GAUGE (STATIC VALUES) --------------------
export const overallGaugeData = {
  fundamental: fundamentalGaugeScore.score,  // dynamic from fundamental gauge
  technical: 68,     
  foreignMarket: 58, 
  options: 62,       
  events: 55       
};
