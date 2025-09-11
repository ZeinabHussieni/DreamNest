import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import Avatar from "../shared/avatar/Avatar";
import { useAppDispatch } from "../../store/hooks";
import useChatRedux from "../../Redux/chat/useChatRedux";
import useChatUI from "../../Hooks/chat/useChatUI";
import { useAuth } from "../../Context/AuthContext";
import backk from "../../Assets/Icons/back.svg";
import searchh from "../../Assets/Icons/search.svg";
import audio from "../../Assets/Icons/audio.svg";
import sendMsg from "../../Assets/Icons/send.svg";
import paused from "../../Assets/Icons/paused.svg";
import type { ChatRoom } from "../../Redux/chat/chat.types";
import AudioBubble from "./AudioBubble";
import { initChatSocketThunk, loadRoomsThunk } from "../../Redux/chat/chat.thunks";
import Lottie from "lottie-react";
import EmptyConnectionsAnim from "../../Assets/Animations/connections.json";
import { useRecorder } from "../../Hooks/recorder/useRecorder";
import "./chat.css";
import { buildFileUrl } from "../../Utils/buildFileUrl";
const Ticks: React.FC<{ status?: "sent" | "delivered" | "read" }> = ({ status = "sent" }) => {
  if (status === "read") return <span className="tick tick-read">✓✓</span>;
  if (status === "delivered") return <span className="tick tick-delivered">✓✓</span>;
  return <span className="tick tick-sent">✓</span>;
};

const ChatPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAuth() as any;
  const userId = Number(user?.id) || 0;

  const {
    rooms,
    activeRoom,
    setActiveId,
    messages,
    loadingRooms,
    loadingMsgs,
    sendVoice,
    send,
    
  } = useChatRedux(userId);

  const { start, stop, recording } = useRecorder();

  const {
    text, setText,
    search, setSearch,
    mobileOpen, setMobileOpen,
    filteredRooms,
    activeOther,
    statusLine,
    activeRoomTyping,
    bodyRef, bottomRef,
    getOtherUser,
    onSubmit,
    firstUnreadId,
    isUserOnline,
    getMsgStatus,
    fmtTime,
    unreadByRoom,
  } = useChatUI({ userId, rooms, activeRoom, loadingMsgs, messages, send });

  useEffect(() => {
    dispatch(initChatSocketThunk());
    dispatch(loadRoomsThunk());
  }, [dispatch]);

  return (
    <div className="chat-wrap">
      <aside className="chat-sidebar">
        <h3>Conversations</h3>

        <div className="chat-search">
          <img src={searchh} alt="search" className="search-icon" />
          <input
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {!userId ? (
          <div className="muted">Sign in first.</div>
        ) : loadingRooms ? (
          <div className="muted">Loading rooms…</div>
        ) : rooms.length === 0 ? (
          <div className="empty-state">
            <p>No conversations yet.</p>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="muted">No conversations match “{search}”.</div>
        ) : (
          <ul className="room-list">
            {filteredRooms.map((r) => {
              const other = getOtherUser(r as ChatRoom);
              const isActive = activeRoom?.id === r.id;
              const unread = unreadByRoom[r.id]?.count || 0;

              return (
                <li
                  key={r.id}
                  className={`room-item ${isActive ? "active" : ""}`}
                  onClick={() => setActiveId(r.id)}
                >
                  <div className="room-avatar-wrap">
                    <Avatar filename={other?.profilePicture ?? null} className="room-avatar-img" />
                    {!!other && (
                      <span className={`presence-dot ${isUserOnline(other.id) ? "online" : "offline"}`} />
                    )}
                  </div>

                  <div className="room-name">
                    {other?.userName || r.name || `Room ${r.id}`}
                    {unread > 0 && <span className="unread-badge">{unread}</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="chat-actions">
          <Link to="/" className="chat-back">
            <img src={backk} alt="Back" className="icon-back" />
            Back
          </Link>
        </div>
      </aside>

      <main className="chat-main">
        {activeRoom ? (
          <header className="chat-header">
            <div className="chat-header-inner">
              <button className="chat-menu-btn" onClick={() => setMobileOpen(true)}>☰</button>

              <div className="room-avatar-wrap">
                <Avatar filename={activeOther?.profilePicture ?? null} className="room-avatar" />
              </div>

              <div className="chat-title">
                <h2>{activeOther?.userName || activeRoom?.name || "…"}</h2>
                <div className="subtle">{statusLine}</div>

                {!!activeRoom && activeRoomTyping.length > 0 && (
                  <div className="typing-indicator">
                    {activeRoomTyping.length === 1 ? "typing…" : `${activeRoomTyping.length} are typing…`}
                  </div>
                )}
              </div>
            </div>
          </header>
        ) : null}

        <div className="chat-body" ref={bodyRef}>
          {!userId ? (
            <div className="muted">Sign in first.</div>
          ) : loadingMsgs ? (
            <div className="muted">Loading messages…</div>
          ) : !activeRoom ? (
            <div className="empty-chat-landing">
              <div className="empty-card">
                <div className="empty-anim">
                  <Lottie animationData={EmptyConnectionsAnim} loop />
                </div>
                <div className="empty-textt">
                <h2>No conversations yet</h2>
                <Link to="/connections" className="empty-cta">
                  Find people to chat
                </Link>
                <div className="chat-actions-appear">
                 <Link to="/" className="chat-back-appear">
                   Back
                </Link>
                </div>
                </div>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="empty-main"><p className="muted">No messages yet. Say hi 👋</p></div>
          ) : (
            <ul className="msg-list">
              {messages.map((m) => {
                const mine = m.senderId === userId;
                const showCatchUp = firstUnreadId && m.id === firstUnreadId;
                return (
                  <React.Fragment key={m.id}>
                    {showCatchUp && <li className="catch-up"><span>New</span></li>}
                    <li className={`msg ${mine ? "me" : "other"}`}>
               <div className="bubble">
                      {m.type === "audio" ? (
                      <div className="audio-message">
                      <AudioBubble
                       src={m.audioUrl ? buildFileUrl(m.audioUrl) : ""}
                       transcript={m.transcript}
                       mine={mine}
                      />

                    </div>
                  ) : (
                    <span>{m.content}</span>
                   )}


                  <div className="meta">
                   <time>{fmtTime(m.createdAt)}</time>
                   {mine && <Ticks status={(getMsgStatus(m.id) || "sent") as any} />}
                 </div>
              </div>

              </li>
              </React.Fragment>
                );
              })}
              <div ref={bottomRef} />
            </ul>
          )}
        </div>

      {activeRoom ? (
        <form className="chat-input" onSubmit={onSubmit}>
         <input
           value={text}
           onChange={(e) => setText(e.target.value)}
           placeholder="Type a message…"
           autoComplete="off"
           disabled={!userId || !activeRoom}
           />

          {!recording ? (
            <button
            type="button"
            onClick={start}
           disabled={!userId || !activeRoom}
           className="mic-btn"
           title="Record voice"
          >
           <img src={audio} alt="" className="mic-icon" />
        </button>
        ) : (
         <button
           type="button"
           onClick={async () => {
           const file = await stop();
           if (file) sendVoice(file);
           }}
           className="stop-btn"
           title="Stop recording"
          >
           <img src={paused} alt="" className="paused-icon" />
        </button>
      )}

     <button
      type="submit"
      disabled={!text.trim() || !userId || !activeRoom}
      className="send-btn"
      title="Send"
     >
      <img src={sendMsg} alt="send" className="sendmsg"/>
     </button>
     </form>
   ) : null}

      </main>

      <div
        className={`chat-drawer-backdrop ${mobileOpen ? "open" : ""}`}
        onClick={() => setMobileOpen(false)}
      />
      <aside className={`chat-drawer ${mobileOpen ? "open" : ""}`} role="dialog">
        <div className="drawer-header">
          <h3>Conversations</h3>
          <button className="drawer-close" onClick={() => setMobileOpen(false)}>✕</button>
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
            <p className="muted">Go to <Link to="/connections">Connections</Link> to start one.</p>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="muted">No conversations match “{search}”.</div>
        ) : (
          <ul className="drawer-list">
            {filteredRooms.map((r) => {
              const other = getOtherUser(r as ChatRoom);
              const isActive = activeRoom?.id === r.id;
              const unread = unreadByRoom[r.id]?.count || 0;

              return (
                <li
                  key={r.id}
                  className={`drawer-item ${isActive ? "active" : ""}`}
                  onClick={() => {
                    setActiveId(r.id);
                    setMobileOpen(false);
                  }}
                >
                  <div className="room-avatar-wrap">
                    <Avatar filename={other?.profilePicture ?? null} className="room-avatar-img" />
                    {!!other && (
                      <span className={`presence-dot ${isUserOnline(other.id) ? "online" : "offline"}`} />
                    )}
                  </div>

                  <div className="room-name">
                    {other?.userName || r.name || `Room ${r.id}`}
                  </div>

                  {unread > 0 && <span className="unread-badge">{unread}</span>}
                </li>
              );
            })}
          </ul>
        )}

        <div className="chat-actions">
          <Link to="/" className="chat-back">
            <img src={backk} alt="Back" className="icon-back" />
            Back
          </Link>
        </div>
      </aside>
    </div>
  );
};

export default ChatPage;
