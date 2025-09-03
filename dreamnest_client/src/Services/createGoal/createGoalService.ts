import api from "../axios/axios";
import type { Goal } from "../goalDetails/goalDetailsService";


export type CreateGoalDto = {
  title: string;
  description?: string;
  helpText?: string;
  visionBoardFilename?: string;
  due_date?: string; 
};


export default async function createGoal(data: CreateGoalDto): Promise<Goal> {
  const res = await api.post<{ data: Goal }>("/goals", data);
  return res.data.data ?? (res.data as any);
}
