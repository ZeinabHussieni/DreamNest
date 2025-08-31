import { useEffect, useMemo, useState } from "react";
import {Connection,getConnections,acceptConnection,rejectConnection,} from "../../Services/connections/connectionsService";
import { toast } from "react-toastify";

function isConnection(x: any): x is Connection {
  return !!x && typeof x.id === "number" && typeof x.helper_id === "number" && typeof x.seeker_id === "number";
}

export default function useConnections(currentUserId: number) {
  const [items, setItems] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const onAccept = async (id: number) => {

    setItems((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              helperDecision: c.helper_id === currentUserId ? "accepted" : c.helperDecision,
              seekerDecision: c.seeker_id === currentUserId ? "accepted" : c.seekerDecision,
            }
          : c
      )
    );

    try {
      const { connection, chatRoom } = await acceptConnection(id);
      if (isConnection(connection)) {
        setItems((prev) => prev.map((c) => (c.id === id ? connection : c)));
        chatRoom
          ? toast.success("You're connected! Chat room created.")
          : toast.info("Accepted. Waiting for the other user.");
      } else {
        await reload();
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to accept");
      await reload();
    }
  };

  const onReject = async (id: number) => {
 
    setItems((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: "rejected",
              helperDecision: c.helper_id === currentUserId ? "rejected" : c.helperDecision,
              seekerDecision: c.seeker_id === currentUserId ? "rejected" : c.seekerDecision,
            }
          : c
      )
    );

    try {
      const { connection } = await rejectConnection(id);
      if (isConnection(connection)) {
        setItems((prev) => prev.map((c) => (c.id === id ? connection : c)));
        toast.success("Request removed.");
      } else {
        await reload();
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to reject");
      await reload();
    }
  };

  return { connections: pendingForMe, loading, error, reload, onAccept, onReject };
}
