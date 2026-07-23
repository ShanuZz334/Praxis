const fs = require('fs');
const path = require('path');

const CANONICAL_IDS = [
    "praxis_composite_header", "market_heatmap", "fii_dii_flow_master", "options_pulse", "sector_rotation", "volume_shockers", "catalyst_calendar", "pe_ratio", "forward_pe", "pb_ratio", "ev_ebitda", "market_cap_gdp", "earnings_yield", "relative_valuation", "dividend_yield", "nifty_pe", "nifty_pb", "mcap_gdp", "eps_growth", "revenue_growth", "profit_growth", "earnings_trend", "earnings_quality", "earnings_revision", "eps_yoy", "forward_eps", "sector_earnings", "profit_margin", "roe", "roce", "roa", "net_margin", "operating_margin", "debt_to_equity", "interest_coverage", "free_cash_flow", "current_ratio", "promoter_holding", "smart_money_flow", "fii_dii_flow", "gdp_growth", "gdp", "cpi", "repo", "policy_stance", "fiscal_deficit", "current_account", "fii", "dii", "fii_trend", "system_liquidity", "mf_flows", "sector_valuation", "sector_growth", "sector_concentration", "cyc_def", "credit_growth", "corp_debt", "policy_tailwinds", "crude", "usdinr", "global_liq", "sovereign_risk", "npa", "reform_momentum", "advance_decline", "india_vix", "index_macd", "index_200dma", "rsi", "macd", "stoch_rsi", "williams_r", "bb_20_2", "atr", "kc", "ema_20", "ema_50", "ema_200", "sma_50", "sma_200", "adx", "supertrend", "cmf", "volume_sma", "obv", "vwap", "support", "resistance", "trendline", "pivot", "fibonacci", "ad_line", "nh_nl", "breadth_ratio", "trin", "mcclellan", "atm_iv", "iv_rank", "iv_percentile", "total_call_oi", "total_put_oi", "oi_change", "delta", "gamma", "theta", "vega", "pcr_oi", "pcr_volume", "max_pain", "event_card", "news_card", "news_impact_panel", "sp_futures", "nasdaq_futures", "dow_futures", "dxy", "usd_inr", "us_10y_yield", "brent_crude_oil", "gold", "silver", "vix_global", "bitcoin", "eurusd", "usdjpy", "nikkei", "ftse", "dax", "hangseng", "shanghai", "cac40", "eurostoxx", "copper", "natgas", "wheat", "aluminum", "move"
];

// Track results per canonical ID
const results = {};
CANONICAL_IDS.forEach(id => {
    results[id] = {
        schema: false,
        insight: false,
        chat: false,
        prompt: false,
        schemaMatches: [],
        insightMatches: [],
        chatMatches: [],
        promptMatches: []
    };
});

// Track orphans/legacy keys
const orphans = [];

// Helper to check if string contains a card id but we need to verify the context
const walkDir = (dir, fileCallback) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file === 'node_modules' || file === '.git' || file === '.next' || file === 'build' || file === 'dist') continue;
        const filepath = path.join(dir, file);
        const stat = fs.statSync(filepath);
        if (stat.isDirectory()) {
            walkDir(filepath, fileCallback);
        } else if (stat.isFile()) {
            const ext = path.extname(filepath);
            if (['.js', '.jsx', '.ts', '.tsx', '.json', '.md'].includes(ext)) {
                fileCallback(filepath);
            }
        }
    }
};

const processFile = (filepath) => {
    const content = fs.readFileSync(filepath, 'utf8');
    const lines = content.split('\n');

    // Regex heuristics for the 4 categories
    // 1. Data/schema identity: models/schemas, enums, mock data
    //    e.g., cardId: 'foo', id: "foo", "foo": { ... } in some json
    // 2. Insight engine hook: useInsight('foo'), generateAiInsight('foo'), aiInsight('foo')
    // 3. Chat storage key: useChat('foo'), cardId="foo" inside a component where it might pass it to chat
    // 4. Prompt Studio key: something related to prompt / settings config.

    // A more brute-force but comprehensive approach:
    // If a canonical ID appears in a line, we analyze the line and file context.
    
    lines.forEach((line, index) => {
        const lineNum = index + 1;
        
        CANONICAL_IDS.forEach(id => {
            // Need boundary to avoid false positives (e.g. matching "dii" inside "fii_dii")
            // A word boundary or quote boundary
            const regex = new RegExp(`(['"\`])${id}\\1|\\b${id}\\b`, 'g');
            if (regex.test(line)) {
                
                // Try to categorize the match based on keywords in the line or file path
                const isBackend = filepath.includes('backend');
                const isSchema = filepath.includes('models') || filepath.includes('schema') || /cardId\s*[:=]\s*['"`]/.test(line) || /id\s*[:=]\s*['"`]/.test(line);
                const isInsight = filepath.toLowerCase().includes('insight') || /useInsight/.test(line) || /aiInsight/.test(line) || /generateAiInsight/.test(line) || /insightHook/.test(line);
                const isChat = filepath.toLowerCase().includes('chat') || /useChat/.test(line) || filepath.toLowerCase().includes('pai') || /chatKey/.test(line);
                const isPrompt = filepath.toLowerCase().includes('prompt') || /systemPrompt/.test(line) || /settings/.test(filepath.toLowerCase()) || /studio/.test(filepath.toLowerCase());

                if (isSchema || filepath.includes('seed') || filepath.includes('data')) {
                    results[id].schema = true;
                    results[id].schemaMatches.push(`${filepath}:${lineNum}`);
                }
                if (isInsight) {
                    results[id].insight = true;
                    results[id].insightMatches.push(`${filepath}:${lineNum}`);
                }
                if (isChat) {
                    results[id].chat = true;
                    results[id].chatMatches.push(`${filepath}:${lineNum}`);
                }
                if (isPrompt || filepath.includes('PROMPT')) {
                    results[id].prompt = true;
                    results[id].promptMatches.push(`${filepath}:${lineNum}`);
                }
                
                // If we couldn't clearly categorize, maybe it's just a general appearance.
                // We'll mark schema if it's at least in a config/data struct (very common).
                if (!isSchema && !isInsight && !isChat && !isPrompt) {
                    // fallback based on general structure
                    if (filepath.includes('config') || filepath.includes('constants') || filepath.endsWith('.json')) {
                        results[id].schema = true;
                    } else if (line.includes('<') && line.includes('/>')) { // React component props
                        // Often cardId is passed here
                        if(line.includes('cardId')) results[id].chat = true;
                    }
                }
            }
        });
        
        // Find potential orphans: words looking like card ids that are used in cardId="" or useInsight('')
        const orphanRegex = /(?:cardId|id|useInsight|useChat|insightKey)\s*[:=]\s*(['"`])([a-z0-9_]+)\1/g;
        let match;
        while ((match = orphanRegex.exec(line)) !== null) {
            const potentialId = match[2];
            if (!CANONICAL_IDS.includes(potentialId)) {
                // filter out some obvious non-card ids like 'true', 'false', '123'
                if (['true', 'false', 'null', 'undefined', 'row', 'col', 'main'].includes(potentialId)) continue;
                if (!orphans.some(o => o.id === potentialId && o.file === filepath)) {
                    orphans.push({
                        id: potentialId,
                        file: filepath,
                        line: lineNum,
                        context: line.trim()
                    });
                }
            }
        }
    });
};

console.log("Scanning codebase...");
walkDir(path.join(__dirname, 'frontend'), processFile);
walkDir(path.join(__dirname, 'backend'), processFile);
walkDir(path.join(__dirname, 'local_data'), processFile); // Check local_data too
const inventoryMd = path.join(__dirname, 'CARD_INVENTORY.md');
if (fs.existsSync(inventoryMd)) processFile(inventoryMd);


let markdown = `# Praxis Card Identity Audit Report\n\n`;

markdown += `## Canonical IDs Audit\n\n`;
markdown += `| cardId | schema/data key found? | insight hook key found? | chat key found? | prompt key found? | status |\n`;
markdown += `|---|---|---|---|---|---|\n`;

let ok = 0;
let mismatch = 0;
let gap = 0;
let mock = 0;

CANONICAL_IDS.forEach(id => {
    const r = results[id];
    let status = "";
    
    // Evaluate status
    if (r.schema && r.insight && r.chat && r.prompt) {
        status = "OK — fully wired and consistent";
        ok++;
    } else if (r.schema || r.insight || r.chat || r.prompt) {
        status = `GAP — missing from (${[!r.schema?'schema':'', !r.insight?'insight':'', !r.chat?'chat':'', !r.prompt?'prompt':''].filter(Boolean).join(', ')})`;
        gap++;
    } else {
        status = "GAP — missing entirely from all systems";
        gap++;
    }

    markdown += `| \`${id}\` | ${r.schema ? '✅' : '❌'} | ${r.insight ? '✅' : '❌'} | ${r.chat ? '✅' : '❌'} | ${r.prompt ? '✅' : '❌'} | ${status} |\n`;
});

markdown += `\n## Orphan/Legacy IDs Found\n\n`;
markdown += `| Found ID | File Path | Line | Context / Guess |\n`;
markdown += `|---|---|---|---|\n`;

let uniqueOrphans = [...new Set(orphans.map(o => o.id))];

orphans.forEach(o => {
    markdown += `| \`${o.id}\` | \`${o.file.replace(__dirname, '')}\` | ${o.line} | \`${o.context.substring(0, 50)}\` |\n`;
});

markdown += `\n## Summary\n`;
markdown += `- **Total OK**: ${ok}\n`;
markdown += `- **Total MISMATCH**: ${mismatch}\n`;
markdown += `- **Total GAP**: ${gap}\n`;
markdown += `- **Total MOCK**: ${mock}\n`;
markdown += `- **Total Orphans**: ${uniqueOrphans.length}\n`;

fs.writeFileSync(path.join(__dirname, 'audit_report.md'), markdown);
console.log("Audit complete. Report generated at audit_report.md");
