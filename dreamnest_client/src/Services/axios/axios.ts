import axios from "axios";

const API_BASE = "http://localhost:3000";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});


api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});


api.interceptors.response.use(
  (response) => response, 
  (error) => {
    const payload = error?.response?.data;
    const status = payload?.statusCode || error?.response?.status;

    if (status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.replace("/login");
    
      return;
    }

 
    const err: any = new Error(
      payload?.error?.message || payload?.message || error.message || "Request failed"
    );
    err.errors = payload?.error?.errors || payload?.errors || {};
    err.status = status;
    return Promise.reject(err);
  }
);

export default api;
