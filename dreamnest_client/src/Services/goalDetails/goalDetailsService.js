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