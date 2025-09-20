import { useEffect, useState } from "react";
import { getLeaderboard, LeaderboardUser } from "../../Services/dashboard/dashboardService";

export default function useLeaderboard(limit = 5) {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getLeaderboard(limit);
        if (!cancelled) setUsers(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load leaderboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [limit]);

  return { users, loading, error };
}
