export const MOCK_WALLET_DATA = {
    summary: {
        availableCapital: 52400,
        todayPnL: 2100,
        todayPnLPct: 2.76,
        openRiskPct: 1.2,
        maxRiskAllowedPct: 2.0,
        activeMode: 'Normal' // Conservative / Normal / Aggressive
    },
    allocation: [
        { id: 'intraday', name: 'Intraday Eq', value: 28, status: 'Healthy', suggestion: 'Maintain current size.' },
        { id: 'swing', name: 'Swing Pos', value: 35, status: 'Optimal', suggestion: 'Good diversity in holdings.' },
        { id: 'options', name: 'Options', value: 25, status: 'Elevated', suggestion: 'Reduce exposure if VIX > 18.' },
        { id: 'cash', name: 'Cash Buffer', value: 12, status: 'Low Buffer', suggestion: 'Increase liquidity for opportunities.' }
    ],
    performance: {
        equityCurve: [
            { day: 1, val: 70000 }, { day: 2, val: 71000 }, { day: 3, val: 69500 },
            { day: 4, val: 68000 }, { day: 5, val: 72000 }, { day: 6, val: 73500 },
            { day: 7, val: 78000 } // Current
        ],
        drawdown: {
            current: 3.1,
            maxAllowed: 6.0,
            riskBudgetLeft: 2.9, // %
            isHardStopNear: false
        }
    },
    riskRules: [
        { id: 1, text: 'No new trades if DD > 5%', status: 'Safe', explanation: 'Current DD is 3.1%' },
        { id: 2, text: 'Reduce size if VIX > 20', status: 'Triggered', explanation: 'VIX is 22.4 - Size reduced' },
        { id: 3, text: 'Lock profits after +3R', status: 'Safe', explanation: 'Avg R is 2.1R' },
        { id: 4, text: 'Cut exposure after 2 losses', status: 'Safe', explanation: 'Current streak: 1 Loss' }
    ],
    positions: [
        { id: 'p1', instrument: 'NIFTY 24500 CE', type: 'Options', exposure: 12, pnl: 4500, riskTag: 'High' },
        { id: 'p2', instrument: 'RELIANCE', type: 'Swing', exposure: 15, pnl: 1200, riskTag: 'Low' },
        { id: 'p3', instrument: 'BANKNIFTY FUT', type: 'Intraday', exposure: 18, pnl: -850, riskTag: 'Medium' },
        { id: 'p4', instrument: 'HDFCBANK', type: 'Swing', exposure: 10, pnl: -150, riskTag: 'Low' },
        { id: 'p5', instrument: 'FINNIFTY 20200 PE', type: 'Options', exposure: 8, pnl: 3200, riskTag: 'High' },
        { id: 'p6', instrument: 'INFY', type: 'Swing', exposure: 5, pnl: 450, riskTag: 'Low' },
        { id: 'p7', instrument: 'TATASTEEL', type: 'Swing', exposure: 4, pnl: -120, riskTag: 'Low' },
        { id: 'p8', instrument: 'CRUDEOIL FUT', type: 'Intraday', exposure: 10, pnl: 950, riskTag: 'High' },
        { id: 'p9', instrument: 'USDINR', type: 'Options', exposure: 3, pnl: 100, riskTag: 'Medium' },
        { id: 'p10', instrument: 'ADANIENT', type: 'Intraday', exposure: 6, pnl: -400, riskTag: 'High' },
        { id: 'p11', instrument: 'GOLDM', type: 'Swing', exposure: 8, pnl: 2100, riskTag: 'Low' },
        { id: 'p12', instrument: 'SBIN 600 CE', type: 'Options', exposure: 2, pnl: -50, riskTag: 'High' }
    ],
    systemNote: "Capital conditions stable. Avoid leverage ahead of macro event tomorrow."
};
