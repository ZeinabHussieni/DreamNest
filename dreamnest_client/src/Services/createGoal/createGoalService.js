import api from "../axios/axios";

const createGoalService = async (data) => {
  const response = await api.post("/goals", data); 
  return response.data; 
};

export default createGoalService;
