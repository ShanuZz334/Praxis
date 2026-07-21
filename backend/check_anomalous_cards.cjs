const db = require('better-sqlite3')('local_data/praxis_market.db');
const anomalousCards = [
    'event_card', 'news_card', 'news_impact_panel', 
    'earnings_revision', 'current_account', 'policy_stance', 'usdinr', 
    'index_200dma', 'index_macd',
    'EventCard', 'NewsCard', 'NewsImpactPanel',
    'EarningsRevisionCard', 'CurrentAccountCard', 'PolicyStanceCard',
    'USDINRCard', 'MovingAverageCard', 'MACDTrendCard'
];
const placeholders = anomalousCards.map(() => '?').join(',');
const query = `SELECT * FROM ai_card_store WHERE card_name IN (${placeholders})`;
console.log('Matches:', db.prepare(query).all(anomalousCards));
