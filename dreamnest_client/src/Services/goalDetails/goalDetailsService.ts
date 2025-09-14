import api from "../axios/axios";
import type { ApiEnvelope } from "../axios/types";

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



export const getGoalsDetails = async (): Promise<Goal[]> => {
  const res = await api.get<ApiEnvelope<Goal[]>>("/goals");
  return res.data.data;
};

export const getGoalsStatus = async (status: string): Promise<Goal[]> => {
  const res = await api.get<ApiEnvelope<Goal[]>>("/goals", { params: { status } });
  return res.data.data;
};

export const deleteGoal = async (id: number): Promise<void> => {
  await api.delete(`/goals/${id}`);
};

export const fetchGoals = async (status?: string): Promise<Goal[]> => {
  const res = await api.get<ApiEnvelope<Goal[]>>("/goals", {
    params: status ? { status } : undefined,
  });
  return res.data.data;
};

export const getGoalById = async (id: number): Promise<Goal> => {
  const res = await api.get<ApiEnvelope<Goal>>(`/goals/${id}`);
  return res.data.data;
};

export const getGoalPlans = async (id: number): Promise<Plan[]> => {
  const res = await api.get<ApiEnvelope<Plan[]>>(`/plans/${id}`);
  return res.data.data;
};

export const togglePlanDone = async (
  planId: number
): Promise<{ progress?: number }> => {
  const res = await api.patch<ApiEnvelope<{ progress?: number }>>(
    `/plans/${planId}/toggle`
  );
  return res.data.data;
};

export default async function visionBoardUrl(filename: string): Promise<Blob> {
  const response = await api.get(`/goals/visionBoard/file/${filename}`, {
    responseType: "blob",
  });
  return response.data as Blob;
}
