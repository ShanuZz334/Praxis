import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function FreeCashFlowCard({ data, manualOverride, lastUpdated }) {
    let isManual = true;
    let extractedValue = null;
    let extractedSector = null;

    // Attempt 1: From Ratios (Upstox)
    const ratioObj = (Array.isArray(data?.ratios) ? data.ratios : []).find(r => 
        r.name?.toLowerCase().includes('free cash flow') ||
        r.name?.toLowerCase() === 'fcf'
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

    // Attempt 2: Calculate from Cash Flow Statement (if ratios missed it)
    if (isManual && data?.cashFlow) {
        const fullStmt = Array.isArray(data.cashFlow.full_statement) ? data.cashFlow.full_statement : [];
        const opCashObj = fullStmt.find(m => m.particular?.toLowerCase().includes('operations'));
        const invCashObj = fullStmt.find(m => m.particular?.toLowerCase().includes('investing'));
        
        if (opCashObj && Array.isArray(opCashObj.history) && opCashObj.history.length > 0 &&
            invCashObj && Array.isArray(invCashObj.history) && invCashObj.history.length > 0) {
            const latestOpCash = opCashObj.history[0].value;
            const latestInvCash = invCashObj.history[0].value; // Usually negative
            // Free Cash Flow Proxy = Operating Cash Flow + Investing Cash Flow (Capex proxy)
            extractedValue = latestOpCash + latestInvCash;
            isManual = false;
        }
    }

    const currentFCF = isManual ? (manualOverride !== undefined && manualOverride !== null ? parseFloat(manualOverride) : null) : extractedValue;
    const sectorFCF = isManual ? null : extractedSector;

    // 2. Load Central Config
    const configData = getIndicatorConfig('free_cash_flow');

    // 3. Praxis Engine Variables
    let score = 0;
    let bias = 'Neutral';
    let confidence = '85%';
    let aiInsightText = 'Waiting for insight...';

    // 4. Custom Scoring Logic (FCF can be negative — use !== null check)
    if (currentFCF !== null) {
        if (currentFCF > 5000) {
            score = 95; bias = 'Strong Bullish';
        } else if (currentFCF > 0) {
            score = 75; bias = 'Bullish';
        } else if (currentFCF === 0) {
            score = 50; bias = 'Neutral';
        } else if (currentFCF > -2000) {
            score = 30; bias = 'Bearish';
        } else {
            score = 10; bias = 'Strong Bearish';
        }

        // 5. Dynamic AI Insight
        if (currentFCF > 5000) {
            aiInsightText = 'The company is generating healthy excess cash after investments, strengthening financial flexibility.';
        } else if (currentFCF > 0) {
            aiInsightText = 'Cash generation remains healthy and supports future growth.';
        } else if (currentFCF === 0) {
            aiInsightText = 'Cash generation is stable but should continue improving.';
        } else {
            aiInsightText = 'The company is spending more cash than it generates and should be monitored.';
        }
    }

    const updateTime = lastUpdated || '--:--';

        return (
        <IndicatorCard
            config={{
                title: 'Free Cash Flow',
                category: 'Financial Health',
                mode: isManual ? 'MANUAL' : 'AUTO',
                creditScore: configData?.creditScore || 5,
                updateTime: updateTime,
                source: isManual ? 'Manual' : (extractedSector ? 'Upstox Ratios' : 'Upstox Cash Flow Stmt (Calc)'),
                aiModel: configData?.aiModel || 'Qwen3 8B'
            }}
            data={{
                currentValueObj: { label: 'FCF (₹ Cr)', value: currentFCF !== null ? currentFCF.toFixed(0) : '--' },
                details: [
                    { label: 'Sector FCF', value: sectorFCF !== null ? sectorFCF.toFixed(0) : '--', isManual: false }
                ],
                score: score || 0,
                bias: bias || 'Neutral',
                confidence: confidence || '85%',
                impactWeight: configData?.impactWeight || 5.0
            }}
            chartData={{
                points: [],
                valueKey: 'value',
                valueName: 'FCF (₹ Cr)'
            }}
            insights={{
                aiInsight: aiInsightText || 'No insights available.',
                whyItMatters: [
                    'Shows actual cash generated after investments.',
                    'Used for dividends, buybacks, or debt reduction.',
                    'Strongest indicator of financial flexibility.'
                ]
            }}
        />
    );
}
