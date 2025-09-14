import React from "react";
import "../dashboard/dashboard.css";

type Offender = {
  userId: number; userName: string; email: string;
  totalInfractions: number; textInfractions: number; voiceInfractions: number; imageInfractions: number;
  chatBlocked: boolean; siteBlocked: boolean; lastUpdated: string;
};

type BadMsg = {
  id: number; chatRoomId: number; senderId: number; senderName: string;
  type: "text" | "voice" | "image"; status: string; badReason: string; createdAt: string;
};

export const AdminOffendersCard: React.FC<{ items: Offender[] }> = ({ items }) => (
  <div className="dg-card">
    <div className="dg-head">
      <div>
        <div className="dg-title">Top Offenders</div>
        <div className="dg-subtitle">Most infractions</div>
      </div>
    </div>

    {items.length === 0 ? (
      <div className="dg-empty">No offenders found.</div>
    ) : (
      <ul className="dg-list">
        {items.map(o => (
          <li key={o.userId} className="dg-row">
            <div className="dg-main">
              <div className="dg-title-sm">{o.userName} <span className="dg-subtitle">({o.email})</span></div>
              <div className="dg-subtitle">
                Total {o.totalInfractions} — Text {o.textInfractions}, Voice {o.voiceInfractions}, Image {o.imageInfractions}
                {o.chatBlocked && " · Chat blocked"}
                {o.siteBlocked && " · Site blocked"}
              </div>
            </div>
            <div className="dg-pct">{new Date(o.lastUpdated).toLocaleString()}</div>
          </li>
        ))}
      </ul>
    )}
  </div>
);

export const AdminRecentBadCard: React.FC<{ items: BadMsg[] }> = ({ items }) => (
  <div className="dg-card">
    <div className="dg-head">
      <div>
        <div className="dg-title">Recent Moderation Events</div>
        <div className="dg-subtitle">Latest blocked/censored messages</div>
      </div>
    </div>

    {items.length === 0 ? (
      <div className="dg-empty">Nothing recent 🎉</div>
    ) : (
      <ul className="dg-list">
        {items.map(m => (
          <li key={m.id} className="dg-row">
            <div className="dg-main">
              <div className="dg-title-sm">
                #{m.id} · {m.type.toUpperCase()} · {m.status}
              </div>
              <div className="dg-subtitle">
                by <strong>{m.senderName}</strong> in room {m.chatRoomId} — reason: {m.badReason}
              </div>
            </div>
            <div className="dg-pct">{new Date(m.createdAt).toLocaleString()}</div>
          </li>
        ))}
      </ul>
    )}
  </div>
);
