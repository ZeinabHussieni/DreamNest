// src/Services/axios/axios.ts
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { refreshSocketsAfterAuthChange } from "../socket/socket";

const API_BASE =
  (import.meta as any)?.env?.VITE_API_URL ||
  (process.env as any)?.REACT_APP_API_URL ||
  `${window.location.protocol}//${window.location.hostname}:3000`;

function getAccessToken(): string | null {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    null
  );
}
function getRefreshToken(): string | null {
  return localStorage.getItem("refreshToken") || null;
}
function setTokens(access: string, refresh?: string) {
  localStorage.setItem("token", access);
  localStorage.setItem("access_token", access);
  if (refresh) localStorage.setItem("refreshToken", refresh);
  refreshSocketsAfterAuthChange(); // make sockets reconnect with fresh auth
}
function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("access_token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  localStorage.removeItem("userId");
  refreshSocketsAfterAuthChange();
}

const api = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});

// ---- Request: attach bearer if present
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---- Refresh helpers
let isRefreshing = false;
let pendingQueue: Array<(token?: string) => void> = [];

function subscribeTokenRefresh(cb: (token?: string) => void) {
  pendingQueue.push(cb);
}
function onRefreshed(token?: string) {
  pendingQueue.forEach((cb) => cb(token));
  pendingQueue = [];
}

async function refreshAccessToken(): Promise<string> {
  const rt = getRefreshToken();
  if (!rt) throw new Error("No refresh token");

  const res = await axios.post(
    `${API_BASE}/auth/refresh`,
    {},
    { headers: { Authorization: `Bearer ${rt}` } }
  );
  const data = res.data || {};
  const newAccess =
    data.accessToken || data.access_token || data.token || data?.data?.accessToken;
  const newRefresh = data.refreshToken || data.refresh_token;

  if (!newAccess) throw new Error("Invalid refresh payload");
  setTokens(newAccess, newRefresh);
  return newAccess;
}

// ---- Response: error handling + refresh retry
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<any>) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;

    // If 401 and we haven't retried yet => try refresh
    if (status === 401 && original && !original._retry) {
      original._retry = true;

      if (isRefreshing) {
        // wait for ongoing refresh
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((token) => {
            if (!token) return reject(error);
            original.headers = original.headers ?? {};
            (original.headers as any).Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }

      try {
        isRefreshing = true;
        const newToken = await refreshAccessToken();
        isRefreshing = false;
        onRefreshed(newToken);

        original.headers = original.headers ?? {};
        (original.headers as any).Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (e) {
        isRefreshing = false;
        onRefreshed(undefined);
        clearAuth();
        // Bubble the original 401
        return Promise.reject(error);
      }
    }

    // Build a normalized error for the app
    const payload = (error.response?.data as any) || {};
    const norm: any = new Error(
      payload?.error?.message ||
        payload?.message ||
        error.message ||
        "Request failed"
    );
    norm.errors = payload?.error?.errors || payload?.errors || {};
    norm.status = status ?? 0;

    return Promise.reject(norm);
  }
);

export default api;
