import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import type { ChatRoom, Message, MsgStatus } from "../../Redux/chat/chat.types";
import {
  selectUnreadByRoom,
  selectActiveRoomId,
  selectPresence,
  selectTyping,
  selectMessageStatusMap,
} from "../../Redux/chat/chat.slice";
import { markRoomReadThunk } from "../../Redux/chat/chat.thunks";
import { setTyping as emitTyping } from "../../Services/socket/socket";

type Args = {
  userId: number;
  rooms: ChatRoom[];
  activeRoom: ChatRoom | null | undefined;
  loadingMsgs: boolean;
  messages: Message[];
  send: (text: string) => void;
};

export default function useChatUI({
  userId,
  rooms,
  activeRoom,
  loadingMsgs,
  messages,
  send,
}: Args) {
  const dispatch = useAppDispatch();

  //  state we need for UI
  const unreadByRoom = useAppSelector(selectUnreadByRoom);
  const activeRoomId = useAppSelector(selectActiveRoomId);
  const presenceByUser = useAppSelector(selectPresence);
  const typingByRoom = useAppSelector(selectTyping);
  const msgStatusMap = useAppSelector(selectMessageStatusMap);

  // local ui state
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  // dom refs
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // time helper
  const timeAgo = (iso?: string | null) => {
    if (!iso) return "";
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return "just now";
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const fmtTime = (iso: string | number | Date) =>
    new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // who is the other user in a 1:1 room
  const getOtherUser = useCallback(
    (room: ChatRoom) => {
      const users = room.participants?.map((p) => p.user).filter(Boolean) ?? [];
      return users.find((u) => u.id !== userId) ?? null;
    },
    [userId]
  );

  const activeOther = useMemo(
    () => (activeRoom ? getOtherUser(activeRoom) : null),
    [activeRoom, getOtherUser]
  );

  const otherParticipant = useMemo(() => {
    if (!activeRoom || !activeOther) return null;
    return activeRoom.participants?.find((p) => p.userId === activeOther.id) || null;
  }, [activeRoom, activeOther]);

  // presence helpers
  const isUserOnline = useCallback(
    (id?: number | null) => (!!id ? !!presenceByUser[id] : false),
    [presenceByUser]
  );

  const activeOtherOnline = isUserOnline(activeOther?.id ?? null);

  const statusLine = useMemo(() => {
    if (!activeOther) return "";
    if (activeOtherOnline) return "online";
    const ts = otherParticipant?.lastSeenAt || activeOther.lastActiveAt || null;
    return ts ? `last seen ${timeAgo(ts)}` : "";
  }, [activeOther, activeOtherOnline, otherParticipant]);

  // room search
  const filteredRooms = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rooms;
    return rooms.filter((r) => {
      const other = getOtherUser(r);
      const username = (other?.userName || "").toLowerCase();
      const name = (r.name || "").toLowerCase();
      return username.includes(q) || name.includes(q);
    });
  }, [rooms, search, getOtherUser]);

  // typing indicator users in active room excluding me
  const activeRoomTyping = useMemo(() => {
    if (!activeRoom) return [];
    const roomMap = typingByRoom[activeRoom.id] || {};
    return Object.keys(roomMap)
      .map(Number)
      .filter((uid) => uid !== userId);
  }, [typingByRoom, activeRoom, userId]);

  // scroll to bottom when messages change
  useEffect(() => {
    if (loadingMsgs) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loadingMsgs]);

  // close drawer with ESC
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  // catch-Up divider id for active room
  const firstUnreadId = useMemo(
    () => (activeRoom ? unreadByRoom[activeRoom.id]?.firstUnreadId ?? null : null),
    [unreadByRoom, activeRoom]
  );

  // auto mark read when bottom is visible
  useEffect(() => {
    if (!activeRoom || messages.length === 0) return;
    const el = bottomRef.current;
    if (!el) return;

    const lastId = messages[messages.length - 1]?.id;
    const targetUntil = firstUnreadId || lastId;

    const obs = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (e.isIntersecting && targetUntil) {
          dispatch(markRoomReadThunk({ roomId: activeRoom.id, untilMessageId: targetUntil }));
        }
      },
      { root: bodyRef.current, threshold: 1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [activeRoom, messages, firstUnreadId, dispatch]);

  // emit typing 
  useEffect(() => {
    if (!activeRoomId || !text) return;

    emitTyping(activeRoomId, true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => emitTyping(activeRoomId, false), 1200);

    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [text, activeRoomId]);

  // stop typing on blur
  useEffect(() => {
    const stop = () => {
      if (activeRoomId) emitTyping(activeRoomId, false);
    };
    window.addEventListener("blur", stop);
    return () => window.removeEventListener("blur", stop);
  }, [activeRoomId]);

  // send
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value || !activeRoom) return;
    send(value);
    setText("");
    if (activeRoomId) emitTyping(activeRoomId, false);
  };

  // msg status helper
  const getMsgStatus = useCallback(
    (id: number): MsgStatus => (msgStatusMap[id] ?? "sent"),
    [msgStatusMap]
  );

  return {

    text, setText,
    search, setSearch,
    mobileOpen, setMobileOpen,

  
    filteredRooms,
    bodyRef,
    bottomRef,

   
    activeOther,
    activeOtherOnline,
    statusLine,
    isUserOnline,

   
    activeRoomTyping,
    firstUnreadId,

 
    getOtherUser,
    getMsgStatus,
    fmtTime,
    onSubmit,

 
    unreadByRoom,
  } as const;
}
