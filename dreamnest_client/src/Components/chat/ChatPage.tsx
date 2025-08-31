import React, { useMemo, useState } from "react";
import useChat from "../../Hooks/chat/useChat";
import "./chat.css";
import { useAuth } from "../../Context/AuthContext";
import Avatar from "../shared/avatar/Avatar";
import type { ChatRoom } from "../../Services/chat/chatService";

const ChatPage: React.FC = () => {
  const { user } = useAuth() as any;
  const userId = Number(user?.id);
  const { rooms, activeRoom, setActiveId, messages, loadingRooms, loadingMsgs, send } =
    useChat(userId);
  const [text, setText] = useState("");

  // helper returns the other participant’s user 
  const getOtherUser = (room: ChatRoom) => {
    const users = room.participants?.map(p => p.user).filter(Boolean) ?? [];
    return users.find(u => u.id !== userId) ?? null;
  };

  const activeOther = useMemo(
    () => (activeRoom ? getOtherUser(activeRoom) : null),
    [activeRoom]
  );

  if (!userId) return <div className="chat-wrap"><p>Sign in first.</p></div>;

  return (
    <div className="chat-wrap">
      <aside className="chat-sidebar">
        <div className="chat-search">
          <input placeholder="Search…" />
        </div>

        {loadingRooms ? (
          <div className="muted">Loading rooms…</div>
        ) : (
          <ul className="room-list">
            {rooms.map((r) => {
              const otherUser = getOtherUser(r);
              return (
                <li
                  key={r.id}
                  className={`room-item ${activeRoom?.id === r.id ? "active" : ""}`}
                  onClick={() => setActiveId(r.id)}
                >
                  <Avatar
                    filename={otherUser?.profilePicture ?? null}
                    className="room-avatar-img"
                  />
                  <div className="room-name">
                    {otherUser?.userName || r.name || `Room ${r.id}`}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </aside>

      <main className="chat-main">
        <header className="chat-header">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Avatar filename={activeOther?.profilePicture ?? null} className="room-avatar" />
            <h2>{activeOther?.userName || activeRoom?.name || "…"}</h2>
          </div>
        </header>

        <div className="chat-body">
          {loadingMsgs ? (
            <div className="muted">Loading messages…</div>
          ) : (
            <ul className="msg-list">
              {messages.map((m) => {
                const mine = m.senderId === userId;
                return (
                  <li key={m.id} className={`msg ${mine ? "me" : "other"}`}>
                    <div className="bubble">{m.content}</div>
                    <time className="time">
                      {new Date(m.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <form
          className="chat-input"
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim() || !activeRoom) return;
            send(text.trim());
            setText("");
          }}
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message…"
          />
          <button aria-label="Send">➤</button>
        </form>
      </main>
    </div>
  );
};

export default ChatPage;
