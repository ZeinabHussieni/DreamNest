// api.ts
import axios, { AxiosError } from "axios";

const API_BASE =
  (import.meta as any)?.env?.VITE_API_URL ||
  (process.env as any)?.REACT_APP_API_URL ||
  `${window.location.protocol}//${window.location.hostname}:3000`;

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token") || localStorage.getItem("access_token");
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<any>) => {
    const payload = err.response?.data as any;
    const clean = new Error(
      payload?.error?.message || payload?.message || err.message || "Request failed"
    ) as any;
    clean.status = err.response?.status ?? 0;
    clean.errors = payload?.error?.errors || payload?.errors || {};
    return Promise.reject(clean);
  }
);

export default api;
