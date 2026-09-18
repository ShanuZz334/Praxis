/**
 * @file newsAutoProcessor.js
 * @purpose Automatically processes incoming live market news through the
 *          Praxis AI event extraction pipeline and saves results to the
 *          market_events SQLite table — zero human input required.
 *
 * @pipeline
 *   1. Receives raw news items (from Upstox market:news feed via cachedNews)
 *   2. Deduplicates against already-processed articles (by article_link)
 *   3. Auto-detects instrument type (MACRO_POLICY, EQUITY, COMMODITY, etc.)
 *   4. Routes to the correct domain-specific AI system prompt
 *   5. Calls AI Gateway for extraction
 *   6. Validates + sanitizes AI output, computes PES-7 score deterministically
 *   7. Persists to SQLite market_events table
 *   8. Broadcasts updated event list over Socket.io
 *
 * @constraints
 *   - Does NOT touch or modify the CatalystCalendar / Live Market News UI
 *   - Rate-limited: max 3 concurrent AI calls, 2s delay between articles
 *   - Skips articles already processed (idempotent via article_link index)
 *   - Only processes articles published within the last 24 hours
 */

import db from "../config/localDb.js";
import { aiGateway } from "../ai-gateway/index.js";
import {
    detectInstrumentType,
    resolvePromptByInstrumentType,
    buildEventExtractionPrompt,
    validateAndSanitizeEvent
} from "../../frontend/stock-look/src/shared/global/logic/eventsEngine.js";

// ============================================================
// Config
// ============================================================
const MAX_AGE_HOURS    = 72;    // Only process news from last 72 hours
const CONCURRENCY      = 2;     // Max parallel AI calls
const INTER_CALL_DELAY = 2500;  // ms between batches (rate-limit protection)
const MAX_PER_CYCLE    = 25;    // Max new articles to process per polling cycle

// ============================================================
// State & Deduplication Buffers
// ============================================================
let isProcessing = false;
let processedArticleLinks = new Set(); // In-memory dedup cache (backed by DB)
let processedHeadlines = new Set();    // Secondary dedup by exact headline
let recentHeadlinesBuffer = [];        // Rolling semantic dedup buffer: { headline, tokens, timestamp }

const STOP_WORDS = new Set([
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has", "he",
    "in", "is", "it", "its", "of", "on", "that", "the", "to", "was", "were", "will",
    "with", "up", "down", "over", "into", "amid", "after", "says", "said", "about"
]);

export function tokenizeHeadline(text) {
    if (!text || typeof text !== "string") return new Set();
    const words = text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter(w => w.length > 2 && !STOP_WORDS.has(w));
    return new Set(words);
}

export function calculateJaccardSimilarity(setA, setB) {
    if (!setA.size || !setB.size) return 0;
    let intersection = 0;
    for (const item of setA) {
        if (setB.has(item)) intersection++;
    }
    const union = setA.size + setB.size - intersection;
    return union > 0 ? intersection / union : 0;
}

export function isSemanticDuplicate(newHeadline, maxAgeHours = 6, threshold = 0.65) {
    const now = Date.now();
    // Prune buffer older than 24 hours
    recentHeadlinesBuffer = recentHeadlinesBuffer.filter(item => (now - item.timestamp) < 24 * 60 * 60 * 1000);

    const newTokens = tokenizeHeadline(newHeadline);
    if (newTokens.size < 3) return false;

    for (const item of recentHeadlinesBuffer) {
        if ((now - item.timestamp) <= maxAgeHours * 60 * 60 * 1000) {
            const similarity = calculateJaccardSimilarity(newTokens, item.tokens);
            if (similarity >= threshold) {
                return true;
            }
        }
    }
    return false;
}

/**
 * Loads already-processed article links and recent headlines from DB on startup.
 */
function loadProcessedLinks() {
    try {
        const rows = db.prepare(`
            SELECT headline, reasoning, source_url, created_at, published_time FROM market_events ORDER BY created_at DESC LIMIT 200
        `).all();
        
        rows.forEach(r => {
            if (r.headline) {
                processedHeadlines.add(r.headline.trim());
                const date = r.published_time ? new Date(r.published_time) : new Date(r.created_at || Date.now());
                recentHeadlinesBuffer.push({
                    headline: r.headline,
                    tokens: tokenizeHeadline(r.headline),
                    timestamp: date.getTime()
                });
            }
            if (r.source_url) processedArticleLinks.add(r.source_url);
            
            // Legacy fallback if article_link was embedded in reasoning
            if (r.reasoning && r.reasoning.includes('article_link:')) {
                const match = r.reasoning.match(/article_link:\s*(https?:\/\/[^\s]+)/);
                if (match) processedArticleLinks.add(match[1]);
            }
        });
        console.log(`[AutoProcessor] Loaded ${processedArticleLinks.size} processed URLs and ${recentHeadlinesBuffer.length} recent headlines for semantic deduplication`);
    } catch (e) {
        // source_url column may not exist yet — handled gracefully
        console.log("[AutoProcessor] Initialized with empty processed-links cache");
    }
}

/**
 * Adds source_url column to market_events if not present.
 * This lets us track which original news URL triggered which event.
 */
function ensureSourceUrlColumn() {
    try {
        db.exec(`ALTER TABLE market_events ADD COLUMN source_url TEXT;`);
        db.exec(`CREATE INDEX IF NOT EXISTS idx_market_events_source_url ON market_events(source_url);`);
        console.log("[AutoProcessor] Added source_url column to market_events");
    } catch (e) {
        // Column already exists — safe to ignore
    }
}

/**
 * Adds hashtags column to market_events if not present.
 */
function ensureHashtagsColumn() {
    try {
        db.exec(`ALTER TABLE market_events ADD COLUMN hashtags TEXT;`);
        console.log("[AutoProcessor] Added hashtags column to market_events");
    } catch (e) {
        // Column already exists — safe to ignore
    }
}

/**
 * Sleeps for a given number of milliseconds.
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Processes a single news article through the full AI pipeline.
 * Returns the saved event's DB row ID, or null if skipped/failed.
 */
async function processNewsArticle(newsItem, useFewShot = true) {
    const { heading, summary, article_link, published_time } = newsItem;

    if (!heading) return null;

    // 1. Skip if already processed (check URL, exact headline, and semantic similarity)
    if (article_link && processedArticleLinks.has(article_link)) return null;
    if (processedHeadlines.has(heading.trim())) return null;
    if (isSemanticDuplicate(heading, 6, 0.65)) {
        console.log(`[AutoProcessor] ⏭️ Skipped syndicated duplicate: "${heading.slice(0, 50)}"`);
        return null;
    }

    // 2. Skip if article is older than MAX_AGE_HOURS
    const pubTime = published_time ? new Date(published_time * 1000) : null;
    if (pubTime) {
        const ageHours = (Date.now() - pubTime.getTime()) / (1000 * 60 * 60);
        if (ageHours > MAX_AGE_HOURS) return null;
    }

    // 3. Auto-detect instrument type
    const instrumentType = detectInstrumentType(heading, summary || "", "");

    // 4. Resolve the correct domain system prompt
    const systemPrompt = resolvePromptByInstrumentType(instrumentType, useFewShot);

    // 5. Build the extraction user prompt
    const userPrompt = buildEventExtractionPrompt(
        heading,
        summary || "",
        "Market News (Auto)",
        instrumentType
    );

    try {
        // 6. Call AI Gateway
        const result = await aiGateway.process({
            taskType:          "MARKET_EVENT_EXTRACTION",
            prompt:            userPrompt,
            systemInstruction: systemPrompt,
            jsonMode:          true,
            temperature:       0.1,
            maxTokens:         2048
        });

        if (result.error) {
            console.warn(`[AutoProcessor] AI error for "${heading.slice(0, 50)}":`, result.message);
            return null;
        }

        // 7. Parse AI response
        let rawData;
        try {
            rawData = JSON.parse(result.text);
        } catch (e) {
            // Aggressive fallback: extract JSON between first { and last }
            try {
                const firstBrace = result.text.indexOf('{');
                const lastBrace  = result.text.lastIndexOf('}');
                if (firstBrace !== -1 && lastBrace !== -1) {
                    rawData = JSON.parse(result.text.substring(firstBrace, lastBrace + 1));
                } else {
                    throw new Error("No JSON found");
                }
            } catch {
                console.warn(`[AutoProcessor] Failed to parse JSON for "${heading.slice(0, 50)}"`);
                return null;
            }
        }

        // 8. Ensure instrument_type is set
        if (!rawData.instrument_type) rawData.instrument_type = instrumentType;

        // 9. Validate, sanitize, compute PES-7 score deterministically (passing original heading for anti-truncation)
        const { sanitized, errors } = validateAndSanitizeEvent(rawData, heading);
        if (errors.length > 0) {
            console.log(`[AutoProcessor] Validation auto-corrections for "${heading.slice(0, 50)}":`, errors);
        }

        const finalHeadline = sanitized.headline || heading;
        const finalCategory = sanitized.category || "Macro";

        // Safeguard: Do not save hollow/empty events
        if (!finalHeadline || finalHeadline.trim().length === 0) {
            console.warn(`[AutoProcessor] Skipping event with missing headline for "${heading.slice(0, 50)}"`);
            return null;
        }

        // 10. Save to DB (with hashtags and published_time)
        const publishedIso = pubTime ? pubTime.toISOString() : new Date().toISOString();
        const stmt = db.prepare(`
            INSERT INTO market_events (
                headline, summary, category, sub_category, source,
                published_time,
                sentiment, importance, severity, override_mode,
                confidence, affected_assets, event_score, horizon, reasoning,
                instrument_type, key_data_points, source_url, ttl_hours, hashtags
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const info = stmt.run(
            finalHeadline,
            sanitized.summary        || summary || finalHeadline,
            finalCategory,
            sanitized.sub_category   || null,
            sanitized.source         || "Market News (Auto)",
            publishedIso,
            sanitized.sentiment      || "Neutral",
            sanitized.importance     || "Medium",
            sanitized.severity       || "Normal",
            sanitized.override_mode  || "None",
            sanitized.confidence     || 60,
            sanitized.affected_assets && sanitized.affected_assets.length > 0 ? JSON.stringify(sanitized.affected_assets) : "[]",
            sanitized.event_score    || 0,
            sanitized.horizon        || "Swing",
            sanitized.reasoning      || null,
            sanitized.instrument_type || instrumentType,
            sanitized.key_data_points && sanitized.key_data_points.length > 0 ? JSON.stringify(sanitized.key_data_points) : "[]",
            article_link             || null,
            sanitized.ttl_hours      || 72,
            sanitized.hashtags && sanitized.hashtags.length > 0 ? JSON.stringify(sanitized.hashtags) : "[]"
        );

        if (article_link) processedArticleLinks.add(article_link);
        processedHeadlines.add(heading.trim());
        if (sanitized.headline) processedHeadlines.add(sanitized.headline.trim());
        recentHeadlinesBuffer.push({
            headline: finalHeadline,
            tokens: tokenizeHeadline(finalHeadline),
            timestamp: Date.now()
        });

        console.log(`[AutoProcessor] ✅ Saved event: "${finalHeadline.slice(0, 60)}" | Score: ${sanitized.event_score} | Category: ${finalCategory} | Assets: ${(sanitized.affected_assets || []).join(",")}`);
        return info.lastInsertRowid;

    } catch (e) {
        console.error(`[AutoProcessor] Unexpected error for "${heading.slice(0, 50)}":`, e.message);
        return null;
    }
}

/**
 * Main entry point: processes a batch of news items.
 * Called by upstoxMarketData.js whenever cachedNews is updated.
 *
 * @param {Array}    newsItems  - Array of Upstox news objects
 * @param {Function} broadcastFn - Optional: socket broadcast function for live reload
 * @param {boolean}  useFewShot - Whether to include few-shot examples in prompts
 */
export async function processNewsItems(newsItems, broadcastFn = null, useFewShot = true) {
    if (isProcessing) {
        console.log("[AutoProcessor] Already processing — skipping this cycle");
        return;
    }

    if (!Array.isArray(newsItems) || newsItems.length === 0) return;

    isProcessing = true;

    try {
        // Filter to unprocessed, recent items only
        const candidates = newsItems
            .filter(n => n.heading && !processedHeadlines.has(n.heading.trim()) && (!n.article_link || !processedArticleLinks.has(n.article_link)))
            .filter(n => {
                if (!n.published_time) return true;
                const ageHours = (Date.now() - n.published_time * 1000) / (1000 * 60 * 60);
                return ageHours <= MAX_AGE_HOURS;
            })
            .slice(0, MAX_PER_CYCLE);

        if (candidates.length === 0) {
            console.log("[AutoProcessor] No new articles to process this cycle");
            isProcessing = false;
            return;
        }

        console.log(`[AutoProcessor] Processing ${candidates.length} new article(s)...`);

        let savedCount = 0;

        // Process in batches of CONCURRENCY
        for (let i = 0; i < candidates.length; i += CONCURRENCY) {
            const batch = candidates.slice(i, i + CONCURRENCY);
            const results = await Promise.all(
                batch.map(item => processNewsArticle(item, useFewShot))
            );
            savedCount += results.filter(Boolean).length;

            // Rate-limit delay between batches
            if (i + CONCURRENCY < candidates.length) {
                await sleep(INTER_CALL_DELAY);
            }
        }

        if (savedCount > 0) {
            console.log(`[AutoProcessor] ✅ Cycle complete: ${savedCount} event(s) saved`);

            // Broadcast refreshed events list to all connected clients
            if (broadcastFn) {
                try {
                    const updatedEvents = db.prepare(`
                        SELECT * FROM market_events ORDER BY created_at DESC LIMIT 500
                    `).all().map(r => {
                        let assets = [], keyPoints = [];
                        try { assets    = JSON.parse(r.affected_assets); } catch {}
                        try { keyPoints = JSON.parse(r.key_data_points);  } catch {}
                        return {
                            ...r,
                            created_at:      r.created_at?.includes('Z') ? r.created_at : (r.created_at?.replace(' ', 'T') + 'Z'),
                            affected_assets:  assets,
                            key_data_points:  keyPoints
                        };
                    });
                    broadcastFn("events:updated", updatedEvents);
                    console.log("[AutoProcessor] 📡 Broadcasted events:updated to all clients");
                } catch (broadcastErr) {
                    console.error("[AutoProcessor] Broadcast error:", broadcastErr.message);
                }
            }
        }

    } finally {
        isProcessing = false;
    }
}

/**
 * Initializes the auto-processor: sets up DB column and loads processed link cache.
 */
export function initNewsAutoProcessor() {
    ensureSourceUrlColumn();
    ensureHashtagsColumn();
    loadProcessedLinks();
    console.log("✅ News Auto-Processor initialized");
}
