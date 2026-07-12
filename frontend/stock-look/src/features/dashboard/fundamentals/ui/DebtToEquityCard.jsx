import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function DebtToEquityCard({ data, manualOverride, lastUpdated }) {
    let isManual = true;
    let extractedValue = null;
    let extractedSector = null;

    // Attempt 1: From Ratios (Upstox)
    const ratioObj = (Array.isArray(data?.ratios) ? data.ratios : []).find(r => 
        r.name?.toLowerCase().includes('debt to equity') || 
        r.name?.toLowerCase() === 'd/e'
    );
    
    if (ratioObj && ratioObj.company_value) {
        const parsed = parseFloat(ratioObj.company_value);
        if (!isNaN(parsed)) {
            extractedValue = parsed;
            isManual = false;
        }
        if (ratioObj.sector_value) {
            const parsedSector = parseFloat(ratioObj.sector_value);
            if (!isNaN(parsedSector)) { extractedSector = parsedSector; }
        }
    }

    // Attempt 2: Calculate from Balance Sheet (if ratios missed it)
    if (isManual && data?.balanceSheet) {
        const bsHistory = Array.isArray(data.balanceSheet.history) ? data.balanceSheet.history : [];
        const fullStmt = Array.isArray(data.balanceSheet.full_statement) ? data.balanceSheet.full_statement : [];
        
        const latestSummary = bsHistory[0];
        const equityObj = fullStmt.find(m => m.particular?.toLowerCase().includes('equity capital'));
        
        if (latestSummary && latestSummary.total_liability !== undefined && equityObj && Array.isArray(equityObj.history) && equityObj.history.length > 0) {
            const latestEquity = equityObj.history[0].value;
            if (latestEquity > 0) {
                // Using Total Liability / Equity as proxy if pure Debt isn't isolated
                extractedValue = (latestSummary.total_liability / latestEquity);
                isManual = false;
            }
        }
    }

    const currentDE = isManual ? (manualOverride !== undefined && manualOverride !== null ? parseFloat(manualOverride) : null) : extractedValue;
    const sectorDE = isManual ? null : extractedSector;

    // 2. Load Central Config
    const configData = getIndicatorConfig('debt_to_equity');

    // 3. Praxis Engine Variables
    let score = 0;
    let bias = 'Neutral';
    let confidence = '85%';
    let aiInsightText = 'Waiting for insight...';

    // 4. Custom Scoring Logic
    if (currentDE !== null) {
        if (currentDE < 0.3) {
            score = 95; bias = 'Strong Bullish';
        } else if (currentDE < 0.6) {
            score = 82; bias = 'Bullish';
        } else if (currentDE <= 1.0) {
            score = 60; bias = 'Neutral';
        } else if (currentDE <= 2.0) {
            score = 30; bias = 'Bearish';
        } else {
            score = 5; bias = 'Strong Bearish';
        }

        // 5. Dynamic AI Insight
        if (currentDE < 0.3) {
            aiInsightText = 'The company has a conservative capital structure with low financial leverage.';
        } else if (currentDE < 0.6) {
            aiInsightText = 'Debt levels remain healthy and manageable.';
        } else if (currentDE <= 1.0) {
            aiInsightText = 'Leverage is moderate and should be monitored.';
        } else if (currentDE <= 2.0) {
            aiInsightText = 'The company relies significantly on debt financing.';
        } else {
            aiInsightText = 'High leverage increases financial risk, especially during economic slowdowns.';
        }
    }

    const updateTime = lastUpdated || '--:--';

        return (
        <IndicatorCard
            config={{
                title: 'Debt to Equity',
                category: 'Financial Health',
                mode: isManual ? 'MANUAL' : 'AUTO',
                creditScore: configData?.creditScore || 5,
                updateTime: updateTime,
                source: isManual ? 'Manual' : (extractedSector ? 'Upstox Ratios' : 'Upstox Balance Stmt (Calc)'),
                aiModel: configData?.aiModel || 'Qwen3 8B'
            }}
            data={{
                currentValueObj: { label: 'D/E Ratio', value: currentDE !== null ? currentDE.toFixed(2) : '--' },
                details: [
                    { label: 'Sector D/E', value: sectorDE !== null ? sectorDE.toFixed(2) : '--', isManual: false }
                ],
                score: score || 0,
                bias: bias || 'Neutral',
                confidence: confidence || '85%',
                impactWeight: configData?.impactWeight || 5.0
            }}
            chartData={{
                points: [],
                valueKey: 'value',
                valueName: 'D/E Ratio'
            }}
            insights={{
                aiInsight: aiInsightText || 'No insights available.',
                whyItMatters: [
                    'Assesses financial leverage and risk.',
                    'High D/E can indicate potential solvency issues.',
                    'Helps determine cost of capital.'
                ]
            }}
        />
    );
}
