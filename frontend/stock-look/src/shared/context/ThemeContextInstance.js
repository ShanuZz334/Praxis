/**
 * @file ThemeContextInstance.js
 * @purpose Singleton instance of ThemeContext.
 * @responsibilities
 * - Defines the React Context for theming.
 * - Separated from provider to enable Fast Refresh (HMR).
 * @key_exports
 * - ThemeContext
 * @dependencies
 * - React (createContext)
 * @date 2026-02-04
 */

import { createContext } from 'react';

export const ThemeContext = createContext();
