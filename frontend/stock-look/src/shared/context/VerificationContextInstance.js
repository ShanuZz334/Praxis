/**
 * @file VerificationContextInstance.js
 * @purpose Creates and exports the VerificationContext instance.
 * @responsibilities
 * - Separated to avoid circular dependencies in imports.
 * - Serves as the singleton context definition.
 * @key_exports
 * - VerificationContext
 * @dependencies
 * - React (createContext)
 * @date 2026-02-04
 */

import { createContext } from 'react';

export const VerificationContext = createContext(null);
