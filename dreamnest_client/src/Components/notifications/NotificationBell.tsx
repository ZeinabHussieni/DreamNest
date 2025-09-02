import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNotificationCenter } from "../../Context/NotificationsContext";
import "./notifications.css";

type TypeLabelMap = Record<string, string>;

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

const TYPE_LABELS: TypeLabelMap = {
  NEW_CONNECTION: "New connection",
  CONNECTION_PARTIAL_ACCEPT: "Connection update",
  CONNECTION_ACCEPTED: "Connection accepted",
  CONNECTION_REJECTED: "Connection rejected",
  LIKE_POST: "New like",
  GOAL_PROGRESS: "Goal progress",
  PLAN_COMPLETED: "Plan completed",
  NEW_MESSAGE: "New message",
};

const BellIcon: React.FC<{ active?: boolean }> = ({ active }) => (
  <svg
    className={`bell-icon ${active ? "active" : ""}`}
    viewBox="0 0 24 24"
    aria-hidden
  >
    <path d="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2Zm7-6V11a7 7 0 1 0-14 0v5l-2 2v1h20v-1l-2-2Z" />
  </svg>
);

const NotificationBell: React.FC = () => {
  const { items, unreadCount, markRead, markAllRead } = useNotificationCenter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);


  const toggleOpen = useCallback(() => setOpen((v) => !v), []);
  const close = useCallback(() => setOpen(false), []);


  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) close();
    }
    if (open) document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [open, close]);


  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  const topItems = useMemo(() => items.slice(0, 12), [items]);

  const onItemClick = useCallback(
    (id: number) => {
      markRead(id);
    },
    [markRead]
  );

  const onItemKey = useCallback(
    (e: React.KeyboardEvent<HTMLLIElement>, id: number) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        markRead(id);
      }
    },
    [markRead]
  );

  return (
    <div className="notif-wrapper" ref={rootRef}>
      <button
        type="button"
        className="notif-button"
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={toggleOpen}
      >
        <BellIcon active={open} />
        {unreadCount > 0 && (
          <span className="notif-badge" aria-label={`${unreadCount} unread`}>
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown" role="menu" aria-label="Notifications menu">
          <div className="notif-header">
            <span>Notifications</span>
            <button
              type="button"
              className="mark-all"
              onClick={markAllRead}
              disabled={unreadCount === 0}
            >
              Mark all read
            </button>
          </div>

          {topItems.length === 0 ? (
            <div className="notif-empty">You’re all caught up</div>
          ) : (
            <ul className="notif-list" role="list">
              {topItems.map((n) => {
                const pillClass = `pill pill-${(n.type || "DEFAULT").toLowerCase()}`;
                const label = TYPE_LABELS[n.type] || n.type || "Notification";
                return (
                  <li
                    key={n.id}
                    className={`notif-item ${n.read ? "" : "unread"}`}
                    tabIndex={0}
                    role="button"
                    onClick={() => onItemClick(n.id)}
                    onKeyDown={(e) => onItemKey(e, n.id)}
                  >
                    <div className="notif-left">
                      <span className={pillClass}>{label}</span>
                      <p className="notif-text">{n.content}</p>
                    </div>
                    <div className="notif-right">
                      <span className="time">{timeAgo(n.createdAt)}</span>
                      {!n.read && <span className="dot" />}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
