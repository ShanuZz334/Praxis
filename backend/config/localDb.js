import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the local_data directory exists (anchored reliably to backend/local_data)
const dataDir = path.resolve(__dirname, "..", "local_data");
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
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

        -- 4b. Historical Backfill Metadata (tracks instruments that have their 10+ year history stored)
        CREATE TABLE IF NOT EXISTS historical_backfill_meta (
            instrument_key TEXT,
            timeframe TEXT,
            oldest_date TEXT,
            synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY(instrument_key, timeframe)
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

        -- ============================================================
        -- INSTITUTIONAL UPGRADE — LAYER 4 & 5 NEW TABLES
        -- ============================================================

        -- 21. User Manual Overrides (replaces praxis_manual_overrides_* localStorage)
        CREATE TABLE IF NOT EXISTS user_overrides (
            id                INTEGER PRIMARY KEY AUTOINCREMENT,
            module_key        TEXT NOT NULL,      -- 'fundamentals', 'technical', 'options', 'foreign'
            instrument_key    TEXT NOT NULL,      -- 'NSE_INDEX|Nifty 50' or 'NSE_EQ|INE...'
            field_key         TEXT NOT NULL,      -- 'pe_ratio', 'gdp_growth', 'iv_rank', etc.
            value             TEXT,               -- Always TEXT (serialized) to handle any type
            source            TEXT DEFAULT 'manual',
            updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(module_key, instrument_key, field_key)
        );
        CREATE INDEX IF NOT EXISTS idx_overrides_lookup ON user_overrides(module_key, instrument_key);

        -- 22. User Preferences (replaces all stocky-*, pai-*, praxis_ai_sensitivity_* localStorage)
        CREATE TABLE IF NOT EXISTS user_preferences (
            pref_key          TEXT PRIMARY KEY,
            pref_value        TEXT,
            updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- 23. Page State (replaces dash_category, dash_instrument, praxis_master_charts, etc.)
        CREATE TABLE IF NOT EXISTS page_state (
            page_name         TEXT NOT NULL,      -- 'master', 'fundamentals', 'technical', 'options', 'foreign', 'events'
            state_json        TEXT,               -- JSON: { instrument_key, category, expiry, timeframe, extra_charts[] }
            updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY(page_name)
        );

        -- 24. Chart Drawings (replaces dynamic useDrawings localStorage keys)
        CREATE TABLE IF NOT EXISTS chart_drawings (
            id                INTEGER PRIMARY KEY AUTOINCREMENT,
            instrument_key    TEXT NOT NULL,
            timeframe         TEXT NOT NULL,      -- '1D', '1W', '1M', etc.
            drawings_json     TEXT,               -- Full annotation/drawing JSON array
            updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(instrument_key, timeframe)
        );

        -- 25. Global Macro Cache (replaces in-memory globalCache in dataRoutes.js)
        CREATE TABLE IF NOT EXISTS global_cache (
            symbol_id         TEXT PRIMARY KEY,   -- 'crude', 'gold', 'dxy', 'usd_inr', 'bitcoin', etc.
            value             REAL,
            hi_52             REAL,
            lo_52             REAL,
            pct_change        REAL,
            source            TEXT DEFAULT 'yahoo', -- 'yahoo', 'coingecko', 'fred'
            fetched_at        DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- 26. Market Broadcast Cache (replaces in-memory cachedFlowData/Smartlists/Sectors/News)
        CREATE TABLE IF NOT EXISTS market_broadcast_cache (
            cache_key         TEXT PRIMARY KEY,   -- 'fii_dii_flow', 'smartlists', 'sectors', 'market_news'
            payload_json      TEXT,
            fetched_at        DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- 27. OI Base Snapshots (replaces praxis_oi_base_* localStorage entries)
        CREATE TABLE IF NOT EXISTS oi_base_snapshots (
            instrument_key    TEXT NOT NULL,
            snapshot_date     TEXT NOT NULL,      -- YYYY-MM-DD (IST)
            base_call_oi      REAL,
            base_put_oi       REAL,
            base_total_oi     REAL,
            strike_breakdown  TEXT,               -- JSON: OI per strike at market open
            created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY(instrument_key, snapshot_date)
        );

        -- 28. AI Insights Cache (replaces praxis_ai_insight_cache localStorage)
        CREATE TABLE IF NOT EXISTS ai_insights_cache (
            id                INTEGER PRIMARY KEY AUTOINCREMENT,
            instrument_key    TEXT NOT NULL,
            page_name         TEXT NOT NULL,      -- 'fundamentals', 'technical', 'options', 'foreign', 'master'
            card_id           TEXT NOT NULL,      -- Matches CARD_REGISTRY ids
            score             REAL,
            regime            TEXT,
            insight_text      TEXT NOT NULL,
            model             TEXT,
            provider          TEXT,
            generated_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(instrument_key, page_name, card_id)
        );
        CREATE INDEX IF NOT EXISTS idx_insights ON ai_insights_cache(instrument_key, page_name, generated_at DESC);

        -- 29. Page Composite Snapshots (historical append log — header_data only stores latest)
        CREATE TABLE IF NOT EXISTS page_composite_snapshots (
            id                INTEGER PRIMARY KEY AUTOINCREMENT,
            instrument_key    TEXT NOT NULL,
            page_name         TEXT NOT NULL,      -- 'fundamentals', 'technical', 'options', 'foreign', 'master'
            composite_score   REAL,
            regime            TEXT,
            regime_color      TEXT,
            bull_count        INTEGER,
            bear_count        INTEGER,
            neutral_count     INTEGER,
            trading_mode      TEXT DEFAULT 'swing',
            tailwinds_json    TEXT,
            risks_json        TEXT,
            sections_json     TEXT,
            snapshot_at       DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_composites ON page_composite_snapshots(instrument_key, page_name, snapshot_at DESC);

        -- 30. Foreign Page Cache (per-symbol Foreign Markets scores + AI insights)
        CREATE TABLE IF NOT EXISTS foreign_page_cache (
            symbol_id         TEXT PRIMARY KEY,   -- matches global_cache.symbol_id
            category          TEXT,               -- 'fx', 'commodities', 'global_indices', 'bonds', 'crypto', 'volatility'
            display_name      TEXT,
            value             REAL,
            pct_change        REAL,
            score             REAL,
            signal            INTEGER,            -- -1, 0, 1
            bias              TEXT,
            hi_52             REAL, lo_52 REAL,
            ai_insight        TEXT,
            insight_generated_at DATETIME,
            updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- 31. Fundamentals Cache — Column-level (replaces fundamentals_data raw_json blob)
        CREATE TABLE IF NOT EXISTS fundamentals_cache (
            instrument_key    TEXT PRIMARY KEY,
            -- Valuation
            pe_ratio          REAL, pe_ratio_src TEXT,
            forward_pe        REAL, forward_pe_src TEXT,
            pb_ratio          REAL, pb_ratio_src TEXT,
            ev_ebitda         REAL, ev_ebitda_src TEXT,
            earnings_yield    REAL,
            dividend_yield    REAL,
            -- Company Earnings/Growth
            eps_growth        REAL, revenue_growth REAL, profit_growth REAL,
            profit_margin     REAL, operating_margin REAL, net_margin REAL,
            -- Profitability
            roe               REAL, roce REAL, roa REAL,
            -- Balance Sheet
            debt_to_equity    REAL, current_ratio REAL,
            interest_coverage REAL, free_cash_flow REAL, cash_conversion REAL,
            -- Ownership
            promoter_holding  REAL,
            -- Index Valuation
            nifty_pe          REAL, nifty_pb REAL, mcap_gdp REAL,
            eps_yoy           REAL, forward_eps REAL,
            -- Macro (shared)
            gdp_growth        REAL, cpi REAL, repo_rate REAL, fiscal_deficit REAL,
            -- Flow
            fii_flow          REAL, dii_flow REAL, fii_trend TEXT,
            advance_decline   REAL,
            -- Risk
            india_vix         REAL, crude REAL, credit_growth REAL, corp_debt REAL,
            global_liq        REAL,
            -- Peer/Analyst
            analyst_consensus TEXT,
            -- Full raw responses for fallback
            yahoo_raw_json    TEXT,
            nse_raw_json      TEXT,
            -- Timestamps
            yahoo_fetched_at  DATETIME,
            nse_fetched_at    DATETIME,
            updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- 32. Technicals Cache — Column-level (replaces technicals_data raw_json blob)
        CREATE TABLE IF NOT EXISTS technicals_cache (
            instrument_key    TEXT PRIMARY KEY,
            timeframe         TEXT DEFAULT '1d',
            candles_count     INTEGER,
            -- Trend
            ema_20 REAL, ema_50 REAL, ema_200 REAL,
            sma_50 REAL, sma_200 REAL,
            adx REAL, adx_plus_di REAL, adx_minus_di REAL,
            supertrend REAL, supertrend_direction INTEGER,
            beta_correlation  REAL,
            -- Momentum
            rsi REAL,
            macd_line REAL, macd_signal REAL, macd_histogram REAL,
            stoch_rsi REAL, stoch_k REAL, stoch_d REAL,
            williams_r REAL,
            -- Volatility
            bb_upper REAL, bb_middle REAL, bb_lower REAL, bb_pb REAL,
            atr REAL,
            kc_upper REAL, kc_middle REAL, kc_lower REAL,
            -- Volume
            volume_sma REAL, obv REAL, cmf REAL, vwap REAL,
            -- Structure
            support REAL, resistance REAL,
            pivot_p REAL, pivot_r1 REAL, pivot_s1 REAL, pivot_r2 REAL, pivot_s2 REAL,
            fib_0 REAL, fib_236 REAL, fib_382 REAL, fib_500 REAL, fib_618 REAL, fib_100 REAL,
            trendline_slope REAL, trendline_r2 REAL, trendline_std_err REAL,
            -- Breadth (index only — null for companies)
            breadth_ratio REAL, ad_line REAL, mcclellan REAL, nh_nl REAL, trin REAL,
            updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- 33. Options Cache — Column-level (replaces options_data raw_json blob)
        CREATE TABLE IF NOT EXISTS options_cache (
            instrument_key    TEXT PRIMARY KEY,
            expiry            TEXT,
            spot_price        REAL,
            -- OI
            total_call_oi     REAL, total_put_oi REAL,
            oi_change_call    REAL, oi_change_put REAL,
            -- PCR
            pcr_oi            REAL, pcr_volume REAL,
            -- Greeks (ATM)
            atm_strike        REAL,
            atm_delta         REAL, atm_gamma REAL,
            atm_theta         REAL, atm_vega REAL, atm_rho REAL,
            atm_iv            REAL,
            -- Derived
            iv_rank           REAL, iv_percentile REAL,
            max_pain          REAL,
            -- Full snapshot JSONs (kept for chain table + charts)
            chain_json        TEXT,
            greeks_json       TEXT,
            updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        -- 34. FII/DII Historical Flow (proper per-day append, replaces ai_card_store misuse)
        CREATE TABLE IF NOT EXISTS fii_dii_history (
            date        TEXT PRIMARY KEY,  -- YYYY-MM-DD (IST market date)
            fii_json    TEXT,              -- JSON object: { segment_name: { buy_amount, sell_amount, net } }
            dii_json    TEXT,              -- JSON object: { segment_name: { buy_amount, sell_amount, net } }
            updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_fii_dii_history_date ON fii_dii_history(date DESC);

        -- ============================================================
        -- MULTI-MODEL PREDICTION & CALIBRATION ENGINE (HEDGE SPINE)
        -- ============================================================

        -- 35. Predictions (Quantiles per model and combined ensemble)
        CREATE TABLE IF NOT EXISTS predictions (
            id                    INTEGER PRIMARY KEY AUTOINCREMENT,
            instrument            TEXT NOT NULL,
            timeframe             TEXT NOT NULL,
            predicted_at          DATETIME NOT NULL,
            target_candle_time    DATETIME NOT NULL,
            model_id              TEXT NOT NULL, -- 'naive_baseline', 'future_vision', 'kronos_small', 'ensemble', etc.
            q10_o REAL, q25_o REAL, q50_o REAL, q75_o REAL, q90_o REAL,
            q10_h REAL, q25_h REAL, q50_h REAL, q75_h REAL, q90_h REAL,
            q10_l REAL, q25_l REAL, q50_l REAL, q75_l REAL, q90_l REAL,
            q10_c REAL, q25_c REAL, q50_c REAL, q75_c REAL, q90_c REAL,
            regime_at_prediction  TEXT NOT NULL DEFAULT 'CHOPPY',
            weight_used           REAL NOT NULL DEFAULT 1.0,
            features_hash         TEXT,
            status                TEXT DEFAULT 'PENDING' -- 'PENDING', 'RESOLVED', 'ORPHANED'
        );
        CREATE INDEX IF NOT EXISTS idx_predictions_lookup ON predictions(instrument, timeframe, status, target_candle_time);
        CREATE INDEX IF NOT EXISTS idx_predictions_target ON predictions(status, target_candle_time);

        -- 36. Resolutions (Scored outcomes against actuals)
        CREATE TABLE IF NOT EXISTS resolutions (
            prediction_id       INTEGER PRIMARY KEY,
            actual_o            REAL NOT NULL,
            actual_h            REAL NOT NULL,
            actual_l            REAL NOT NULL,
            actual_c            REAL NOT NULL,
            resolved_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
            pinball_loss        REAL NOT NULL,
            crps                REAL,
            interval_score      REAL,
            inside_80_interval  INTEGER NOT NULL, -- 1 = true, 0 = false
            conformity_score    REAL NOT NULL,
            FOREIGN KEY (prediction_id) REFERENCES predictions(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_resolutions_time ON resolutions(resolved_at DESC);

        -- 37. Model Weights (Hedge Multiplicative-Weights tracking)
        CREATE TABLE IF NOT EXISTS model_weights (
            model_id            TEXT NOT NULL,
            instrument          TEXT NOT NULL,
            timeframe           TEXT NOT NULL,
            regime              TEXT NOT NULL,
            weight              REAL NOT NULL DEFAULT 0.5,
            updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
            rolling_loss_20     REAL DEFAULT 0,
            rolling_loss_100    REAL DEFAULT 0,
            n_resolved          INTEGER DEFAULT 0,
            is_probation        INTEGER DEFAULT 0,
            probation_started_at DATETIME,
            PRIMARY KEY(model_id, instrument, timeframe, regime)
        );
        CREATE INDEX IF NOT EXISTS idx_model_weights_lookup ON model_weights(instrument, timeframe, regime);

        -- 38. Calibration State (Conformal interval scaling per instrument/timeframe)
        CREATE TABLE IF NOT EXISTS calibration_state (
            instrument           TEXT NOT NULL,
            timeframe            TEXT NOT NULL,
            conformal_multiplier REAL DEFAULT 1.0,
            coverage_actual_80   REAL DEFAULT 0.80,
            window_size          INTEGER DEFAULT 200,
            updated_at           DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY(instrument, timeframe)
        );

        -- ============================================================
        -- AUTO-FINE-TUNING & RESILIENT RETRAINING PIPELINE
        -- ============================================================

        -- 39. Training Samples (Rolling window of 512 context -> 1 target)
        CREATE TABLE IF NOT EXISTS training_samples (
            id                  INTEGER PRIMARY KEY AUTOINCREMENT,
            instrument          TEXT NOT NULL,
            timeframe           TEXT NOT NULL,
            candle_time         DATETIME NOT NULL,
            context_window      TEXT NOT NULL, -- JSON array of 512 OHLCV objects
            target_o            REAL NOT NULL,
            target_h            REAL NOT NULL,
            target_l            REAL NOT NULL,
            target_c            REAL NOT NULL,
            regime              TEXT NOT NULL,
            feature_version     INTEGER DEFAULT 1,
            created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
            used_by             TEXT DEFAULT '[]', -- JSON array of version numbers that trained on this
            UNIQUE(instrument, timeframe, candle_time)
        );
        CREATE INDEX IF NOT EXISTS idx_training_samples_lookup ON training_samples(instrument, timeframe, candle_time);
        CREATE INDEX IF NOT EXISTS idx_training_samples_regime ON training_samples(instrument, timeframe, regime);

        -- 40. Fine-Tune Versions (Every training run, complete history)
        CREATE TABLE IF NOT EXISTS finetune_versions (
            id                          INTEGER PRIMARY KEY AUTOINCREMENT,
            model_id                    TEXT NOT NULL,
            instrument                  TEXT NOT NULL,
            timeframe                   TEXT NOT NULL,
            version_num                 INTEGER NOT NULL,
            status                      TEXT NOT NULL DEFAULT 'TRAINING', -- 'COLLECTING', 'TRAINING', 'VALIDATING', 'PROMOTED', 'REJECTED', 'RETIRED', 'DRIFT_REVERTED'
            base_checkpoint_ref         TEXT NOT NULL,
            parent_version_id           INTEGER,
            train_window_start          DATETIME,
            train_window_end            DATETIME,
            n_train_samples             INTEGER,
            epochs_total                INTEGER,
            epochs_completed            INTEGER DEFAULT 0,
            checkpoint_path             TEXT,
            val_pinball_loss            REAL,
            zero_shot_pinball_loss      REAL,
            live_baseline_pinball_loss  REAL,
            improvement_vs_zero_shot_pct REAL,
            val_coverage_80             REAL,
            error_breakdown             TEXT, -- JSON per-regime breakdown
            rejection_reason            TEXT,
            started_at                  DATETIME DEFAULT CURRENT_TIMESTAMP,
            finished_at                 DATETIME,
            promoted_at                 DATETIME,
            retired_at                  DATETIME,
            heartbeat_at                DATETIME,
            UNIQUE(model_id, instrument, timeframe, version_num)
        );
        CREATE INDEX IF NOT EXISTS idx_finetune_versions_lookup ON finetune_versions(model_id, instrument, timeframe, status);

        -- 41. Active Versions (Currently active checkpoint per model/instrument/timeframe)
        CREATE TABLE IF NOT EXISTS active_versions (
            model_id            TEXT NOT NULL,
            instrument          TEXT NOT NULL,
            timeframe           TEXT NOT NULL,
            active_version_id   INTEGER, -- NULL means base zero-shot weights active
            promoted_at         DATETIME,
            reverted_at         DATETIME,
            revert_reason       TEXT,
            PRIMARY KEY(model_id, instrument, timeframe),
            FOREIGN KEY (active_version_id) REFERENCES finetune_versions(id)
        );

        -- 42. Readiness State (For UI progress bars and worker scheduling)
        CREATE TABLE IF NOT EXISTS readiness_state (
            model_id                    TEXT NOT NULL,
            instrument                  TEXT NOT NULL,
            timeframe                   TEXT NOT NULL,
            latest_finetune_version_id  INTEGER,
            data_pct                    REAL DEFAULT 0.0,
            train_pct                   REAL DEFAULT 0.0,
            validation_pct              REAL DEFAULT 0.0,
            calibration_pct             REAL DEFAULT 0.0,
            overall_pct                 REAL DEFAULT 0.0,
            stage                       TEXT DEFAULT 'COLLECTING', -- 'COLLECTING', 'READY_TO_TRAIN', 'TRAINING', 'VALIDATING', 'PROMOTED', 'REJECTED', 'DRIFT_REVERTED', 'DEFERRED'
            blocker                     TEXT,
            eta_text                    TEXT,
            updated_at                  DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY(model_id, instrument, timeframe)
        );

        -- 43. Incidents (Rollbacks, drift events, failed runs)
        CREATE TABLE IF NOT EXISTS finetune_incidents (
            id                  INTEGER PRIMARY KEY AUTOINCREMENT,
            model_id            TEXT NOT NULL,
            instrument          TEXT NOT NULL,
            timeframe           TEXT NOT NULL,
            reason              TEXT NOT NULL,
            rolling_loss_20     REAL,
            val_loss            REAL,
            created_at          DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- 44. Fine-Tune Training Log (Real-time epoch-by-epoch progress)
        CREATE TABLE IF NOT EXISTS finetune_training_log (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            version_id      INTEGER NOT NULL REFERENCES finetune_versions(id) ON DELETE CASCADE,
            epoch           INTEGER NOT NULL,
            train_loss      REAL,
            val_pinball     REAL,
            learning_rate   REAL,
            grad_norm       REAL,
            elapsed_sec     REAL,
            logged_at       DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_training_log_version ON finetune_training_log(version_id, epoch);
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

    try {
        db.exec(`ALTER TABLE model_weights ADD COLUMN is_probation INTEGER DEFAULT 0;`);
    } catch (e) {}

    try {
        db.exec(`ALTER TABLE model_weights ADD COLUMN probation_started_at DATETIME;`);
    } catch (e) {}

    // Multi-tenant user_id support for journal notes and overrides
    try {
        db.exec(`ALTER TABLE journal_notes ADD COLUMN user_id TEXT DEFAULT 'default_user';`);
    } catch (e) {}

    try {
        db.exec(`CREATE INDEX IF NOT EXISTS idx_journal_notes_user_date ON journal_notes(user_id, date);`);
    } catch (e) {}

    try {
        db.exec(`ALTER TABLE user_overrides ADD COLUMN user_id TEXT DEFAULT 'default_user';`);
    } catch (e) {}

    try {
        db.exec(`CREATE INDEX IF NOT EXISTS idx_user_overrides_lookup ON user_overrides(user_id, module_key, instrument_key, field_key);`);
    } catch (e) {}

    try {
        db.exec(`ALTER TABLE finetune_versions ADD COLUMN heartbeat_at DATETIME;`);
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
