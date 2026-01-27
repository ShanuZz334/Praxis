import {
  createContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import axiosInstance from "@/shared/utils/axiosInstance.js";
import { BASE_URL } from "@/shared/utils/apiPaths.js";

export const UserContext = createContext(null);

// Helper to fix mixed content issues (localhost images in production)
const sanitizeUser = (userData) => {
  if (!userData) return null;

  let sanitized = { ...userData };

  // 1. Fix Localhost issues
  if (sanitized.profileImageUrl && sanitized.profileImageUrl.includes("http://localhost:8000")) {
    sanitized.profileImageUrl = sanitized.profileImageUrl.replace("http://localhost:8000", BASE_URL);
  }

  if (sanitized.profileImage && typeof sanitized.profileImage === 'string' && sanitized.profileImage.includes("http://localhost:8000")) {
    sanitized.profileImage = sanitized.profileImage.replace("http://localhost:8000", BASE_URL);
  }

  // 2. Fix Mixed Content issues (Ensuring HTTPS)
  // Ensure we use HTTPS if the current page is HTTPS or if BASE_URL specifies it
  const isPageHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  if (isPageHttps || BASE_URL.startsWith("https://")) {
    if (sanitized.profileImageUrl && sanitized.profileImageUrl.startsWith("http://")) {
      sanitized.profileImageUrl = sanitized.profileImageUrl.replace("http://", "https://");
    }
    if (sanitized.profileImage && typeof sanitized.profileImage === 'string' && sanitized.profileImage.startsWith("http://")) {
      sanitized.profileImage = sanitized.profileImage.replace("http://", "https://");
    }
  }

  return sanitized;
};

const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (token) {
      axiosInstance.defaults.headers.Authorization = `Bearer ${token}`;
    } else {
      delete axiosInstance.defaults.headers.Authorization;
    }
  }, [token]);

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

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;
