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

        -- 3. Economic Catalysts & Earnings (Events)
        CREATE TABLE IF NOT EXISTS catalysts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            event_date TEXT NOT NULL,
            impact TEXT DEFAULT 'Low', -- High, Medium, Low
            category TEXT DEFAULT 'Macro', -- Macro, Earnings, Geo
            description TEXT
        );

        -- 4. Candles (OHLCV)
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
            counts_json TEXT,
            tree_payload_json TEXT,
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
        -- 15. Universal AI Card Store
        CREATE TABLE IF NOT EXISTS ai_card_store (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            instrument_key TEXT NOT NULL,
            page_name TEXT NOT NULL,
            section_name TEXT NOT NULL,
            card_name TEXT NOT NULL,
            timestamp DATETIME NOT NULL,
            data_payload TEXT,
            UNIQUE(instrument_key, page_name, section_name, card_name, timestamp)
        );
        CREATE INDEX IF NOT EXISTS idx_ai_store ON ai_card_store(instrument_key, page_name, timestamp);

        -- 16. Backfill State (Smart Backfill Engine tracker)
        CREATE TABLE IF NOT EXISTS backfill_state (
            instrument_key  TEXT NOT NULL,
            timeframe       TEXT NOT NULL,
            oldest_date     TEXT,           -- ISO date string of the oldest candle fetched
            is_complete     INTEGER DEFAULT 0,  -- 1 = full year of history fetched
            last_run_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY(instrument_key, timeframe)
        );

        -- 17. Gauge Score History (Append Only)
        CREATE TABLE IF NOT EXISTS card_score_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            instrument_key TEXT NOT NULL,
            page_name TEXT NOT NULL,
            section_name TEXT NOT NULL,
            card_name TEXT NOT NULL,
            signal INTEGER,
            gauge_score REAL,
            timestamp DATETIME NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_card_history ON card_score_history(instrument_key, page_name, card_name, timestamp);

        -- 18. Market Events Intelligence
        CREATE TABLE IF NOT EXISTS market_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            headline TEXT NOT NULL,
            summary TEXT,
            category TEXT,
            sub_category TEXT,
            source TEXT,
            published_time DATETIME,
            sentiment TEXT,
            importance TEXT,
            severity TEXT,
            override_mode TEXT,
            confidence INTEGER,
            affected_assets TEXT, -- JSON array string
            event_score REAL,
            horizon TEXT,
            reasoning TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_market_events_time ON market_events(created_at);
        -- 19. Journal Notes
        CREATE TABLE IF NOT EXISTS journal_notes (
            date TEXT PRIMARY KEY,
            premarket TEXT,
            inmarket TEXT,
            postmarket TEXT,
            lessons TEXT,
            mood TEXT,
            tags TEXT,
            compliance_score TEXT,
            ai_insights TEXT,
            images TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- 20. Trade History (Historical executions)
        CREATE TABLE IF NOT EXISTS trade_history (
            trade_id TEXT PRIMARY KEY,
            date TEXT,
            instrument_key TEXT,
            trading_symbol TEXT,
            transaction_type TEXT,
            quantity INTEGER,
            average_price REAL,
            pnl REAL,
            r_multiple REAL,
            strategy_tag TEXT,
            exchange TEXT,
            order_id TEXT,
            exchange_timestamp DATETIME
        );
        CREATE INDEX IF NOT EXISTS idx_trade_history_date ON trade_history(date);
    `);

    try {
        db.exec(`ALTER TABLE header_data ADD COLUMN counts_json TEXT;`);
    } catch (e) {}

    try {
        db.exec(`ALTER TABLE header_data ADD COLUMN tree_payload_json TEXT;`);
    } catch (e) {}

    // Market Events: new columns for institutional multi-prompt system
    try {
        db.exec(`ALTER TABLE market_events ADD COLUMN instrument_type TEXT;`);
    } catch (e) {}

    try {
        db.exec(`ALTER TABLE market_events ADD COLUMN key_data_points TEXT;`); // JSON array string
    } catch (e) {}

    try {
        db.exec(`ALTER TABLE market_events ADD COLUMN ttl_hours INTEGER;`); // Event wear-off time in hours
    } catch (e) {}

    console.log("✅ SQLite Tables Initialized");
};

// Generic Helper for AI Card Store
export const upsertAiCardStore = (instrument_key, page_name, section_name, card_name, timestamp, data_payload) => {
    try {
        const stmt = db.prepare(`
            INSERT INTO ai_card_store (instrument_key, page_name, section_name, card_name, timestamp, data_payload)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(instrument_key, page_name, section_name, card_name, timestamp)
            DO UPDATE SET data_payload = excluded.data_payload
        `);
        stmt.run(instrument_key, page_name, section_name, card_name, timestamp, JSON.stringify(data_payload));
    } catch (e) {
        console.error("SQLite upsertAiCardStore error:", e.message);
    }
};

export const insertCardScoreHistory = (instrument_key, page_name, section_name, card_name, timestamp, signal, gauge_score) => {
    try {
        const stmt = db.prepare(`
            INSERT INTO card_score_history (instrument_key, page_name, section_name, card_name, timestamp, signal, gauge_score)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(instrument_key, page_name, section_name, card_name, timestamp, signal, gauge_score);
    } catch (e) {
        console.error("SQLite insertCardScoreHistory error:", e.message);
    }
};

export const getAiCardStoreHistory = (instrument_key, page_name, section_name, card_name, skip = 0, limit = 30) => {
    try {
        const stmt = db.prepare(`
            SELECT timestamp, data_payload 
            FROM ai_card_store 
            WHERE instrument_key = ? AND page_name = ? AND section_name = ? AND card_name = ?
            ORDER BY timestamp DESC
            LIMIT ? OFFSET ?
        `);
        const rows = stmt.all(instrument_key, page_name, section_name, card_name, limit, skip);
        return rows.map(r => ({
            timestamp: r.timestamp,
            ...JSON.parse(r.data_payload)
        }));
    } catch (e) {
        console.error("SQLite getAiCardStoreHistory error:", e.message);
        return [];
    }
};

export const getLatestAiPageSnapshot = (instrument_key, page_name) => {
    try {
        // We want the most recent timestamp for this page/instrument
        const stmt = db.prepare(`
            SELECT timestamp, section_name, card_name, data_payload 
            FROM ai_card_store 
            WHERE instrument_key = ? AND page_name = ?
            AND timestamp = (
                SELECT MAX(timestamp) 
                FROM ai_card_store 
                WHERE instrument_key = ? AND page_name = ?
            )
        `);
        const rows = stmt.all(instrument_key, page_name, instrument_key, page_name);
        
        if (rows.length === 0) return null;

        const snapshot = {
            timestamp: rows[0].timestamp,
            cards: [],
            sections: [],
        };

        for (const row of rows) {
            const data = JSON.parse(row.data_payload);
            if (row.section_name === "Header" && row.card_name === "Summary") {
                Object.assign(snapshot, data);
            } else if (row.section_name === "Sections" && row.card_name === "List") {
                snapshot.sections = data.sections || [];
            } else if (row.section_name === "Cards") {
                snapshot.cards.push(data);
            }
        }
        return snapshot;
    } catch (e) {
        console.error("SQLite getLatestAiPageSnapshot error:", e.message);
        return null;
    }
};

export const getAiPageHistory = (instrument_key, page_name, limit = 100) => {
    try {
        // 1. Get all distinct timestamps for this page/instrument, sorted newest first
        const tsStmt = db.prepare(`
            SELECT DISTINCT timestamp 
            FROM ai_card_store 
            WHERE instrument_key = ? AND page_name = ?
            ORDER BY timestamp DESC
            LIMIT ?
        `);
        const tsRows = tsStmt.all(instrument_key, page_name, limit);
        
        if (tsRows.length === 0) return [];

        const snapshots = [];

        // 2. Fetch data for each timestamp and reconstruct the snapshot
        const dataStmt = db.prepare(`
            SELECT section_name, card_name, data_payload 
            FROM ai_card_store 
            WHERE instrument_key = ? AND page_name = ? AND timestamp = ?
        `);

        for (const tsRow of tsRows) {
            const rows = dataStmt.all(instrument_key, page_name, tsRow.timestamp);
            
            const snapshot = {
                timestamp: tsRow.timestamp,
                cards: [],
                sections: [],
            };

            for (const row of rows) {
                const data = JSON.parse(row.data_payload);
                if (row.section_name === "Header" && row.card_name === "Summary") {
                    Object.assign(snapshot, data);
                } else if (row.section_name === "Sections" && row.card_name === "List") {
                    snapshot.sections = data.sections || [];
                } else if (row.section_name === "Cards") {
                    snapshot.cards.push(data);
                }
            }
            snapshots.push(snapshot);
        }

        return snapshots;
    } catch (e) {
        console.error("SQLite getAiPageHistory error:", e.message);
        return [];
    }
};

export default db;
