import api from "../axios/axios";

export type MonthCounts = Record<string, number>;
export type DashboardDto = {
  totalGoals: number;
  inProgressGoals: number;
  completedGoals: number;
  postsPerMonth: MonthCounts;
  goalsPerMonth: MonthCounts;
};

function deepUnwrap<T>(payload: any): T {
  let p = payload?.data ?? payload;
  if (p && typeof p === "object" && "data" in p) p = (p as any).data;
  return p as T;
}

function toNumber(v: any, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export async function fetchDashboard(): Promise<DashboardDto> {
  const res = await api.get("/dashboard");
  const raw = deepUnwrap<Partial<DashboardDto>>(res);

  return {
    totalGoals: toNumber(raw?.totalGoals),
    inProgressGoals: toNumber(raw?.inProgressGoals),
    completedGoals: toNumber(raw?.completedGoals),
    postsPerMonth: (raw?.postsPerMonth as MonthCounts) ?? {},
    goalsPerMonth: (raw?.goalsPerMonth as MonthCounts) ?? {},
  };
}
