/**
 * @file utils.ts
 * @purpose Utility functions for class name merging and conditional styling.
 * @responsibilities
 * - Merges Tailwind CSS classes efficiently.
 * - Handles conditional class names via clsx.
 * - Resolves Tailwind conflicts via tailwind-merge.
 * @key_exports
 * - cn (Function): Class name merger.
 * @dependencies
 * - clsx
 * - tailwind-merge
 * @lifecycle
 * - Used universally across UI components for styling.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// =============================
// Utilities
// =============================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
