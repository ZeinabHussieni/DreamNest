import api from "../axios/axios";

const getUserService = async () => {
  const res = await api.get("/auth/me");
  return res.data?.data; 
};

export default getUserService;
