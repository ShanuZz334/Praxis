import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// Ensure the local_data directory exists
const dataDir = path.join(process.cwd(), "local_data");
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// Initialize SQLite database
const dbPath = path.join(dataDir, "praxis_market.db");
const db = new Database(dbPath, { verbose: null });

// Enable WAL mode for high concurrency
db.pragma("journal_mode = WAL");
db.pragma("synchronous = NORMAL"); // Fast inserts

export const initLocalDb = () => {
    console.log("🛠️ Initializing SQLite Local Database...");

    db.exec(`
        -- 1. Instruments Master
        CREATE TABLE IF NOT EXISTS instruments (
            instrument_key TEXT PRIMARY KEY,
            trading_symbol TEXT,
            name TEXT,
            exchange TEXT,
            segment TEXT,
            instrument_type TEXT,
            tick_size REAL,
            lot_size INTEGER,
            expiry TEXT,
            strike REAL,
            option_type TEXT,
            isin TEXT,
            freeze_quantity INTEGER,
            exchange_token TEXT,
            underlying_key TEXT,
            underlying_symbol TEXT,
            underlying_type TEXT
        );

        -- 2. Market Ticks (High Frequency)
        CREATE TABLE IF NOT EXISTS market_ticks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            instrument_key TEXT,
            ltp REAL,
            volume INTEGER,
            open_interest REAL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_market_ticks_instrument ON market_ticks(instrument_key);

        -- 3. Candles (OHLCV)
        CREATE TABLE IF NOT EXISTS candles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            instrument_key TEXT,
            timeframe TEXT,
            timestamp DATETIME,
            open REAL,
            high REAL,
            low REAL,
            close REAL,
            volume INTEGER,
            open_interest REAL,
            UNIQUE(instrument_key, timeframe, timestamp)
        );

        -- 4. Quotes (Market Snapshot)
        CREATE TABLE IF NOT EXISTS quotes (
            instrument_key TEXT PRIMARY KEY,
            ltp REAL,
            open REAL,
            high REAL,
            low REAL,
            close REAL,
            volume INTEGER,
            lower_circuit REAL,
            upper_circuit REAL,
            yearly_high REAL,
            yearly_low REAL,
            market_depth TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- 5. Option Chain
        CREATE TABLE IF NOT EXISTS option_chain (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            underlying_key TEXT,
            expiry TEXT,
            strike_price REAL,
            spot_price REAL,
            ce_ltp REAL,
            pe_ltp REAL,
            ce_oi REAL,
            pe_oi REAL,
            ce_oi_change REAL,
            pe_oi_change REAL,
            ce_volume INTEGER,
            pe_volume INTEGER,
            ce_instrument_key TEXT,
            pe_instrument_key TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(underlying_key, expiry, strike_price)
        );

        -- 6. Holdings
        CREATE TABLE IF NOT EXISTS holdings (
            instrument_key TEXT PRIMARY KEY,
            trading_symbol TEXT,
            quantity INTEGER,
            average_price REAL,
            current_value REAL,
            pnl REAL,
            day_change REAL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- 7. Positions
        CREATE TABLE IF NOT EXISTS positions (
            instrument_key TEXT PRIMARY KEY,
            trading_symbol TEXT,
            net_quantity INTEGER,
            buy_quantity INTEGER,
            sell_quantity INTEGER,
            average_price REAL,
            unrealized_pnl REAL,
            realized_pnl REAL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- 8. Card Snapshots (Historical Data)
        CREATE TABLE IF NOT EXISTS card_snapshots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            instrument_key TEXT,
            card_id TEXT,
            raw_value REAL,
            score INTEGER,
            bias TEXT,
            snapshot_date DATE DEFAULT CURRENT_DATE,
            UNIQUE(instrument_key, card_id, snapshot_date)
        );

        -- 9. Fundamentals Data (Raw Cache)
        CREATE TABLE IF NOT EXISTS fundamentals_data (
            instrument_key TEXT PRIMARY KEY,
            raw_json TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- 10. Technicals Data (Raw Cache)
        CREATE TABLE IF NOT EXISTS technicals_data (
            instrument_key TEXT PRIMARY KEY,
            raw_json TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- 11. Options Data (Raw Cache)
        CREATE TABLE IF NOT EXISTS options_data (
            instrument_key TEXT PRIMARY KEY,
            raw_json TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- 12. Global Data (Raw Cache)
        CREATE TABLE IF NOT EXISTS global_data (
            instrument_key TEXT PRIMARY KEY,
            raw_json TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- 13. Header AI Data (Composite, Regime, Tailwinds, Risks)
        CREATE TABLE IF NOT EXISTS header_data (
            instrument_key TEXT,
            category TEXT, -- e.g., 'fundamental', 'technical', 'options', 'global'
            composite_score REAL,
            regime_json TEXT,
            tailwinds_json TEXT,
            risks_json TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY(instrument_key, category)
        );

        -- 14. Index Ticks (High Priority persistence for Topbar)
        CREATE TABLE IF NOT EXISTS index_ticks (
            instrument_key TEXT PRIMARY KEY,
            ltp REAL,
            net_change REAL,
            pct_change REAL,
            status TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    try {
        db.exec(`ALTER TABLE header_data ADD COLUMN counts_json TEXT;`);
    } catch (e) {
        // Column already exists
    }

    console.log("✅ SQLite Tables Initialized");
};

export default db;
