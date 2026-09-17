/**
 * @file testableUnitsRegistry.js
 * @purpose Centralized dynamic registry and persistence layer for testable units in the Praxis Backtesting Workshop.
 * Eliminates hardcoded unit arrays, manages dynamic built-in & custom lab units in localStorage,
 * provides automatic cascade detachment when indicators are deleted anywhere in the app,
 * and supports 1-click import/export of self-contained detachable structs.
 * @date 2026-09-17
 */

import { 
    getCustomIndicators, 
    deleteCustomIndicator, 
    saveCustomIndicator 
} from '../lab/customIndicatorRegistry.js';

export const STORAGE_KEY = 'praxis_testable_units';
export const EVENT_NAME = 'praxis_testable_units_changed';
const CUSTOM_IND_EVENT_NAME = 'praxis_custom_indicators_changed';
const STRATEGY_STORAGE_KEY = 'praxis_strategies';

/**
 * The 8 standard built-in engines available out of the box.
 */
export const DEFAULT_BUILTIN_UNITS = [
    { 
        id: 'PREDICTOR', 
        label: '7-Candle Predictor', 
        nickname: '7CP', 
        iconName: 'Cpu', 
        desc: 'AI forecast direction & confidence calibration', 
        type: 'BUILTIN', 
        isDetachable: false 
    },
    { 
        id: 'PATTERNS', 
        label: 'Pattern Engine', 
        nickname: 'PAT', 
        iconName: 'Layers', 
        desc: '40+ candlestick & chart patterns win rate', 
        type: 'BUILTIN', 
        isDetachable: false 
    },
    { 
        id: 'COMPOSITE_SCORE', 
        label: 'Composite Score', 
        nickname: 'COMP', 
        iconName: 'Activity', 
        desc: 'Pattern sentiment threshold crossovers', 
        type: 'BUILTIN', 
        isDetachable: false 
    },
    { 
        id: 'PNCO', 
        label: 'PNCO Oscillator', 
        nickname: 'PNCO', 
        iconName: 'Zap', 
        desc: 'Cross-domain momentum & bull/bear trap filter', 
        type: 'BUILTIN', 
        isDetachable: false 
    },
    { 
        id: 'AAVB', 
        label: 'AAVB Bands', 
        nickname: 'AAVB', 
        iconName: 'TrendingUp', 
        desc: 'Macro-volatility adaptive channel bounces', 
        type: 'BUILTIN', 
        isDetachable: false 
    },
    { 
        id: 'IFDI', 
        label: 'IFDI Flow Index', 
        nickname: 'IFDI', 
        iconName: 'BarChart2', 
        desc: 'Smart money hidden accumulation & distribution', 
        type: 'BUILTIN', 
        isDetachable: false 
    },
    { 
        id: 'HEAD_TO_HEAD', 
        label: 'Head-to-Head', 
        nickname: 'H2H', 
        iconName: 'GitCompare', 
        desc: 'Confluence vs individual component benchmark', 
        type: 'BUILTIN', 
        isDetachable: false 
    },
    { 
        id: 'CUSTOM_COMBO', 
        label: 'Custom Combo', 
        nickname: 'COMBO', 
        iconName: 'Sliders', 
        desc: 'Multi-factor rule builder', 
        type: 'BUILTIN', 
        isDetachable: false 
    },
];

/**
 * Dispatches an app-wide custom event notifying subscribers that the units list has changed.
 */
function notifyChange() {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(EVENT_NAME));
    }
}

/**
 * Loads testable units from localStorage.
 * Automatically performs cascade validation against custom indicators:
 * If an indicator was deleted from Custom Lab or Strategy Builder, it is automatically
 * detached and scrubbed from the units list with zero orphan ghost entries.
 * @returns {Array} Array of valid unit objects
 */
export function getTestableUnits() {
    if (typeof localStorage === 'undefined') return [...DEFAULT_BUILTIN_UNITS];

    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        let units = raw ? JSON.parse(raw) : null;

        if (!Array.isArray(units) || units.length === 0) {
            units = [...DEFAULT_BUILTIN_UNITS];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(units));
            return units;
        }

        // Cross-reference with customIndicatorRegistry to scrub deleted indicators
        const activeCustomIndicators = getCustomIndicators();
        const customMap = new Map(activeCustomIndicators.map(ind => [ind.id, ind]));

        let hasModifications = false;
        const sanitized = [];

        for (const u of units) {
            if (u.type === 'CUSTOM_INDICATOR' || u.indicatorId) {
                const indId = u.indicatorId || u.id;
                const activeInd = customMap.get(indId);
                if (!activeInd) {
                    // Indicator was deleted from the app -> cascade purge from units grid
                    hasModifications = true;
                    continue;
                }
                // Keep unit synchronized with the latest indicator state
                sanitized.push({
                    ...u,
                    id: u.id || activeInd.id,
                    indicatorId: activeInd.id,
                    label: activeInd.name || u.label,
                    nickname: activeInd.nickname || u.nickname || 'CUST',
                    desc: activeInd.description || u.desc || '',
                    modes: activeInd.modes || u.modes,
                    rules: activeInd.rules || u.rules,
                    code: activeInd.code || u.code,
                    promoted: activeInd.promoted ?? u.promoted ?? false,
                    isDetachable: true,
                    type: 'CUSTOM_INDICATOR',
                    iconName: u.iconName || 'Sparkles',
                });
            } else if (u.type === 'STRATEGY' || u.type === 'INDICATOR') {
                // Strategy and standard indicator unit validation
                sanitized.push(u);
            } else {
                // Built-in unit
                sanitized.push(u);
            }
        }

        if (hasModifications || sanitized.length !== units.length) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
        }

        return sanitized.length > 0 ? sanitized : [...DEFAULT_BUILTIN_UNITS];
    } catch (e) {
        console.error('[testableUnitsRegistry] Failed to read testable units:', e);
        return [...DEFAULT_BUILTIN_UNITS];
    }
}

/**
 * Saves units array to localStorage and notifies all subscribers.
 * @param {Array} units 
 * @returns {Array}
 */
export function saveTestableUnits(units) {
    if (typeof localStorage === 'undefined') return units;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(units));
        notifyChange();
        return units;
    } catch (e) {
        console.error('[testableUnitsRegistry] Failed to save testable units:', e);
        return units;
    }
}

/**
 * Adds a new testable unit to the registry.
 * Can accept a custom indicator object, a strategy object, or a built-in definition.
 * @param {Object} item 
 * @returns {Array} Updated list of units
 */
export function addTestableUnit(item) {
    if (!item) return getTestableUnits();
    const current = getTestableUnits();

    let newUnit;
    if (item.type === 'BUILTIN') {
        newUnit = {
            id: item.id,
            label: item.label,
            nickname: item.nickname || item.id.slice(0, 4),
            iconName: item.iconName || 'Cpu',
            desc: item.desc || '',
            type: 'BUILTIN',
            isDetachable: false,
        };
    } else if (item.type === 'STRATEGY') {
        newUnit = {
            id: item.id || `strat_${Date.now()}`,
            label: item.name || item.label || 'Strategy Unit',
            nickname: (item.nickname || 'STRAT').toUpperCase().slice(0, 5),
            iconName: 'Sliders',
            desc: item.description || 'Compound multi-factor strategy',
            type: 'STRATEGY',
            strategyId: item.id,
            rules: item.rules || [],
            mode: item.mode || 'swing',
            isDetachable: true,
        };
    } else if (item.type === 'INDICATOR') {
        newUnit = {
            id: item.id,
            indicatorId: item.id,
            label: item.label || item.name,
            nickname: (item.nickname || item.id).toUpperCase().slice(0, 5),
            iconName: item.iconName || 'Activity',
            desc: item.desc || item.description || 'Standard Technical Indicator',
            type: 'INDICATOR',
            category: item.category || 'MOMENTUM',
            isDetachable: true,
        };
    } else {
        // Custom indicator unit
        newUnit = {
            id: item.id,
            indicatorId: item.id,
            label: item.name || item.label || 'Custom Model',
            nickname: (item.nickname || 'CUST').toUpperCase().slice(0, 5),
            iconName: 'Sparkles',
            desc: item.description || item.desc || 'Custom Lab Quantitative Model',
            type: 'CUSTOM_INDICATOR',
            isDetachable: true,
            promoted: item.promoted ?? false,
            modes: item.modes || {},
            rules: item.rules || [],
            code: item.code || '',
            createdAt: item.createdAt || Date.now(),
        };
    }

    // Deduplicate: if exists, replace; if not, append
    const filtered = current.filter(u => u.id !== newUnit.id);
    const updated = [...filtered, newUnit];
    return saveTestableUnits(updated);
}

/**
 * Removes or completely deletes a testable unit.
 * @param {string} unitId 
 * @param {Object} [options]
 * @param {boolean} [options.deleteFromApp=false] If true and unit is a custom indicator, permanently deletes code & struct across the app with strategy cascade cleanup
 * @returns {Array} Updated units list
 */
export function removeTestableUnit(unitId, { deleteFromApp = false } = {}) {
    const current = getTestableUnits();
    const targetUnit = current.find(u => u.id === unitId);

    if (deleteFromApp && targetUnit && (targetUnit.type === 'CUSTOM_INDICATOR' || targetUnit.indicatorId)) {
        // Permanently delete indicator from customIndicatorRegistry
        const targetIndId = targetUnit.indicatorId || targetUnit.id;
        deleteCustomIndicator(targetIndId);
    }

    const filtered = current.filter(u => u.id !== unitId);
    return saveTestableUnits(filtered);
}

/**
 * Resets the active testable units to factory default (the 8 built-in engines).
 * Does not delete saved custom indicator structs from the app.
 * @returns {Array}
 */
export function resetTestableUnitsToDefault() {
    return saveTestableUnits([...DEFAULT_BUILTIN_UNITS]);
}

/**
 * Exports a testable unit as a portable, standardized JSON struct file.
 * @param {Object} unit 
 */
export function exportUnitJson(unit) {
    if (!unit) return;
    const payload = {
        version: "2.0.0",
        format: "praxis_testable_unit",
        exportedAt: new Date().toISOString(),
        unit,
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
    const filename = `praxis_unit_${(unit.nickname || unit.id).toLowerCase()}_${Date.now()}.json`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

/**
 * Imports a testable unit or custom indicator from a JSON struct string.
 * Automatically saves to customIndicatorRegistry if code is provided and adds to testable units.
 * @param {string} jsonStr 
 * @returns {Object|null} The imported unit or null if failed
 */
export function importUnitFromJson(jsonStr) {
    try {
        const parsed = JSON.parse(jsonStr);
        const data = parsed.unit || parsed;
        if (!data || (!data.label && !data.name)) {
            throw new Error("Invalid unit struct: Missing label or name.");
        }

        if (data.code) {
            // Save to custom indicators first
            saveCustomIndicator({
                id: data.indicatorId || data.id,
                name: data.name || data.label,
                nickname: data.nickname,
                description: data.description || data.desc,
                code: data.code,
                modes: data.modes,
                rules: data.rules,
                promoted: data.promoted ?? false,
            });
        }

        const unitToAdd = {
            id: data.id || `unit_${Date.now()}`,
            label: data.label || data.name,
            nickname: (data.nickname || 'UNIT').toUpperCase().slice(0, 5),
            desc: data.desc || data.description || '',
            iconName: data.iconName || (data.code ? 'Sparkles' : 'Cpu'),
            type: data.type || (data.code ? 'CUSTOM_INDICATOR' : 'BUILTIN'),
            isDetachable: data.isDetachable ?? true,
            indicatorId: data.indicatorId || data.id,
            modes: data.modes,
            rules: data.rules,
            code: data.code,
        };

        addTestableUnit(unitToAdd);
        return unitToAdd;
    } catch (e) {
        console.error('[testableUnitsRegistry] Failed to import unit JSON:', e);
        throw e;
    }
}

/**
 * Subscribes to changes in testable units AND custom indicators.
 * Ensures the units grid immediately updates if any indicator is added, edited, or deleted anywhere.
 * @param {Function} callback 
 * @returns {Function} Unsubscribe cleanup function
 */
export function subscribeToTestableUnits(callback) {
    if (typeof window === 'undefined') return () => {};

    const handler = () => {
        const updated = getTestableUnits();
        callback(updated);
    };

    window.addEventListener(EVENT_NAME, handler);
    window.addEventListener(CUSTOM_IND_EVENT_NAME, handler);

    return () => {
        window.removeEventListener(EVENT_NAME, handler);
        window.removeEventListener(CUSTOM_IND_EVENT_NAME, handler);
    };
}
