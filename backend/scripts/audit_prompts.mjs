import axios from 'axios';

const EMAIL = 'shanifshaz546@gmail.com';
const PASSWORD = 'Shezin@2005';
const BASE_URL = 'http://localhost:5000';

const EXPECTED_TARGETS = [
    // Headers + Chats (20)
    'master_header','fundamentals_index_header','fundamentals_company_header',
    'technical_index_header','technical_company_header','options_header',
    'foreign_header','events_header',
    'master_manual','fund_manual','tech_manual','opt_manual','global_manual',
    'qchat_global','qchat_fundamentals','qchat_technicals','qchat_options',
    'qchat_global_macros','qchat_events','qchat_dashboard',
    // Fundamentals Index (26)
    'nifty_pe','nifty_pb','mcap_gdp','eps_yoy','forward_eps','profit_margin',
    'gdp_growth','gdp','cpi','repo','fiscal_deficit','fii','dii','fii_trend',
    'mf_flows','system_liquidity','advance_decline','credit_growth','corp_debt',
    'policy_tailwinds','india_vix','crude','global_liq','sovereign_risk','npa','reform_momentum',
    // Fundamentals Company (29)
    'pe_ratio','forward_pe','pb_ratio','ev_ebitda','earnings_yield','relative_valuation',
    'dividend_yield','revenue_growth','eps_growth','profit_growth','earnings_trend',
    'net_margin','operating_margin','roe','roa','roce','free_cash_flow','earnings_quality',
    'debt_to_equity','current_ratio','interest_coverage','promoter_holding',
    'analyst_consensus','smart_money_flow','fii_dii_flow','cash_conversion',
    'credit_rating','corporate_actions','sector_dashboard',
    // Technical (29)
    'ema_20','ema_50','ema_200','sma_50','sma_200','adx','supertrend',
    'rsi','macd','stoch_rsi','williams_r','bb_20_2','atr','kc',
    'ad_line','nh_nl','breadth_ratio','trin','mcclellan',
    'support_level','resistance_level','trendline','pivot_points','fibonacci',
    'cmf','volume_sma','obv','vwap','beta_correlation',
    // Options (14)
    'total_call_oi','total_put_oi','oi_change','pcr_oi','pcr_volume',
    'delta','gamma','theta','vega','atm_iv','iv_rank','iv_percentile',
    'max_pain',
    // Foreign (25)
    'global_dxy','global_eur_usd','global_usd_jpy','global_usd_inr',
    'global_sp500','global_nasdaq','global_dow','global_nikkei_225',
    'global_ftse_100','global_dax_40','global_hang_seng','global_shanghai',
    'global_cac_40','global_eurostoxx_50','global_gold','global_crude_oil',
    'global_copper','global_silver','global_natgas','global_wheat','global_aluminum',
    'global_us_10y_yield','global_vix','global_move_index','global_bitcoin',
];

async function audit() {
    console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
    console.log('║              PRAXIS PROMPTS — FULL DATABASE AUDIT                   ║');
    console.log('╚══════════════════════════════════════════════════════════════════════╝\n');

    const loginRes = await axios.post(`${BASE_URL}/api/v1/auth/login`, { email: EMAIL, password: PASSWORD });
    const token = loginRes.data?.token || loginRes.data?.data?.token;
    const headers = { Authorization: `Bearer ${token}` };

    const res = await axios.get(`${BASE_URL}/api/v1/ai-prompts`, { headers });
    const prompts = res.data;
    const promptMap = {};
    prompts.forEach(p => { promptMap[p.targetId] = p; });

    console.log(`📊 TOTAL IN DB: ${prompts.length}`);
    console.log(`📋 EXPECTED:    ${EXPECTED_TARGETS.length}`);
    console.log('');

    // ── 1. Missing check ─────────────────────────────────────────────────────
    const missing = EXPECTED_TARGETS.filter(id => !promptMap[id]);
    const extra   = Object.keys(promptMap).filter(id => !EXPECTED_TARGETS.includes(id));

    if (missing.length === 0) {
        console.log('✅ COVERAGE: All expected targetIds are present in DB.');
    } else {
        console.log(`❌ MISSING (${missing.length}):`);
        missing.forEach(id => console.log('   - ' + id));
    }

    if (extra.length > 0) {
        console.log(`⚠️  EXTRA (not in expected list, ${extra.length}): ${extra.join(', ')}`);
    }

    console.log('');

    // ── 2. Prompt quality checks ──────────────────────────────────────────────
    const tooShort    = [];
    const noVars      = [];
    const isDefault   = [];

    EXPECTED_TARGETS.forEach(id => {
        const p = promptMap[id];
        if (!p) return;
        const instr = p.systemInstruction || '';

        // Too short (under 200 chars is suspicious)
        if (instr.length < 200) tooShort.push({ id, len: instr.length });

        // No template variables used at all (manual/qchat is fine to have none)
        const isConversational = id.startsWith('qchat_') || id.endsWith('_manual');
        if (!isConversational && !/{[\w]+}/.test(instr)) {
            noVars.push(id);
        }

        // isDefault flag — if still true, it wasn't saved
        if (p.isDefault) isDefault.push(id);
    });

    if (tooShort.length === 0) {
        console.log('✅ LENGTH:   All prompts have substantial content (200+ chars).');
    } else {
        console.log(`❌ TOO SHORT (${tooShort.length}):`);
        tooShort.forEach(x => console.log(`   - ${x.id} (${x.len} chars)`));
    }

    if (noVars.length === 0) {
        console.log('✅ VARIABLES: All non-conversational prompts use template variables.');
    } else {
        console.log(`⚠️  NO VARS USED (${noVars.length}): ${noVars.join(', ')}`);
    }

    if (isDefault.length === 0) {
        console.log('✅ SAVED:    No prompts are still showing isDefault=true.');
    } else {
        console.log(`❌ STILL DEFAULT (${isDefault.length}): ${isDefault.join(', ')}`);
    }

    console.log('');

    // ── 3. Length distribution ────────────────────────────────────────────────
    const lengths = EXPECTED_TARGETS.map(id => ({
        id, len: (promptMap[id]?.systemInstruction || '').length
    })).filter(x => x.len > 0).sort((a, b) => a.len - b.len);

    const avgLen = Math.round(lengths.reduce((s, x) => s + x.len, 0) / lengths.length);
    console.log(`📐 PROMPT LENGTH STATS:`);
    console.log(`   Average : ${avgLen} chars`);
    console.log(`   Shortest: ${lengths[0].id} (${lengths[0].len} chars)`);
    console.log(`   Longest : ${lengths[lengths.length-1].id} (${lengths[lengths.length-1].len} chars)`);
    console.log('');

    // ── 4. Per-page breakdown ─────────────────────────────────────────────────
    const byPage = {};
    prompts.forEach(p => {
        const pg = p.page || 'Unknown';
        if (!byPage[pg]) byPage[pg] = 0;
        byPage[pg]++;
    });
    console.log('📄 PER-PAGE COUNT IN DB:');
    Object.entries(byPage).sort((a, b) => b[1] - a[1]).forEach(([pg, count]) => {
        console.log(`   ${pg.padEnd(25)} ${count}`);
    });

    console.log('\n──────────────────────────────────────────────────────────────────────');

    // ── 5. Spot-check 5 random prompts for content quality ───────────────────
    const spotCheck = ['master_header', 'nifty_pe', 'rsi', 'max_pain', 'global_dxy'];
    console.log('\n🔍 SPOT CHECK — First 300 chars of 5 key prompts:\n');
    spotCheck.forEach(id => {
        const p = promptMap[id];
        if (!p) { console.log(`   [${id}] NOT FOUND`); return; }
        const preview = (p.systemInstruction || '').substring(0, 300).replace(/\n/g, ' ');
        console.log(`   [${id}]`);
        console.log(`   ${preview}...`);
        console.log('');
    });
}

audit().catch(e => console.error('Audit error:', e.response?.data || e.message));
