import { useEffect, useState } from "react";
import { getGoalsDetails, getGoalsStatus } from "../../Services/goalDetails/goalDetailsService";
import type { Goal } from "../goalDetails/useGoalDetails";

export default function useGoalsList(status?: string) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = async (s?: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const data = (s ? await getGoalsStatus(s) : await getGoalsDetails()) as any;
      const items = Array.isArray(data) ? data : (data?.data ?? data?.items ?? []);
      setGoals(Array.isArray(items) ? (items as Goal[]) : []);
    } catch (err: any) {
      console.error("Error fetching goals:", err);
      setError(err?.message || "Failed to load goals");
      setGoals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchGoals(status);
  }, [status]);

  const reload = () => fetchGoals(status);

  return { goals, setGoals, loading, error, reload };
}
