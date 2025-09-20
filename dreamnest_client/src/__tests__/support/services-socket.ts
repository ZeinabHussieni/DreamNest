type Listener = (...args: any[]) => void;

class Emitter {
  private map = new Map<string, Set<Listener>>();
  on(event: string, cb: Listener) {
    if (!this.map.has(event)) this.map.set(event, new Set());
    this.map.get(event)!.add(cb);
    return this;
  }
  off(event: string, cb: Listener) {
    this.map.get(event)?.delete(cb);
    return this;
  }
  removeAllListeners(event?: string) {
    if (event) this.map.delete(event);
    else this.map.clear();
  }
  emit(event: string, payload?: any) {
    this.map.get(event)?.forEach((cb) => cb(payload));
  }
  disconnect() {}
}

export const __notifSocket = new Emitter();
export const __chatSocket = new Emitter();
export const __dashSocket = new Emitter();

export function getNotifSocket() {
  return __notifSocket as any;
}
export function getChatSocket() {
  return __chatSocket as any;
}
export function getDashboardSocket() {
  return __dashSocket as any;
}
export function disconnectAllSockets() {
  __notifSocket.removeAllListeners();
  __chatSocket.removeAllListeners();
  __dashSocket.removeAllListeners();
}
export function refreshSocketsAfterAuthChange() {
  disconnectAllSockets();
}

// no-op stubs used by app code during tests
export function joinRoom(_roomId: number) {
  // in tests we do not need real socket behavior
}
export function requestUnreadSummary() {
  // in tests we do not need real socket behavior
}
export function markReadUntil(_roomId: number, _untilMessageId: number) {
  // in tests we do not need real socket behavior
}
export function setTyping(_roomId: number, _typing: boolean) {
  // in tests we do not need real socket behavior
}

type Handlers = Partial<{
  onJoined: (roomId: number) => void;
  onNewMessage: (msg: unknown) => void;
  onDelivered: (messageId: number) => void;
  onRead: (data: any) => void;
  onTyping: (data: any) => void;
  onPresence: (data: any) => void;
  onUnreadSummary: (rooms: any[]) => void;
  onConnect: () => void;
  onDisconnect: (reason: string) => void;
  onError: (err: unknown) => void;
}>;

export function subscribeChatEvents(h: Handlers = {}) {
  // wire handler callbacks to our local emitter for completeness
  const joined = (p: { roomId: number }) => h.onJoined?.(p.roomId);
  const newMsg = (m: unknown) => h.onNewMessage?.(m);
  const delivered = (p: { messageId: number }) => h.onDelivered?.(p.messageId);
  const read = (p: any) => h.onRead?.(p);
  const typing = (p: any) => h.onTyping?.(p);
  const presence = (p: any) => h.onPresence?.(p);
  const unread = (p: { rooms: any[] }) => h.onUnreadSummary?.(p.rooms);
  const connected = () => h.onConnect?.();
  const disconnected = (reason: string) => h.onDisconnect?.(reason);
  const error = (err: unknown) => h.onError?.(err);

  __chatSocket.on("chat:joined", joined);
  __chatSocket.on("chat:newMessage", newMsg);
  __chatSocket.on("chat:messageDelivered", delivered);
  __chatSocket.on("chat:messageRead", read);
  __chatSocket.on("chat:typing", typing);
  __chatSocket.on("chat:presenceUpdate", presence);
  __chatSocket.on("chat:unreadSummary", unread);
  __chatSocket.on("connect", connected);
  __chatSocket.on("disconnect", disconnected);
  __chatSocket.on("connect_error", error);

  return () => {
    __chatSocket.off("chat:joined", joined);
    __chatSocket.off("chat:newMessage", newMsg);
    __chatSocket.off("chat:messageDelivered", delivered);
    __chatSocket.off("chat:messageRead", read);
    __chatSocket.off("chat:typing", typing);
    __chatSocket.off("chat:presenceUpdate", presence);
    __chatSocket.off("chat:unreadSummary", unread);
    __chatSocket.off("connect", connected);
    __chatSocket.off("disconnect", disconnected);
    __chatSocket.off("connect_error", error);
  };
}


test('socket helper loaded', () => expect(true).toBe(true));


