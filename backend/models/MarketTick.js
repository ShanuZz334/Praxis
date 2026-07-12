import mongoose from "mongoose";

const marketTickSchema = new mongoose.Schema({
    timestamp: { type: Date, required: true }, // Time Series primary time field
    instrument: { type: String, required: true }, // Time Series meta field (instrumentKey)
    ltp: { type: Number, required: true },
    open: { type: Number },
    high: { type: Number },
    low: { type: Number },
    close: { type: Number },
    previousClose: { type: Number },
    volume: { type: Number },
    averageTradedPrice: { type: Number },
    totalBuyQuantity: { type: Number },
    totalSellQuantity: { type: Number },
    openInterest: { type: Number },
    previousOpenInterest: { type: Number },
    bestBids: { type: Array },
    bestAsks: { type: Array },
    exchangeTimestamp: { type: Date }
}, {
    timeseries: {
        timeField: 'timestamp',
        metaField: 'instrument',
        granularity: 'seconds'
    }
});

const MarketTick = mongoose.model("MarketTick", marketTickSchema);
export default MarketTick;
