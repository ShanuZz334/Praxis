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
    fii: 'Foreign flows indicate global investor sentiment. Sustained inflows support market rally.',
    dii: 'Domestic institutional buying provides stability. Often counter-cyclical to FII flows.',
    system_liquidity: 'RBI liquidity surplus/deficit impacts market funding. Surplus is supportive for risk assets.',
    sector_valuation: 'Sector PE percentiles vs own history identify value pockets. Green sectors offer better risk/reward.',
    sovereign_risk: 'Composite stress indicator tracks multiple risk dimensions. Rising stress warrants defensive positioning.',
  };
  return insights[card.id] || 'Monitor this metric for market insights and trend changes.';
}

// =============================
// Logic: Mock Data Generation
// =============================
function generateMockChartData(cardId, days = 30) {
  const data = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    let value;
    // For Nifty P/E or P/B cards, we might show a distribution scatter or sector weighting chart
    if (cardId === CARD_REGISTRY.nifty_pe.id || cardId === CARD_REGISTRY.nifty_pb.id) {
      value = 20 + Math.sin(i / 5) * 2 + (Math.random() - 0.5) * 0.5;
    } else if (cardId === CARD_REGISTRY.earnings_yield.id) {
      value = 5 + Math.sin(i / 7) * 1 + (Math.random() - 0.5) * 0.3;
    } else if (cardId === 'mcap_gdp') {
      value = 95 + Math.sin(i / 10) * 10 + (Math.random() - 0.5) * 2;
    } else if (cardId === 'eps_yoy') {
      value = 10 + Math.sin(i / 8) * 5 + (Math.random() - 0.5) * 2;
    } else if (cardId === 'earnings_revision') {
      value = Math.floor(Math.random() * 20) - 10;
    } else if (cardId === 'fii') {
      value = (Math.random() - 0.5) * 5000;
    } else if (cardId === 'system_liquidity') {
      value = (Math.random() - 0.3) * 100000;
    } else {
      value = 50 + Math.sin(i / 6) * 20 + (Math.random() - 0.5) * 10;
    }

    data.push({
      date: date.toISOString().split('T')[0],
      value,
    });
  }
  return data;
}

function prepareChartData(cardId, mockData) {
  // Forward PE (Dual Line)
  if (cardId === 'forward_pe') {
    return mockData.map(d => ({
      date: d.date,
      forwardPE: d.value,
      trailingPE: d.value - 1.5 + (Math.random() - 0.5) * 0.5,
    }));
  }
  // PB
  if (cardId === 'pb') {
    return mockData.map(d => ({ date: d.date, pb: d.value }));
  }
  // GDP
  if (cardId === 'gdp') {
    return mockData.map(d => ({ date: d.date, gdp: d.value }));
  }
  // CPI (Single Point)
  if (cardId === 'cpi') {
    return { value: mockData[mockData.length - 1]?.value || 5.5 };
  }
  // Repo
  if (cardId === 'repo') {
    return mockData.map(d => ({ date: d.date, rate: d.value }));
  }
  // Earnings Yield
  if (cardId === CARD_REGISTRY.earnings_yield.id) {
    return mockData.map(d => ({
      date: d.date,
      earningsYield: d.value,
      bondYield: d.value - 1.5 + (Math.random() - 0.5) * 0.5,
    }));
  }
  // Earnings Revision
  if (cardId === 'earnings_revision') {
    return mockData.map(d => ({
      date: d.date,
      upgrades: Math.max(0, d.value),
      downgrades: Math.max(0, -d.value),
    }));
  }
  // FII/DII
  if (cardId === 'fii' || cardId === 'dii') {
    return mockData.map(d => ({
      date: d.date,
      fii: d.value,
      dii: d.value * -0.6 + (Math.random() - 0.5) * 2000,
    }));
  }
  // Sector Valuation (Heatmap)
  if (cardId === 'sector_valuation') {
    return [
      { name: 'IT', pe: 25.5, pePercentile: 75, weight: 18.2 },
      { name: 'Banking', pe: 15.8, pePercentile: 45, weight: 32.5 },
      { name: 'Auto', pe: 22.3, pePercentile: 65, weight: 8.3 },
      { name: 'Pharma', pe: 28.1, pePercentile: 85, weight: 6.7 },
      { name: 'FMCG', pe: 35.2, pePercentile: 90, weight: 9.1 },
      { name: 'Energy', pe: 12.5, pePercentile: 25, weight: 11.8 },
      { name: 'Metals', pe: 9.8, pePercentile: 15, weight: 4.2 },
      { name: 'Realty', pe: 50.9, pePercentile: 95, weight: 2.1 },
    ];
  }
  // Sector Earnings (Matrix)
  if (cardId === 'sector_earnings') {
    const normalize = (val, min, max) => Math.max(-1, Math.min(1, (val - min) / (max - min) * 2 - 1));
    const sectors = [
      { name: 'Banking', weight: 32.5 },
      { name: 'IT', weight: 15.2 },
      { name: 'Oil & Gas', weight: 12.8 },
      { name: 'FMCG', weight: 9.1 },
      { name: 'Auto', weight: 6.3 },
      { name: 'Pharma', weight: 5.7 },
      { name: 'Metals', weight: 4.2 },
      { name: 'Power', weight: 3.5 },
      { name: 'Telecom', weight: 2.9 },
    ];
    return sectors.map(sector => {
      const earningsGrowthYoY = Math.floor(Math.random() * 40) - 10;
      const earningsGrowthQoQ = Math.floor(Math.random() * 15) - 5;
      const contributionToIndexEarnings = Math.max(0, (sector.weight * (1 + (Math.random() - 0.5) * 0.5))).toFixed(1);
      const revisionTrend = (Math.random() * 2 - 1).toFixed(2);

      const nYoY = normalize(earningsGrowthYoY, -5, 25);
      const nRev = normalize(parseFloat(revisionTrend), -0.5, 0.5);
      const nContrib = normalize(parseFloat(contributionToIndexEarnings), 2, 20);
      const nQoQ = normalize(earningsGrowthQoQ, -2, 8);

      const rawScore = (0.4 * nYoY) + (0.25 * nRev) + (0.2 * nContrib) + (0.15 * nQoQ);

      return {
        ...sector,
        earningsGrowthYoY,
        earningsGrowthQoQ,
        contributionToIndexEarnings,
        revisionTrend,
        sectorScore: rawScore
      };
    }).sort((a, b) => b.sectorScore - a.sectorScore);
  }
  // Market Stress Radar
  if (cardId === 'sovereign_risk' || cardId === 'npa') {
    return {
      vix: 15 + Math.random() * 10,
      liquidity: 40 + Math.random() * 30,
      flows: 35 + Math.random() * 25,
      credit: 30 + Math.random() * 20,
      global: 45 + Math.random() * 25,
    };
  }

  return mockData;
}

// =============================
// Main Component
// =============================
export default function FundamentalDetail({ card }) {
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
