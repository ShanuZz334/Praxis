import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import aiGateway from '../ai-gateway/index.js';
import { getCalibrationProfile } from './paceEngine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH   = path.join(__dirname, '..', 'local_data', 'praxis.db');

function getDb() { return new Database(DB_PATH); }

function ensureTable(db) {
    db.exec(`
        CREATE TABLE IF NOT EXISTS analyst_briefs (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            instrument_key  TEXT    NOT NULL,
            timeframe       TEXT    NOT NULL,
            brief_text      TEXT    NOT NULL,
            created_at      INTEGER NOT NULL,
            UNIQUE(instrument_key, timeframe)
        );
    `);
}

export async function runOvernightAnalyst(instrumentKey, timeframe) {
    const db = getDb();
    ensureTable(db);

    const profile = getCalibrationProfile(instrumentKey, timeframe);
    if (!profile) {
        throw new Error('No PACE calibration profile exists for this instrument/timeframe. Cannot run analysis.');
    }

    const systemInstruction = `You are the Praxis Overnight Quantitative Analyst.
Your job is to analyze the historical predictive performance (PACE scores) of our real-time AI models for a specific asset and timeframe.
Based on the aggregated performance metrics provided, write a concise, 2-3 sentence strategic brief.
Focus purely on actionable advice for the real-time AI model that will run tomorrow (e.g., "The model consistently overestimates volatility in bearish regimes; dampen downward ranges." or "Directional accuracy is excellent, but close bias is consistently undershooting; adjust targets slightly higher.")
DO NOT invent data. Base your advice STRICTLY on the metrics provided. Keep it under 50 words.`;

    const prompt = `Instrument: ${instrumentKey}
Timeframe: ${timeframe}
PACE Calibration Profile Metrics:
- Total Bars Scored: ${profile.barsScored}
- Overall Directional Accuracy: ${(profile.avgDa * 100).toFixed(1)}%
- Bullish DA: ${(profile.bullishDa * 100).toFixed(1)}%
- Bearish DA: ${(profile.bearishDa * 100).toFixed(1)}%
- Avg MAPE (Price Error): ${profile.avgMape.toFixed(2)}%
- Avg High/Low Range Error: ${profile.avgHlError.toFixed(2)}%
- Net Close Bias (Negative = Model Undershoots, Positive = Model Overshoots): ${profile.avgCloseBias.toFixed(2)}

Analyze this and provide the strategic brief for tomorrow's live model.`;

    const gatewayRequest = {
        taskType: 'analyst_brief',
        prompt,
        systemInstruction,
        temperature: 0.2, // Low temp for analytical consistency
        maxTokens: 150
    };

    console.log(`[OvernightAnalyst] Running deep analysis for ${instrumentKey} (${timeframe})...`);
    
    const result = await aiGateway.process(gatewayRequest);

    if (result.error) {
        throw new Error(`AI Gateway error: ${result.message || result.details}`);
    }

    const briefText = (result.text || result.content || '').trim();

    const stmt = db.prepare(`
        INSERT INTO analyst_briefs (instrument_key, timeframe, brief_text, created_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(instrument_key, timeframe) 
        DO UPDATE SET brief_text=excluded.brief_text, created_at=excluded.created_at
    `);
    
    stmt.run(instrumentKey, timeframe, briefText, Date.now());
    
    console.log(`[OvernightAnalyst] Brief saved for ${instrumentKey}.`);
    
    return briefText;
}

export function getLatestAnalystBrief(instrumentKey, timeframe) {
    try {
        const db = getDb();
        ensureTable(db);
        const row = db.prepare(`SELECT brief_text FROM analyst_briefs WHERE instrument_key = ? AND timeframe = ?`).get(instrumentKey, timeframe);
        return row ? row.brief_text : null;
    } catch (e) {
        console.error('[OvernightAnalyst] Error fetching brief:', e.message);
        return null;
    }
}

export async function runJournalAnalyst() {
    const db = getDb();
    ensureTable(db);
    
    // Fetch all active profiles
    const rows = db.prepare(`SELECT instrument_key, timeframe FROM pace_profiles GROUP BY instrument_key, timeframe`).all();
    
    if (!rows || rows.length === 0) {
        throw new Error('No PACE profiles available to generate journal insights.');
    }

    let allProfilesContext = '';
    for (const row of rows) {
        const profile = getCalibrationProfile(row.instrument_key, row.timeframe);
        if (profile && profile.barsScored > 0) {
            allProfilesContext += `\nInstrument: ${row.instrument_key} | TF: ${row.timeframe}
- Directional Accuracy: ${(profile.avgDa * 100).toFixed(1)}% (Bullish: ${(profile.bullishDa * 100).toFixed(1)}%, Bearish: ${(profile.bearishDa * 100).toFixed(1)}%)
- MAPE: ${profile.avgMape.toFixed(2)}% | Close Bias: ${profile.avgCloseBias.toFixed(2)}`;
        }
    }

    if (!allProfilesContext) {
        throw new Error('No valid PACE data available for journal insights.');
    }

    const systemInstruction = `You are the Praxis Overnight Quantitative Analyst reporting directly to the trader's daily journal.
Your task is to analyze the global performance of our predictive models across all tracked instruments for today, and write a holistic, reflective journal entry for the "AI Insights" tab.
Highlight where the models excelled, where they failed (e.g. "We struggled to catch the bearish momentum on NIFTY"), and what the trader should watch out for tomorrow.
Keep it engaging, professional, and formatted in clean markdown (bullet points are encouraged). Do NOT hallucinate data.`;

    const prompt = `Global PACE Calibration Metrics:\n${allProfilesContext}\n\nWrite the AI Insights journal entry.`;

    const gatewayRequest = {
        taskType: 'journal_insight',
        prompt,
        systemInstruction,
        temperature: 0.3,
        maxTokens: 400
    };

    console.log(`[OvernightAnalyst] Running global journal analysis...`);
    const result = await aiGateway.process(gatewayRequest);

    if (result.error) {
        throw new Error(`AI Gateway error: ${result.message || result.details}`);
    }

    return (result.text || result.content || '').trim();
}