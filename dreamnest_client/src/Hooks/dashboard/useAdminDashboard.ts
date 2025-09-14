import { useEffect, useState, useCallback } from "react";
import { fetchAdminDashboard, AdminDashboard } from "../../Services/dashboard/adminDashboardService";

export default function useAdminDashboard() {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setErr(null);
      const d = await fetchAdminDashboard();
      setData(d);
    } catch (e: any) {
      setErr(e?.message || "Failed to load admin dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error: err, refresh: load } as const;
}
