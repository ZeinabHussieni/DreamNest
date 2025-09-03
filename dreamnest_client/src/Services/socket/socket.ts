import { io, Socket } from "socket.io-client";

const WS_BASE =
  (import.meta as any)?.env?.VITE_WS_URL ||
  (process.env as any)?.REACT_APP_WS_URL ||
  `${window.location.protocol}//${window.location.hostname}:3000`;

let chatSocketRef: Socket | null = null;
let notifSocketRef: Socket | null = null;
let dashSocketRef: Socket | null = null;

function buildAuthPayload() {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    undefined;

  let userId: number | undefined;
  const raw = localStorage.getItem("user");
  if (raw) {
    try {
      const u = JSON.parse(raw);
      const id = Number(u?.id || u?.user?.id);
      if (Number.isFinite(id)) userId = id;
    } catch {}
  }
  if (!userId) {
    const uid = Number(localStorage.getItem("userId"));
    if (Number.isFinite(uid)) userId = uid;
  }
  return { token, userId };
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
      auth: buildAuthPayload(),
    });
  }
  return notifSocketRef;
}

export function getDashboardSocket(): Socket {
  if (!dashSocketRef) {
    dashSocketRef = io(`${WS_BASE}/dashboard`, {
      withCredentials: true,
      transports: ["websocket"],
      auth: buildAuthPayload(),
    });
  }
  return dashSocketRef;
}

export function disconnectAllSockets() {
  chatSocketRef?.disconnect();
  notifSocketRef?.disconnect();
  dashSocketRef?.disconnect();
  chatSocketRef = notifSocketRef = dashSocketRef = null;
}

export function refreshSocketsAfterAuthChange() {
  disconnectAllSockets();
}
