import React from 'react';
import { IndicatorCard } from '@/shared/components/ui/IndicatorCard/IndicatorCard';
import { getIndicatorConfig } from '@/shared/config/indicatorConfig';

export default function PERatioCard({ initialData = null, data = null, manualOverrides, lastUpdated }) {
    // Upstox Data mapping
    const upstoxPEObj = (Array.isArray(data?.ratios) ? data.ratios : []).find(r => r.name === "P/E");
    const parsedPE = upstoxPEObj?.company_value ? parseFloat(upstoxPEObj.company_value) : null;
    const isManual = parsedPE === null || isNaN(parsedPE);

    // Core Value State
    
    const currentPE = isManual ? manualOverrides?.pe_ratio : parsedPE;
    
    const historicalPE = manualOverrides?.pe_hist || null;
    const sectorPE = manualOverrides?.pe_sector || null;

    // Centralized Config
    const configData = getIndicatorConfig('pe_ratio');
    
    // --- REAL DATA MAPPING (Defaults to empty/0 if no data) ---
    const historicalAvg = initialData?.historicalAvg || 25;
    let score = initialData?.score || 50;
    let bias = initialData?.bias || "Neutral";
    let confidence = initialData?.confidence || "80%";
    
    // Optional: Real logic could go here, but for now we rely on initialData or defaults
    if (currentPE !== null && historicalAvg !== null) {
        if (currentPE < historicalAvg - 5) {
            score = 95; bias = "Strong Bullish";
        } else if (currentPE < historicalAvg) {
            score = 80; bias = "Bullish";
        } else if (currentPE > historicalAvg + 5) {
            score = 10; bias = "Strong Bearish";
        } else if (currentPE > historicalAvg) {
            score = 35; bias = "Bearish";
        } else {
            score = 50; bias = "Neutral";
        }
    }

    // Chart Data (Empty array if no history)
    const historyData = initialData?.history || [];

    // AI Insight Data
    const aiInsightText = initialData?.insights?.aiInsight || "Waiting for insight...";
    const updateTime = initialData?.updateTime || "--:--";

    

    // Live Data Subscription
    React.

        return (
        <IndicatorCard
            config={{
                title: 'P/E Ratio',
                category: 'Valuation',
                mode: (isManual || historicalPE !== null || sectorPE !== null) ? 'MANUAL' : 'AUTO',
                creditScore: configData?.creditScore || 5,





























                updateTime: updateTime,
                source: configData.source,
                aiModel: configData.aiModel
            }}
            data={{
                currentValueObj: { label: "Current Value", value: currentPE !== null ? currentPE : "--" },
                details: [],
                score: score,
                bias: bias,
                confidence: confidence,
                impactWeight: configData.impactWeight
            }}
            chartData={{
                points: historyData, // Pass empty array if no data, chart will gracefully show nothing
                valueKey: "value",
                valueName: "PE Value"
            }}
            insights={{
                aiInsight: aiInsightText,
                whyItMatters: initialData?.insights?.whyItMatters || [
                    "Measures market valuation.",
                    "Helps identify undervalued and overvalued conditions.",
                    "Provides long-term market context.",
                    "Widely followed by institutional investors."
                ]
            }}
            onSave={handleSave}
        />
    );
}
