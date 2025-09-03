import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchDashboard, DashboardDto } from "../../Services/dashboard/dashboardService";
import { getDashboardSocket } from "../../Services/socket/socket";

export default function useDashboard() {
  const [data, setData] = useState<DashboardDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let didCancel = false;
    const s = getDashboardSocket();

    const onData = (payload: DashboardDto) => {
      if (!didCancel) setData(payload);
    };
    const onUpdate = (payload: DashboardDto) => {
      if (!didCancel) setData(payload);
    };

    (async () => {
      try {
        const initial = await fetchDashboard();
        if (!didCancel) setData(initial);
      } finally {
        if (!didCancel) setLoading(false);
      }
    })();

    s.off("dashboardData", onData);
    s.off("dashboardUpdate", onUpdate);
    s.on("dashboardData", onData);
    s.on("dashboardUpdate", onUpdate);


    s.emit("getDashboard", {});

    return () => {
      didCancel = true;
      s.off("dashboardData", onData);
      s.off("dashboardUpdate", onUpdate);
    };
  }, []);

  const completionPct = useMemo(() => {
    if (!data || data.totalGoals === 0) return 0;
    return Math.round((data.completedGoals / data.totalGoals) * 100);
  }, [data]);

  const inProgressPct = useMemo(() => {
    if (!data || data.totalGoals === 0) return 0;
    return Math.round((data.inProgressGoals / data.totalGoals) * 100);
  }, [data]);

  const refresh = useCallback(() => {
    try {
      getDashboardSocket().emit("getDashboard", {});
    } catch {}
  }, []);

  return { data, loading, completionPct, inProgressPct, refresh } as const;
}
