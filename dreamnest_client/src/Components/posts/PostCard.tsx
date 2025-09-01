import React from "react";
import Avatar from "../shared/avatar/Avatar";
import { ReactComponent as EmptyHeart } from "../../Assets/Icons/empty_heart.svg";
import { ReactComponent as FullHeart } from "../../Assets/Icons/full_heart.svg";

type Props = {
  id: number;
  content: string;
  authorName: string;
  authorAvatar?: string | null;
  liked?: boolean;
  likeCount?: number;
  onLike?: (id: number) => void;
  onDelete?: (id: number) => void;
  showDelete?: boolean;
};

const PostCard: React.FC<Props> = ({
  id,
  content,
  authorName,
  authorAvatar,
  liked = false,
  likeCount = 0,
  onLike,
  onDelete,
  showDelete = true,
}) => {
  return (
    <article className="post-card">
      <header className="post-head">
        <div className="post-user">
          <Avatar filename={authorAvatar ?? null} className="post-avatar" />
          <span className="post-name">{authorName}</span>
        </div>

        <button
          className={`heart ${liked ? "active" : ""}`}
          aria-pressed={liked}
          aria-label={liked ? "Unlike" : "Like"}
          onClick={() => onLike?.(id)}
        >
          {liked ? (
            <FullHeart className="heart-icon" />
          ) : (
            <EmptyHeart className="heart-icon" />
          )}
        </button>
      </header>

      <h3 className="post-title">{content.split("\n")[0]}</h3>
      {content.includes("\n") && (
        <p className="post-sub">{content.split("\n").slice(1).join("\n")}</p>
      )}

      <footer className="post-foot">
        {showDelete && (
          <button className="btn-delete" onClick={() => onDelete?.(id)}>
            Delete
          </button>
        )}
        <span className="like-count">{likeCount} like</span>
      </footer>
    </article>
  );
};

export default PostCard;
