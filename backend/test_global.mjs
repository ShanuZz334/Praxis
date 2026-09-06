import db from "./config/localDb.js";
import { computeGlobalComposite } from "../frontend/stock-look/src/features/dashboard/foreign/engine/globalCompositeMath.js";
import { FOREIGN_WEIGHTS } from "../frontend/stock-look/src/config/weights/foreignWeights.js";
import { scoreDXY, scoreUSDINR, scoreCrude, scoreGold, scoreSilver, scoreUS10Y, scoreSPFutures, scoreNasdaqFutures, scoreDowFutures, scoreVIX, scoreBitcoin, scoreEurusd, scoreUsdjpy, scoreNikkei, scoreFtse, scoreDax, scoreHangseng, scoreShanghai, scoreCac40, scoreEurostoxx, scoreCopper, scoreNatgas, scoreWheat, scoreAluminum, scoreMove } from "../frontend/stock-look/src/features/dashboard/foreign/engine/globalScoringEngine.js";

const rows = db.prepare(`SELECT symbol_id, value, hi_52, lo_52 FROM global_cache WHERE value IS NOT NULL`).all();
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
const result = computeGlobalComposite(globalScores, FOREIGN_WEIGHTS);
console.log("ACTUAL COMPUTED SCORE:", result.compositeScore);
