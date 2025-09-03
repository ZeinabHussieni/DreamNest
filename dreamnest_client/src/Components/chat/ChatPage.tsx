import React from "react";
import { Link } from "react-router-dom";
import useChat from "../../Hooks/chat/useChat";
import useChatUI from "../../Hooks/chat/useChatUI";
import { useAuth } from "../../Context/AuthContext";
import Avatar from "../shared/avatar/Avatar";
import type { ChatRoom } from "../../Services/chat/chatService";
import "./chat.css";

const ChatPage: React.FC = () => {

  const { user } = useAuth() as any;
  const userId = Number(user?.id) || 0;

  const {
    rooms,
    activeRoom,
    setActiveId,
    messages,
    loadingRooms,
    loadingMsgs,
    send,
  } = useChat(userId);

  const {
    text, setText,
    search, setSearch,
    mobileOpen, setMobileOpen,
    filteredRooms, activeOther,
    bodyRef, bottomRef,
    getOtherUser, onSubmit,
  } = useChatUI({ userId, rooms, activeRoom, loadingMsgs, messages, send });


  const fmtTime = (iso: string | number | Date) =>
    new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });


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
        ) : rooms.length === 0 ? (
          <div className="empty-state">
            <p>No conversations yet.</p>
            <p className="muted">
              Start one from <Link to="/connections" className="con">Connections</Link>.
            </p>
          </div>
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
              onClick={() => setMobileOpen(true)}
              aria-label="Open conversations"
            >
              ☰
            </button>
            <Avatar
              filename={activeOther?.profilePicture ?? null}
              className="room-avatar"
            />
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
          ) : !activeRoom ? (
            <div className="empty-main">
              <h3>No conversation selected</h3>
              {rooms.length === 0 ? (
                <p className="muted">
                  You don’t have any chats yet. Start one from{" "}
                  <Link to="/connections" className="con">Connections</Link>.
                </p>
              ) : (
                <p className="muted">Pick a conversation from the left.</p>
              )}
            </div>
          ) : messages.length === 0 ? (
            <div className="empty-main">
              <p className="muted">No messages here yet. Say hi 👋</p>
            </div>
          ) : (
            <ul className="msg-list">
              {messages.map((m) => {
                const mine = m.senderId === userId;
                return (
                  <li key={m.id} className={`msg ${mine ? "me" : "other"}`}>
                    <div className="bubble">
                      {m.content}
                      <div className="meta">
                        <time>{fmtTime(m.createdAt)}</time>
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
            placeholder={
              activeRoom
                ? "Type a message…"
                : "Select a conversation to start chatting"
            }
            autoComplete="off"
            disabled={!userId || !activeRoom}
          />
          <button disabled={!text.trim() || !userId || !activeRoom}>➤</button>
        </form>
      </main>

 
      <div
        className={`chat-drawer-backdrop ${mobileOpen ? "open" : ""}`}
        onClick={() => setMobileOpen(false)}
      />
      <aside
        className={`chat-drawer ${mobileOpen ? "open" : ""}`}
        role="dialog"
        aria-label="Conversations"
      >
        <div className="drawer-header">
          <h3>Conversations</h3>
          <button
            className="drawer-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close"
          >
            ✕
          </button>
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
        ) : rooms.length === 0 ? (
          <div className="empty-state">
            <p>No conversations yet.</p>
            <p className="muted">
              Go to <Link to="/connections">Connections</Link> to start one.
            </p>
          </div>
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
                  onClick={() => {
                    setActiveId(r.id);
                    setMobileOpen(false);
                  }}
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

        <div className="drawer-actions">
          <Link to="/" className="chat-back">Back to Home Page</Link>
        </div>
      </aside>
    </div>
  );
};

export default ChatPage;
