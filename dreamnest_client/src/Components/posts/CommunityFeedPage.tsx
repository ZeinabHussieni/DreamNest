import React from "react";
import useCommunityPosts from "../../Hooks/posts/useCommunityPosts";
import PostCard from "../../Components/posts/PostCard";


const CommunityFeedPage: React.FC = () => {
  const { items, loading, likeMap, like } = useCommunityPosts();

  return (
    <section className="feed-wrap">
      <h1 className="feed-title">Community Feed</h1>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : items.length === 0 ? (
        <p className="muted">No posts yet.</p>
      ) : (
        <ul className="feed-grid">
          {items.map((p) => {
            const l = likeMap[p.id] || { liked: false, count: p.likeCount ?? 0 };
            return (
              <li key={p.id}>
                <PostCard
                  id={p.id}
                  content={p.content}
                  authorName={p.user?.userName ?? "Unknown"}
                  authorAvatar={p.user?.profilePicture ?? null}
                  liked={l.liked}
                  likeCount={l.count}
                  onLike={like}
                  showDelete={false} 
                />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default CommunityFeedPage;
