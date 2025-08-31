import api from "../axios/axios";

export const getGoalsDetails = async () => {
  const data = (await api.get("/goals")).data;
  return data?.data ?? data?.items ?? data ?? [];
};

export const getGoalsStatus = async (status) => {
  const data = (await api.get("/goals", { params: { status } })).data;
  return data?.data ?? data?.items ?? data ?? [];
};

export const deleteGoal=async (id)=> {
   const data= await api.delete(`/goals/${id}`); 
}


export async function fetchGoals(status) {
  const data = await api.get("/goals", { params: status ? { status } : undefined });
  return data?.data ?? data?.items ?? data ?? [];
}

export const getGoalById = async (id) => {
  const res = await api.get(`/goals/${id}`);
  return res.data?.data ?? res.data;
};


export const getGoalPlans = async (id) => {
  const res = await api.get(`/goals/${id}/plans`);
  return res.data?.data ?? res.data;
};


export const togglePlanDone = async (planId) => {
  const res = await api.patch(`/goals/plans/${planId}/toggle`);
  return res.data?.data ?? res.data;
};

export default async function visionBoardUrl(filename){
  const response = await api.get(`/goals/visionBoard/${filename}`, {
    responseType: "blob",
  });
  return response.data; 
};
