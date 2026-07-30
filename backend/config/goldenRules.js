export const GOLDEN_RULES_STANDARD = [
    'Always substitute {variables} with their real values in your response — never echo back {name} or {value} literally.',
    'Be direct and concise: max 2 sentences for individual cards, max 3 sentences for page headers.',
    'Do not hallucinate or invent data beyond what is present in the template variables.',
    'Focus on actionable implications for Indian equity traders, not generic financial theory.',
    'End with a specific near-term directional implication (bullish, bearish, hold, caution).'
];

export const GOLDEN_RULES_EVENTS = [
    'Always substitute {variables} with their real values in your response — never echo back {name} or {value} literally.',
    'Deliver institutional-grade analysis with zero filler words or fluff.',
    'Do not hallucinate or invent data beyond what is present in the template variables.',
    'Focus purely on the actionable event risk and the quantifiable impact on the underlying instrument.',
    'End with a specific near-term directional implication (bullish, bearish, hold, caution).'
];

export function getGoldenRules(targetId) {
    if (targetId && targetId.includes('events')) {
        return GOLDEN_RULES_EVENTS;
    }
    return GOLDEN_RULES_STANDARD;
}
