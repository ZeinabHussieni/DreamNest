import api from "../axios/axios";
import type { ApiEnvelope } from "../axios/types";

// Services/chat/chatService.ts
export type Message = {
  id: number;
  content: string;
  createdAt: string;
  deliveredAt?: string | null;   // 👈 add this
  senderId: number;
  chatRoomId: number;
};




// Services/chat/chatService.ts (types)

export type ParticipantUser = {
  id: number;
  userName: string;
  profilePicture?: string | null;
  lastActiveAt?: string | null;   // 👈 from User
};

export type ChatParticipant = {
  id: number;
  userId: number;
  chatRoomId: number;
  lastSeenAt: string;             // 👈 from ChatRoomUser
  user: ParticipantUser;
};

export type ChatRoom = {
  id: number;
  name?: string | null;
  messages?: Message[];
  participants?: ChatParticipant[];
};
const toIso = (d: unknown) =>
  d == null ? null : typeof d === 'string' ? d : new Date(d as any).toISOString();

const withDefaults = (r: ChatRoom): ChatRoom => ({
  ...r,
  participants: (r.participants ?? []).map(p => ({
    ...p,
    lastSeenAt: toIsoString(p.lastSeenAt),                 // required
    user: {
      ...p.user,
      lastActiveAt: toIsoNullable(p.user?.lastActiveAt),   // optional
    },
  })),
  messages: (r.messages ?? []).map(m => ({
    ...m,
    createdAt: toIsoString(m.createdAt),                   // required
  })),
});



export async function getChatRooms(): Promise<ChatRoom[]> {
  const res = await api.get<ApiEnvelope<ChatRoom[]>>("/chat/rooms");
  const rooms = res.data?.data ?? [];
  return rooms.map(withDefaults);
}


const toIsoNullable = (d: unknown): string | null =>
  d == null ? null : typeof d === "string" ? d : new Date(d as any).toISOString();

const toIsoString = (d: unknown): string =>
  typeof d === "string" ? d : new Date(d as any).toISOString();

export async function getRoomMessages(roomId: number): Promise<Message[]> {
  const res = await api.get<ApiEnvelope<Message[]>>(`/chat/messages/${roomId}`);
  const list = res.data?.data ?? [];
  return list.map((m: any) => ({
    ...m,
    createdAt: toIsoString(m.createdAt),
    deliveredAt: toIsoNullable(m.deliveredAt), // 👈 map it
  }));
}

export type UnreadForRoom = { count: number; firstUnreadId: number | null };

export async function getRoomUnread(roomId: number): Promise<UnreadForRoom> {
  const res = await api.get<ApiEnvelope<UnreadForRoom>>(`/chat/rooms/${roomId}/unread`);
  return res.data?.data ?? { count: 0, firstUnreadId: null };
}
export type ReactionRow = { messageId: number; emoji: string; count: number };

export async function getRoomReactions(roomId: number): Promise<ReactionRow[]> {
  const res = await api.get<ApiEnvelope<ReactionRow[]>>(`/chat/rooms/${roomId}/reactions`);
  return res.data?.data ?? [];
}
