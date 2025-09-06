import { useEffect, useMemo, useState } from "react";
import { getGoalById, getGoalPlans, togglePlanDone } from "../../Services/goalDetails/goalDetailsService";
import visionBoardBlobFetch from "../../Services/goalDetails/goalDetailsService";
import getUserService from "../../Services/auth/getUserService";
import Swal from "sweetalert2";

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
  onCompletePlan: (planId: number) => Promise<void>;
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

  const confirmComplete = async (planTitle?: string) => {
    const { isConfirmed } = await Swal.fire({
      title: "Mark this plan as completed?",
      text: planTitle ? `“${planTitle}” will be locked and coins will be awarded.` : "This will lock the plan and award coins.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Mark as done",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#6f56c5",
      cancelButtonColor: "#e0524c",
      reverseButtons: true,
      focusCancel: true,
      width: 420,
    });
    return isConfirmed;
  };

  const onCompletePlan = async (planId: number) => {
    const idx = plans.findIndex(p => p.id === planId);
    const target = plans[idx];
    if (!target || target.completed || isLocked(planId)) return;

    const ok = await confirmComplete(target.title);
    if (!ok) return;

    const nextRaw = plansRaw.map(p => (p.id === planId ? { ...p, completed: true } : p));
    setPlansRaw(nextRaw);
    setGoal(g => (g ? { ...g, progress: calcProgress(orderPlans(nextRaw)) } : g));

    try {
      const res = (await togglePlanDone(planId)) as any;
      if (res?.progress != null) {
        setGoal(g => (g ? { ...g, progress: Number(res.progress) } : g));
      }
      await Swal.fire({
        title: "Completed!",
        text: `Nice — “${target.title}” is done.`,
        icon: "success",
        timer: 1100,
        showConfirmButton: false,
      });
      const me = await getUserService();
      const coinsVal = Number(me?.coins) || 0;
      window.dispatchEvent(new CustomEvent(COINS_EVENT, { detail: { value: coinsVal } }));
    } catch (e) {
      const revert = plansRaw.map(p => (p.id === planId ? { ...p, completed: false } : p));
      setPlansRaw(revert);
      setGoal(g => (g ? { ...g, progress: calcProgress(orderPlans(revert)) } : g));
      await Swal.fire({
        title: "Failed",
        text: (e as any)?.response?.data?.message || "Couldn’t complete this plan.",
        icon: "error",
      });
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
    onCompletePlan,
    isLocked,
  };
}
