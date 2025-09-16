import axios, { AxiosError } from "axios";

const API_BASE =
  (import.meta as any)?.env?.VITE_API_URL ||
  (process.env as any)?.REACT_APP_API_URL ||
  `${window.location.protocol}//${window.location.hostname}:3000`;

const api = axios.create({
  baseURL: API_BASE,
  timeout: 900000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token") || localStorage.getItem("access_token");
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).set?.("Authorization", `Bearer ${token}`);
  }
  if (!(config.data instanceof FormData)) {
    (config.headers as any).set?.("Content-Type", "application/json");
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<any>) => {
    const status = err.response?.status;
    const payload = err.response?.data as any;

    if (status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      localStorage.removeItem("userId");

      window.location.href = "/login";
    }

    const clean = new Error(
      payload?.error?.message || payload?.message || err.message || "Request failed"
    ) as any;
    clean.status = status ?? 0;
    clean.errors = payload?.error?.errors || payload?.errors || {};
    return Promise.reject(clean);
  }
);

export default api;
