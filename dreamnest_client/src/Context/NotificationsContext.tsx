// // src/Context/NotificationsContext.tsx
// import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
// import {
//   getNotifications,
//   getUnreadCount,
//   markNotificationRead,
//   NotificationDTO,
// } from "../Services/notifications/notificationsService";
// import { getNotificationsSocket, reconnectNotificationsSocket } from "../Services/socket/notificationsSocket";
// import { toast } from "react-toastify";

// type Ctx = {
//   items: NotificationDTO[];
//   unread: number;
//   loading: boolean;
//   markRead: (id: number) => Promise<void>;
//   markAllRead: () => Promise<void>;
//   reload: () => Promise<void>;
// };

// const NotificationsContext = createContext<Ctx | null>(null);

// export function useNotifications() {
//   const ctx = useContext(NotificationsContext);
//   if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
//   return ctx;
// }

// type ProviderProps = {
//   getToken: () => string | null; // how we retrieve the JWT
//   userId?: number | null;        // for (re)connecting when login changes
//   children: React.ReactNode;
// };

// export const NotificationsProvider: React.FC<ProviderProps> = ({ getToken, userId, children }) => {
//   const [items, setItems] = useState<NotificationDTO[]>([]);
//   const [unread, setUnread] = useState<number>(0);
//   const [loading, setLoading] = useState(true);
//   const socketRef = useRef<ReturnType<typeof getNotificationsSocket> | null>(null);

//   const load = async () => {
//     try {
//       setLoading(true);
//       const [list, u] = await Promise.all([getNotifications(), getUnreadCount()]);
//       // newest first (or let backend order by createdAt desc)
//       const sorted = [...list].sort(
//         (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
//       );
//       setItems(sorted);
//       setUnread(u.count ?? 0);
//     } catch (e: any) {
//       console.error(e);
//       toast.error(e?.response?.data?.message || "Failed to load notifications");
//       setItems([]);
//       setUnread(0);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     // whenever userId or token changes, (re)connect socket and fetch
//     if (!userId) return;
//     const token = getToken();
//     if (socketRef.current) {
//       // if you rotate tokens on refresh, ensure socket uses fresh token
//       reconnectNotificationsSocket(getToken);
//     }
//     socketRef.current = getNotificationsSocket(getToken);

//     const socket = socketRef.current;

//     const onNew = (n: NotificationDTO) => {
//       setItems(prev => [n, ...prev]);
//       setUnread(prev => prev + (n.read ? 0 : 1));
//     };

//     socket.on("newNotification", onNew);
//     // initial load
//     void load();

//     return () => {
//       socket.off("newNotification", onNew);
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [userId]);

//   const markRead = async (id: number) => {
//     try {
//       await markNotificationRead(id);
//       setItems(prev =>
//         prev.map(n => (n.id === id ? { ...n, read: true } : n))
//       );
//       setUnread(prev => Math.max(0, prev - 1));
//     } catch (e: any) {
//       console.error(e);
//       toast.error(e?.response?.data?.message || "Failed to mark as read");
//     }
//   };

//   const markAllRead = async () => {
//     try {
//       // simple client-side mark all without hitting server one-by-one:
//       // If you want server truth, add a /notifications/mark-all endpoint later.
//       const unreadIds = items.filter(n => !n.read).map(n => n.id);
//       await Promise.all(unreadIds.map(id => markNotificationRead(id)));
//       setItems(prev => prev.map(n => ({ ...n, read: true })));
//       setUnread(0);
//     } catch (e: any) {
//       console.error(e);
//       toast.error(e?.response?.data?.message || "Failed to mark all as read");
//     }
//   };

//   const value = useMemo(
//     () => ({ items, unread, loading, markRead, markAllRead, reload: load }),
//     [items, unread, loading]
//   );

//   return (
//     <NotificationsContext.Provider value={value}>
//       {children}
//     </NotificationsContext.Provider>
//   );
// };
export{}