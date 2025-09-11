import { io, Socket } from "socket.io-client";


let chatSocketRef: Socket | null = null;
let notifSocketRef: Socket | null = null;
let dashSocketRef: Socket | null = null;
let chatAuthSig: string | null = null;
let notifAuthSig: string | null = null;
let dashAuthSig: string | null = null;
type ErrorEvt = { code: string; message: string };

//for token
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
      const id = Number(u?.id ?? u?.user?.id);
      if (Number.isFinite(id)) userId = id;
    } catch {}
  }
  if (!userId) {
    const uid = Number(localStorage.getItem("userId"));
    if (Number.isFinite(uid)) userId = uid;
  }
  return { token, userId };
}

const WS_BASE =
  (import.meta as any)?.env?.VITE_WS_URL ||
  (process.env as any)?.REACT_APP_WS_URL ||
  `${window.location.protocol}//${window.location.hostname}:3000`;

function authSig(a: { token?: string; userId?: number }) {
  return `${a.userId || 0}:${(a.token || '').slice(0, 16)}`;
}

//to make all namespaces use the same consistent behavior
function makeOptions() {
  return {
    withCredentials: true,
    transports: ["websocket" as const],
    auth: buildAuthPayload(),
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 500,
    timeout: 8000,
  };
}

export function getChatSocket(): Socket {
  const auth = buildAuthPayload();
  const sig = authSig(auth);
  if (!chatSocketRef || chatAuthSig !== sig) {
    chatSocketRef?.disconnect();
    chatSocketRef = io(`${WS_BASE}/chat`, makeOptions());
    chatAuthSig = sig;
  }
  return chatSocketRef;
}

export function getNotifSocket(): Socket {
  const auth = buildAuthPayload();
  const sig = authSig(auth);
  if (!notifSocketRef || notifAuthSig !== sig) {
    notifSocketRef?.disconnect();
    notifSocketRef = io(`${WS_BASE}/notifications`, makeOptions());
    notifAuthSig = sig;
  }
  return notifSocketRef;
}

export function getDashboardSocket(): Socket {
  if (!dashSocketRef) dashSocketRef = io(`${WS_BASE}/dashboard`, makeOptions());
  return dashSocketRef;
}


export function disconnectAllSockets() {
  chatSocketRef?.disconnect();
  notifSocketRef?.disconnect();
  dashSocketRef?.disconnect();
  chatSocketRef = notifSocketRef = dashSocketRef = null;
  chatAuthSig = notifAuthSig = dashAuthSig = null;
}

export function refreshSocketsAfterAuthChange() {
  disconnectAllSockets();
}



export function joinRoom(roomId: number) {
  const s = getChatSocket();
  const { userId } = buildAuthPayload();
  if (userId) s.emit("joinRoom", { chatRoomId: roomId, userId });
}

export function requestUnreadSummary() {
  const s = getChatSocket();
  const { userId } = buildAuthPayload();
  if (userId) s.emit("chat:requestUnreadSummary", { userId });
}

export function markReadUntil(roomId: number, untilMessageId: number) {
  const s = getChatSocket();
  const { userId } = buildAuthPayload();
  if (userId) s.emit("chat:markReadUntil", { roomId, userId, untilMessageId });
}

export function setTyping(roomId: number, typing: boolean) {
  const s = getChatSocket();
  const { userId } = buildAuthPayload();
  if (userId) s.emit("chat:typing", { roomId, userId, typing });
}



export type UnreadSummaryItem = {
  roomId: number;
  count: number;
  firstUnreadId: number | null;
};

//type shapes for events the server emits so the rest of app reducers thunks can be strongly typed
type JoinedEvt = { roomId: number };
type DeliveredEvt = { messageId: number };
type ReadEvt = { roomId: number; untilMessageId: number; readerId: number };
type TypingEvt = { roomId: number; userId: number; typing: boolean };
type PresenceEvt = { userId: number; online: boolean };
type UnreadEvt = { rooms: UnreadSummaryItem[] };

//make every callback optional resuable 
type Handlers = Partial<{
  onJoined: (roomId: number) => void;
  onNewMessage: (msg: unknown) => void;
  onDelivered: (messageId: number) => void;
  onRead: (data: ReadEvt) => void;
  onTyping: (data: TypingEvt) => void;
  onPresence: (data: PresenceEvt) => void;
  onUnreadSummary: (rooms: UnreadSummaryItem[]) => void;
  onConnect: () => void;
  onDisconnect: (reason: string) => void;
  onError: (err: unknown) => void;
}>;

//prevents memory leaks and duplicate event handling if the view re-mounts
export function subscribeChatEvents(h: Handlers = {}) {
  const s = getChatSocket();

  const joined = (p: JoinedEvt) => h.onJoined?.(p.roomId);
  const newMsg = (m: unknown) => h.onNewMessage?.(m);
  const delivered = (p: DeliveredEvt) => h.onDelivered?.(p.messageId);
  const read = (p: ReadEvt) => h.onRead?.(p);
  const typing = (p: TypingEvt) => h.onTyping?.(p);
  const presence = (p: PresenceEvt) => h.onPresence?.(p);
  const unread = (p: UnreadEvt) => h.onUnreadSummary?.(p.rooms);
  const connected = () => h.onConnect?.();
  const disconnected = (reason: string) => h.onDisconnect?.(reason);
  const error = (err: unknown) => h.onError?.(err);
  const errorEvt = (p: ErrorEvt) => h.onError?.(p);


  s.on("chat:joined", joined);
  s.on("chat:newMessage", newMsg);
  s.on("chat:messageDelivered", delivered);
  s.on("chat:messageRead", read);
  s.on("chat:typing", typing);
  s.on("chat:presenceUpdate", presence);
  s.on("chat:unreadSummary", unread);
  s.on("connect", connected);
  s.on("disconnect", disconnected);
  s.on("connect_error", error);
  s.on("chat:error", errorEvt);

  // if user out
  return () => {
    s.off("chat:joined", joined);
    s.off("chat:newMessage", newMsg);
    s.off("chat:messageDelivered", delivered);
    s.off("chat:messageRead", read);
    s.off("chat:typing", typing);
    s.off("chat:presenceUpdate", presence);
    s.off("chat:unreadSummary", unread);
    s.off("connect", connected);
    s.off("disconnect", disconnected);
    s.off("connect_error", error);
    s.off("chat:error", errorEvt);
  };
}
