import api from "../axios/axios";
import type { ApiEnvelope } from "../axios/types";



export type Message = {
  id: number;
  type: 'text' | 'audio';
  content: string | null;
  audioUrl: string | null;
  transcript: string | null;
  status: 'sent' | 'delivered' | 'read' | string;
  createdAt: string;
  deliveredAt?: string | null;
  senderId: number;
  chatRoomId: number;
};


export type ParticipantUser = {
  id: number;
  userName: string;
  profilePicture?: string | null;
  lastActiveAt?: string | null;
};

export type ChatParticipant = {
  id: number;
  userId: number;
  chatRoomId: number;
  lastSeenAt: string;
  user: ParticipantUser;
};

export type ChatRoom = {
  id: number;
  name?: string | null;
  messages?: Message[];
  participants?: ChatParticipant[];
};

export type UnreadForRoom = {
  count: number;
  firstUnreadId: number | null;
};

export type ReactionRow = {
  messageId: number;
  emoji: string;
  count: number;
};

//coerce unknown date to ISO string 
const toIsoString = (d: unknown): string =>
  typeof d === "string" ? d : new Date(d as any).toISOString();

//coerce unknown date to ISO string or null
const toIsoNullable = (d: unknown): string | null =>
  d == null ? null : typeof d === "string" ? d : new Date(d as any).toISOString();

//normalize a chatRoom payload to ensure date strings and defaults
const normalizeRoom = (r: ChatRoom): ChatRoom => ({
  ...r,
  participants: (r.participants ?? []).map((p) => ({
    ...p,
    lastSeenAt: toIsoString((p as any).lastSeenAt),
    user: {
      ...p.user,
      lastActiveAt: toIsoNullable((p.user as any)?.lastActiveAt),
    },
  })),
  messages: (r.messages ?? []).map((m) => ({
    ...m,
    createdAt: toIsoString((m as any).createdAt),
    deliveredAt: toIsoNullable((m as any).deliveredAt),
  })),
});



export async function getChatRooms(): Promise<ChatRoom[]> {
  const res = await api.get<ApiEnvelope<ChatRoom[]>>("/chat/rooms");
  const rooms = res.data?.data ?? [];
  return rooms.map(normalizeRoom);
}

export async function getRoomMessages(roomId: number): Promise<Message[]> {
  const res = await api.get<ApiEnvelope<Message[]>>(`/chat/messages/${roomId}`);
  const list = res.data?.data ?? [];
  return list.map((m) => ({
    ...m,
    createdAt: toIsoString((m as any).createdAt),
    deliveredAt: toIsoNullable((m as any).deliveredAt),
  }));
}

export async function getRoomUnread(roomId: number): Promise<UnreadForRoom> {
  const res = await api.get<ApiEnvelope<UnreadForRoom>>(`/chat/rooms/${roomId}/unread`);
  return res.data?.data ?? { count: 0, firstUnreadId: null };
}

export async function getRoomReactions(roomId: number): Promise<ReactionRow[]> {
  const res = await api.get<ApiEnvelope<ReactionRow[]>>(`/chat/rooms/${roomId}/reactions`);
  return res.data?.data ?? [];
}


export async function sendVoice(roomId: number, file: File, onProgress?: (pct: number) => void) {
  const fd = new FormData();
  fd.append('roomId', String(roomId));
  fd.append('audio', file, file.name || 'voice.webm');

  const res = await api.post<ApiEnvelope<Message>>('/chat/messages/voice', fd, {
    headers: { "Content-Type": "multipart/form-data" }, 
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    },
  });

  return res.data?.data;
}
