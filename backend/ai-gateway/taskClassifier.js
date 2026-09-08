/**
 * Classifies a requested task into a complexity Level (1-7).
 */
export function classifyTask(taskType) {
    const LEVEL_1 = ['alert_context', 'event_classification', 'scanner_nl_parsing'];
    const LEVEL_2 = ['per_card_insight', 'per_indicator_signal'];
    const LEVEL_3 = ['chat_conversation', 'page_header_insight', 'options_oi_interpretation'];
    const LEVEL_4 = ['stock_narrative', 'report_generation', 'strategy_suggestion', 'journal_behavioral_patterns', 'macro_cycle_assessment'];
    const LEVEL_5 = ['future_vision_prediction']; // Explicitly requested CoT or Deep Quantitative tasks go here
    const LEVEL_6 = ['chart_qa', 'pattern_recognition_narrative']; // Vision tasks
    const LEVEL_7 = ['voice_transcription', 'text_to_speech']; // Audio tasks

    if (LEVEL_1.includes(taskType)) return 'level1_fast';
    if (LEVEL_2.includes(taskType)) return 'level2_standard';
    if (LEVEL_3.includes(taskType)) return 'level3_advanced';
    if (LEVEL_4.includes(taskType)) return 'level4_expert';
    if (LEVEL_5.includes(taskType)) return 'level5_reasoner';
    if (LEVEL_6.includes(taskType)) return 'level6_vision';
    if (LEVEL_7.includes(taskType)) return 'level7_audio';

    // Default to Level 2 (Standard) if unknown.
    return 'level2_standard';
}
