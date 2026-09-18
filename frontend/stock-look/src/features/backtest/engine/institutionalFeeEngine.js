/**
 * Institutional Indian Market Statutory Fee & Dynamic Slippage Engine
 * 
 * Accurately models SEBI statutory levies, STT (Finance Act 2024),
 * Stamp Duty, Exchange Turnover Charges, GST (18%), Brokerage,
 * and Dynamic Volatility-Based Slippage.
 */

export const INDIAN_INSTRUMENT_TYPES = {
    EQUITY_INTRADAY: 'EQUITY_INTRADAY',
    EQUITY_DELIVERY: 'EQUITY_DELIVERY',
    FUTURES: 'FUTURES',
    OPTIONS: 'OPTIONS',
};

export const DEFAULT_FEE_CONFIG = {
    instrumentType: INDIAN_INSTRUMENT_TYPES.EQUITY_INTRADAY,
    brokerageType: 'DISCOUNT_FLAT', // 'DISCOUNT_FLAT' (₹20 or 0.03%) | 'ZERO' | 'PERCENTAGE' (0.05%)
    flatBrokeragePerOrder: 20,
    brokeragePctCap: 0.03,
    exchangeRatePct: 0.00325, // NSE standard equity
    sebiRatePct: 0.0001,      // ₹10 per crore
    gstRatePct: 18.0,         // 18% on (Brokerage + Exch + SEBI)
    slippageModel: 'DYNAMIC_ATR', // 'NONE' | 'FIXED' | 'DYNAMIC_ATR'
    fixedSlippagePct: 0.05,
    dynamicAtrMultiplier: 0.04, // 4% of ATR(14)
    minSlippagePct: 0.02,
    maxSlippagePct: 0.35,
};

/**
 * Computes exact Indian statutory taxes and transaction costs for a round-trip trade.
 * 
 * @param {Object} tradeParams
 * @param {number} tradeParams.entryPrice
 * @param {number} tradeParams.exitPrice
 * @param {number} tradeParams.quantity
 * @param {number} [tradeParams.direction=1] // 1 for LONG, -1 for SHORT
 * @param {number} [tradeParams.atr=0]       // Current 14-period ATR
 * @param {Object} [customConfig={}]
 * @returns {Object} Comprehensive itemized fee breakdown
 */
export function calculateRoundTripTransactionCosts(tradeParams, customConfig = {}) {
    const config = { ...DEFAULT_FEE_CONFIG, ...customConfig };
    const {
        entryPrice = 100,
        exitPrice = 100,
        quantity = 1,
        direction = 1,
        atr = 0,
    } = tradeParams;

    const validEntry = Math.max(0.01, Number(entryPrice) || 1);
    const validExit = Math.max(0.01, Number(exitPrice) || 1);
    const validQty = Math.max(1, Number(quantity) || 1);

    // Turnovers
    const buyTurnover = direction === 1 ? (validEntry * validQty) : (validExit * validQty);
    const sellTurnover = direction === 1 ? (validExit * validQty) : (validEntry * validQty);
    const totalTurnover = buyTurnover + sellTurnover;

    // 1. Brokerage
    let buyBrokerage = 0;
    let sellBrokerage = 0;

    if (config.brokerageType === 'DISCOUNT_FLAT') {
        const buyPctMax = (buyTurnover * config.brokeragePctCap) / 100;
        buyBrokerage = Math.min(config.flatBrokeragePerOrder, buyPctMax);
        const sellPctMax = (sellTurnover * config.brokeragePctCap) / 100;
        sellBrokerage = Math.min(config.flatBrokeragePerOrder, sellPctMax);
    } else if (config.brokerageType === 'PERCENTAGE') {
        buyBrokerage = (buyTurnover * 0.05) / 100;
        sellBrokerage = (sellTurnover * 0.05) / 100;
    }
    const totalBrokerage = buyBrokerage + sellBrokerage;

    // 2. Securities Transaction Tax (STT / CTT) - Finance Act 2024 Rates
    let stt = 0;
    switch (config.instrumentType) {
        case INDIAN_INSTRUMENT_TYPES.EQUITY_INTRADAY:
            // STT: 0.025% on sell turnover only
            stt = Math.round((sellTurnover * 0.025) / 100);
            break;
        case INDIAN_INSTRUMENT_TYPES.EQUITY_DELIVERY:
            // STT: 0.1% on buy and 0.1% on sell (0.2% round-trip)
            stt = Math.round((buyTurnover * 0.10) / 100) + Math.round((sellTurnover * 0.10) / 100);
            break;
        case INDIAN_INSTRUMENT_TYPES.FUTURES:
            // STT: 0.02% on sell turnover (revised 2024)
            stt = Math.round((sellTurnover * 0.02) / 100);
            break;
        case INDIAN_INSTRUMENT_TYPES.OPTIONS:
            // STT: 0.10% on sell turnover of premium (revised 2024)
            stt = Math.round((sellTurnover * 0.10) / 100);
            break;
        default:
            stt = Math.round((sellTurnover * 0.025) / 100);
    }

    // 3. Stamp Duty (State Stamp Act / Indian Stamp Act 2019) - Buy side only
    let stampDuty = 0;
    switch (config.instrumentType) {
        case INDIAN_INSTRUMENT_TYPES.EQUITY_INTRADAY:
            stampDuty = Math.round((buyTurnover * 0.003) / 100); // 0.003% or ₹300 per crore
            break;
        case INDIAN_INSTRUMENT_TYPES.EQUITY_DELIVERY:
            stampDuty = Math.round((buyTurnover * 0.015) / 100); // 0.015% or ₹1500 per crore
            break;
        case INDIAN_INSTRUMENT_TYPES.FUTURES:
            stampDuty = Math.round((buyTurnover * 0.002) / 100); // 0.002%
            break;
        case INDIAN_INSTRUMENT_TYPES.OPTIONS:
            stampDuty = Math.round((buyTurnover * 0.003) / 100); // 0.003%
            break;
        default:
            stampDuty = Math.round((buyTurnover * 0.003) / 100);
    }

    // 4. Exchange Transaction Charges
    let exchRate = config.exchangeRatePct;
    if (config.instrumentType === INDIAN_INSTRUMENT_TYPES.FUTURES) exchRate = 0.0019;
    if (config.instrumentType === INDIAN_INSTRUMENT_TYPES.OPTIONS) exchRate = 0.0500;
    const exchangeFee = (totalTurnover * exchRate) / 100;

    // 5. SEBI Turnover Charges (₹10 per crore = 0.0001%)
    const sebiFee = (totalTurnover * config.sebiRatePct) / 100;

    // 6. GST (18% on Brokerage + Exchange Fee + SEBI Fee)
    const gstTaxable = totalBrokerage + exchangeFee + sebiFee;
    const gst = (gstTaxable * config.gstRatePct) / 100;

    // 7. Slippage Calculation
    let slippagePct = 0;
    if (config.slippageModel === 'FIXED') {
        slippagePct = config.fixedSlippagePct * 2; // Entry + exit
    } else if (config.slippageModel === 'DYNAMIC_ATR' && atr > 0) {
        // Volatility-based slippage: higher ATR = wider bid-ask spread
        const rawSlip = (atr / validEntry) * config.dynamicAtrMultiplier * 100;
        const clampedSlip = Math.max(config.minSlippagePct, Math.min(config.maxSlippagePct, rawSlip));
        slippagePct = clampedSlip * 2; // Entry + exit
    } else if (config.slippageModel !== 'NONE') {
        slippagePct = 0.05 * 2;
    }

    const slippageAmount = (totalTurnover * (slippagePct / 2)) / 100;

    // Total Statutory & Transaction Costs
    const statutoryCharges = stt + stampDuty + exchangeFee + sebiFee + gst;
    const totalCostRupees = totalBrokerage + statutoryCharges + slippageAmount;
    const totalCostPct = totalTurnover > 0 ? (totalCostRupees / (validEntry * validQty)) * 100 : 0;

    return {
        totalCostRupees: Math.round(totalCostRupees * 100) / 100,
        totalCostPct: Math.round(totalCostPct * 1000) / 1000,
        statutoryCharges: Math.round(statutoryCharges * 100) / 100,
        brokerage: Math.round(totalBrokerage * 100) / 100,
        stt: Math.round(stt * 100) / 100,
        stampDuty: Math.round(stampDuty * 100) / 100,
        exchangeFee: Math.round(exchangeFee * 100) / 100,
        sebiFee: Math.round(sebiFee * 100) / 100,
        gst: Math.round(gst * 100) / 100,
        slippageAmount: Math.round(slippageAmount * 100) / 100,
        slippagePct: Math.round(slippagePct * 1000) / 1000,
        turnover: Math.round(totalTurnover * 100) / 100,
    };
}
