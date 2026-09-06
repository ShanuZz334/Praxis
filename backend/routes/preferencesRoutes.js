import express from "express";
import db from "../config/localDb.js";

const router = express.Router();

const upsertPref = db.prepare(`
    INSERT INTO user_preferences (pref_key, pref_value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(pref_key) DO UPDATE SET pref_value = excluded.pref_value, updated_at = CURRENT_TIMESTAMP
`);

const getAllPrefs = db.prepare(`SELECT pref_key, pref_value, updated_at FROM user_preferences`);
const getPref    = db.prepare(`SELECT pref_value, updated_at FROM user_preferences WHERE pref_key = ?`);
const deletePref = db.prepare(`DELETE FROM user_preferences WHERE pref_key = ?`);

const upsertPageState = db.prepare(`
    INSERT INTO page_state (page_name, state_json, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(page_name) DO UPDATE SET state_json = excluded.state_json, updated_at = CURRENT_TIMESTAMP
`);
const getAllPageStates = db.prepare(`SELECT page_name, state_json, updated_at FROM page_state`);
const getPageState    = db.prepare(`SELECT state_json, updated_at FROM page_state WHERE page_name = ?`);

// GET /api/v1/preferences — all preferences as flat key-value map
router.get("/", (req, res) => {
    try {
        const rows = getAllPrefs.all();
        const data = {};
        for (const row of rows) { data[row.pref_key] = row.pref_value; }
        res.json({ status: "success", data });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch preferences" });
    }
});

// POST /api/v1/preferences — upsert single pref
router.post("/", (req, res) => {
    try {
        const { pref_key, pref_value } = req.body;
        if (!pref_key) return res.status(400).json({ error: "pref_key is required" });
        const serialized = (pref_value === null || pref_value === undefined) ? null : (typeof pref_value === "string" ? pref_value : JSON.stringify(pref_value));
        upsertPref.run(pref_key, serialized);
        res.json({ status: "success" });
    } catch (err) {
        res.status(500).json({ error: "Failed to save preference" });
    }
});

// POST /api/v1/preferences/batch — upsert many prefs at once
router.post("/batch", (req, res) => {
    try {
        const { preferences } = req.body;
        if (!Array.isArray(preferences) || preferences.length === 0) return res.status(400).json({ error: "preferences array is required" });
        const batch = db.transaction((items) => {
            for (const item of items) {
                const serialized = (item.pref_value === null || item.pref_value === undefined) ? null : (typeof item.pref_value === "string" ? item.pref_value : JSON.stringify(item.pref_value));
                upsertPref.run(item.pref_key, serialized);
            }
        });
        batch(preferences);
        res.json({ status: "success", message: `${preferences.length} preferences saved` });
    } catch (err) {
        res.status(500).json({ error: "Failed to batch save preferences" });
    }
});

// DELETE /api/v1/preferences/:key
router.delete("/:key", (req, res) => {
    try {
        deletePref.run(req.params.key);
        res.json({ status: "success" });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete preference" });
    }
});

// GET /api/v1/preferences/page-state — all page states
router.get("/page-state", (req, res) => {
    try {
        const rows = getAllPageStates.all();
        const data = {};
        for (const row of rows) {
            try { data[row.page_name] = JSON.parse(row.state_json); } catch { data[row.page_name] = row.state_json; }
        }
        res.json({ status: "success", data });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch page states" });
    }
});

// POST /api/v1/preferences/page-state — upsert page state
router.post("/page-state", (req, res) => {
    try {
        const { page_name, state } = req.body;
        if (!page_name) return res.status(400).json({ error: "page_name is required" });
        upsertPageState.run(page_name, JSON.stringify(state));
        res.json({ status: "success" });
    } catch (err) {
        res.status(500).json({ error: "Failed to save page state" });
    }
});

// GET /api/v1/preferences/page-state/:page_name — get a specific page's state
router.get("/page-state/:page_name", (req, res) => {
    try {
        const row = getPageState.get(req.params.page_name);
        if (!row) return res.json({ status: "success", data: null });
        let parsed = row.state_json;
        try { parsed = JSON.parse(row.state_json); } catch {}
        res.json({ status: "success", data: parsed, updated_at: row.updated_at });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch page state" });
    }
});

// ─── Drawings CRUD ─────────────────────────────────────────────────────────

const upsertDrawings = db.prepare(`
    INSERT INTO chart_drawings (instrument_key, timeframe, drawings_json, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(instrument_key, timeframe) DO UPDATE SET
        drawings_json = excluded.drawings_json,
        updated_at = CURRENT_TIMESTAMP
`);
const getDrawings = db.prepare(`
    SELECT drawings_json, updated_at
    FROM chart_drawings
    WHERE instrument_key = ? AND timeframe = ?
`);
const deleteDrawings = db.prepare(`
    DELETE FROM chart_drawings WHERE instrument_key = ? AND timeframe = ?
`);

// GET /api/v1/preferences/drawings?instrument_key=X&timeframe=Y
router.get("/drawings", (req, res) => {
    try {
        const { instrument_key, timeframe } = req.query;
        if (!instrument_key || !timeframe) {
            return res.status(400).json({ error: "instrument_key and timeframe are required" });
        }
        const row = getDrawings.get(instrument_key, timeframe);
        if (!row) return res.json({ status: "success", data: [], updated_at: null });
        let drawings = [];
        try { drawings = JSON.parse(row.drawings_json); } catch {}
        res.json({ status: "success", data: drawings, updated_at: row.updated_at });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch drawings" });
    }
});

// POST /api/v1/preferences/drawings
router.post("/drawings", (req, res) => {
    try {
        const { instrument_key, timeframe, drawings } = req.body;
        if (!instrument_key || !timeframe) {
            return res.status(400).json({ error: "instrument_key and timeframe are required" });
        }
        upsertDrawings.run(instrument_key, timeframe, JSON.stringify(drawings ?? []));
        res.json({ status: "success" });
    } catch (err) {
        res.status(500).json({ error: "Failed to save drawings" });
    }
});

// DELETE /api/v1/preferences/drawings?instrument_key=X&timeframe=Y
router.delete("/drawings", (req, res) => {
    try {
        const { instrument_key, timeframe } = req.query;
        if (!instrument_key || !timeframe) {
            return res.status(400).json({ error: "instrument_key and timeframe are required" });
        }
        deleteDrawings.run(instrument_key, timeframe);
        res.json({ status: "success" });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete drawings" });
    }
});

// ─── Settings Alias (PATCH) ─────────────────────────────────────────────────
// PATCH /api/v1/preferences/settings — upsert many prefs (convenience alias for SettingsPage)
router.patch("/settings", (req, res) => {
    try {
        const { preferences } = req.body;
        if (!Array.isArray(preferences) || preferences.length === 0) {
            return res.status(400).json({ error: "preferences array is required" });
        }
        const batch = db.transaction((items) => {
            for (const item of items) {
                const serialized = (item.pref_value === null || item.pref_value === undefined)
                    ? null
                    : (typeof item.pref_value === "string" ? item.pref_value : JSON.stringify(item.pref_value));
                upsertPref.run(item.pref_key, serialized);
            }
        });
        batch(preferences);
        res.json({ status: "success", message: `${preferences.length} settings saved` });
    } catch (err) {
        res.status(500).json({ error: "Failed to save settings" });
    }
});

export default router;
