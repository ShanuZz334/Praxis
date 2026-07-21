/**
 * Classifies a requested task into a complexity Tier (1-4).
 */
export function classifyTask(taskType) {
    const TIER_1 = ['per_card_insight', 'alert_context', 'event_classification', 'scanner_nl_parsing'];
    const TIER_2 = ['chat_conversation', 'per_indicator_signal', 'options_oi_interpretation'];
    const TIER_3 = ['stock_narrative', 'report_generation', 'strategy_suggestion', 'journal_behavioral_patterns', 'macro_cycle_assessment'];
    const TIER_4 = ['chart_qa', 'pattern_recognition_narrative'];

    if (TIER_1.includes(taskType)) return 1;
    if (TIER_2.includes(taskType)) return 2;
    if (TIER_3.includes(taskType)) return 3;
    if (TIER_4.includes(taskType)) return 4;

    // Default to Tier 2 if unknown but valid.
    return 2;
}
