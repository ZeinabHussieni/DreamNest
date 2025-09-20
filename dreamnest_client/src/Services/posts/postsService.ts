import api from "../axios/axios";
import type { ApiEnvelope } from "../axios/types";

export type Post = {
  id: number;
  content: string;
  user_id: number;
  createdAt: string;
  updatedAt: string;
  user?: { id: number; userName: string; profilePicture?: string | null };
  likeCount?: number;
  viewerLiked?: boolean;
};

export type ToggleLikeResult = { liked: boolean; likeCount: number };



export async function createPost(content: string): Promise<Post> {
  const res = await api.post<ApiEnvelope<Post>>("/posts", { content });
   return res.data.data;
}

export async function getMyPosts(): Promise<Post[]> {
  const res = await api.get<ApiEnvelope<Post[]>>("/posts/me");
  return res.data.data;
}

export async function getAllPosts(): Promise<Post[]> {
  const res = await api.get<ApiEnvelope<Post[]>>("/posts");
   return res.data.data;
}

export async function deletePost(id: number): Promise<{ success: boolean }> {
  const res = await api.delete<ApiEnvelope<{ success: boolean }>>(`/posts/${id}`);
  return res.data.data;
}

export async function toggleLike(postId: number): Promise<ToggleLikeResult> {
  const res = await api.post<ApiEnvelope<ToggleLikeResult>>(`/posts/toggle-like/${postId}`);
  return res.data.data;
}
