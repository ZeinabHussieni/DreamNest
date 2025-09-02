// // src/Components/notifications/NotificationBell.tsx
// import React, { useEffect, useRef, useState } from "react";
// import { useNotifications } from "../../Context/NotificationsContext";
// import Avatar from "../shared/avatar/Avatar";
// import "./notifications.css";
// import { Link } from "react-router-dom";

// const NotificationBell: React.FC = () => {
//   const { items, unread, loading, markRead } = useNotifications();
//   const [open, setOpen] = useState(false);
//   const ref = useRef<HTMLDivElement | null>(null);

//   useEffect(() => {
//     const onClickAway = (e: MouseEvent) => {
//       if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
//     };
//     document.addEventListener("click", onClickAway);
//     return () => document.removeEventListener("click", onClickAway);
//   }, []);

//   const top5 = items.slice(0, 5);

//   return (
//     <div className="notif-wrap" ref={ref}>
//       <button
//         className="icon-btn notif-bell"
//         aria-label="Notifications"
//         onClick={() => setOpen(v => !v)}
//       >
//         {/* you can keep your image, using a badge */}
//         {/* <img src={Notification} alt="Notifications" /> */}
//         <span className="bell-shape" aria-hidden /> 
//         {unread > 0 && <span className="notif-badge">{unread}</span>}
//       </button>

//       {open && (
//         <div className="notif-dropdown">
//           <div className="notif-head">
//             <strong>Notifications</strong>
//             {loading && <span className="muted">…</span>}
//           </div>

//           {top5.length === 0 ? (
//             <div className="notif-empty">No notifications yet</div>
//           ) : (
//             <ul className="notif-list">
//               {top5.map(n => (
//                 <li
//                   key={n.id}
//                   className={`notif-item ${n.read ? "" : "unread"}`}
//                   onClick={() => markRead(n.id)}
//                 >
//                   {n.actor ? (
//                     <Avatar filename={n.actor.profilePicture ?? null} className="notif-avatar" />
//                   ) : (
//                     <div className="notif-avatar placeholder" />
//                   )}
//                   <div className="notif-text">
//                     <div className="notif-content">{n.content}</div>
//                     <time className="notif-time">
//                       {new Date(n.createdAt).toLocaleString()}
//                     </time>
//                   </div>
//                 </li>
//               ))}
//             </ul>
//           )}

//           <div className="notif-foot">
//             <Link to="/notifications" onClick={() => setOpen(false)}>
//               View all
//             </Link>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default NotificationBell;
export{}