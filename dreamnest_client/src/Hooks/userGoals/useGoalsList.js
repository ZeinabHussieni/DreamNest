import { useEffect, useState, useCallback } from "react";
import { getGoalsDetails, getGoalsStatus } from "../../Services/goalDetails/goalDetailsService";

/**
 * status: undefined | "in-progress" | "completed"
 * - undefined => all goals
 */
const useGoalsList = (status) => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data  = status ? await getGoalsStatus(status) : await getGoalsDetails();
      const items = Array.isArray(data) ? data : (data?.data ?? data?.items ?? []);
      setGoals(items);
    } catch (err) {
      console.error("Error fetching goals:", err);
      setError("Failed to load goals");
    } finally {
      setLoading(false);
    }
  }, [status]); // 🔑 refetch when status changes

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  return { goals, setGoals, loading, error, reload: fetchGoals };
};

export default useGoalsList;
