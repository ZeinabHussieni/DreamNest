import { io, Socket } from "socket.io-client";

const WS_BASE =
  (import.meta as any)?.env?.VITE_WS_URL ||
  (process.env as any)?.REACT_APP_WS_URL ||
  `${window.location.protocol}//${window.location.hostname}:3000`;

let chatSocketRef: Socket | null = null;
let notifSocketRef: Socket | null = null;


function getStoredToken(): string | undefined {
  const t1 = localStorage.getItem("token") || undefined;
  const t2 = localStorage.getItem("access_token") || undefined;
  return t1 ?? t2;
}

function getStoredUserId(): number | undefined {
  const raw = localStorage.getItem("user");
  if (raw) {
    try {
      const u = JSON.parse(raw);
      const id = Number(u?.id || u?.user?.id);
      if (Number.isFinite(id)) return id;
    } catch {}
  }
  const uid = Number(localStorage.getItem("userId"));
  return Number.isFinite(uid) ? uid : undefined;
}

function authPayload() {
  return {
    token: getStoredToken(),
    userId: getStoredUserId(),
  };
}

export function getChatSocket(): Socket {
  if (!chatSocketRef) {
    chatSocketRef = io(`${WS_BASE}/chat`, {
      withCredentials: true,
      transports: ["websocket"],
    });
  }
  return chatSocketRef;
}

export function getNotifSocket(): Socket {
  if (!notifSocketRef) {
    notifSocketRef = io(`${WS_BASE}/notifications`, {
      withCredentials: true,
      transports: ["websocket"],
      auth: authPayload,
    });
  }
  return notifSocketRef;
}

export function disconnectAllSockets() {
  chatSocketRef?.disconnect();
  notifSocketRef?.disconnect();
  chatSocketRef = null;
  notifSocketRef = null;
}

export function refreshSocketsAfterAuthChange() {
  disconnectAllSockets();
}
