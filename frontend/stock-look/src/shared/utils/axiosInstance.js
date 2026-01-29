import axios from "axios";
import { BASE_URL } from "@/shared/utils/apiPaths";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/* -------------------------------------------
   REQUEST INTERCEPTOR
-------------------------------------------- */
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

/* -------------------------------------------
   RESPONSE INTERCEPTOR
-------------------------------------------- */
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

      // If it's a session conflict, don't redirect yet. 
      // Let the UI handle it via an event.
      if (message.includes("Internal Session Conflict")) {
        window.dispatchEvent(new CustomEvent('session-conflict', { detail: message }));
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
