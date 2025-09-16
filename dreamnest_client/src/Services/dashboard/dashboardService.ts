import api from "../axios/axios";
import type { ApiEnvelope } from "../axios/types";
import axios from "axios";

export type MonthCounts = Record<string, number>;
export type DashboardDto = {
  totalGoals: number;
  inProgressGoals: number;
  completedGoals: number;
  postsPerMonth: MonthCounts;
  goalsPerMonth: MonthCounts;
};
export type LeaderboardUser = {
  id: number;
  name: string;
  coins: number;
  profilePicFilename: string | null;
};
type LeaderboardItem = { id: number; userName: string; profilePicture?: string | null; coins: number; };
type LeaderboardResponse = { items: LeaderboardItem[] };

const isUnauthorized = (e: unknown) => {

  if (axios.isAxiosError(e)) {
    if (e.response?.status === 401) return true;
    const d = e.response?.data as any;
    if (Array.isArray(d?.message) && d.message.join(" ").toLowerCase().includes("unauthorized")) return true;
  }

  if (e && typeof (e as any).message === "string" && (e as any).message.toLowerCase().includes("unauthorized")) {
    return true;
  }
  return false;
};

export async function fetchDashboard(): Promise<DashboardDto | null> {
  try {
    const res = await api.get<ApiEnvelope<DashboardDto>>("/dashboard");
    return res.data.data ?? null;
  } catch (e) {
    if (isUnauthorized(e)) return null; 
    throw e;
  }
}

export async function getLeaderboard(limit = 5): Promise<LeaderboardUser[]> {
  try {
    const res = await api.get<ApiEnvelope<LeaderboardResponse>>("/coins/leaderboard", { params: { limit } });
    const items = res.data?.data?.items ?? [];
    return items.map((i) => ({
      id: i.id,
      name: i.userName,
      coins: i.coins,
      profilePicFilename: i.profilePicture ?? null,
    }));
  } catch (e) {
    if (isUnauthorized(e)) return []; 
    throw e;
  }
}
