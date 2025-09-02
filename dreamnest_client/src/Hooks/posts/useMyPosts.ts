import { useEffect, useMemo, useState} from "react";
import { createPost, deletePost, getMyPosts, toggleLike, Post } from "../../Services/posts/postsService";
import {toast} from "react-toastify";
import Swal from "sweetalert2";

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

    const { isConfirmed } = await Swal.fire({
    title: "Delete this post?",
    text: "This action cannot be undone.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Delete",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#e0524c",
    cancelButtonColor: "#6f56c5",
    reverseButtons: true,
    focusCancel: true,
    width:400
    });
    if (!isConfirmed) return;

    const snapshot = items;
    setItems(prev => prev.filter(p => p.id !== id));

   try {
     await deletePost(id);
     setLikeMap(prev => {
       const { [id]: _discard, ...rest } = prev;
       return rest;
     });

     await Swal.fire({
       title: "Deleted",
       text: "Post removed successfully.",
       icon: "success",
       timer: 1200,
       showConfirmButton: false,
     });
    } catch (e: any) {
     setItems(snapshot);
     await Swal.fire({
       title: "Failed",
       text: e?.response?.data?.message || "Failed to delete",
       icon: "error",
     });
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