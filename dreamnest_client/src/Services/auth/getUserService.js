import api from "../axios/axios";

export default async function getUserService(){
  const res = await api.get("/auth/me");
  return res.data?.data; 
};

