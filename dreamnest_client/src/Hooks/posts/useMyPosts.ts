import { useEffect, useMemo, useState} from "react";
import { createPost, deletePost, getMyPosts, toggleLike, Post } from "../../Services/posts/postsService";
import {toast} from "react-toastify";

export default function useMyPosts(){
    const [items, setItems]=useState<Post[]>([]);
    const [loading, setLoading]= useState(true);
    const [publishing, setPublishing]=useState(false);
    const [likeMap,setLikeMap]=useState<Record<number,{liked: boolean;count:number}>>({});

    const load = async()=>{
        try{
            setLoading(true);
            const data = await  getMyPosts();
            setItems(Array.isArray(data)? data:[]);
           setLikeMap((prev) => {
             const next = { ...prev };
             for (const p of data) {
             next[p.id] = next[p.id] ?? {
             liked: Boolean(p.viewerLiked),  
             count: p.likeCount ?? 0,
           };
          }
             return next;
          });
        }catch (e:any){
            console.error(e);
            toast.error(e?.message || "Failed to load posts");
            setItems([]);
        }finally{
            setLoading(false);
        }
    }

    useEffect(()=>{void load();},[]);

    const publish=async(content:string)=>{
        if(!content.trim())return;
        try{
            setPublishing(true);
            const post = await createPost(content.trim());
            setItems((prev)=>[post,...prev]);
            setLikeMap((prev)=>({...prev,[post.id]:{liked:false,count:0}}));
            toast.success("Post published!");

        }catch(e: any){
            console.error(e);
            toast.error(e);
            toast.error(e?.response?.data?.message||"Failed to publish");

        }finally{
            setPublishing(false);
        }
    };

   const remove = async (id: number) => {
      const snapshot = items;
      setItems(prev => prev.filter(p => p.id !== id));
      try {
         await deletePost(id);
         setLikeMap(prev => {
         const { [id]: _, ...rest } = prev;
         return rest;
        });
         toast.success("Post deleted");
        } catch (e:any) {
          setItems(snapshot);
         toast.error(e?.response?.data?.message || "Failed to delete");
        }
    };

  const like = async (id: number) => {
    try {
      const res = await toggleLike(id);
      setLikeMap((prev) => ({ ...prev, [id]: { liked: res.liked, count: res.likeCount } }));
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Failed to toggle like");
    }
  };

    const state=useMemo(()=>({items,loading,publishing,likeMap}),[items,loading,publishing,likeMap]);
    return {...state,publish,remove,like,reload:load};


}