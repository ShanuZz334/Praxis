/**
 * @file axiosInstance.js
 * @purpose Configured Axios instance with request/response interceptors.
 * @responsibilities
 * - Creates axios instance with BASE_URL and default headers.
 * - Attaches JWT token to all outgoing requests.
 * - Handles 401 (Unauthorized) responses with session conflict detection.
 * - Redirects to login on auth failures.
 * - Logs network and server errors.
 * @key_exports
 * - axiosInstance (default)
 * @dependencies
 * - axios
 * - apiPaths (BASE_URL)
 * @lifecycle
 * - Used by all API service layers and contexts.
 * @date 2026-02-04
 */

// =============================
// Imports
// =============================

import axios from "axios";
import { BASE_URL } from "@/shared/utils/apiPaths";

// =============================
// Axios Instance Configuration
// =============================

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// =============================
// Request Interceptor
// =============================

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// =============================
// Response Interceptor
// =============================

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      console.error("Network error or server unreachable");
      return Promise.reject(error);
    }

    const { status } = error.response;

    if (status === 401) {
      const message = error.response.data?.message || "";

      if (message.includes("Internal Session Conflict")) {
        const token = error.config?.headers?.Authorization || "";
        window.dispatchEvent(new CustomEvent('session-conflict', { detail: { message, token } }));
        return Promise.reject(error);
      }

      localStorage.removeItem("user");
      localStorage.removeItem("token");

      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }

    if (status >= 500) {
      console.error("Server error. Please try again later.");
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;

