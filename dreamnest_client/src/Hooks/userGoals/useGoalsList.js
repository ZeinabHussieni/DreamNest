import { useEffect, useState } from "react";
import { getGoalsDetails, getGoalsStatus } from "../../Services/goalDetails/goalDetailsService";

const useGoalsList = (status) => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  const fetchGoals = async (s = status) => {
    setLoading(true);
    setError(null);
    try {
      const data  = s ? await getGoalsStatus(s) : await getGoalsDetails();
      const items = Array.isArray(data) ? data : (data?.data ?? data?.items ?? []);
      setGoals(items);
    } catch (err) {
      console.error("Error fetching goals:", err);
      setError("Failed to load goals");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchGoals(status);
  }, [status]);


  const reload = () => fetchGoals(status);

  return { goals, setGoals, loading, error, reload };
};

export default useGoalsList;
