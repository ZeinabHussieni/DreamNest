import React from "react";
import useNotifications from "../../Hooks/notifications/useNotifications";
import useNotificationBell from "../../Hooks/notifications/useNotificationUI";
import timeAgo from "../../Utils/timeAgo";
import "./notifications.css";

type TypeLabelMap = Record<string, string>;
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
  <svg className={`bell-icon ${active ? "active" : ""}`} viewBox="0 0 24 24">
    <path d="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2Zm7-6V11a7 7 0 1 0-14 0v5l-2 2v1h20v-1l-2-2Z" />
  </svg>
);

const NotificationBell: React.FC = () => {
  const { items, unreadCount, activateItem, markAllRead } = useNotifications();
  const { open, toggleOpen, close, rootRef, onItemKey } = useNotificationBell();

  return (
    <div className="notif-wrapper" ref={rootRef}>
      <button
        type="button"
        className="notif-button"
        onClick={toggleOpen}
      >
        <BellIcon active={open} />
        {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
      </button>

      {open && (
        <div className="notif-dropdown" role="menu">
          <div className="notif-header">
            <span>Notifications</span>
            <button className="mark-all" onClick={markAllRead} disabled={unreadCount === 0}>
              Mark all read
            </button>
          </div>

          {items.length === 0 ? (
            <div className="notif-empty">You’re all caught up</div>
          ) : (
            <ul className="notif-list" role="list">
              {items.map((n) => {
                const pillClass = `pill pill-${(n.type || "DEFAULT").toLowerCase()}`;
                const label = TYPE_LABELS[n.type] || n.type || "Notification";
                return (
                  <li
                    key={n.id}
                    className={`notif-item ${n.read ? "" : "unread"}`}
                    tabIndex={0}
                    role="button"
                    onClick={() => activateItem(n.id)}
                    onKeyDown={(e) => onItemKey(e, () => activateItem(n.id))}
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
