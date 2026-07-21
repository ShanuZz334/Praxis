import db from '../config/localDb.js';
import { fetchHistoricalCandles } from './upstoxHistorical.js';

const activeBackfills = new Set();
const MAX_WINDOW_DAYS = 31;
const INTER_WINDOW_DELAY_MS = 1200;

const TARGET_HISTORY_DAYS = {
    '1minute': 365, '5minute': 365, '10minute': 365,
    '15minute': 365, '30minute': 365, '1hour': 365,
    'day': 730, 'week': 730,
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const toDateStr = (d) => d.toISOString().split('T')[0];
const subtractDays = (dateStr, days) => {
    const d = new Date(dateStr);
    d.setUTCDate(d.getUTCDate() - days);
    return toDateStr(d);
};

const getBackfillState = (key, tf) =>
    db.prepare('SELECT oldest_date, is_complete, last_run_at FROM backfill_state WHERE instrument_key = ? AND timeframe = ?').get(key, tf);

const upsertBackfillState = (key, tf, oldest, complete) =>
    db.prepare('INSERT INTO backfill_state (instrument_key, timeframe, oldest_date, is_complete, last_run_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(instrument_key, timeframe) DO UPDATE SET oldest_date=excluded.oldest_date, is_complete=excluded.is_complete, last_run_at=CURRENT_TIMESTAMP').run(key, tf, oldest, complete ? 1 : 0);

const getOldestCandleDate = (key, tf) => {
    const row = db.prepare('SELECT MIN(timestamp) as oldest FROM candles WHERE instrument_key = ? AND timeframe = ?').get(key, tf);
    return row?.oldest ? toDateStr(new Date(row.oldest)) : null;
};

const runBackfill = async (instrumentKey, timeframe) => {
    const lockKey = instrumentKey + '_' + timeframe;
    if (activeBackfills.has(lockKey)) return;
    activeBackfills.add(lockKey);
    try {
        const targetDays = TARGET_HISTORY_DAYS[timeframe] || 365;
        const targetDate = subtractDays(toDateStr(new Date()), targetDays);
        let currentOldest = getOldestCandleDate(instrumentKey, timeframe) || toDateStr(new Date());

        if (currentOldest <= targetDate) {
            upsertBackfillState(instrumentKey, timeframe, currentOldest, true);
            console.log('[Backfill] Already complete:', instrumentKey, timeframe);
            return;
        }

        console.log('[Backfill] Starting:', instrumentKey, timeframe, 'from', currentOldest, 'to', targetDate);
        let windowsProcessed = 0;
        let currentToDate = subtractDays(currentOldest, 1);

        while (currentToDate > targetDate) {
            const windowFrom = subtractDays(currentToDate, MAX_WINDOW_DAYS - 1);
            const actualFrom = windowFrom < targetDate ? targetDate : windowFrom;
            console.log('[Backfill] Window', windowsProcessed + 1 + ':', actualFrom, '->', currentToDate);
            try {
                await fetchHistoricalCandles(instrumentKey, timeframe, currentToDate, actualFrom, false);
                windowsProcessed++;
                upsertBackfillState(instrumentKey, timeframe, actualFrom, false);
            } catch (err) {
                console.warn('[Backfill] Window failed:', err.message, '- pausing backfill');
                break;
            }
            currentToDate = subtractDays(actualFrom, 1);
            if (currentToDate > targetDate) await sleep(INTER_WINDOW_DELAY_MS);
        }

        const finalOldest = getOldestCandleDate(instrumentKey, timeframe);
        const isComplete = !!(finalOldest && finalOldest <= targetDate);
        upsertBackfillState(instrumentKey, timeframe, finalOldest || currentOldest, isComplete);
        console.log('[Backfill] Done:', instrumentKey, timeframe, '| Windows:', windowsProcessed, '| Complete:', isComplete, '| Oldest:', finalOldest);
    } catch (err) {
        console.error('[Backfill] Fatal error:', instrumentKey, timeframe, err.message);
    } finally {
        activeBackfills.delete(lockKey);
    }
};

export const triggerBackfillIfNeeded = (instrumentKey, timeframe) => {
    if (timeframe === 'day' || timeframe === 'week' || timeframe === 'month') return;
    const state = getBackfillState(instrumentKey, timeframe);
    if (state && state.is_complete === 1) return;
    setImmediate(() => runBackfill(instrumentKey, timeframe).catch(e => console.error('[Backfill] Unhandled:', e.message)));
};

export const getBackfillStatus = (instrumentKey, timeframe) => {
    const state = getBackfillState(instrumentKey, timeframe);
    const row = db.prepare('SELECT COUNT(*) as cnt FROM candles WHERE instrument_key = ? AND timeframe = ?').get(instrumentKey, timeframe);
    return {
        isComplete: state?.is_complete === 1,
        isRunning: activeBackfills.has(instrumentKey + '_' + timeframe),
        oldestDate: state?.oldest_date || null,
        totalCandles: row?.cnt || 0,
        lastRunAt: state?.last_run_at || null,
    };
};
