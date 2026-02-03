/**
 * @file eslint.config.js
 * @purpose ESLint configuration for the Stocky application.
 * @responsibilities
 * - Enforces code quality and consistency standards.
 * - Configures React Hooks and React Refresh rules.
 * - Defines custom rules for unused variables.
 * @key_exports
 * - ESLint configuration object (default export)
 * @dependencies
 * - @eslint/js - Core ESLint recommended rules
 * - eslint-plugin-react-hooks - React Hooks linting
 * - eslint-plugin-react-refresh - Vite HMR compliance
 * - globals - Browser global variables
 * @lifecycle
 * - Loaded by ESLint when running lint commands.
 * @date 2026-02-04
 */

// =============================
// Imports
// =============================

import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

// =============================
// ESLint Configuration
// =============================

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
])
