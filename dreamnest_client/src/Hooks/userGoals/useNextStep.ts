import { useEffect, useState } from "react";
import { getGoalPlans } from "../../Services/goalDetails/goalDetailsService";

type Plan = { id:number; title:string; completed:boolean; createdAt?:string };

const orderPlans = (arr: Plan[]) =>
  [...arr].sort((a, b) => {
    const ta = new Date(a?.createdAt ?? 0).getTime();
    const tb = new Date(b?.createdAt ?? 0).getTime();
    if (!Number.isNaN(ta) && !Number.isNaN(tb) && ta !== tb) return ta - tb;
    return (a.id ?? 0) - (b.id ?? 0);
  });

export default function useNextStep(goalId: number) {
  const [nextTitle, setNextTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const plans = (await getGoalPlans(goalId)) as Plan[];
        const next = orderPlans(plans).find(p => !p.completed);
        if (alive) setNextTitle(next ? next.title : null);
      } catch {
        if (alive) setNextTitle(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [goalId]);

  return { nextTitle, loading };
}
