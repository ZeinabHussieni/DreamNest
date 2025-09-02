import React from "react";
import useChat from "../../Hooks/chat/useChat";
import useChatUI from "../../Hooks/chat/useChatUI";
import "./chat.css";
import { Link } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";
import Avatar from "../shared/avatar/Avatar";
import type { ChatRoom } from "../../Services/chat/chatService";

const ChatPage: React.FC = () => {
  const { user } = useAuth() as any;
  const userId = Number(user?.id) || 0; 

  const {rooms,activeRoom,setActiveId,messages,loadingRooms,loadingMsgs,send,} = useChat(userId);

  const {text, setText,search, setSearch,mobileOpen, setMobileOpen,filteredRooms, activeOther,bodyRef, bottomRef,getOtherUser, onSubmit,
        } = useChatUI({ userId, rooms, activeRoom, loadingMsgs, messages, send });

  return (
    <div className="chat-wrap">
      <aside className="chat-sidebar">
        <div className="chat-search">
          <input
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <h3>Conversations</h3>

        {!userId ? (
          <div className="muted">Sign in first.</div>
        ) : loadingRooms ? (
          <div className="muted">Loading rooms…</div>
        ) : filteredRooms.length === 0 ? (
          <div className="muted">No conversations match “{search}”.</div>
        ) : (
          <ul className="room-list">
            {filteredRooms.map((r) => {
              const otherUser = getOtherUser(r as ChatRoom);
              const isActive = activeRoom?.id === r.id;
              return (
                <li
                  key={r.id}
                  className={`room-item ${isActive ? "active" : ""}`}
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

        <div className="chat-actions">
          <Link to="/" className="chat-back">Back to Home Page</Link>
        </div>
      </aside>

      <main className="chat-main">
        <header className="chat-header">
          <div className="chat-header-inner">
            <button
              className="chat-menu-btn"
              aria-label="Open conversations"
              aria-haspopup="dialog"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
            >
              ☰
            </button>
            <Avatar filename={activeOther?.profilePicture ?? null} className="room-avatar" />
            <div className="chat-title">
              <h2>{activeOther?.userName || activeRoom?.name || "…"}</h2>
            </div>
          </div>
        </header>

        <div className="chat-body" ref={bodyRef}>
          {!userId ? (
            <div className="muted">Sign in first.</div>
          ) : loadingMsgs ? (
            <div className="muted">Loading messages…</div>
          ) : (
            <ul className="msg-list">
              {messages.map((m) => {
                const mine = m.senderId === userId;
                return (
                  <li key={m.id} className={`msg ${mine ? "me" : "other"}`}>
                    <div className="bubble">
                      {m.content}
                      <div className="meta">
                        <time>
                          {new Date(m.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </time>
                      </div>
                    </div>
                  </li>
                );
              })}
              <div ref={bottomRef} />
            </ul>
          )}
        </div>

        <form className="chat-input" onSubmit={onSubmit}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message…"
            autoComplete="off"
            disabled={!userId || !activeRoom}
          />
          <button aria-label="Send" disabled={!text.trim() || !userId || !activeRoom}>
            ➤
          </button>
        </form>
      </main>

      <div
        className={`chat-drawer-backdrop ${mobileOpen ? "open" : ""}`}
        onClick={() => setMobileOpen(false)}
      />
      <aside
        className={`chat-drawer ${mobileOpen ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Conversations"
      >
        <div className="drawer-header">
          <h3>Conversations</h3>
          <button className="drawer-close" aria-label="Close" onClick={() => setMobileOpen(false)}>✕</button>
        </div>

        <div className="drawer-search">
          <input
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loadingRooms ? (
          <div className="muted">Loading rooms…</div>
        ) : filteredRooms.length === 0 ? (
          <div className="muted">No conversations match “{search}”.</div>
        ) : (
          <ul className="drawer-list">
            {filteredRooms.map((r) => {
              const otherUser = getOtherUser(r as ChatRoom);
              const isActive = activeRoom?.id === r.id;
              return (
                <li
                  key={r.id}
                  className={`drawer-item ${isActive ? "active" : ""}`}
                  onClick={() => setActiveId(r.id)}
                >
                  <Avatar filename={otherUser?.profilePicture ?? null} className="room-avatar-img" />
                  <div className="room-name">
                    {otherUser?.userName || r.name || `Room ${r.id}`}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="drawer-actions">
          <Link to="/" className="chat-back">Back to Home Page</Link>
        </div>
      </aside>
    </div>
  );
};

export default ChatPage;
