import { useEffect, useState } from "react";
import { fetchAdminDashboard, AdminDashboard } from "../../Services/dashboard/adminDashboardService";
import { getDashboardSocket } from "../../Services/socket/socket";

export default function useAdminDashboard() {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const s = getDashboardSocket(true); 

    const onData = (payload: AdminDashboard) => { if (!cancelled) setData(payload); };
    const onUpdate = (payload: AdminDashboard) => { if (!cancelled) setData(payload); };

    (async () => {
      try {
        const snap = await fetchAdminDashboard();
        if (!cancelled) setData(snap);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Failed to load admin dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    s.off("adminDashboardData", onData);
    s.off("adminDashboardUpdate", onUpdate);
    s.on("adminDashboardData", onData);
    s.on("adminDashboardUpdate", onUpdate);

    s.emit("getAdminDashboard"); 

    return () => {
      cancelled = true;
      s.off("adminDashboardData", onData);
      s.off("adminDashboardUpdate", onUpdate);
    };
  }, []);

  return { data, loading, error: err } as const;
}
