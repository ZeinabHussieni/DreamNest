import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../Context/AuthContext";
import { getNotifSocket } from "../../Services/socket/socket";
import {fetchNotifications,deleteAllForUser,deleteNotificationById,markRead as apiMarkRead,markAllRead as apiMarkAllRead,NotificationDto,} from "../../Services/socket/notificationsSocket";
import Swal from "sweetalert2";

export default function useNotifications() {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let didCancel = false;
    let socket: ReturnType<typeof getNotifSocket> | null = null;

    async function boot() {
      if (!isAuthenticated) {
        setItems([]);
        setLoading(false);
        return;
      }

   
      try {
        const initial = await fetchNotifications();
        if (!didCancel) setItems(initial);
      } catch {
        if (!didCancel) setItems([]);
      } finally {
        if (!didCancel) setLoading(false);
      }

    
      socket = getNotifSocket();
      const onNew = (n: NotificationDto) => {
        if (didCancel) return;
        setItems(prev => (prev.some(x => x.id === n.id) ? prev : [n, ...prev]));
      };

      socket.off("newNotification", onNew);
      socket.on("newNotification", onNew);
    }

    boot();


    return () => {
      didCancel = true;
      if (socket) {
        socket.removeAllListeners?.("newNotification");
      }
    };
  }, [isAuthenticated]);

  const unreadCount = useMemo(
    () => items.filter(n => !n.read).length,
    [items]
  );

  const markOneRead = useCallback(async (id: number) => {
    setItems(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    try {
      await apiMarkRead(id);
    } catch {
      setItems(prev => prev.map(n => (n.id === id ? { ...n, read: false } : n)));
    }
  }, []);

  const markAllRead = useCallback(async () => {
    const ids = items.filter(n => !n.read).map(n => n.id);
    if (!ids.length) return;
    setItems(prev => prev.map(n => (n.read ? n : { ...n, read: true })));
    try {
      await apiMarkAllRead(ids);
    } catch {
    }
  }, [items]);


  const removeById = useCallback(async (id: number) => {
  
      const { isConfirmed } = await Swal.fire({
      title: "Delete this notification?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#e0524c",
      cancelButtonColor: "#6f56c5",
      reverseButtons: true,
      focusCancel: true,
      width:400
      });
      if (!isConfirmed) return;
  
      const snapshot = items;
      setItems(prev => prev.filter(p => p.id !== id));
  
     try {
       await deleteNotificationById(id);
  
       await Swal.fire({
         title: "Deleted",
         text: "Notification removed successfully.",
         icon: "success",
         timer: 1200,
         showConfirmButton: false,
       });
      } catch (e: any) {
       setItems(snapshot);
       await Swal.fire({
         title: "Failed",
         text: e?.response?.data?.message || "Failed to delete",
         icon: "error",
       });
      }
    },[items]);

    const removeAll = useCallback(async () => {
  
      const { isConfirmed } = await Swal.fire({
      title: "Delete all notifications?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#e0524c",
      cancelButtonColor: "#6f56c5",
      reverseButtons: true,
      focusCancel: true,
      width:400
      });
      if (!isConfirmed) return;
  
      const snapshot = items;
      setItems([]); 
  
     try {
       await deleteAllForUser();
  
       await Swal.fire({
         title: "Deleted",
         text: "Notifications removed successfully.",
         icon: "success",
         timer: 1200,
         showConfirmButton: false,
       });
      } catch (e: any) {
       setItems(snapshot);
       await Swal.fire({
         title: "Failed",
         text: e?.response?.data?.message || "Failed to delete",
         icon: "error",
       });
      }
    }, [items]);
  



  const activateItem = useCallback((id: number) => {
    markOneRead(id);
  }, [markOneRead]);

  return { items, loading, unreadCount, activateItem, markAllRead,removeById,removeAll } as const;
}
