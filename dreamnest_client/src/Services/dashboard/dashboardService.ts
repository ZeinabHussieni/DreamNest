import api from "../axios/axios";
import type { ApiEnvelope } from "../axios/types";

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

type LeaderboardItem = {
  id: number;
  userName: string;
  profilePicture?: string | null;
  coins: number;
};

type LeaderboardResponse = {
  items: LeaderboardItem[];
};


export async function fetchDashboard(): Promise<DashboardDto> {
  const res = await api.get<ApiEnvelope<DashboardDto>>("/dashboard");
  return res.data.data;
}

export async function getLeaderboard(limit = 5): Promise<LeaderboardUser[]> {
  const res = await api.get<ApiEnvelope<LeaderboardResponse>>("/coins/leaderboard", {
    params: { limit },
  });

  return res.data.data.items.map((i) => ({
    id: i.id,
    name: i.userName,
    coins: i.coins,
    profilePicFilename: i.profilePicture ?? null,
  }));
}