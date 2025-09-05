import api from "../axios/axios";
import type { ApiEnvelope } from "../axios/types";

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

const toIso = (d: unknown) =>
  typeof d === "string" ? d : new Date(d as any).toISOString();

const withDefaults = (r: ChatRoom): ChatRoom => ({
  ...r,
  participants: r.participants ?? [],
  messages: r.messages?.map(m => ({ ...m, createdAt: toIso(m.createdAt) })) ?? [],
});


export async function getChatRooms(): Promise<ChatRoom[]> {
  const res = await api.get<ApiEnvelope<ChatRoom[]>>("/chat/rooms");
  const rooms = res.data?.data ?? [];
  return rooms.map(withDefaults);
}


export async function getRoomMessages(roomId: number): Promise<Message[]> {
  const res = await api.get<ApiEnvelope<Message[]>>(`/chat/messages/${roomId}`);
  const list = res.data?.data ?? [];
  return list.map(m => ({ ...m, createdAt: toIso(m.createdAt) }));
}