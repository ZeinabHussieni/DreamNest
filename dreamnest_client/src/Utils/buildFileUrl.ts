import api from "../Services/axios/axios";

export const buildFileUrl = (url?: string): string => {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;

  const base = (api.defaults.baseURL ?? "").replace(/\/+$/, "");
  const path = url.replace(/^\/+/, "");
  return `${base}/${path}`;
};
