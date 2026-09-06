/**
 * @file overridesRoutes.js
 * @desc Backend API for user manual overrides.
 * Replaces the browser localStorage keys: praxis_manual_overrides_*, praxis_manual_last_updated_*
 * All override values are stored in SQLite `user_overrides` table.
 */
import express from "express";
import db from "../config/localDb.js";

const router = express.Router();

const upsertStmt = db.prepare(`
    INSERT INTO user_overrides (module_key, instrument_key, field_key, value, source, updated_at)
    VALUES (?, ?, ?, ?, 'manual', CURRENT_TIMESTAMP)
    ON CONFLICT(module_key, instrument_key, field_key)
    DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
`);

const getByModuleAndInstrument = db.prepare(`
    SELECT field_key, value, updated_at 
    FROM user_overrides 
    WHERE module_key = ? AND instrument_key = ?
`);

const getAll = db.prepare(`
    SELECT module_key, instrument_key, field_key, value, updated_at 
    FROM user_overrides
`);

const deleteStmt = db.prepare(`
    DELETE FROM user_overrides 
    WHERE module_key = ? AND instrument_key = ? AND field_key = ?
`);

const deleteByModuleAndInstrument = db.prepare(`
    DELETE FROM user_overrides 
    WHERE module_key = ? AND instrument_key = ?
`);

router.get("/", (req, res) => {
    try {
        const rows = getAll.all();
        const grouped = {};
        for (const row of rows) {
            if (!grouped[row.module_key]) grouped[row.module_key] = {};
            if (!grouped[row.module_key][row.instrument_key]) grouped[row.module_key][row.instrument_key] = {};
            grouped[row.module_key][row.instrument_key][row.field_key] = { value: row.value, updated_at: row.updated_at };
        }
        res.json({ status: "success", data: grouped });
    } catch (err) {
        console.error("GET /overrides error:", err.message);
        res.status(500).json({ error: "Failed to fetch overrides" });
    }
});

router.get("/:module/:instrumentKey", (req, res) => {
    try {
        const { module: moduleKey, instrumentKey } = req.params;
        const rows = getByModuleAndInstrument.all(moduleKey, instrumentKey);
        const result = {};
        for (const row of rows) { result[row.field_key] = { value: row.value, updated_at: row.updated_at }; }
        res.json({ status: "success", data: result });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch overrides" });
    }
});

router.post("/", (req, res) => {
    try {
        const { module_key, instrument_key, field_key, value } = req.body;
        if (!module_key || !instrument_key || !field_key) return res.status(400).json({ error: "module_key, instrument_key, and field_key are required" });
        const serialized = (value === null || value === undefined) ? null : String(value);
        upsertStmt.run(module_key, instrument_key, field_key, serialized);
        res.json({ status: "success", message: "Override saved" });
    } catch (err) {
        res.status(500).json({ error: "Failed to save override" });
    }
});

router.post("/batch", (req, res) => {
    try {
        const { overrides } = req.body;
        if (!Array.isArray(overrides) || overrides.length === 0) return res.status(400).json({ error: "overrides array is required" });
        const batchUpsert = db.transaction((items) => {
            for (const item of items) {
                const serialized = (item.value === null || item.value === undefined) ? null : String(item.value);
                upsertStmt.run(item.module_key, item.instrument_key, item.field_key, serialized);
            }
        });
        batchUpsert(overrides);
        res.json({ status: "success", message: ` overrides saved` });
    } catch (err) {
        res.status(500).json({ error: "Failed to batch save overrides" });
    }
});

router.delete("/:module/:instrumentKey/:fieldKey", (req, res) => {
    try {
        const { module: moduleKey, instrumentKey, fieldKey } = req.params;
        deleteStmt.run(moduleKey, instrumentKey, fieldKey);
        res.json({ status: "success", message: "Override cleared" });
    } catch (err) {
        res.status(500).json({ error: "Failed to clear override" });
    }
});

router.delete("/:module/:instrumentKey", (req, res) => {
    try {
        const { module: moduleKey, instrumentKey } = req.params;
        const result = deleteByModuleAndInstrument.run(moduleKey, instrumentKey);
        res.json({ status: "success", message: ` overrides cleared` });
    } catch (err) {
        res.status(500).json({ error: "Failed to clear overrides" });
    }
});

export default router;
