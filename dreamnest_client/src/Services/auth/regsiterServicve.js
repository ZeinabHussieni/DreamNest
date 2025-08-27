import api from "../axios/axios";

const registerService = async (data) => {
  const response = await api.post("/auth/register", data); 
  return response.data; 
};

export default registerService;
