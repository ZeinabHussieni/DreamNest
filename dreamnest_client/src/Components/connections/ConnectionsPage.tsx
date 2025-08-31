import React from "react";
import useConnections from "../../Hooks/connections/useConnections";
import "./connections.css";
import { useAuth } from "../../Context/AuthContext"; // assumes you already have this
import Avatar from "../shared/avatar/Avatar";

const avatar = (url?: string | null) =>
  url ? url : "https://via.placeholder.com/64?text=%20"; // fallback

const ConnectionsPage: React.FC = () => {
  const { user } = useAuth() as any; // { user: { id, userName, ... } }
  const userId = Number(user?.id);
  const { connections, loading, error, onAccept, onReject } = useConnections(userId);

  if (!userId) return <div className="req-page"><p>Sign in first.</p></div>;
  if (loading) return <div className="req-page"><p>Loading…</p></div>;
  if (error) return <div className="req-page"><p className="err">{error}</p></div>;

  return (
    <section className="req-page">
      <h1 className="req-title">Friends requests</h1>

      {connections.length === 0 && (
        <div className="req-empty">No requests right now ✨</div>
      )}

      <ul className="req-list">
        {connections.map((c) => {
          const iAmHelper = c.helper_id === userId;
          const other = iAmHelper ? c.seeker : c.helper;
          const line = iAmHelper
            ? `${other.userName} needs your help for "${c.goal.title}"`
            : `${other.userName} can help you with "${c.goal.title}"`;

          return (
            <li key={c.id} className="req-card">
       <Avatar filename={other.profilePicture} className="req-avatar" />
              <div className="req-info">
                <div className="req-name">{other.userName}</div>
                <div className="req-sub">{line}</div>
              </div>
              <div className="req-actions">
                <button className="btnn confirm" onClick={() => onAccept(c.id)}>
                  Confirm
                </button>
                <button className="btnn reject" onClick={() => onReject(c.id)}>
                  Delete
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default ConnectionsPage;
