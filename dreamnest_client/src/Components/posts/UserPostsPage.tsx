import React from "react";
import useMyPosts from "../../Hooks/posts/useMyPosts";
import PostCard from "../../Components/posts/PostCard";
import PostComposer from "../../Components/posts/PostComposer";
import "./userPosts.css";
import { useAuth } from "../../Context/AuthContext";

const UserPostsPage: React.FC = () => {
  const { user } = useAuth() as any; 
  const { items, loading, publishing, likeMap, publish, remove, like } = useMyPosts();

  return (
    <section className="feed-wrap">
      <h1 className="feed-title">My Feed</h1>

      <PostComposer onPublish={publish} loading={publishing} />

      {loading ? (
        <p className="muted">Loading…</p>
      ) : items.length === 0 ? (
        <p className="muted">No posts yet. Share your first thought ✨</p>
      ) : (
        <ul className="feed-grid">
          {items.map((p) => {
            const l = likeMap[p.id] || { liked: false, count: 0 };
            return (
              <li key={p.id}>
                <PostCard
                  id={p.id}
                  content={p.content}
                  authorName={user?.userName ?? "Me"}
                  authorAvatar={user?.profilePicture ?? null}
                  liked={l.liked}
                  likeCount={l.count}
                  onLike={like}
                  onDelete={remove}
                  showDelete={true}
                />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default UserPostsPage;
