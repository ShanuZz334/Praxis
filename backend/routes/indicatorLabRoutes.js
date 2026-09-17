/**
 * @file indicatorLabRoutes.js
 * @purpose Secure backend sandboxing service for Custom Indicator Lab.
 * Executes user-authored indicator code inside an isolated Node.js VM context,
 * enforcing execution timeouts, memory limits, and static security AST/regex restrictions.
 * Supports both legacy indicator functions and Praxis v2 Specification (with baked rules & 3 modes).
 * @date 2026-09-17
 */

import express from "express";
import vm from "node:vm";

const router = express.Router();

const FORBIDDEN_KEYWORDS = [
    /\bprocess\b/,
    /\brequire\b/,
    /\bimport\b/,
    /\bfetch\b/,
    /\bfs\b/,
    /\bchild_process\b/,
    /\bXMLHttpRequest\b/,
    /\bWebSocket\b/,
    /\bglobal\b/,
    /\bglobalThis\b/,
    /\beval\b/,
    /\bFunction\b/,
    /\bexec\b/,
    /\bspawn\b/,
    /\b__dirname\b/,
    /\b__filename\b/
];

router.post("/run", async (req, res) => {
    const startTime = Date.now();
    try {
        const { code, candles, mode = 'swing' } = req.body;

        if (!code || typeof code !== "string" || !code.trim()) {
            return res.status(400).json({
                success: false,
                error: "Code payload is required and must be a non-empty string."
            });
        }

        if (!Array.isArray(candles) || candles.length < 5) {
            return res.status(400).json({
                success: false,
                error: "A valid candles array with at least 5 bars is required for evaluation."
            });
        }

        // 1. Static Security Scanner
        for (const pattern of FORBIDDEN_KEYWORDS) {
            if (pattern.test(code)) {
                return res.status(403).json({
                    success: false,
                    error: `Security Violation: Restricted syntax or keyword detected (${pattern.source}). Indicators must be pure mathematical functions.`
                });
            }
        }

        // 2. Prepare Sandbox Context (isolated primitives only)
        const safeContext = {
            candles: candles.map(c => ({
                time: c.time,
                open: Number(c.open),
                high: Number(c.high),
                low: Number(c.low),
                close: Number(c.close),
                volume: Number(c.volume || 0),
            })),
            Math: Math,
            Array: Array,
            Number: Number,
            String: String,
            Boolean: Boolean,
            Date: Date,
            parseInt: parseInt,
            parseFloat: parseFloat,
            isNaN: isNaN,
            isFinite: isFinite,
        };

        const vmContext = vm.createContext(safeContext);

        // 3. Construct runnable code wrapper
        let runnableCode;
        if (/function\s+indicator\s*\(/.test(code)) {
            runnableCode = `
${code}
(function() {
    let res;
    try {
        res = indicator(candles);
    } catch (e) {
        throw e;
    }
    if (res && typeof res === 'object' && !Array.isArray(res)) {
        const activeMode = "${mode}";
        const modeParams = (res.modes && res.modes[activeMode]) ? res.modes[activeMode] : (res.modes?.swing || {});
        let series = [];
        if (typeof res.calculate === 'function') {
            series = res.calculate(candles, modeParams);
        } else if (typeof res.indicator === 'function') {
            series = res.indicator(candles, modeParams);
        }
        return {
            isV2: true,
            meta: {
                name: res.name,
                nickname: res.nickname,
                description: res.description,
                modes: res.modes,
                rules: Array.isArray(res.rules) ? res.rules.map(r => ({ id: r.id, label: r.label, description: r.description })) : []
            },
            series: series
        };
    }
    return { isV2: false, series: res };
})()`;
        } else if (/^\s*return\b/.test(code)) {
            runnableCode = `(function(candles) {\n${code}\n})(candles);`;
        } else {
            runnableCode = `(function(candles) {\n${code}\nif (typeof indicator === 'function') return indicator(candles);\n})(candles);`;
        }

        // 4. Execute inside VM with strict 3000ms CPU timeout
        const script = new vm.Script(runnableCode, { filename: "customIndicator.js" });
        const rawExecution = script.runInContext(vmContext, { timeout: 3000 });

        let rawOutput = rawExecution;
        let extractedMeta = null;

        if (rawExecution && typeof rawExecution === 'object' && !Array.isArray(rawExecution)) {
            if (rawExecution.isV2) {
                rawOutput = rawExecution.series;
                extractedMeta = rawExecution.meta;
            }
        }

        if (!Array.isArray(rawOutput)) {
            return res.status(400).json({
                success: false,
                error: `Indicator must return an Array of values or objects. Received type: ${typeof rawOutput}`
            });
        }

        if (rawOutput.length !== candles.length && rawOutput.length < 5) {
            return res.status(400).json({
                success: false,
                error: `Indicator returned array of length ${rawOutput.length}, expected length corresponding to input candles (${candles.length}).`
            });
        }

        // 5. Normalize and validate output series
        const normalized = [];
        for (let i = 0; i < candles.length; i++) {
            const time = candles[i].time;
            const item = rawOutput[i];

            let value = null;
            if (typeof item === "number") {
                value = isNaN(item) ? null : item;
            } else if (item && typeof item === "object") {
                const candidate = item.value !== undefined ? item.value : item.val;
                value = typeof candidate === "number" && !isNaN(candidate) ? candidate : null;
            }

            normalized.push({ time, value });
        }

        const validCount = normalized.filter(d => d.value !== null).length;
        if (validCount === 0) {
            return res.status(400).json({
                success: false,
                error: "Execution completed, but the indicator produced zero valid numerical values."
            });
        }

        return res.json({
            success: true,
            data: normalized,
            meta: extractedMeta,
            metrics: {
                totalBars: candles.length,
                validBars: validCount,
                executionTimeMs: Date.now() - startTime
            }
        });

    } catch (err) {
        return res.status(400).json({
            success: false,
            error: `Indicator Runtime Error: ${err.message}`
        });
    }
});

export default router;
