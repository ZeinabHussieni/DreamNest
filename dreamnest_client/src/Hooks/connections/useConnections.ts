import { useEffect, useMemo, useState, useRef } from "react";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import {Connection,getConnections,acceptConnection,rejectConnection,} from "../../Services/connections/connectionsService";

function isConnection(x: any): x is Connection {
  return (
    !!x &&
    typeof x.id === "number" &&
    typeof x.helper_id === "number" &&
    typeof x.seeker_id === "number"
  );
}

export default function useConnections(currentUserId: number) {
  const [items, setItems] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const inFlight = useRef<Set<number>>(new Set());

  const reload = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getConnections();
      setItems(Array.isArray(data) ? data.filter(isConnection) : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load connections");
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUserId) void reload();
  }, [currentUserId]);

  const pendingForMe = useMemo(() => {
    return items.filter((c) => {
      const iAmHelper = c.helper_id === currentUserId;
      const iAmSeeker = c.seeker_id === currentUserId;
      if (iAmHelper) return c.helperDecision === "pending";
      if (iAmSeeker) return c.seekerDecision === "pending";
      return false;
    });
  }, [items, currentUserId]);

  const confirm = async (opts: {
    title: string;
    text?: string;
    confirmText?: string;
    icon?: "warning" | "question";
  }) => {
    const { isConfirmed } = await Swal.fire({
      title: opts.title,
      text: opts.text,
      icon: opts.icon ?? "question",
      showCancelButton: true,
      confirmButtonText: opts.confirmText ?? "Yes",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#6f56c5", 
      cancelButtonColor: "#9ca3af",
      reverseButtons: true,
      focusCancel: true,
      width: 420,
    });
    return isConfirmed;
  };

  const onAccept = async (id: number) => {
    if (inFlight.current.has(id)) return;
    const ok = await confirm({
      title: "Accept this request?",
      text: "You’ll be connected. If both accept, a chat opens.",
      icon: "question",
      confirmText: "Accept",
    });
    if (!ok) return;

    inFlight.current.add(id);
    const snapshot = items;

    setItems((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              helperDecision:
                c.helper_id === currentUserId ? "accepted" : c.helperDecision,
              seekerDecision:
                c.seeker_id === currentUserId ? "accepted" : c.seekerDecision,
            }
          : c
      )
    );

    try {
      const { connection, chatRoom } = await acceptConnection(id);
      if (isConnection(connection)) {
        setItems((prev) => prev.map((c) => (c.id === id ? connection : c)));
        if (chatRoom) {
          await Swal.fire({
            title: "Connected 🎉",
            text: "Chat room created — say hi!",
            icon: "success",
            timer: 1400,
            showConfirmButton: false,
          });
        } else {
          toast.info("Accepted. Waiting for the other user.");
        }
      } else {
        await reload();
      }
    } catch (e: any) {
      setItems(snapshot); 
      await Swal.fire({
        title: "Failed",
        text: e?.response?.data?.message || "Failed to accept request",
        icon: "error",
      });
    } finally {
      inFlight.current.delete(id);
    }
  };

  const onReject = async (id: number) => {
    if (inFlight.current.has(id)) return;
    const ok = await confirm({
      title: "Reject this request?",
      text: "They won’t be able to connect unless they send again.",
      icon: "warning",
      confirmText: "Reject",
    });
    if (!ok) return;

    inFlight.current.add(id);
    const snapshot = items;

    setItems((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: "rejected",
              helperDecision:
                c.helper_id === currentUserId ? "rejected" : c.helperDecision,
              seekerDecision:
                c.seeker_id === currentUserId ? "rejected" : c.seekerDecision,
            }
          : c
      )
    );

    try {
      const { connection } = await rejectConnection(id);
      if (isConnection(connection)) {
        setItems((prev) => prev.map((c) => (c.id === id ? connection : c)));
        await Swal.fire({
          title: "Removed",
          text: "Request removed successfully.",
          icon: "success",
          timer: 1000,
          showConfirmButton: false,
        });
      } else {
        await reload();
      }
    } catch (e: any) {
      setItems(snapshot);
      await Swal.fire({
        title: "Failed",
        text: e?.response?.data?.message || "Failed to reject request",
        icon: "error",
      });
    } finally {
      inFlight.current.delete(id);
    }
  };

  return {
    connections: pendingForMe,
    loading,
    error,
    reload,
    onAccept,
    onReject,
  };
}
