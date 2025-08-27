import api from "../axios/axios";

const getUserProfile = async (filename) => {
  const response = await api.get(`/auth/profile/${filename}`, {
    responseType: "blob",
  });
  return response.data; 
};

export default getUserProfile;
