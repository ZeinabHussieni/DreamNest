import api from "../axios/axios";

export default async function registerService(data){
  const response = await api.post("/auth/register", data); 
  return response.data; 
};

