/**
 * @file repairMarketEvents.js
 * @purpose Retroactively repairs truncated headlines, populates missing affected assets,
 *          generates institutional hashtags, and recalculates PES-7 scores for SQLite market_events.
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import {
    isHeadlineTruncated,
    extractAssetsFromText,
    generateEventHashtags,
    computeEventScore,
    computeEventImpactMagnitude
} from '../../frontend/stock-look/src/shared/global/logic/eventsEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../local_data/praxis_market.db');
const db = new Database(dbPath);

console.log(`[RepairScript] Connected to DB at: ${dbPath}`);

// 1. Ensure hashtags column exists
try {
    db.exec(`ALTER TABLE market_events ADD COLUMN hashtags TEXT;`);
    console.log("[RepairScript] Added hashtags column to market_events");
} catch (e) {
    // Column already exists
}

// 2. Load cached market news for pristine original headings
let cachedNewsMap = new Map();
try {
    const row = db.prepare("SELECT payload_json FROM market_broadcast_cache WHERE cache_key = 'market_news'").get();
    if (row && row.payload_json) {
        const newsArray = JSON.parse(row.payload_json);
        newsArray.forEach(n => {
            if (n.article_link && n.heading) {
                cachedNewsMap.set(n.article_link, n.heading);
            }
        });
        console.log(`[RepairScript] Loaded ${cachedNewsMap.size} articles from market_broadcast_cache`);
    }
} catch (e) {
    console.warn("[RepairScript] Could not read market_broadcast_cache:", e.message);
}

// Helper to convert URL slug into title case headline if article not in cache
function slugToHeadline(url) {
    if (!url) return null;
    const match = url.match(/\/stocks\/([^\/]+)\//);
    if (!match) return null;
    const slug = match[1];
    return slug
        .split('-')
        .map(w => {
            if (['in', 'on', 'at', 'to', 'for', 'and', 'or', 'of', 'by', 'as'].includes(w.toLowerCase())) return w.toLowerCase();
            if (['nifty', 'sensex', 'fii', 'dii', 'rbi', 'sebi', 'ipo', 'ofs', 'pat', 'bse', 'nse', 'itc', 'sbi', 'tcs', 'hdfc', 'lic', 'tmpv', 'ongc'].includes(w.toLowerCase())) return w.toUpperCase();
            return w.charAt(0).toUpperCase() + w.slice(1);
        })
        .join(' ');
}

// 3. Known clean headlines for recent events from Upstox feed
const KNOWN_REPAIR_HEADLINES = {
    360: "Top gainers and losers, September 17: HDFC LIC jumps 5%, TMPV rises 4%, ONGC falls 2%; check list",
    356: "NIFTY50, SENSEX today: Wall Street cues, FII activity, key things to know before markets open on September 17",
    352: "Stocks to watch, Sept 16: Paytm, Yes Bank, R R Kabel, BHEL, Titagarh Rail Systems, Vikram Solar, NBCC",
    350: "SENSEX jumps over 500 points, NIFTY50 opens at 23,576 as Tech Mahindra, HCL Tech lead IT gains",
    347: "TCS, Tata Motors PV, Tata Chemicals: Tata Group shares surge up to 20%; here is why",
    346: "HCL Tech, HDFC Bank, HFCL among buzzing stocks as SENSEX falls nearly 300 pts, NIFTY trades below 23,300",
    345: "Infosys, TCS, Wipro: IT stocks in focus after global AI leaders call for slower development",
    340: "SENSEX, NIFTY50 snap two-day losing streak led by ITC, SBI, Reliance Industries",
    339: "NIFTY FMCG Index rallies near 2% on festive demand expectations",
    337: "Top gainers and losers, September 16: HDFC LIC, SBI jump 3%, TCS tumbles 3%; check full list"
};

// 4. Fetch all events and evaluate
const events = db.prepare("SELECT * FROM market_events ORDER BY id DESC").all();
console.log(`[RepairScript] Processing ${events.length} events...`);

let repairedCount = 0;

const updateStmt = db.prepare(`
    UPDATE market_events 
    SET headline = ?,
        affected_assets = ?,
        key_data_points = ?,
        hashtags = ?,
        event_score = ?
    WHERE id = ?
`);

const tx = db.transaction(() => {
    for (const ev of events) {
        let needsUpdate = false;
        let finalHeadline = ev.headline;
        
        // A. Check if headline is truncated
        if (KNOWN_REPAIR_HEADLINES[ev.id]) {
            finalHeadline = KNOWN_REPAIR_HEADLINES[ev.id];
            needsUpdate = true;
            console.log(`[RepairScript] Restored Known Headline for ID ${ev.id}: "${finalHeadline}"`);
        } else if (isHeadlineTruncated(ev.headline)) {
            // Check cache
            if (ev.source_url && cachedNewsMap.has(ev.source_url)) {
                finalHeadline = cachedNewsMap.get(ev.source_url);
                needsUpdate = true;
                console.log(`[RepairScript] Restored from Cache for ID ${ev.id}: "${finalHeadline}"`);
            } else if (ev.source_url) {
                const slugTitle = slugToHeadline(ev.source_url);
                if (slugTitle && slugTitle.length > ev.headline.length) {
                    finalHeadline = slugTitle;
                    needsUpdate = true;
                    console.log(`[RepairScript] Restored from Slug for ID ${ev.id}: "${finalHeadline}"`);
                }
            }
        }

        // B. Assets extraction & repair
        let currentAssets = [];
        try {
            if (ev.affected_assets) currentAssets = JSON.parse(ev.affected_assets);
        } catch (e) {
            currentAssets = [];
        }

        const extractedAssets = extractAssetsFromText(finalHeadline, ev.summary || "");
        const mergedAssets = Array.from(new Set([...extractedAssets, ...currentAssets])).slice(0, 8);
        if (mergedAssets.length !== currentAssets.length) {
            needsUpdate = true;
        }

        // C. Key data points extraction
        let currentKeyPoints = [];
        try {
            if (ev.key_data_points) currentKeyPoints = JSON.parse(ev.key_data_points);
        } catch (e) {
            currentKeyPoints = [];
        }

        if (currentKeyPoints.length === 0) {
            const combined = `${finalHeadline} ${ev.summary || ""}`;
            const matches = combined.match(/(\$\d+(\.\d+)?(\/[a-zA-Z]+)?|\b\d+(\.\d+)?%|\b\d+\s*bps|\b\d+(\.\d+)?\s*(cr|crore|lakh|bn|billion|trillion)|₹\s*[\d,]+(\.\d+)?)/gi);
            if (matches && matches.length > 0) {
                currentKeyPoints = Array.from(new Set(matches.map(m => m.trim()))).slice(0, 4);
                needsUpdate = true;
            }
        }

        // D. Hashtags generation
        let currentHashtags = [];
        try {
            if (ev.hashtags) currentHashtags = JSON.parse(ev.hashtags);
        } catch (e) {
            currentHashtags = [];
        }

        if (!currentHashtags || currentHashtags.length === 0) {
            currentHashtags = generateEventHashtags({
                ...ev,
                headline: finalHeadline,
                affected_assets: mergedAssets
            });
            needsUpdate = true;
        }

        // E. Score recomputation
        const newScore = computeEventScore(
            ev.sentiment || "Neutral",
            ev.importance || "Medium",
            ev.severity || "Normal",
            ev.confidence || 60,
            ev.horizon || "Swing"
        );

        if (needsUpdate || ev.event_score !== newScore) {
            updateStmt.run(
                finalHeadline,
                JSON.stringify(mergedAssets),
                JSON.stringify(currentKeyPoints),
                JSON.stringify(currentHashtags),
                newScore,
                ev.id
            );
            repairedCount++;
        }
    }
});

tx();

console.log(`[RepairScript] ✅ Completed! Repaired/updated ${repairedCount} event rows.`);

// Inspect sample repaired rows
const checkRows = db.prepare("SELECT id, headline, affected_assets, key_data_points, hashtags, event_score FROM market_events WHERE id IN (360, 356, 352, 350, 347, 346, 345, 340, 337)").all();
console.log("[RepairScript] Sample Repaired Events:\n", JSON.stringify(checkRows, null, 2));

db.close();
process.exit(0);
