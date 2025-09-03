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


const api = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});


let isRefreshing = false;
let pendingQueue: Array<(token?: string) => void> = [];

function subscribeTokenRefresh(cb: (token?: string) => void) {
  pendingQueue.push(cb);
}


api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<any>) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;


    if (status === 401 && original && !original._retry) {
      original._retry = true;

      if (isRefreshing) {
    
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((token) => {
            if (!token) return reject(error);
            original.headers = original.headers ?? {};
            (original.headers as any).Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }

    }


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
