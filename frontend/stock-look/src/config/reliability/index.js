/**
 * @file index.js (Reliability)
 * @purpose Central export for all reliability configurations and institutional logic.
 */

import { getCreditFromReliability } from '../../shared/global/logic/signals';
import TECHNICAL_RELIABILITY from './technicalReliability';
import FUNDAMENTALS_RELIABILITY from './fundamentalsReliability';
import OPTIONS_RELIABILITY from './optionsReliability';
import FOREIGN_RELIABILITY from './foreignReliability';
import EVENTS_RELIABILITY from './eventsReliability';

/**
 * Calculates total possible credits for a reliability mapping
 */
export const calculateTotalCredits = (reliabilityMap) => {
    return Object.values(reliabilityMap).reduce((sum, rel) => sum + getCreditFromReliability(rel), 0);
};

export {
    TECHNICAL_RELIABILITY,
    FUNDAMENTALS_RELIABILITY,
    OPTIONS_RELIABILITY,
    FOREIGN_RELIABILITY,
    EVENTS_RELIABILITY
};

// Preset Totals
export const TOTAL_TECHNICAL_CREDITS = calculateTotalCredits(TECHNICAL_RELIABILITY);
export const TOTAL_FUNDAMENTALS_CREDITS = calculateTotalCredits(FUNDAMENTALS_RELIABILITY);
export const TOTAL_OPTIONS_CREDITS = calculateTotalCredits(OPTIONS_RELIABILITY);
export const TOTAL_FOREIGN_CREDITS = calculateTotalCredits(FOREIGN_RELIABILITY);
export const TOTAL_EVENTS_CREDITS = calculateTotalCredits(EVENTS_RELIABILITY);
