import { CARD_REGISTRY } from './src/shared/config/cardRegistry.js';
import { FundamentalEngine } from './src/features/dashboard/fundamentals/engine/headlessFundamentalParser.js';
import { TechnicalEngine } from './src/features/dashboard/technical/engine/headlessTechnicalParser.js';

// Build a mock live registry
const mockRegistry = {
    fundamentals: {},
    technical: {},
    options: {},
    foreign: {},
    master: {}
};

function registerBulk(pageId, cardsArray) {
    if (!mockRegistry[pageId]) mockRegistry[pageId] = {};
    cardsArray.forEach(c => {
        mockRegistry[pageId][c.id] = c;
    });
}

// 1. Run Fundamental Engine
const fEngine = new FundamentalEngine();
fEngine.callbacks = { registerBulk };
fEngine.parse(null);
fEngine.register();

// 2. Run Technical Engine
const tEngine = new TechnicalEngine();
tEngine.callbacks = { registerBulk };
tEngine.parse(null, null);
tEngine.register();

let totalCards = 0;
let registeredCount = 0;
let liveCount = 0;
let missingCount = 0;
let duplicateCount = 0;

const seenIds = new Set();
const duplicateIds = new Set();
const liveKeys = new Set();

Object.values(mockRegistry).forEach(page => {
    Object.values(page).forEach(c => {
        if (seenIds.has(c.id)) duplicateIds.add(c.id);
        seenIds.add(c.id);
        liveKeys.add(c.id);
        if (c.hasLiveData) liveCount++;
        else missingCount++;
    });
});

registeredCount = liveKeys.size;
duplicateCount = duplicateIds.size;

Object.values(CARD_REGISTRY).forEach(c => {
    if (c.appliesTo !== 'n/a' && c.type !== 'widget') totalCards++; // exclude widgets from total for now
});

const coverage = ((registeredCount / totalCards) * 100).toFixed(2);

console.log("=== REGISTRY VERIFICATION SUMMARY ===");
console.log(`Total Cards (applicable): ${totalCards}`);
console.log(`Registered: ${registeredCount}`);
console.log(`Live: ${liveCount}`);
console.log(`Missing (Explicitly Flagged): ${missingCount}`);
console.log(`Duplicates: ${duplicateCount}`);
console.log(`Coverage: ${coverage}%`);

console.log("\\nDetails:");
Object.values(CARD_REGISTRY).forEach(def => {
    if (def.appliesTo === 'n/a' || def.type === 'widget') return;
    if (!liveKeys.has(def.id)) {
        console.log(`[UNREGISTERED] ${def.id} (${def.page})`);
    } else {
        let found = null;
        Object.values(mockRegistry).forEach(p => {
            if (p[def.id]) found = p[def.id];
        });
        if (found) {
            console.log(`[REGISTERED] ${def.id} -> hasLiveData: ${found.hasLiveData}, status: ${found.status || 'undefined'}, appliesTo: ${found.appliesTo}`);
        }
    }
});
