/**
 * Wire cardId into all Technical Analysis + Options card components.
 */
const fs = require('fs');
const path = require('path');

const TECH_BASE = path.join(__dirname, '../technical/ui');
const OPTS_BASE = path.join(__dirname, '../options/ui');

const TECH_CARDS = [
    // Both (25 index-applicable)
    { file: 'EMA20Card.jsx',          cardId: 'ema_20' },
    { file: 'EMA50Card.jsx',          cardId: 'ema_50' },
    { file: 'EMA200Card.jsx',         cardId: 'ema_200' },
    { file: 'SMA50Card.jsx',          cardId: 'sma_50' },
    { file: 'SMA200Card.jsx',         cardId: 'sma_200' },
    { file: 'ADXCard.jsx',            cardId: 'adx' },
    { file: 'SupertrendCard.jsx',     cardId: 'supertrend' },
    { file: 'RSICard.jsx',            cardId: 'rsi' },
    { file: 'MACDCard.jsx',           cardId: 'macd' },
    { file: 'StochRSICard.jsx',       cardId: 'stoch_rsi' },
    { file: 'WilliamsRCard.jsx',      cardId: 'williams_r' },
    { file: 'BBCard.jsx',             cardId: 'bb_20_2' },
    { file: 'ATRCard.jsx',            cardId: 'atr' },
    { file: 'KCCard.jsx',             cardId: 'kc' },
    { file: 'SupportCard.jsx',        cardId: 'support' },
    { file: 'ResistanceCard.jsx',     cardId: 'resistance' },
    { file: 'TrendlineCard.jsx',      cardId: 'trendline' },
    { file: 'PivotCard.jsx',          cardId: 'pivot' },
    { file: 'FibonacciCard.jsx',      cardId: 'fibonacci' },
    { file: 'BetaCorrelationCard.jsx',cardId: 'beta_correlation' },
    // Index Only (5)
    { file: 'ADLineCard.jsx',         cardId: 'ad_line' },
    { file: 'NhnlCard.jsx',           cardId: 'nh_nl' },
    { file: 'BreadthRatioCard.jsx',   cardId: 'breadth_ratio' },
    { file: 'TrinCard.jsx',           cardId: 'trin' },
    { file: 'McClellanCard.jsx',      cardId: 'mcclellan' },
    // Company Only (4) — Phase 4
    { file: 'CmfCard.jsx',            cardId: 'cmf' },
    { file: 'VolumeSmaCard.jsx',      cardId: 'volume_sma' },
    { file: 'ObvCard.jsx',            cardId: 'obv' },
    { file: 'VwapCard.jsx',           cardId: 'vwap' },
];

const OPTS_CARDS = [
    { file: 'PcrOiCard.jsx',              cardId: 'pcr_oi' },
    { file: 'PcrVolumeCard.jsx',          cardId: 'pcr_volume' },
    { file: 'MaxPainCard.jsx',            cardId: 'max_pain' },
    { file: 'AtmIvCard.jsx',              cardId: 'atm_iv' },
    { file: 'IvRankCard.jsx',             cardId: 'iv_rank' },
    { file: 'IvPercentileCard.jsx',       cardId: 'iv_percentile' },
    { file: 'OpenInterestChangeCard.jsx', cardId: 'oi_change' },
    { file: 'TotalCallOpenInterestCard.jsx', cardId: 'total_call_oi' },
    { file: 'TotalPutOpenInterestCard.jsx',  cardId: 'total_put_oi' },
    { file: 'DeltaCard.jsx',              cardId: 'delta' },
    { file: 'GammaCard.jsx',              cardId: 'gamma' },
    { file: 'ThetaCard.jsx',              cardId: 'theta' },
    { file: 'VegaCard.jsx',               cardId: 'vega' },
];

function wireCards(cards, basePath) {
    let wired = 0, skipped = 0, failed = 0;
    cards.forEach(({ file, cardId }) => {
        const fullPath = path.join(basePath, file);
        if (!fs.existsSync(fullPath)) {
            console.log(`⚠️  MISSING: ${file}`);
            failed++;
            return;
        }
        let content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('cardId={cardId}') || content.includes(`cardId="${cardId}"`)) {
            console.log(`✓  SKIP (already wired): ${file}`);
            skipped++;
            return;
        }
        let changed = false;
        content = content.replace(
            /(export\s+(?:default\s+)?function\s+\w+Card\s*\(\s*\{)/,
            (match) => { changed = true; return match + ' cardId,'; }
        );
        if (!changed) {
            content = content.replace(
                /((?:export\s+(?:default\s+)?)?const\s+\w+Card\s*=\s*\(\s*\{)/,
                (match) => { changed = true; return match + ' cardId,'; }
            );
        }
        if (!changed) {
            console.log(`⚠️  SIGNATURE not found: ${file}`);
            failed++;
            return;
        }
        content = content.replace(
            /(<\s*IndicatorCard\b)(\s*\n|\s+)/,
            (match, tag, space) => `${tag}\n            cardId={cardId}${space}`
        );
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`✅ WIRED: ${file} → cardId="${cardId}"`);
        wired++;
    });
    return { wired, skipped, failed };
}

const techResult = wireCards(TECH_CARDS, TECH_BASE);
const optsResult = wireCards(OPTS_CARDS, OPTS_BASE);

console.log(`\nTechnical: ${techResult.wired} wired, ${techResult.skipped} skipped, ${techResult.failed} failed`);
console.log(`Options:   ${optsResult.wired} wired, ${optsResult.skipped} skipped, ${optsResult.failed} failed`);
