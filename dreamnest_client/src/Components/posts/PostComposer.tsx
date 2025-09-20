import React, { useState } from "react";

type Props = {
  onPublish: (content: string) => void;
  loading?: boolean;
};

const PostComposer: React.FC<Props> = ({ onPublish, loading }) => {
  const [content, setContent] = useState("");

  return (
    <div className="composer">
      <div className="composer-title">Add new Post</div>
      <div className="composer-row">
        <input
          className="composer-input"
          placeholder="Share what's on your mind..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button
          className="composer-btn"
          disabled={loading || !content.trim()}
          onClick={() => { onPublish(content); setContent(""); }}
        >
          {loading ? "Publishing…" : "Publish"}
        </button>
      </div>
    </div>
  );
};

export default PostComposer;
