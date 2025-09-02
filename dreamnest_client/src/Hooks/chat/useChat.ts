import { useEffect, useMemo, useRef, useState } from "react";
import { getChatRooms, getRoomMessages, ChatRoom, Message } from "../../Services/chat/chatService";
import { getSocket } from "../../Services/socket/socket";
import { toast } from "react-toastify";

export default function useChat(currentUserId: number) {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const socketRef = useRef(getSocket());

  const loadRooms = async () => {
    try {
      setLoadingRooms(true);
      const data = await getChatRooms();
      const list = Array.isArray(data) ? data : [];
      setRooms(list);
      if (!activeId && list[0]) setActiveId(list[0].id);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to load rooms");
      setRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    if (currentUserId) void loadRooms();
  }, [currentUserId]);

  const activeRoom = useMemo(() => {
    const list = Array.isArray(rooms) ? rooms : [];
    return (list.find((r) => r.id === activeId) as ChatRoom | undefined) ?? null;
  }, [rooms, activeId]);

  // for join and load messages when room changes
  useEffect(() => {
    const socket = socketRef.current;
    if (!activeRoom || !currentUserId) return;

    const join = () => socket.emit("joinRoom", { chatRoomId: activeRoom.id, userId: currentUserId });

    const handleNew = (msg: Message) => {
      if (msg.chatRoomId === activeRoom.id) setMessages((prev) => [...prev, msg]);
    };

    setLoadingMsgs(true);
    getRoomMessages(activeRoom.id)
      .then((data) => setMessages(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load messages");
        setMessages([]);
      })
      .finally(() => setLoadingMsgs(false));

    join();
    socket.on("newMessage", handleNew);

    return () => {
      socket.off("newMessage", handleNew);
    };
  }, [activeRoom?.id, currentUserId]);

  const send = (content: string) => {
    if (!content.trim() || !activeRoom) return;
    socketRef.current.emit("sendMessage", {
      chatRoomId: activeRoom.id,
      senderId: currentUserId,
      content,
    });
  };

  return {
    rooms,
    activeRoom,
    setActiveId,
    messages,
    loadingRooms,
    loadingMsgs,
    send,
    reloadRooms: loadRooms,
  };
}
