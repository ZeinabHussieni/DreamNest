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
  imageUrl?: string;
  deadlineLabel: string;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  onTogglePlan: (planId: number) => Promise<void>;
  isLocked: (planId: number) => boolean;
};


const calcProgress = (arr: Plan[]) =>
  arr.length ? Math.round((arr.filter(p => p.completed).length / arr.length) * 100) : 0;

const orderPlans = (arr: Plan[]) =>
  [...arr].sort((a, b) => {
    const ta = new Date(a?.createdAt ?? 0).getTime();
    const tb = new Date(b?.createdAt ?? 0).getTime();
    if (!Number.isNaN(ta) && !Number.isNaN(tb) && ta !== tb) return ta - tb;
    return (a.id ?? 0) - (b.id ?? 0);
  });

const COINS_EVENT = "coins:update";

const ENFORCE_STRICT_UNCHECK = false;

export default function useGoalDetails(goalId: number): UseGoalDetailsResult {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [plansRaw, setPlansRaw] = useState<Plan[]>([]);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    try {
      setLoading(true);
      setError(null);
      const [g, p] = await Promise.all([getGoalById(goalId), getGoalPlans(goalId)]);
      setGoal(g as Goal);
      setPlansRaw(Array.isArray(p) ? (p as Plan[]) : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load goal");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (Number.isFinite(goalId)) void reload();
  }, [goalId]);

  const plans = useMemo(() => orderPlans(plansRaw), [plansRaw]);


  const firstOpenIdx = useMemo(() => plans.findIndex(p => !p.completed), [plans]);


  const isLocked = (planId: number) => {
    const idx = plans.findIndex(p => p.id === planId);
    if (idx === -1) return true;
    if (firstOpenIdx === -1) return false; 
    return idx > firstOpenIdx;
  };


  const isUncheckLocked = (planId: number) => {
    if (!ENFORCE_STRICT_UNCHECK) return false;
    const lastCompletedIdx = plans.map(p => p.completed).lastIndexOf(true);
    const idx = plans.findIndex(p => p.id === planId);
    return plans[idx]?.completed && idx !== lastCompletedIdx;
  };


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


  const deadlineLabel = useMemo(() => {
    const lastTs = plans.reduce<number>((max, p) => {
      const t = new Date(p?.due_date || 0).getTime();
      return Number.isNaN(t) ? max : Math.max(max, t);
      }, 0);
    return lastTs ? new Date(lastTs).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : "—";
  }, [plans]);


  const onTogglePlan = async (planId: number) => {
    const idx = plans.findIndex(p => p.id === planId);
    const target = plans[idx];
    if (!target) return;


    if (!target.completed && isLocked(planId)) return;

    if (target.completed && isUncheckLocked(planId)) return;

    const nextRaw = plansRaw.map(p => (p.id === planId ? { ...p, completed: !p.completed } : p));
    setPlansRaw(nextRaw);
    setGoal(g => (g ? { ...g, progress: calcProgress(orderPlans(nextRaw)) } : g));

    try {
      const res = (await togglePlanDone(planId)) as any;
      if (res?.progress != null) {
        setGoal(g => (g ? { ...g, progress: Number(res.progress) } : g));
      }
      const me = await getUserService();
      const coinsVal = Number(me?.coins) || 0;
      window.dispatchEvent(new CustomEvent(COINS_EVENT, { detail: { value: coinsVal } }));
    } catch {

      const revert = plansRaw.map(p => (p.id === planId ? { ...p, completed: target.completed } : p));
      setPlansRaw(revert);
      setGoal(g => (g ? { ...g, progress: calcProgress(orderPlans(revert)) } : g));
    }
  };

  return {
    goal,
    plans,
    imageUrl,
    deadlineLabel,
    loading,
    error,
    reload,
    onTogglePlan,
    isLocked,
  };
}
