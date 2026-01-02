import axios from "axios";
import { BASE_URL } from "./apiPaths";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
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
    // Network / timeout error
    if (!error.response) {
      console.error("Network error or server unreachable");
      return Promise.reject(error);
    }

    const { status } = error.response;

    // Unauthorized → logout once
    if (status === 401) {
      localStorage.removeItem("user");
      localStorage.removeItem("token");

      // Prevent redirect loop
      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }

    // Server error
    if (status >= 500) {
      console.error("Server error. Please try again later.");
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
