import axios from "axios";

const configuredBaseUrl = String(import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").trim();
const baseURL = configuredBaseUrl.replace(/\/$/, "");

const api = axios.create({
  baseURL,
  timeout: 120_000,
  headers: {
    Accept: "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      window.dispatchEvent(new Event("critiqon:session-expired"));
    }
    return Promise.reject(error);
  },
);

export default api;
