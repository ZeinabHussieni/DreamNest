import api from "../axios/axios";


export default async function getUserProfile(filename: string): Promise<Blob> {
  const response = await api.get<Blob>(`/auth/profile/${filename}`, {
    responseType: "blob",
  });
  return response.data;
}
