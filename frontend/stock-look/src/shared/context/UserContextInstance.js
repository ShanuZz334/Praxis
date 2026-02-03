/**
 * @file UserContextInstance.js
 * @purpose Singleton instance of UserContext.
 * @responsibilities
 * - Defines the React Context for user session.
 * - Separated from provider to enable Fast Refresh (HMR).
 * @key_exports
 * - UserContext
 * @dependencies
 * - React (createContext)
 * @date 2026-02-04
 */

import { createContext } from 'react';

export const UserContext = createContext(null);
