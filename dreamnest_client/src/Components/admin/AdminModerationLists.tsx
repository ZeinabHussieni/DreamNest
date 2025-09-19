import React, { useMemo, useState, useEffect, useCallback } from "react";
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


const ChevronLeft: React.FC<{className?:string}> = ({className}) => (
  <svg viewBox="0 0 24 24" width="18" height="18" className={className} aria-hidden="true">
    <path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const ChevronRight: React.FC<{className?:string}> = ({className}) => (
  <svg viewBox="0 0 24 24" width="18" height="18" className={className} aria-hidden="true">
    <path d="M9 18l6-6-6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);


function usePager<T>(items: T[], pageSize = 5) {
  const [page, setPage] = useState(1);
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));


  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [pages, page]);

  const slice = useMemo(() => {
    if (total === 0) return [];
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize, total]);

  const range = useMemo(() => {
    if (total === 0) return { from: 0, to: 0 };
    const from = (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, total);
    return { from, to };
  }, [page, pageSize, total]);

  const next = useCallback(() => setPage(p => Math.min(pages, p + 1)), [pages]);
  const prev = useCallback(() => setPage(p => Math.max(1, p - 1)), []);

  return { page, pages, setPage, slice, total, range, next, prev, hasPrev: page > 1, hasNext: page < pages };
}


const Pager: React.FC<{
  page: number; pages: number; total: number;
  range: {from:number; to:number};
  next: () => void; prev: () => void;
  hasPrev: boolean; hasNext: boolean;
}> = ({ page, pages, total, range, next, prev, hasPrev, hasNext }) => (
  <div className="dg-pager" role="navigation" aria-label="Pagination">
    <div className="dg-pager-left">
      <span className="dg-pager-range">Showing {range.from}–{range.to}</span>
      <span className="dg-pager-total">of {total}</span>
    </div>
    <div className="dg-pager-right">
      <button
        type="button"
        className="dg-page-btn"
        onClick={prev}
        disabled={!hasPrev}
      >
        <ChevronLeft />
        <span className="sr-only">Prev</span>
      </button>
      <span className="dg-page-num" aria-live="polite">{page} / {pages}</span>
      <button
        type="button"
        className="dg-page-btn"
        onClick={next}
        disabled={!hasNext}
      >
        <ChevronRight />
        <span className="sr-only">Next</span>
      </button>
    </div>
  </div>
);


export const AdminOffendersCard: React.FC<{ items: Offender[]; pageSize?: number }> = ({ items, pageSize = 5 }) => {
  const pager = usePager(items, pageSize);

  return (
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
        <>
          <ul className="dg-list">
            {pager.slice.map(o => (
              <li key={o.userId} className="dg-row">
                <div className="dg-main">
                  <div className="dg-title-sm">
                    {o.userName} <span className="dg-subtitle">({o.email})</span>
                  </div>
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

          <Pager {...pager} />
        </>
      )}
    </div>
  );
};


export const AdminRecentBadCard: React.FC<{ items: BadMsg[]; pageSize?: number }> = ({ items, pageSize = 6 }) => {
  const pager = usePager(items, pageSize);

  return (
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
        <>
          <ul className="dg-list">
            {pager.slice.map(m => (
              <li key={m.id} className="dg-row">
                <div className="dg-main">
                  <div className="dg-title-sm">
                    #{m.id} {m.type.toUpperCase()}
                  </div>
                  <div className="dg-subtitle">
                    by <strong>{m.senderName}</strong> in room {m.chatRoomId} — reason: {m.badReason}
                  </div>
                </div>
                <div className="dg-pct">{new Date(m.createdAt).toLocaleString()}</div>
              </li>
            ))}
          </ul>

          <Pager {...pager} />
        </>
      )}
    </div>
  );
};
