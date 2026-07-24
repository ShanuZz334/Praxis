/**
 * Confidence Engine Configuration
 * 
 * Tunable weights and parameters for the deterministic confidence scoring engine.
 * 
 * w1_FR: Weight for Freshness (FR)
 * w2_SR: Weight for Source Reliability (SR)
 * w3_SS: Weight for Signal Stability (SS)
 * w4_CV: Weight for Cross-Validation (CV)
 * lambda: Decay factor for Freshness. Larger lambda = faster decay.
 * cv_threshold: Threshold for Coefficient of Variation (volatility damping).
 * k_dispersion: Dampening factor for header dispersion penalty.
 */

export const CONFIDENCE_CONFIG = {
    fundamentals: { 
        w1_FR: 0.2, 
        w2_SR: 0.5, 
        w3_SS: 0.3, 
        w4_CV: 0.0, // Fundamentals don't typically use CV
        lambda: 0.00001, // Very slow decay (e.g. days/weeks)
        cv_threshold: 10, 
        k_dispersion: 0.2 
    },
    technical: { 
        w1_FR: 0.35, 
        w2_SR: 0.25, 
        w3_SS: 0.20, 
        w4_CV: 0.20, // High CV use for trend confirmation
        lambda: 0.005, // Fast decay (minutes)
        cv_threshold: 5, 
        k_dispersion: 0.4 
    },
    options: { 
        w1_FR: 0.4, 
        w2_SR: 0.2, 
        w3_SS: 0.3, 
        w4_CV: 0.1, 
        lambda: 0.005, 
        cv_threshold: 8, 
        k_dispersion: 0.3 
    },
    foreign: { 
        w1_FR: 0.2, 
        w2_SR: 0.5, 
        w3_SS: 0.3, 
        w4_CV: 0.0, 
        lambda: 0.0001, 
        cv_threshold: 15, 
        k_dispersion: 0.2 
    },
    global: {
        w1_FR: 0.2, 
        w2_SR: 0.5, 
        w3_SS: 0.3, 
        w4_CV: 0.0, 
        lambda: 0.0001, 
        cv_threshold: 15, 
        k_dispersion: 0.2 
    }
};
