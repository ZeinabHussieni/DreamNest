import api from "../axios/axios";

export default async function getUserProfile(filename){
  const response = await api.get(`/auth/profile/${filename}`, {
    responseType: "blob",
  });
  return response.data; 
};
