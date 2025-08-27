import api from "../axios/axios";

const loginService = async (data) => {
  const response = await api.post("/auth/login", data); 
  return response.data; 
};

export default loginService;
