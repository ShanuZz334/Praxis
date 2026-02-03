/**
 * @file apiPaths.js
 * @purpose Centralized API endpoint definitions and base URL configuration.
 * @responsibilities
 * - Exports BASE_URL from environment variables.
 * - Defines all API endpoint paths for Auth, Dashboard, Income, Expense, and Image uploads.
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

export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

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

  DASHBOARD: {
    GET_DATA: "/api/v1/dashboard",
  },

  INCOME: {
    ADD_INCOME: "/api/v1/income/add",
    GET_ALL_INCOME: "/api/v1/income/get",
    DELETE_INCOME: (incomeId) => `/api/v1/income/${incomeId}`,
    DOWNLOAD_INCOME: "/api/v1/income/downloadexcel",
  },

  EXPENSE: {
    ADD_EXPENSE: "/api/v1/expense/add",
    GET_ALL_EXPENSE: "/api/v1/expense/get",
    DELETE_EXPENSE: (expenseId) => `/api/v1/expense/${expenseId}`,
    DOWNLOAD_EXPENSE: "/api/v1/expense/downloadexcel",
  },

  IMAGE: {
    UPLOAD_IMAGE: "/api/v1/user/upload-image",
    UPLOAD_IMAGE_PUBLIC: "/api/v1/user/upload-image-public",
  },
};

