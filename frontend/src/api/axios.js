import axios from "axios";

// Use VITE_API_URL from .env (the single source of truth).
// Fallback: if running locally without the env var set, default to localhost:5000.
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://pausetu.onrender.com/api";

const instance = axios.create({
  baseURL: API_BASE_URL,
  // 30 seconds — covers Render free-tier cold start (10–30 s) and slow connections.
  // The old 8000 ms caused every cold-start request to fail with "Network Error".
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token automatically
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("pashusetu_admin_token");

    if (token) {
      if (config.headers && typeof config.headers.set === "function") {
        config.headers.set("Authorization", `Bearer ${token}`);
      } else if (config.headers) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle responses
instance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.warn("[API Warning]", error.message);
    return Promise.reject(error);
  }
);

export const axiosInstance = instance;
export const api = instance;

export default instance;
