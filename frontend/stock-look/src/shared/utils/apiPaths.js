/**
 * @file apiPaths.js
 * @purpose Centralized API endpoint definitions and base URL configuration.
 * @responsibilities
 * - Exports BASE_URL from environment variables.
 * - Defines all API endpoint paths for Auth, Dashboard, Income, Expense, and Image uploads.
 * Trigger restart
 * - Supports dynamic path generation (e.g., DELETE_INCOME by ID).
 * @key_exports
 * - BASE_URL
 * - API_PATHS
 * @dependencies
 * - Vite environment variables (import.meta.env)
 * @lifecycle
 * - Imported by axiosInstance and service layers.
 * @date 2026-02-04
 */

// =============================
// Base URL Configuration
// =============================

export const BASE_URL = import.meta.env.VITE_API_URL || "";

// =============================
// API Endpoint Paths
// =============================

export const API_PATHS = {
  AUTH: {
    LOGIN: "/api/v1/auth/login",
    REGISTER: "/api/v1/auth/register",
    GET_USER_INFO: "/api/v1/auth/getUser",
    VERIFY_CREDENTIALS: "/api/v1/auth/verify-credentials",
  },

  IMAGE: {
    UPLOAD_IMAGE: "/api/v1/user/upload-image",
    UPLOAD_IMAGE_PUBLIC: "/api/v1/user/upload-image-public",
  },

  CHARTS: {
    GET_DATA: (metricKey) => `/api/v1/charts/${metricKey}`,
  },

  EVENTS: {
    GET_ALL: "/api/v1/events",
  },

  OPTIONS: {
    GET_CONTRACTS: (instrumentKey) => `/api/v1/upstox/option-contracts?instrument_key=${encodeURIComponent(instrumentKey)}`,
    GET_CHAIN: (instrumentKey, expiryDate) => `/api/v1/upstox/option-chain?instrument_key=${encodeURIComponent(instrumentKey)}&expiry_date=${encodeURIComponent(expiryDate)}`,
    GET_GREEKS: (instrumentKeys) => `/api/v1/upstox/option-greeks?instrument_key=${encodeURIComponent(instrumentKeys)}`,
  },

  FUNDAMENTALS: {
    GET: (instrumentKey) => `/api/v1/upstox/fundamentals?instrument_key=${encodeURIComponent(instrumentKey)}&_t=${Date.now()}`,
  },

  JOURNAL: {
    GET_LOGS: "/api/v1/journal",
    ANALYTICS: "/api/v1/journal/analytics",
    GET_NOTES: "/api/v1/journal/notes",
    SAVE_NOTE: "/api/v1/journal/notes",
    GET_HOLIDAYS: "/api/v1/journal/holidays",
    GET_SUMMARY: "/api/v1/journal/summary",
    GET_TRADES: "/api/v1/journal/trades",
  },

  ADMIN: {
    CREDENTIALS: "/api/v1/admin/credentials",
    TOGGLE_CREDENTIAL: (provider) => `/api/v1/admin/credentials/${provider}/toggle`,
  },

  COLLECT: {
    RUN: "/api/v1/collect/run",
  },

  HEALTH: {
    PROVIDERS: "/api/v1/health/providers",
  },

  DATA: {
    GLOBAL: "/api/v1/data/global",
  },
};


