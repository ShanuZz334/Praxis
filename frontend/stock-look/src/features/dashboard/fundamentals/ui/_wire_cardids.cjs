/**
 * Phase 1 + Phase 2 cardId wiring script.
 * Adds `cardId` to each card's function signature and passes it to IndicatorCard.
 * Safe: skips if already wired, logs every change.
 */
const fs = require('fs');
const path = require('path');

const BASE = __dirname;

// ALL 53 Fundamentals cards (Phase 1 + Phase 2 combined, minus NiftyPECard already done)
const CARDS = [
  // Phase 1 — Index Only (24 minus nifty_pe which is already done)
  { file: 'NiftyPBCard.jsx',          cardId: 'nifty_pb' },
  { file: 'IndexMCapGDPCard.jsx',     cardId: 'mcap_gdp' },
  { file: 'EPSYoYCard.jsx',           cardId: 'eps_yoy' },
  { file: 'ForwardEPSCard.jsx',       cardId: 'forward_eps' },
  { file: 'ProfitMarginCard.jsx',     cardId: 'profit_margin' },
  { file: 'CPICard.jsx',              cardId: 'cpi' },
  { file: 'RepoCard.jsx',             cardId: 'repo' },
  { file: 'FiscalDeficitCard.jsx',    cardId: 'fiscal_deficit' },
  { file: 'FIICard.jsx',              cardId: 'fii' },
  { file: 'DIICard.jsx',              cardId: 'dii' },
  { file: 'FIITrendCard.jsx',         cardId: 'fii_trend' },
  { file: 'SystemLiquidityCard.jsx',  cardId: 'system_liquidity' },
  { file: 'MFFlowsCard.jsx',          cardId: 'mf_flows' },
  { file: 'AdvanceDeclineCard.jsx',   cardId: 'advance_decline' },
  { file: 'CreditGrowthCard.jsx',     cardId: 'credit_growth' },
  { file: 'CorpDebtCard.jsx',         cardId: 'corp_debt' },
  { file: 'PolicyTailwindsCard.jsx',  cardId: 'policy_tailwinds' },
  { file: 'VolatilityCard.jsx',       cardId: 'india_vix' },
  { file: 'CrudeCard.jsx',            cardId: 'crude' },
  { file: 'GlobalLiqCard.jsx',        cardId: 'global_liq' },
  { file: 'SovereignRiskCard.jsx',    cardId: 'sovereign_risk' },
  { file: 'NPACard.jsx',              cardId: 'npa' },
  { file: 'ReformMomentumCard.jsx',   cardId: 'reform_momentum' },
  { file: 'IndexDividendYieldCard.jsx', cardId: 'dividend_yield' },

  // Phase 1 — Both (3)
  { file: 'DividendYieldCard.jsx',    cardId: 'dividend_yield' },
  { file: 'GDPGrowthCard.jsx',        cardId: 'gdp_growth' },
  { file: 'SectorDashboardCard.jsx',  cardId: 'sector_dashboard' },

  // Phase 2 — Company Only (26)
  { file: 'ForwardPECard.jsx',        cardId: 'forward_pe' },
  { file: 'EVEbitdaCard.jsx',         cardId: 'ev_ebitda' },
  { file: 'PERatioCard.jsx',          cardId: 'pe_ratio' },
  { file: 'PBRatioCard.jsx',          cardId: 'pb_ratio' },
  { file: 'RelativeValuationCard.jsx', cardId: 'relative_valuation' },
  { file: 'RevenueGrowthCard.jsx',    cardId: 'revenue_growth' },
  { file: 'EPSGrowthCard.jsx',        cardId: 'eps_growth' },
  { file: 'ProfitGrowthCard.jsx',     cardId: 'profit_growth' },
  { file: 'FIIDIIFlowCard.jsx',       cardId: 'fii_dii_flow' },
  { file: 'EarningsTrendCard.jsx',    cardId: 'earnings_trend' },
  { file: 'ROACard.jsx',              cardId: 'roa' },
  { file: 'ROECard.jsx',              cardId: 'roe' },
  { file: 'OperatingMarginCard.jsx',  cardId: 'operating_margin' },
  { file: 'ROCECard.jsx',             cardId: 'roce' },
  { file: 'NetMarginCard.jsx',        cardId: 'net_margin' },
  { file: 'FreeCashFlowCard.jsx',     cardId: 'free_cash_flow' },
  { file: 'AnalystConsensusCard.jsx', cardId: 'analyst_consensus' },
  { file: 'CashConversionCycleCard.jsx', cardId: 'cash_conversion' },
  { file: 'CorporateActionsCard.jsx', cardId: 'corporate_actions' },
  { file: 'CreditRatingCard.jsx',     cardId: 'credit_rating' },
  { file: 'CurrentRatioCard.jsx',     cardId: 'current_ratio' },
  { file: 'EarningsQualityCard.jsx',  cardId: 'earnings_quality' },
  { file: 'InterestCoverageCard.jsx', cardId: 'interest_coverage' },
  { file: 'PromoterHoldingCard.jsx',  cardId: 'promoter_holding' },
  { file: 'SmartMoneyFlowCard.jsx',   cardId: 'smart_money_flow' },
  { file: 'EarningsYieldCard.jsx',    cardId: 'earnings_yield' },

  // Also wire GDPCard (used on index page)
  { file: 'GDPCard.jsx',              cardId: 'gdp' },
];

let wired = 0;
let skipped = 0;
let failed = 0;

CARDS.forEach(({ file, cardId }) => {
  const fullPath = path.join(BASE, file);
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  MISSING: ${file}`);
    failed++;
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');

  // Already wired?
  if (content.includes('cardId={cardId}') || content.includes(`cardId="${cardId}"`)) {
    console.log(`✓  SKIP (already wired): ${file}`);
    skipped++;
    return;
  }

  let changed = false;

  // 1. Add cardId to the function signature
  // Matches: export default function XxxCard({ ... }) or export function XxxCard({ ... })
  content = content.replace(
    /(export\s+(?:default\s+)?function\s+\w+Card\s*\(\s*\{)/,
    (match) => {
      changed = true;
      return match + ' cardId,';
    }
  );

  if (!changed) {
    // Try arrow function: const XxxCard = ({ ... }) =>
    content = content.replace(
      /((?:export\s+(?:default\s+)?)?const\s+\w+Card\s*=\s*\(\s*\{)/,
      (match) => {
        changed = true;
        return match + ' cardId,';
      }
    );
  }

  if (!changed) {
    console.log(`⚠️  SIGNATURE not found: ${file}`);
    failed++;
    return;
  }

  // 2. Pass cardId to <IndicatorCard>
  // Insert after the opening <IndicatorCard tag
  content = content.replace(
    /(<\s*IndicatorCard\b)(\s*\n|\s+)/,
    (match, tag, space) => {
      return `${tag}\n            cardId={cardId}${space}`;
    }
  );

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✅ WIRED: ${file} → cardId="${cardId}"`);
  wired++;
});

console.log(`\nDone: ${wired} wired, ${skipped} skipped, ${failed} failed`);
