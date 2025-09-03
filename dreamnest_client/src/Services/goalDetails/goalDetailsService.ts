import api from "../axios/axios";

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


type ApiResponse<T> = {
  data?: T;
  items?: T;
} & Record<string, any>;



export const getGoalsDetails = async (): Promise<Goal[]> => {
  const res = await api.get<ApiResponse<Goal[]>>("/goals");
  return res.data?.data ?? res.data?.items ?? (res.data as any) ?? [];
};

export const getGoalsStatus = async (status: string): Promise<Goal[]> => {
  const res = await api.get<ApiResponse<Goal[]>>("/goals", { params: { status } });
  return res.data?.data ?? res.data?.items ?? (res.data as any) ?? [];
};

export const deleteGoal = async (id: number): Promise<void> => {
  await api.delete(`/goals/${id}`);
};

export const fetchGoals = async (status?: string): Promise<Goal[]> => {
  const res = await api.get<ApiResponse<Goal[]>>("/goals", {
    params: status ? { status } : undefined,
  });
  return res.data?.data ?? res.data?.items ?? (res.data as any) ?? [];
};

export const getGoalById = async (id: number): Promise<Goal> => {
  const res = await api.get<ApiResponse<Goal>>(`/goals/${id}`);
  return res.data?.data ?? (res.data as any);
};

export const getGoalPlans = async (id: number): Promise<Plan[]> => {
  const res = await api.get<ApiResponse<Plan[]>>(`/goals/${id}/plans`);
  return res.data?.data ?? (res.data as any);
};

export const togglePlanDone = async (
  planId: number
): Promise<{ progress?: number }> => {
  const res = await api.patch<ApiResponse<{ progress?: number }>>(
    `/goals/plans/${planId}/toggle`
  );
  return res.data?.data ?? (res.data as any);
};

export default async function visionBoardUrl(filename: string): Promise<Blob> {
  const response = await api.get(`/goals/visionBoard/${filename}`, {
    responseType: "blob",
  });
  return response.data as Blob;
}
