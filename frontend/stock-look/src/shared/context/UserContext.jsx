/**
 * @file UserContext.jsx
 * @purpose Manages global user session and authentication state.
 * @responsibilities
 * - Stores `user` profile data and JWT `token`.
 * - Handles login (`updateUser`) and logout (`clearUser`) actions.
 * - Monitors session validity via background polling.
 * - Sanitizes user data (e.g., image URLs) for mixed-content safety.
 * @key_exports
 * - UserContext (Context Object)
 * - UserProvider (Component)
 * @dependencies
 * - axiosInstance (for API calls and header management)
 * @lifecycle
 * - Core Auth provider wrapping the app.
 * @date 2026-02-04
 */

// =============================
// Imports
// =============================

import {
  useState,
  useEffect,
  useMemo,
} from "react";
import axiosInstance from "@/shared/utils/axiosInstance.js";
import { BASE_URL } from "@/shared/utils/apiPaths.js";
import SessionConflictModal from "@/shared/components/modals/SessionConflictModal";
import { UserContext } from './UserContextInstance';

// =============================
// Context Instance Re-export
// =============================

export { UserContext };

// =============================
// Helper Functions
// =============================

/**
 * Sanitizes user data to fix mixed content and localhost URL issues.
 * @param {Object} userData 
 * @returns {Object} Cleaned user data
 */
const sanitizeUser = (userData) => {
  if (!userData) return null;

  let sanitized = { ...userData };

  // 1. Fix Localhost issues
  if (sanitized.profileImage && typeof sanitized.profileImage === 'string' && sanitized.profileImage.includes("http://localhost:8000")) {
    sanitized.profileImage = sanitized.profileImage.replace("http://localhost:8000", BASE_URL);
  }

  // 2. Fix Mixed Content issues (Ensuring HTTPS)
  // Ensure we use HTTPS if the current page is HTTPS or if BASE_URL specifies it
  const isPageHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  if (isPageHttps || BASE_URL.startsWith("https://")) {
    if (sanitized.profileImage && typeof sanitized.profileImage === 'string' && sanitized.profileImage.startsWith("http://")) {
      sanitized.profileImage = sanitized.profileImage.replace("http://", "https://");
    }
  }

  return sanitized;
};

// =============================
// Provider Component
// =============================

const UserProvider = ({ children }) => {

  // --- State ---
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConflictModal, setShowConflictModal] = useState(false);

  // --- Effects: Session Management ---

  // Handle 'session-conflict' event triggered by axios interceptor
  useEffect(() => {
    const handleConflict = () => {
      setShowConflictModal(true);
    };

    window.addEventListener('session-conflict', handleConflict);
    return () => window.removeEventListener('session-conflict', handleConflict);
  }, []);

  // Background Session Monitoring (Polls every 20s)
  useEffect(() => {
    let interval;
    if (token && !showConflictModal) {
      interval = setInterval(async () => {
        try {
          await axiosInstance.get('/api/v1/user/session-check');
        } catch (err) {
          // axiosInstance interceptor will dispatch 'session-conflict' on 401
          console.debug("Session check failed, handling via interceptor");
        }
      }, 20000); // 20 seconds
    }
    return () => clearInterval(interval);
  }, [token, showConflictModal]);

  // Initial Load from LocalStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("token");

      if (storedUser && storedToken) {
        const parsedUser = JSON.parse(storedUser);
        setUser(sanitizeUser(parsedUser));
        setToken(storedToken);
      }
    } catch (err) {
      console.error("Corrupted auth data. Clearing storage.");
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update Axios Headers
  useEffect(() => {
    if (token) {
      axiosInstance.defaults.headers.Authorization = `Bearer ${token}`;
    } else {
      delete axiosInstance.defaults.headers.Authorization;
    }
  }, [token]);

  // --- Actions ---

  const updateUser = (userData, jwtToken) => {
    const cleanUser = sanitizeUser(userData);
    setUser(cleanUser);
    setToken(jwtToken);
    localStorage.setItem("user", JSON.stringify(cleanUser));
    localStorage.setItem("token", jwtToken);
  };

  const clearUser = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    delete axiosInstance.defaults.headers.Authorization;
  };

  // --- Context Value ---

  const contextValue = useMemo(
    () => ({
      user,
      token,
      loading,
      updateUser,
      clearUser,
    }),
    [user, token, loading]
  );

  // --- Render ---

  return (
    <UserContext.Provider value={contextValue}>
      {children}
      <SessionConflictModal
        isOpen={showConflictModal}
        onConfirm={() => {
          clearUser();
          window.location.replace("/login");
        }}
      />
    </UserContext.Provider>
  );
};

export default UserProvider;

