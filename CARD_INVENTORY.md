# Praxis Dashboard - Master Card Inventory

> **Inventory Status**: Synchronized with active production codebase across all 5 dashboard modules. Includes active Keltner Channel (Volatility), Corporate Actions (Company Fundamentals), Dow Jones Futures & Ethereum (Foreign / Global Macro), and multi-metric Open Interest options composition. Pruned deprecated duplicates (SMA 50, SMA 200, Williams %R, TRIN, McClellan Osc, IV Percentile, CAC 40, Euro Stoxx 50, Wheat, Aluminum) remain archived.

---

## 1. Fundamentals — Index & Macro (32 Indicators)

| # | Card | Page | Data Source | Applicability |
| -: | --- | --- | --- | --- |
| 1 | Nifty P/E | Fundamentals | Manual | Index Only |
| 2 | Nifty P/B | Fundamentals | Manual | Index Only |
| 3 | M-Cap to GDP | Fundamentals | Manual | Index Only |
| 4 | Earnings Yield | Fundamentals | Manual (Index) / Auto (Company) | Both |
| 5 | Dividend Yield | Fundamentals | Manual | Both |
| 6 | EPS YoY | Fundamentals | Manual | Index Only |
| 7 | Forward EPS | Fundamentals | Manual | Index Only |
| 8 | Earnings Revision | Fundamentals | Manual | Index Only |
| 9 | Sector Earnings | Fundamentals | Manual | Index Only |
| 10 | Profit Margin | Fundamentals | Manual | Index Only |
| 11 | GDP Growth | Fundamentals | Manual | Index Only |
| 12 | CPI Inflation | Fundamentals | Manual | Index Only |
| 13 | Repo Rate | Fundamentals | Manual | Index Only |
| 14 | Policy Stance | Fundamentals | Manual | Index Only |
| 15 | Fiscal Deficit | Fundamentals | Manual | Index Only |
| 16 | Current Account | Fundamentals | Manual | Index Only |
| 17 | FII Flow | Fundamentals | Auto (Live NSE) / Manual | Index Only |
| 18 | DII Flow | Fundamentals | Auto (Live NSE) / Manual | Index Only |
| 19 | FII Trend | Fundamentals | Auto (Live SQLite) / Manual | Index Only |
| 20 | Advance / Decline | Fundamentals | Auto (Live NSE) / Manual | Index Only |
| 21 | Sector Valuation | Fundamentals | Manual | Index Only |
| 22 | Sector Growth | Fundamentals | Manual | Index Only |
| 23 | Sector Concentration | Fundamentals | Manual | Index Only |
| 24 | Cyclical / Defensive | Fundamentals | Manual | Index Only |
| 25 | MACD Momentum | Fundamentals | Manual | Index Only |
| 26 | 200 DMA Stretch | Fundamentals | Manual | Index Only |
| 27 | Credit Growth | Fundamentals | Auto (FRED/RBI) / Manual | Index Only |
| 28 | Corporate Debt | Fundamentals | Auto (FRED/RBI) / Manual | Index Only |
| 29 | Policy Tailwinds | Fundamentals | Manual | Index Only |
| 30 | India VIX | Fundamentals | Auto | Index Only |
| 31 | Crude Oil | Fundamentals | Manual | Index Only |
| 32 | Global Liquidity | Fundamentals | Manual | Index Only |

---

## 2. Fundamentals — Company (25 Indicators)

| # | Card | Page | Data Source | Applicability |
| -: | --- | --- | --- | --- |
| 33 | P/E Ratio | Fundamentals | Auto | Company Only |
| 34 | Forward P/E | Fundamentals | Auto | Company Only |
| 35 | P/B Ratio | Fundamentals | Auto | Company Only |
| 36 | EV/EBITDA | Fundamentals | Auto | Company Only |
| 37 | Relative Valuation | Fundamentals | Auto | Company Only |
| 38 | Revenue Growth | Fundamentals | Auto | Company Only |
| 39 | EPS Growth | Fundamentals | Auto | Company Only |
| 40 | Profit Growth | Fundamentals | Auto | Company Only |
| 41 | ROE | Fundamentals | Auto | Company Only |
| 42 | ROCE | Fundamentals | Auto | Company Only |
| 43 | ROA | Fundamentals | Auto | Company Only |
| 44 | Net Margin | Fundamentals | Auto | Company Only |
| 45 | Operating Margin | Fundamentals | Auto | Company Only |
| 46 | Debt to Equity | Fundamentals | Auto | Company Only |
| 47 | Free Cash Flow | Fundamentals | Auto | Company Only |
| 48 | Current Ratio | Fundamentals | Auto | Company Only |
| 49 | Interest Coverage | Fundamentals | Auto | Company Only |
| 50 | Promoter Holding | Fundamentals | Auto | Company Only |
| 51 | Smart Money Flow | Fundamentals | Auto | Company Only |
| 52 | Cash Conversion Cycle | Fundamentals | Auto (Yahoo) | Company Only |
| 53 | Analyst Consensus | Fundamentals | Auto (Yahoo) | Company Only |
| 54 | Shareholding Trend | Fundamentals | Auto (Screener.in 12Q) | Company Only |
| 55 | Sector Peer Multiples | Fundamentals | Auto (Screener.in Peers) | Company Only |
| 56 | Corporate Actions | Fundamentals | Auto | Company Only |
| 57 | 10Y Financial Statements | Fundamentals | Auto (Screener.in 10Y) | Company Only |

---

## 3. Technical Analysis (23 Cards)

| # | Card | Page | Data Source | Applicability |
| -: | --- | --- | --- | --- |
| 57 | EMA 20 | Technical Analysis | Auto | Both |
| 58 | EMA 50 | Technical Analysis | Auto | Both |
| 59 | EMA 200 | Technical Analysis | Auto | Both |
| 60 | ADX (14) | Technical Analysis | Auto | Both |
| 61 | Supertrend | Technical Analysis | Auto | Both |
| 62 | Beta Correlation | Technical Analysis | Auto | Company Only |
| 63 | RSI (14) | Technical Analysis | Auto | Both |
| 64 | MACD | Technical Analysis | Auto | Both |
| 65 | Stochastic RSI | Technical Analysis | Auto | Both |
| 66 | Bollinger Bands | Technical Analysis | Auto | Both |
| 67 | Average True Range (ATR) | Technical Analysis | Auto | Both |
| 68 | Keltner Channel | Technical Analysis | Auto | Both |
| 69 | Volume SMA | Technical Analysis | Auto | Company Only |
| 70 | OBV | Technical Analysis | Auto | Company Only |
| 71 | CMF | Technical Analysis | Auto | Company Only |
| 72 | VWAP | Technical Analysis | Auto | Company Only |
| 73 | Support Level | Technical Analysis | Auto | Both |
| 74 | Resistance Level | Technical Analysis | Auto | Both |
| 75 | Trendline | Technical Analysis | Manual | Both |
| 76 | Pivot Points | Technical Analysis | Auto | Both |
| 77 | Fibonacci Retracement | Technical Analysis | Auto | Both |
| 78 | Advance / Decline Line | Technical Analysis | Manual | Index Only |
| 79 | New High / New Low | Technical Analysis | Manual | Index Only |
| 80 | Market Breadth Ratio | Technical Analysis | Manual | Index Only |

---

## 4. Options Analysis (14 Cards + 3 Widgets)

| # | Card | Page | Data Source | Applicability |
| -: | --- | --- | --- | --- |
| 81 | ProDesk Action Signal | Options | Auto (Engine) | Both |
| 82 | Options Chain Table | Options | Upstox | Both |
| 83 | Options History Chart | Options | Auto | Both |
| 84 | Open Interest Change | Options | Upstox | Both |
| 85 | Total Call Open Interest | Options | Upstox / Manual | Both |
| 86 | Total Put Open Interest | Options | Upstox / Manual | Both |
| 87 | Put-Call Ratio (OI) | Options | Auto (Engine) | Both |
| 88 | Put-Call Ratio (Volume) | Options | Auto (Engine) | Both |
| 89 | Delta | Options | Auto (Engine) | Both |
| 90 | Gamma | Options | Auto (Engine) | Both |
| 91 | Theta | Options | Auto (Engine) | Both |
| 92 | Vega | Options | Auto (Engine) | Both |
| 93 | At-the-Money Implied Volatility | Options | Upstox | Both |
| 94 | IV Rank | Options | Auto / Manual | Both |
| 95 | Max Pain | Options | Auto (Engine) | Both |
| 96 | Expected Move | Options | Auto (Engine) / Manual | Both |
| 97 | Gamma Exposure (GEX) | Options | Auto (Engine) / Manual | Both |

---

## 5. Foreign / Global Macro (21 Indicators)

| # | Card | Page | Data Source | Applicability |
| -: | --- | --- | --- | --- |
| 98 | US Dollar Index (DXY) | Foreign Markets | Yahoo / Manual | Both |
| 99 | USD/INR Exchange Rate | Foreign Markets | Upstox / Yahoo | Both |
| 100 | USD/JPY | Foreign Markets | Yahoo / Manual | Both |
| 101 | S&P 500 Futures | Foreign Markets | Yahoo / Manual | Both |
| 102 | Nasdaq Futures | Foreign Markets | Yahoo / Manual | Both |
| 103 | Dow Jones Futures | Foreign Markets | Yahoo / Manual | Both |
| 104 | Nikkei 225 | Foreign Markets | Yahoo / Manual | Both |
| 105 | FTSE 100 | Foreign Markets | Yahoo / Manual | Both |
| 106 | DAX 40 | Foreign Markets | Yahoo / Manual | Both |
| 107 | Hang Seng | Foreign Markets | Yahoo / Manual | Both |
| 108 | Shanghai Composite | Foreign Markets | Yahoo / Manual | Both |
| 109 | Brent Crude Oil | Foreign Markets | Upstox / Yahoo | Both |
| 110 | Gold | Foreign Markets | Upstox / Yahoo | Both |
| 111 | Silver | Foreign Markets | Upstox / Yahoo | Both |
| 112 | Copper | Foreign Markets | Yahoo / Manual | Both |
| 113 | Natural Gas | Foreign Markets | Yahoo / Manual | Both |
| 114 | US 10-Year Treasury Yield | Foreign Markets | Yahoo / FRED | Both |
| 115 | CBOE Volatility Index (VIX) | Foreign Markets | Yahoo / Manual | Both |
| 116 | MOVE Index | Foreign Markets | Yahoo / Manual | Both |
| 117 | Bitcoin (BTC/USD) | Foreign Markets | CoinGecko / Yahoo | Both |
| 118 | Ethereum (ETH/USD) | Foreign Markets | CoinGecko / Yahoo | Both |

---

## 6. Backtesting Workshop & Strategy Builder (18 Components)

| # | Component | Module | Implementation | Applicability |
| -: | --- | --- | --- | --- |
| 119 | 7-Candle AI Predictor Backtest | Backtesting Workshop | Auto (Upstox Historical) | Both |
| 120 | Pattern Recognition Engine Backtest | Backtesting Workshop | Auto (Upstox Historical) | Both |
| 121 | Composite Pattern Score Backtest | Backtesting Workshop | Auto (Upstox Historical) | Both |
| 122 | PNCO Confluence Oscillator Backtest | Backtesting Workshop | Auto (Upstox Historical) | Both |
| 123 | AAVB Adaptive Volatility Bands Backtest | Backtesting Workshop | Auto (Upstox Historical) | Both |
| 124 | IFDI Institutional Flow Divergence Backtest | Backtesting Workshop | Auto (Upstox Historical) | Both |
| 125 | Tri-Factor Head-to-Head Confluence Backtest | Backtesting Workshop | Auto (Upstox Historical) | Both |
| 126 | Custom Multi-Factor Strategy Combo Backtest | Backtesting Workshop | Auto (Upstox Historical) | Both |
| 127 | Backtest Interactive Replay Chart | Backtesting Workshop | Lightweight Charts v5 | Both |
| 128 | Backtest Live Performance Scorecard & Event Log | Backtesting Workshop | Auto (Engine) | Both |
| 129 | Backtest Equity Curve & Drawdown Analysis | Backtesting Workshop | Auto (Engine) | Both |
| 130 | Custom Indicator Lab & Sandboxed Compiler | Backtesting Workshop | Auto (Node.js VM) | Both |
| 131 | Multi-Factor Strategy Builder & Rule Canvas | Strategy Builder | Auto (Confluence Engine) | Both |
| 132 | Live Chart Strategy Signals & Arrow Markers | Chart Section | Auto (Confluence Engine) | Both |
| 133 | Live Chart Custom Plotted Lab Indicators | Chart Section | Auto (Node.js Sandbox) | Both |
| 134 | Dynamic & Detachable Testable Units Grid | Backtesting Workshop | Dynamic Registry (localStorage) | Both |
| 135 | AI Foundation Model Auto-Fine-Tuning Studio & Audit History | Backtesting Workshop | Auto (SQLite / PyTorch Subprocess) | Both |
| 136 | Future Vision Predictive Models & Multi-Model Ensemble Mixer | PAI Settings | Auto (Hybrid Multi-Model Gateway) | Both |

---

## 7. Events & Macro Intelligence (10 Cards & Widgets)

| # | Component / Card | Page | Data Source | Applicability |
| -: | --- | --- | --- | --- |
| 137 | Event Institutional Gauge & Regime Meter | Events | Auto (PES-7 Engine) | Both |
| 138 | Geopolitical Shock Card | Events | Auto / Manual | Both |
| 139 | Macro Economic Pulse Card | Events | Auto / Manual | Both |
| 140 | Monetary Policy Stance Card | Events | Auto / Manual | Both |
| 141 | Corporate & Earnings Catalysts Card | Events | Auto / Manual | Both |
| 142 | Regulatory & Legal Actions Card | Events | Auto / Manual | Both |
| 143 | Global Commodity Shocks Card | Events | Auto / Manual | Both |
| 144 | Instrument Focus Mode Radar & Beta Transmission | Events | Auto (Asset Beta Matrix) | Both |
| 145 | Institutional News Wire & Deduplicated Stream | Events | Auto (Jaccard Filter / RSS) | Both |
| 146 | PES-7 Factor Decomposition Inspector | Events | Auto (PES-7 Math Engine) | Both |

