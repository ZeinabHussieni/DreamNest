import api from "../axios/axios";
import type { ApiEnvelope } from "../axios/types";

export type MonthCounts = Record<string, number>;

export type AdminDashboard = {
  totals: {
    usersTotal: number;
    postsTotal: number;
    goalsTotal: number;
    inProgressGoals: number;
    completedGoals: number;
    avgGoalProgress: number;
  };
  moderation: {
    usersWithModerationRow: number;
    totalInfractions: number;
    byType: { text: number; voice: number; image: number };
    chatBlockedCount: number;
    siteBlockedCount: number;
  };
  offenders: Array<{
    userId: number;
    userName: string;
    email: string;
    totalInfractions: number;
    textInfractions: number;
    voiceInfractions: number;
    imageInfractions: number;
    chatBlocked: boolean;
    siteBlocked: boolean;
    lastUpdated: string;
  }>;
  recentBadMessages: Array<{
    id: number;
    chatRoomId: number;
    senderId: number;
    senderName: string;
    type: "text" | "voice" | "image";
    status: string;
    badReason: string;
    createdAt: string;
    textPreview?: string;
    transcriptPreview?: string;
  }>;
  trends: {
    postsPerMonth: MonthCounts;
    goalsPerMonth: MonthCounts;
    badPerMonth: MonthCounts;
    badTextPerMonth: MonthCounts;
    badVoicePerMonth: MonthCounts;
    badImagePerMonth: MonthCounts;
  };
  generatedAt: string;
};

export async function fetchAdminDashboard(): Promise<AdminDashboard> {
  const res = await api.get<ApiEnvelope<AdminDashboard>>("/dashboard/admin");
  return res.data.data;
}
