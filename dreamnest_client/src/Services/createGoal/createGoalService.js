import api from "../axios/axios";

export default async function createGoal(data) {
  const res = await api.post("/goals", data);
  return res.data;
}
