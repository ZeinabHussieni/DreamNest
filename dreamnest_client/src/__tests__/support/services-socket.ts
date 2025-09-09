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


test('socket helper loaded', () => expect(true).toBe(true));


