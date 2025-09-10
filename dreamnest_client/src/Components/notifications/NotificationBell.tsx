import React from 'react'
import removeIcon from '../../Assets/Icons/remove.svg'
import useNotificationBell from '../../Hooks/notifications/useNotificationUI'
import timeAgo from '../../Utils/timeAgo'
import './notifications.css'
import useNotificationsRedux from '../../Redux/notications/useNotificationsRedux' 

type TypeLabelMap = Record<string, string>
const TYPE_LABELS: TypeLabelMap = {
  NEW_CONNECTION: 'New connection',
  CONNECTION_PARTIAL_ACCEPT: 'Connection update',
  CONNECTION_ACCEPTED: 'Connection accepted',
  CONNECTION_REJECTED: 'Connection rejected',
  LIKE_POST: 'New like',
  GOAL_PROGRESS: 'Goal progress',
  PLAN_COMPLETED: 'Plan completed',
  NEW_MESSAGE: 'New message',
}

const BellIcon: React.FC<{ active?: boolean }> = ({ active }) => (
  <svg className={`bell-icon ${active ? 'active' : ''}`} viewBox="0 0 24 24">
    <path d="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2Zm7-6V11a7 7 0 1 0-14 0v5l-2 2v1h20v-1l-2-2Z" />
  </svg>
)

const NotificationBell: React.FC = () => {
  const { open, toggleOpen, rootRef, onItemKey } = useNotificationBell()

  const {
    items,
    unreadCount,
    status,
    handleMarkAllRead,
    handleActivateItem,
    handleRemoveOne,
    handleRemoveAll,
  } = useNotificationsRedux()

  return (
    <div className="notif-wrapper" ref={rootRef}>
      <button type="button" className="notif-button" onClick={toggleOpen}>
        <BellIcon active={open} />
        {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
      </button>

      {open && (
        <div className="notif-dropdown" role="menu">
          <div className="notif-header">
            <span>Notifications</span>
            <button className="mark-all" onClick={handleMarkAllRead} disabled={unreadCount === 0}>
              Mark all read
            </button>
            <button className="remove-notify" onClick={handleRemoveAll}>
              <img src={removeIcon} alt="remove all" className="remove-notify-icon" />
            </button>
          </div>

          {items.length === 0 ? (
            <div className="notif-empty">
              {status === 'pending' ? 'Loading…' : 'You’re all caught up'}
            </div>
          ) : (
            <ul className="notif-list" role="list">
              {items.map((n) => {
                const pillClass = `pill pill-${(n.type || 'DEFAULT').toLowerCase()}`
                const label = TYPE_LABELS[n.type] || n.type || 'Notification'
                return (
                  <li
                    key={n.id}
                    className={`notif-item ${n.read ? '' : 'unread'}`}
                    tabIndex={0}
                    role="button"
                    onClick={() => handleActivateItem(n.id)}
                    onKeyDown={(e) => onItemKey(e, () => handleActivateItem(n.id))}
                  >
                    <div className="notif-left">
                      <span className={pillClass}>{label}</span>
                      <p className="notif-text">{n.content}</p>
                    </div>
                    <div className="notif-right">
                      <span className="timee">{timeAgo(n.createdAt)}</span>
                      {!n.read && <span className="dot" />}
                    </div>
                    <button
                      className="remove-notify"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveOne(n.id)
                      }}
                    >
                      <img src={removeIcon} alt="remove" className="remove-notify-icon" />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationBell
