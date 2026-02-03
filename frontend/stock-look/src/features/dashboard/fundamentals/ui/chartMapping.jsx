/**
 * @file chartMapping.jsx
 * @purpose Central registry for mapping Fundamental Card IDs to Recharts components.
 * @responsibilities
 * - Exports `getChartForCard` to return the specific chart for a metric.
 * - Exports `getChartType` for skeleton loading states.
 * - Exports `shouldShowChart` to determine visibility.
 * @key_exports
 * - getChartForCard
 * - shouldShowChart
 * - getChartType
 * @dependencies
 * - Shared Charts (MeanReversionBandChart, EPSGrowthChart, etc.)
 * @lifecycle
 * - Used by FundamentalDetail and FundamentalModal.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================
import React from 'react';
import MeanReversionBandChart from '@/shared/components/charts/valuation/MeanReversionBandChart';
import EarningsYieldChart from '@/shared/components/charts/valuation/EarningsYieldChart';
import BuffettIndicatorChart from '@/shared/components/charts/valuation/BuffettIndicatorChart';
import ForwardPEChart from '@/shared/components/charts/valuation/ForwardPEChart';
import PBRatioChart from '@/shared/components/charts/valuation/PBRatioChart';
import EPSGrowthChart from '@/shared/components/charts/earnings/EPSGrowthChart';
import EarningsRevisionFlow from '@/shared/components/charts/earnings/EarningsRevisionFlow';
import FIIDIIFlowChart from '@/shared/components/charts/liquidity/FIIDIIFlowChart';
import LiquidityGauge from '@/shared/components/charts/liquidity/LiquidityGauge';
import SectorHeatmap from '@/shared/components/charts/sector/SectorHeatmap';
import MarketStressRadar from '@/shared/components/charts/risk/MarketStressRadar';
import GDPGrowthChart from '@/shared/components/charts/macro/GDPGrowthChart';
import CPIInflationGauge from '@/shared/components/charts/macro/CPIInflationGauge';
import PolicyRateCycleChart from '@/shared/components/charts/macro/PolicyRateCycleChart';
import SectorEarningsMatrix from '@/shared/components/charts/sector/SectorEarningsMatrix';

// =============================
// Chart Mapping Logic
// =============================

/**
 * Get chart component for a given card
 */
export function getChartForCard(cardId, data, height = 300) {
    const chartMap = {
        // --- VALUATION (5) ---
        nifty_pe: <MeanReversionBandChart data={data} metricLabel="NIFTY PE" height={height} />,
        forward_pe: <ForwardPEChart data={data} height={height} />,
        nifty_pb: <MeanReversionBandChart data={data} metricLabel="NIFTY PB" height={height} />,
        earnings_yield: <EarningsYieldChart data={data} height={height} />,
        mcap_gdp: <BuffettIndicatorChart data={data} height={height} />,

        // --- EARNINGS (5) ---
        eps_yoy: <EPSGrowthChart data={data} height={height} />,
        forward_eps: <EPSGrowthChart data={data} height={height} />, // Reuse Growth Chart
        earnings_revision: <EarningsRevisionFlow data={data} height={height} />,
        sector_earnings: <SectorEarningsMatrix sectors={data} height={height} />, // NEW: Earnings Matrix
        profit_margin: <EPSGrowthChart data={data} height={height} />, // Reuse Line/Bar

        // --- MACRO (6) ---
        gdp: <GDPGrowthChart data={data} height={height} />,
        cpi: <CPIInflationGauge value={data?.value || 5.5} height={height} />,
        repo: <PolicyRateCycleChart data={data} height={height} />,
        policy_stance: <LiquidityGauge value={data?.value || 0} height={height} />, // Reuse Gauge (Hawk/Dove)
        fiscal_deficit: <GDPGrowthChart data={data} height={height} />, // Reuse Line
        current_account: <GDPGrowthChart data={data} height={height} />, // Reuse Line

        // --- FLOWS & LIQUIDITY (5) ---
        fii: <FIIDIIFlowChart data={data} height={height} />,
        dii: <FIIDIIFlowChart data={data} height={height} />,
        fii_trend: <FIIDIIFlowChart data={data} height={height} />,
        system_liquidity: <LiquidityGauge value={data?.value || 0} height={height} />,
        mf_flows: <FIIDIIFlowChart data={data} height={height} />,

        // --- SECTOR (4) ---
        sector_valuation: <SectorHeatmap sectors={data} height={height} />,
        sector_growth: <EPSGrowthChart data={data} height={height} />, // Reuse Growth
        sector_concentration: <SectorHeatmap sectors={data} height={height} />, // Reuse Heatmap
        cyc_def: <ForwardPEChart data={data} height={height} />, // Reuse Spread Chart (Cyc vs Def)

        // --- CORPORATE (4) ---
        corp_debt: <GDPGrowthChart data={data} height={height} />, // Reuse Line
        credit_growth: <EPSGrowthChart data={data} height={height} />, // Reuse Growth
        tax_env: <MarketStressRadar data={data} height={height} />, // Reuse Radar/Score
        policy_tailwinds: <MarketStressRadar data={data} height={height} />, // Reuse Radar/Score

        // --- GLOBAL (4) ---
        global_growth: <GDPGrowthChart data={data} height={height} />,
        crude: <MeanReversionBandChart data={data} metricLabel="Crude Oil" height={height} />, // Reuse Mean Reversion
        usdinr: <MeanReversionBandChart data={data} metricLabel="USD/INR" height={height} />, // Reuse Mean Reversion
        global_liq: <FIIDIIFlowChart data={data} height={height} />,

        // --- RISK (3) ---
        sovereign_risk: <MarketStressRadar data={data} height={height} />,
        npa: <MarketStressRadar data={data} height={height} />,
        reform_momentum: <LiquidityGauge value={data?.value || 0} height={height} />,
    };

    // Generic fallback if specific ID missing but category known? (Not implemented, relying on exhaustive map)
    const ChartComponent = chartMap[cardId];
    return ChartComponent || null;
}

/**
 * Check if card should display a chart
 */
export function shouldShowChart(cardId) {
    // All 36 cards now have charts mapped
    return true;
}

/**
 * Get chart type for skeleton loader
 */
export function getChartType(cardId) {
    // Simplified mapping based on assigned component
    if (['sector_valuation', 'sector_earnings', 'sector_concentration'].includes(cardId)) return 'heatmap';
    if (['cpi', 'system_liquidity', 'policy_stance', 'reform_momentum'].includes(cardId)) return 'gauge';
    if (['sovereign_risk', 'npa', 'tax_env', 'policy_tailwinds'].includes(cardId)) return 'radar';
    return 'area'; // Default safe skeleton
}
