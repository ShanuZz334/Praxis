const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname);
const BASE_TECH = path.join(ROOT, 'frontend/stock-look/src/features/dashboard/technical/ui');
const BASE_OPTS = path.join(ROOT, 'frontend/stock-look/src/features/dashboard/options/ui');

const TECH_CARDS = [
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
    { file: 'ADLineCard.jsx',         cardId: 'ad_line' },
    { file: 'NhnlCard.jsx',           cardId: 'nh_nl' },
    { file: 'BreadthRatioCard.jsx',   cardId: 'breadth_ratio' },
    { file: 'TrinCard.jsx',           cardId: 'trin' },
    { file: 'McClellanCard.jsx',      cardId: 'mcclellan' },
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
    { file: 'FnOBanCard.jsx',             cardId: 'fno_ban' },
];

function wireCards(cards, basePath) {
    let wired = 0, skipped = 0, failed = 0;
    cards.forEach(({ file, cardId }) => {
        const fullPath = path.join(basePath, file);
        if (!fs.existsSync(fullPath)) {
            console.log('MISSING: ' + file);
            failed++;
            return;
        }
        let content = fs.readFileSync(fullPath, 'utf8');
        const alreadyWired = content.includes('cardId={cardId}') || content.includes('cardId="' + cardId + '"');
        if (alreadyWired) {
            console.log('SKIP: ' + file);
            skipped++;
            return;
        }
        let changed = false;
        content = content.replace(
            /(export\s+(?:default\s+)?function\s+\w+Card\s*\(\s*\{)/,
            (m) => { changed = true; return m + ' cardId,'; }
        );
        if (!changed) {
            content = content.replace(
                /((?:export\s+(?:default\s+)?)?const\s+\w+Card\s*=\s*\(\s*\{)/,
                (m) => { changed = true; return m + ' cardId,'; }
            );
        }
        if (!changed) {
            console.log('NO_SIG: ' + file);
            failed++;
            return;
        }
        content = content.replace(
            /(<\s*IndicatorCard\b)(\s*\n|\s+)/,
            (m, tag, sp) => tag + '\n            cardId={cardId}' + sp
        );
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('WIRED: ' + file + ' -> ' + cardId);
        wired++;
    });
    return { wired, skipped, failed };
}

const t = wireCards(TECH_CARDS, BASE_TECH);
const o = wireCards(OPTS_CARDS, BASE_OPTS);
console.log('\nTechnical: ' + t.wired + ' wired, ' + t.skipped + ' skipped, ' + t.failed + ' failed');
console.log('Options:   ' + o.wired + ' wired, ' + o.skipped + ' skipped, ' + o.failed + ' failed');
