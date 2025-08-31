import { useEffect, useMemo, useState } from "react";
import {getGoalById,getGoalPlans,togglePlanDone,} from "../../Services/goalDetails/goalDetailsService";
import visionBoardBlobFetch from "../../Services/goalDetails/goalDetailsService";
import getUserService from "../../Services/auth/getUserService"; 

export type Goal = {
  id: number;
  title: string;
  description?: string | null;
  helpText?: string | null;
  visionBoardFilename?: string | null;
  progress?: number | null;
  createdAt?: string;
  updatedAt?: string;
};

export type Plan = {
  id: number;
  title: string;
  description: string;
  due_date?: string | null;
  completed: boolean;
  goal_id?: number;
  createdAt?: string;
  updatedAt?: string;
};

type UseGoalDetailsResult = {
  goal: Goal | null;
  plans: Plan[];
  setPlans: React.Dispatch<React.SetStateAction<Plan[]>>;
  imageUrl?: string;
  deadlineLabel: string;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  onTogglePlan: (planId: number) => Promise<void>;
};

const COINS_EVENT = "coins:update";

export default function useGoalDetails(goalId: number): UseGoalDetailsResult {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    try {
      setLoading(true);
      setError(null);
      const [g, p] = await Promise.all([getGoalById(goalId), getGoalPlans(goalId)]);
      setGoal(g as Goal);
      setPlans(Array.isArray(p) ? (p as Plan[]) : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load goal");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (Number.isFinite(goalId)) void reload();
  }, [goalId]);


  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | undefined;

    (async () => {
      const filename = goal?.visionBoardFilename ?? undefined;
      if (!filename) {
        setImageUrl(undefined);
        return;
      }
      try {
        const blob = await visionBoardBlobFetch(filename);
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setImageUrl(objectUrl);
      } catch {
        if (!cancelled) setImageUrl(undefined);
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [goal?.visionBoardFilename]);

  const deadline = useMemo(() => {
    const latest = plans.reduce<number>((max, pl) => {
      const t = new Date(pl?.due_date || 0).getTime();
      return Number.isNaN(t) ? max : Math.max(max, t);
    }, 0);
    return latest ? new Date(latest) : null;
  }, [plans]);

  const deadlineLabel = deadline
    ? deadline.toLocaleDateString(undefined, { month: "short", year: "numeric" })
    : "—";

  const calcProgress = (arr: Plan[]) => {
    if (!arr.length) return 0;
    const done = arr.reduce((n, p) => n + (p.completed ? 1 : 0), 0);
    return Math.round((done / arr.length) * 100);
  };

  const onTogglePlan = async (planId: number) => {
   
    setPlans(prev => {
      const next = prev.map(p => (p.id === planId ? { ...p, completed: !p.completed } : p));
      setGoal(g => (g ? { ...g, progress: calcProgress(next) } : g));
      return next;
    });

    try {
      const res = (await togglePlanDone(planId)) as any;

      if (res?.progress != null) {
        setGoal(g => (g ? { ...g, progress: Number(res.progress) } : g));
      }

  
      try {
        const me = await getUserService();
        const coinsVal = Number(me?.coins) || 0;
        window.dispatchEvent(new CustomEvent(COINS_EVENT, { detail: { value: coinsVal } }));
      } catch (e) {
    
        console.error("Failed to refresh coins after toggle", e);
      }
    } catch {
 
      setPlans(prev => {
        const next = prev.map(p => (p.id === planId ? { ...p, completed: !p.completed } : p));
        setGoal(g => (g ? { ...g, progress: calcProgress(next) } : g));
        return next;
      });
    }
  };

  return { goal, plans, setPlans, imageUrl, deadlineLabel, loading, error, reload, onTogglePlan };
}
