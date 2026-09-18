/**
 * @file overridesRoutes.js
 * @desc Backend API for user manual overrides.
 * Replaces the browser localStorage keys: praxis_manual_overrides_*, praxis_manual_last_updated_*
 * All override values are stored in SQLite `user_overrides` table.
 */
import express from "express";
import db from "../config/localDb.js";

const router = express.Router();

const normalizeModuleKey = (k) => {
    if (k === 'v2' || k === 'fundamental') return 'fundamentals';
    if (k === 'technicals') return 'technical';
    return k;
};

const getUserId = (req) => {
    if (req.user?._id) return String(req.user._id);
    if (req.headers['x-user-id']) return String(req.headers['x-user-id']);
    return 'default_user';
};

const upsertStmt = db.prepare(`
    INSERT INTO user_overrides (user_id, module_key, instrument_key, field_key, value, source, updated_at)
    VALUES (?, ?, ?, ?, ?, 'manual', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    ON CONFLICT(module_key, instrument_key, field_key)
    DO UPDATE SET value = excluded.value, user_id = excluded.user_id, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
`);

const getByModuleAndInstrument = db.prepare(`
    SELECT field_key, value, updated_at 
    FROM user_overrides 
    WHERE module_key = ? AND instrument_key = ? AND (user_id = ? OR user_id = 'default_user')
    ORDER BY CASE WHEN user_id = ? THEN 0 ELSE 1 END
`);

const getAll = db.prepare(`
    SELECT module_key, instrument_key, field_key, value, updated_at 
    FROM user_overrides
    WHERE user_id = ? OR user_id = 'default_user'
    ORDER BY CASE WHEN user_id = ? THEN 0 ELSE 1 END
`);

const deleteStmt = db.prepare(`
    DELETE FROM user_overrides 
    WHERE module_key = ? AND instrument_key = ? AND field_key = ? AND (user_id = ? OR user_id = 'default_user')
`);

const deleteByModuleAndInstrument = db.prepare(`
    DELETE FROM user_overrides 
    WHERE module_key = ? AND instrument_key = ? AND (user_id = ? OR user_id = 'default_user')
`);

router.get("/", (req, res) => {
    try {
        const userId = getUserId(req);
        const rows = getAll.all(userId, userId);
        const grouped = {};
        for (const row of rows) {
            const modKey = normalizeModuleKey(row.module_key);
            if (!grouped[modKey]) grouped[modKey] = {};
            if (!grouped[modKey][row.instrument_key]) grouped[modKey][row.instrument_key] = {};
            // User-specific rows take precedence over default_user due to ordering
            if (!grouped[modKey][row.instrument_key][row.field_key]) {
                grouped[modKey][row.instrument_key][row.field_key] = { value: row.value, updated_at: row.updated_at };
            }
        }
        res.json({ status: "success", data: grouped });
    } catch (err) {
        console.error("GET /overrides error:", err.message);
        res.status(500).json({ error: "Failed to fetch overrides" });
    }
});

router.get("/:module/:instrumentKey", (req, res) => {
    try {
        const userId = getUserId(req);
        const moduleKey = normalizeModuleKey(req.params.module);
        const { instrumentKey } = req.params;
        let rows = getByModuleAndInstrument.all(moduleKey, instrumentKey, userId, userId);
        // Fallback for legacy database rows saved under old key
        if (rows.length === 0 && req.params.module !== moduleKey) {
            rows = getByModuleAndInstrument.all(req.params.module, instrumentKey, userId, userId);
        }
        const result = {};
        for (const row of rows) {
            if (!result[row.field_key]) {
                result[row.field_key] = { value: row.value, updated_at: row.updated_at };
            }
        }
        res.json({ status: "success", data: result });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch overrides" });
    }
});

router.post("/", (req, res) => {
    try {
        const userId = getUserId(req);
        let { module_key, instrument_key, field_key, value } = req.body;
        if (!module_key || !instrument_key || !field_key) return res.status(400).json({ error: "module_key, instrument_key, and field_key are required" });
        module_key = normalizeModuleKey(module_key);
        if (value === null || value === undefined || value === '') {
            deleteStmt.run(module_key, instrument_key, field_key, userId);
            return res.json({ status: "success", message: "Override cleared" });
        }
        const serialized = String(value);
        upsertStmt.run(userId, module_key, instrument_key, field_key, serialized);
        res.json({ status: "success", message: "Override saved" });
    } catch (err) {
        res.status(500).json({ error: "Failed to save override" });
    }
});

router.post("/batch", (req, res) => {
    try {
        const userId = getUserId(req);
        const { overrides } = req.body;
        if (!Array.isArray(overrides) || overrides.length === 0) return res.status(400).json({ error: "overrides array is required" });
        const batchUpsert = db.transaction((items) => {
            for (const item of items) {
                const modKey = normalizeModuleKey(item.module_key);
                if (item.value === null || item.value === undefined || item.value === '') {
                    deleteStmt.run(modKey, item.instrument_key, item.field_key, userId);
                } else {
                    const serialized = String(item.value);
                    upsertStmt.run(userId, modKey, item.instrument_key, item.field_key, serialized);
                }
            }
        });
        batchUpsert(overrides);
        res.json({ status: "success", message: `${overrides.length} overrides processed` });
    } catch (err) {
        res.status(500).json({ error: "Failed to batch save overrides" });
    }
});

router.delete("/:module/:instrumentKey/:fieldKey", (req, res) => {
    try {
        const userId = getUserId(req);
        const moduleKey = normalizeModuleKey(req.params.module);
        const { instrumentKey, fieldKey } = req.params;
        deleteStmt.run(moduleKey, instrumentKey, fieldKey, userId);
        if (req.params.module !== moduleKey) {
            deleteStmt.run(req.params.module, instrumentKey, fieldKey, userId);
        }
        res.json({ status: "success", message: "Override cleared" });
    } catch (err) {
        res.status(500).json({ error: "Failed to clear override" });
    }
});

router.delete("/:module/:instrumentKey", (req, res) => {
    try {
        const userId = getUserId(req);
        const moduleKey = normalizeModuleKey(req.params.module);
        const { instrumentKey } = req.params;
        deleteByModuleAndInstrument.run(moduleKey, instrumentKey, userId);
        if (req.params.module !== moduleKey) {
            deleteByModuleAndInstrument.run(req.params.module, instrumentKey, userId);
        }
        res.json({ status: "success", message: "All overrides for instrument cleared" });
    } catch (err) {
        res.status(500).json({ error: "Failed to clear overrides" });
    }
});

export default router;
