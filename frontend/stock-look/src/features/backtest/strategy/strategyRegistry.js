/**
 * @file strategyRegistry.js
 * @purpose Local storage persistence registry for multi-factor trading strategies.
 * Manages strategy templates, draft rule configurations, and TOTP-promoted live chart strategies.
 * @date 2026-09-17
 */

const STORAGE_KEY = 'praxis_strategies';
const STRATEGY_EVENT_NAME = 'praxis_strategies_changed';

function notifyStrategyChange() {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        try {
            window.dispatchEvent(new CustomEvent(STRATEGY_EVENT_NAME));
        } catch (e) {
            // ignore
        }
    }
}

/**
 * Retrieve all strategies from localStorage.
 * @returns {Array} List of strategy objects
 */
export function getStrategies() {
    try {
        if (typeof localStorage === 'undefined') return [];
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error('[strategyRegistry] Failed to read strategies', e);
        return [];
    }
}

/**
 * Save or update a strategy in localStorage.
 * @param {Object} strategy 
 * @returns {Array} Updated strategy list
 */
export function saveStrategy(strategy) {
    try {
        const existing = getStrategies();
        const existingIndex = existing.findIndex(s => s.id === strategy.id);
        const id = strategy.id || (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? `strat_${crypto.randomUUID()}`
            : `strat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

        const updatedObj = {
            ...strategy,
            id,
            updatedAt: Date.now(),
            createdAt: strategy.createdAt || Date.now(),
        };

        let newList;
        if (existingIndex >= 0) {
            // Preserve index position when auto-saving or updating existing strategy
            newList = [...existing];
            newList[existingIndex] = updatedObj;
        } else {
            newList = [updatedObj, ...existing];
        }

        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
        }
        notifyStrategyChange();
        return newList;
    } catch (e) {
        console.error('[strategyRegistry] Failed to save strategy', e);
        return getStrategies();
    }
}

/**
 * Delete a strategy permanently.
 * @param {string} id 
 * @returns {Array} Updated strategy list
 */
export function deleteStrategy(id) {
    try {
        const existing = getStrategies();
        const filtered = existing.filter(s => s.id !== id);
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        }
        notifyStrategyChange();
        return filtered;
    } catch (e) {
        console.error('[strategyRegistry] Failed to delete strategy', e);
        return getStrategies();
    }
}

/**
 * TOTP Approval: Promote strategy to live chart with active status.
 * @param {string} id 
 * @returns {Object|null} Promoted strategy object
 */
export function promoteStrategy(id) {
    try {
        const existing = getStrategies();
        let target = null;
        const updated = existing.map(item => {
            if (item.id === id) {
                target = {
                    ...item,
                    promoted: true,
                    promotedAt: Date.now(),
                };
                return target;
            }
            return item;
        });

        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        }
        notifyStrategyChange();
        return target;
    } catch (e) {
        console.error('[strategyRegistry] Failed to promote strategy', e);
        return null;
    }
}

/**
 * Exports a strategy into a portable, versioned Praxis JSON package.
 * @param {Object|string} strategyOrId 
 * @returns {Object} Export package object
 */
export function exportStrategy(strategyOrId) {
    let target = null;
    if (typeof strategyOrId === 'string') {
        target = getStrategies().find(s => s.id === strategyOrId);
    } else if (strategyOrId && typeof strategyOrId === 'object') {
        target = strategyOrId;
    }

    if (!target) {
        throw new Error('Strategy not found or invalid strategy payload for export.');
    }

    return {
        schema: 'praxis_strategy_blueprint',
        version: '2.0',
        exportedAt: new Date().toISOString(),
        strategy: {
            name: target.name || 'Unnamed Strategy',
            nickname: target.nickname || 'STRAT',
            description: target.description || '',
            mode: target.mode || 'swing',
            entryDirection: target.entryDirection || 'LONG',
            volatileTimer: target.volatileTimer || 5,
            rules: Array.isArray(target.rules) ? target.rules : [],
            exitRule: target.exitRule || {
                type: 'TARGET_STOP',
                targetPct: 2.5,
                stopPct: 1.25,
                horizonBars: 14,
            },
            instrument: target.instrument || 'NSE_INDEX|Nifty 50',
            timeframe: target.timeframe || 'day',
        }
    };
}

/**
 * Imports a strategy from a JSON string or object payload into local storage.
 * @param {string|Object} payload 
 * @returns {Object} The imported strategy object saved to registry
 */
export function importStrategy(payload) {
    let parsed = payload;
    if (typeof payload === 'string') {
        try {
            parsed = JSON.parse(payload);
        } catch (e) {
            throw new Error(`Invalid JSON syntax in imported strategy: ${e.message}`);
        }
    }

    if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid strategy package: Expected an object.');
    }

    // Extract core strategy definition if wrapped in blueprint envelope
    const rawStrat = parsed.strategy ? parsed.strategy : parsed;

    if (!rawStrat.name || typeof rawStrat.name !== 'string') {
        throw new Error('Invalid strategy package: Missing required "name" property.');
    }

    if (!Array.isArray(rawStrat.rules)) {
        throw new Error('Invalid strategy package: "rules" must be an array.');
    }

    const importedStrategy = {
        id: (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
            ? `strat_imp_${crypto.randomUUID()}`
            : `strat_imp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name: rawStrat.name.trim(),
        nickname: (rawStrat.nickname || 'STRAT').toUpperCase().trim().slice(0, 6),
        description: rawStrat.description || '',
        mode: ['intraday', 'swing', 'positional'].includes(rawStrat.mode) ? rawStrat.mode : 'swing',
        entryDirection: rawStrat.entryDirection === 'SHORT' ? 'SHORT' : 'LONG',
        volatileTimer: Number(rawStrat.volatileTimer) || 5,
        rules: rawStrat.rules.map((r, idx) => ({
            id: (r.id && typeof r.id === 'string' && r.id.trim())
                ? r.id
                : ((typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
                    ? `rule_${crypto.randomUUID()}`
                    : `rule_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 5)}`),
            indicatorId: r.indicatorId,
            indicatorLabel: r.indicatorLabel || r.indicatorId,
            conditionId: r.conditionId,
            threshold: r.threshold != null ? Number(r.threshold) : 0,
            customThreshold: r.customThreshold != null ? Number(r.customThreshold) : 0,
            params: r.params || {},
            logic: r.logic || 'AND',
        })),
        exitRule: rawStrat.exitRule || {
            type: 'TARGET_STOP',
            targetPct: 2.5,
            stopPct: 1.25,
            horizonBars: 14,
        },
        instrument: rawStrat.instrument || 'NSE_INDEX|Nifty 50',
        timeframe: rawStrat.timeframe || 'day',
        promoted: false,
        importedAt: Date.now(),
    };

    saveStrategy(importedStrategy);
    return importedStrategy;
}

/**
 * Triggers a browser file download of the strategy blueprint in .json format.
 * @param {Object} strategy 
 */
export function downloadStrategyJson(strategy) {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const exportPackage = exportStrategy(strategy);
    const jsonStr = JSON.stringify(exportPackage, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const filename = `${(strategy.nickname || strategy.name || 'strategy').toLowerCase().replace(/[^a-z0-9]/g, '_')}_blueprint.json`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Copies the strategy blueprint JSON string to the user's clipboard.
 * @param {Object} strategy 
 * @returns {Promise<boolean>}
 */
export async function copyStrategyToClipboard(strategy) {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
        throw new Error('Clipboard API not supported in this environment.');
    }
    const exportPackage = exportStrategy(strategy);
    await navigator.clipboard.writeText(JSON.stringify(exportPackage, null, 2));
    return true;
}

/**
 * Subscribe to strategy registry updates.
 * @param {Function} callback 
 * @returns {Function} Unsubscribe function
 */
export function subscribeToStrategies(callback) {
    if (typeof window === 'undefined') return () => {};
    const handler = () => callback(getStrategies());
    window.addEventListener(STRATEGY_EVENT_NAME, handler);
    return () => window.removeEventListener(STRATEGY_EVENT_NAME, handler);
}
