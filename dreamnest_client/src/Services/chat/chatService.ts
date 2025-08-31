import api from "../axios/axios";

export type Message = {
  id: number;
  content: string;
  createdAt: string;
  senderId: number;
  chatRoomId: number;
};

export type ParticipantUser = {
  id: number;
  userName: string;
  profilePicture?: string | null;
};

export type ChatParticipant = {
  id: number;
  userId: number;
  chatRoomId: number;
  user: ParticipantUser;
};

export type ChatRoom = {
  id: number;
  name?: string | null;
  messages?: Message[];
  participants?: ChatParticipant[];
};


function unwrap<T = unknown>(payload: any): any {

  const p = payload?.data ?? payload;

  if (Array.isArray(p)) return p;
  if (Array.isArray(p?.data)) return p.data;    
  if (Array.isArray(p?.items)) return p.items;
  if (Array.isArray(p?.messages)) return p.messages;
  return p;
}

export async function getChatRooms(): Promise<ChatRoom[]> {
  const res  = await api.get("/chat/rooms");
  const raw  = unwrap<ChatRoom[] | { rooms: ChatRoom[] } | { data: ChatRoom[] }>(res);

  const rooms: ChatRoom[] = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as any)?.rooms)
      ? (raw as { rooms: ChatRoom[] }).rooms
      : Array.isArray((raw as any)?.data)
        ? (raw as { data: ChatRoom[] }).data
        : [];

  return rooms.map((r) => ({ ...r, participants: r.participants ?? [] }));
}


export async function getRoomMessages(roomId: number): Promise<Message[]> {
  const res = await api.get(`/chat/messages/${roomId}`);
  const arr = unwrap<Message[]>(res);              
  const list = Array.isArray(arr) ? arr : [];
  return list.map((m: any) => ({
    ...m,
    createdAt:
      typeof m.createdAt === "string"
        ? m.createdAt
        : new Date(m.createdAt).toISOString(),
  }));
}
