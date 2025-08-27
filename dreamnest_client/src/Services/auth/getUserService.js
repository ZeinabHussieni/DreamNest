import api from "../axios/axios";

const getUserService = async () => {
  const response = await api.get("/auth/me");
  return response.data.data;
};

export default getUserService;
