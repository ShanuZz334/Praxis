/**
 * @file helper.js
 * @purpose General-purpose utility functions.
 * @responsibilities
 * - Provides email validation using regex.
 * @key_exports
 * - validateEmail
 * @dependencies
 * - None
 * @date 2026-02-04
 */

// =============================
// Validation Utilities
// =============================

export const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};
