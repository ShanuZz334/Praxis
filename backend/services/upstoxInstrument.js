import axios from "axios";
import cron from "node-cron";
import zlib from "zlib";
import db from "../config/localDb.js";

const UPSTOX_INSTRUMENT_URL = "https://assets.upstox.com/market-quote/instruments/exchange/complete.json.gz";

// Prepare the insert statement for instruments
const insertInstrumentStmt = db.prepare(`
    INSERT INTO instruments (
        instrument_key, trading_symbol, name, exchange, segment, instrument_type, 
        tick_size, lot_size, expiry, strike, option_type, isin, freeze_quantity, 
        exchange_token, underlying_key, underlying_symbol, underlying_type
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(instrument_key) DO UPDATE SET
        trading_symbol=excluded.trading_symbol,
        name=excluded.name,
        exchange=excluded.exchange,
        segment=excluded.segment,
        instrument_type=excluded.instrument_type,
        tick_size=excluded.tick_size,
        lot_size=excluded.lot_size,
        expiry=excluded.expiry,
        strike=excluded.strike,
        option_type=excluded.option_type,
        isin=excluded.isin,
        freeze_quantity=excluded.freeze_quantity,
        exchange_token=excluded.exchange_token,
        underlying_key=excluded.underlying_key,
        underlying_symbol=excluded.underlying_symbol,
        underlying_type=excluded.underlying_type
`);

/**
 * Downloads and parses the latest complete instrument list from Upstox.
 * Seeds the SQLite `instruments` table.
 */
export const syncInstrumentMaster = async () => {
    console.log("📥 Starting Upstox Instrument Master Sync (SQLite)...");
    try {
        const response = await axios({
            method: "get",
            url: UPSTOX_INSTRUMENT_URL,
            responseType: "arraybuffer", // It's gzipped
        });

        // Unzip the buffer
        const unzipped = zlib.gunzipSync(response.data);
        const jsonString = unzipped.toString("utf-8");
        const instrumentsMap = JSON.parse(jsonString);

        const keys = Object.keys(instrumentsMap);
        console.log(`✅ Downloaded ${keys.length} instruments. Parsing and saving...`);

        const insertAll = db.transaction((instruments) => {
            for (const key of instruments) {
                const data = instrumentsMap[key];
                insertInstrumentStmt.run(
                    data.instrument_key,
                    data.tradingsymbol,
                    data.name,
                    data.exchange,
                    data.segment,
                    data.instrument_type,
                    data.tick_size,
                    data.lot_size,
                    data.expiry || null,
                    data.strike,
                    data.option_type,
                    data.isin,
                    data.freeze_quantity,
                    data.exchange_token,
                    data.underlying_key,
                    data.underlying_symbol,
                    data.underlying_type
                );
            }
        });

        // Execute transaction
        insertAll(keys);

        console.log("✅ Instrument Master Sync Completed Successfully!");

    } catch (error) {
        console.error("❌ Failed to sync Instrument Master:", error.message);
    }
};

/**
 * Initialize the cron job to run at 6:00 AM every morning.
 */
export const initInstrumentCron = () => {
    // 0 6 * * * means 6:00 AM every day
    cron.schedule("0 6 * * *", () => {
        syncInstrumentMaster();
    });
    console.log("⏱️ Instrument Master Sync Cron Job initialized (6:00 AM daily)");
};
