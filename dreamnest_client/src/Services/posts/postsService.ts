import api from "../axios/axios";

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

export type toggleLikeResult = {liked: boolean; likeCount: number};

function unwrap<T> (payload:any):T{
    const p= payload?.data?? payload;
    return(p?.data ?? p) as T;
}

export async function createPost (content: string): Promise<Post> {
    const res = await api.post("/posts",{content});
    return unwrap<Post>(res);
}

export async function getMyPosts(): Promise<Post[]>{
    const res = await api.get("/posts/me");
    return unwrap<Post[]>(res);
}

export async function getAllPosts():Promise<Post[]>{
    const res = await api.get("/posts");
    return unwrap<Post[]>(res);
}

export async function deletePost(id: number): Promise<{ success: boolean }> {
  const res = await api.delete(`/posts/${id}`);
  return unwrap<{ success: boolean }>(res);
}


export async function toggleLike(postId: number): Promise<toggleLikeResult>{
    const res = await api.post(`/posts/toggle-like/${postId}`);
    return unwrap<toggleLikeResult>(res);
}