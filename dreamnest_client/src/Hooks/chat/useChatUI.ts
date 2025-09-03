import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChatRoom, Message } from "../../Services/chat/chatService";

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

  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);


  const bodyRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);


  const getOtherUser = useCallback(
    (room: ChatRoom) => {
      const users = room.participants?.map(p => p.user).filter(Boolean) ?? [];
      return users.find(u => u.id !== userId) ?? null;
    },
    [userId]
  );

  const activeOther = useMemo(
    () => (activeRoom ? getOtherUser(activeRoom) : null),
    [activeRoom, getOtherUser]
  );


  const filteredRooms = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rooms;
    return rooms.filter(r => {
      const other = getOtherUser(r);
      const username = (other?.userName || "").toLowerCase();
      const name = (r.name || "").toLowerCase();
      return username.includes(q) || name.includes(q);
    });
  }, [rooms, search, getOtherUser]);


  useEffect(() => {
    if (loadingMsgs) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loadingMsgs]);

 
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);


  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value || !activeRoom) return;
    send(value);
    setText("");
  };

  return {
  
    text, setText,
    search, setSearch,
    mobileOpen, setMobileOpen,

  
    filteredRooms,
    activeOther,

 
    bodyRef,
    bottomRef,

   
    getOtherUser,
    onSubmit,
  };
}
