import { CARD_REGISTRY } from '@/shared/config/cardRegistry';
/**
 * @file FundamentalDetail.jsx
 * @purpose Detailed view for a specific Fundamental metric.
 * @responsibilities
 * - Renders the main value, signal label, and history chart.
 * - Generates mock history data (since backend timeseries is pending).
 * - Provides educational "Why this matters" context.
 * @key_exports
 * - FundamentalDetail (Default Component)
 * @dependencies
 * - ChartWrapper / Recharts
 * - chartMapping (for chart configurations)
 * @lifecycle
 * - Rendered inside FundamentalModal.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React, { useMemo, useState } from "react";
import ChartWrapper from "@/shared/components/charts/ChartWrapper";
import { getChartForCard, shouldShowChart, getChartType } from "./chartMapping";

// =============================
// Constants
// =============================
const INVERSE_METRICS = ['npa', 'cpi', 'fiscal_deficit', 'corp_debt', 'crude', 'vix', 'sovereign_risk', 'repo'];

// =============================
// Helpers
// =============================
function signalLabel(n) {
  if (n > 0.25) return "Bullish";
  if (n < -0.25) return "Bearish";
  return "Neutral";
}

function signalColor(n, metricId = null) {
  const isInverse = metricId && INVERSE_METRICS.includes(metricId);
  const effectiveN = isInverse ? -n : n;

  if (effectiveN > 0.25) return "var(--success)";
  if (effectiveN < -0.25) return "var(--danger)";
  return "var(--text-muted)";
}

function getInsightForCard(card) {
  const insights = {
    nifty_pe: 'PE ratio shows market trading at premium to historical averages. Monitor for mean reversion opportunities.',
    nifty_pb: 'Price-to-book indicates valuation relative to asset base. Compare with sector peers for context.',
    earnings_yield: 'Earnings yield vs bond yield spread (ERP) indicates equity risk premium. Positive spread favors equities.',
    mcap_gdp: 'Buffett Indicator tracks market cap relative to GDP. Above 100% suggests elevated valuations.',
    eps_yoy: 'Earnings growth momentum drives market direction. Acceleration supports higher multiples.',
    earnings_revision: 'Net revisions (upgrades minus downgrades) signal analyst sentiment shift. Positive flow is bullish.',
  const [range, setRange] = useState(30);

  // Chart Data Preparation
  const chartData = useMemo(() => {
    const mockData = generateMockChartData(card.id, range);
    return prepareChartData(card.id, mockData);
  }, [card.id, range]);

  const color = signalColor(card.normalized, card.id);
  const showChart = shouldShowChart(card.id);

  return (
    <div className="space-y-6">

      {/* VALUE HEADER */}
      <div className="flex items-end gap-4 border-b border-white/5 pb-4">
        <div className="text-4xl font-bold text-white tracking-tight">
          {typeof card.raw === 'number' ? card.raw.toFixed(2) : card.raw}
          <span className="text-lg font-normal text-white/40 ml-1">{card.unit}</span>
        </div>
        <div className="text-sm mb-1.5 font-medium px-2 py-0.5 rounded bg-white/5 uppercase tracking-wide" style={{ color }}>
          {signalLabel(card.normalized)}
        </div>
      </div>

      {/* RANGE SELECTOR */}
      <div className="flex gap-2">
        {[5, 10, 30].map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`
              px-3 py-1 text-xs rounded-md transition-all
              ${range === r
                ? "bg-blue-500 text-white"
                : "bg-white/5 text-white/50 hover:bg-white/10"}
            `}
          >
            {r}D
          </button>
        ))}
      </div>

      {/* CHART SECTION */}
      <div className="min-h-[350px] relative mb-8">
        {showChart ? (
          <ChartWrapper
            loading={false}
            height={350}
            skeletonType={getChartType(card.id)}
            className="overflow-visible"
          >
            {getChartForCard(card.id, chartData, 350)}
          </ChartWrapper>
        ) : (
          <div className="h-[300px] bg-black/30 rounded-xl p-4 flex items-center justify-center border border-white/5 border-dashed">
            <div className="text-center">
              <div className="text-white/60 text-sm mb-2">📊 Chart visualization coming soon</div>
              <div className="text-white/40 text-xs">{card.label}</div>
            </div>
          </div>
        )}
      </div>

      {/* EDUCATIONAL INSIGHT */}
      <div className="bg-[#0b1220] border border-white/10 rounded-xl p-5 shadow-inner">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-blue-400 text-lg">💡</span>
          <span className="text-sm font-semibold text-blue-100">Why this matters</span>
        </div>
        <p className="text-sm text-white/70 leading-relaxed pl-7">
          {getInsightForCard(card)}
        </p>
      </div>

    </div>
  );
}
