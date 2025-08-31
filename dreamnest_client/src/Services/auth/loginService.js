import api from "../axios/axios";

export default async function loginService(data){
  const response = await api.post("/auth/login", data); 
  return response.data; 
};


