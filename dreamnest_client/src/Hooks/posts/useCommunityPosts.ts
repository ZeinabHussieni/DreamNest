import { useEffect, useMemo, useState } from "react";
import { getAllPosts, toggleLike, Post } from "../../Services/posts/postsService";
import { toast } from "react-toastify";

type LikeState = Record<number, { liked: boolean; count: number }>;

export default function useCommunityPosts() {
  const [items, setItems] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [likeMap, setLikeMap] = useState<LikeState>({});

  const load = async () => {
    try {
      setLoading(true);
      const data = await getAllPosts();
      const list = Array.isArray(data) ? data : [];
      setItems(list);

      setLikeMap((prev) => {
      const next: LikeState = { ...prev };
      for (const p of list) {
         next[p.id] = next[p.id] ?? {
         liked: Boolean(p.viewerLiked),     
         count: p.likeCount ?? 0,          
        };
       }
          return next;
       });

    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Failed to load community posts");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const like = async (id: number) => {
    try {
      const res = await toggleLike(id);
      setLikeMap((prev) => ({ ...prev, [id]: { liked: res.liked, count: res.likeCount } }));
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Failed to toggle like");
    }
  };

  const state = useMemo(() => ({ items, loading, likeMap }), [items, loading, likeMap]);
  return { ...state, like, reload: load };
}
