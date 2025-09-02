import { useEffect, useMemo, useState } from "react";
import { getNotifSocket } from "../../Services/socket/socket";
import {fetchNotifications,markRead,markAllRead,NotificationDto,} from "../../Services/socket/notificationsSocket";

export default function useNotifications() {
  const [items, setItems] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let didCancel = false;

    (async () => {
      try {
        const initial = await fetchNotifications();
        if (!didCancel) setItems(initial);
      } finally {
        if (!didCancel) setLoading(false);
      }

   
      const s = getNotifSocket();
      const onNew = (n: NotificationDto) => {
        if (!didCancel) setItems((prev) => [n, ...prev]);
      };

    
      s.off("newNotification", onNew);
      s.on("newNotification", onNew);

    
      return () => {
        s.off("newNotification", onNew);
      };
    })();

    return () => {
      didCancel = true;
    };
  }, []);

  const unreadCount = useMemo(
    () => items.filter((n) => !n.read).length,
    [items]
  );

  async function handleMarkRead(id: number) {
    const idx = items.findIndex((n) => n.id === id);
    if (idx === -1 || items[idx].read) return;

   
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

    try {
      await markRead(id);
    } catch {

      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: false } : n)));
    }
  }

  async function handleMarkAllRead() {
    const ids = items.filter((n) => !n.read).map((n) => n.id);
    if (!ids.length) return;


    setItems((prev) => prev.map((n) => (n.read ? n : { ...n, read: true })));

    try {
      await markAllRead(ids);
    } catch {
  
    }
  }

  return {
    items,
    loading,
    unreadCount,
    markRead: handleMarkRead,
    markAllRead: handleMarkAllRead,
  } as const;
}
