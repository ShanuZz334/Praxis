const fs = require('fs');
const file = 'backend/services/backgroundIntelligenceService.js';
let content = fs.readFileSync(file, 'utf8');

const importReplacement = "import { computeGlobalComposite } from '../../frontend/stock-look/src/features/dashboard/foreign/engine/globalCompositeMath.js';\nimport { FOREIGN_WEIGHTS } from '../../frontend/stock-look/src/config/weights/foreignWeights.js';";
content = content.replace("import { computePortfolioMetrics } from '../../frontend/stock-look/src/shared/global/logic/eventsEngine.js';", "import { computePortfolioMetrics } from '../../frontend/stock-look/src/shared/global/logic/eventsEngine.js';\n" + importReplacement);

const newRunFunc = export async function runGlobalIntelligence() {
    if (!shouldRun('global')) return; // mode-aware cadence gate
    console.log('[BG Intel] Running Global Intelligence...');
    try {
        const rows = db.prepare(
            'SELECT symbol_id, value, hi_52, lo_52 FROM global_cache WHERE value IS NOT NULL'
        ).all();

        if (!rows || rows.length === 0) {
            console.warn('[BG Intel] No global_cache data found — skipping.');
            return;
        }

        const SCORE_MAP = {
            dxy: scoreDXY, usd_inr: scoreUSDINR, crude: scoreCrude, gold: scoreGold, silver: scoreSilver,
            us_10y_yield: scoreUS10Y, sp_futures: scoreSPFutures, nasdaq_futures: scoreNasdaqFutures, dow_futures: scoreDowFutures,
            vix: scoreVIX, bitcoin: scoreBitcoin, eurusd: scoreEurusd, usdjpy: scoreUsdjpy, nikkei: scoreNikkei,
            ftse: scoreFtse, dax: scoreDax, hangseng: scoreHangseng, shanghai: scoreShanghai, cac40: scoreCac40,
            eurostoxx: scoreEurostoxx, copper: scoreCopper, natgas: scoreNatgas, wheat: scoreWheat, aluminum: scoreAluminum, move: scoreMove
        };

        const globalScores = {};
        for (const row of rows) {
            const scorer = SCORE_MAP[row.symbol_id];
            if (scorer) {
                const res = scorer(row.value, { hi52: row.hi_52, lo52: row.lo_52 });
                if (res && res.score != null) {
                    globalScores[row.symbol_id] = { score: res.score };
                }
            }
        }

        if (Object.keys(globalScores).length === 0) return;

        const result = computeGlobalComposite(globalScores, FOREIGN_WEIGHTS);
        if (!result || result.compositeScore == null) return;

        upsertHeader.run(
            'GLOBAL', 'global',
            result.compositeScore,
            JSON.stringify({ label: result.regime?.label || 'Neutral' })
        );

        broadcast('intelligence:snapshot', {
            instrument_key: 'GLOBAL',
            global: { composite_score: result.compositeScore, regime: result.regime?.label || 'Neutral' }
        });

        console.log(\[BG Intel] GLOB: \ (\)\);
    } catch (err) {
        console.error('[BG Intel] Global failed:', err.message);
    }
};

const startIdx = content.indexOf('export async function runGlobalIntelligence() {');
const endStr = "console.error('[BG Intel] Global failed:', err.message);\n    }\n}";
const endIdx = content.indexOf(endStr, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
    content = content.substring(0, startIdx) + newRunFunc + content.substring(endIdx + endStr.length);
    fs.writeFileSync(file, content);
    console.log('Fixed backgroundIntelligenceService.js!');
} else {
    console.log('Failed to find replacement bounds.');
}
