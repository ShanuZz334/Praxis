/**
 * @file sections.config.js
 * @purpose Configuration for Fundamental Sections and their relative weights.
 * @responsibilities
 * - Defines the weight distribution for the composite score calculation.
 * - Ensures weights sum to 1.0 (100%).
 * @key_exports
 * - SECTION_WEIGHTS
 * @lifecycle
 * - Loaded by `index.js` for weighted aggregation.
 * @date 2026-02-03
 */

// =============================
// Import from centralized config
// =============================
import { SECTION_WEIGHTS as baseSectionWeights } from '../../../../config/weights/fundamentalsSectionWeights.js';

// Re-export for backward compatibility
export const SECTION_WEIGHTS = baseSectionWeights;
