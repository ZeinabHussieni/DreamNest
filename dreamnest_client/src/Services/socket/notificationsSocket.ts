import api from "../axios/axios";
import type { ApiEnvelope } from "../axios/types";

export type NotificationDto = {
  id: number;
  type: string;
  userId: number;
  actorId?: number | null;
  goalId?: number | null;
  planId?: number | null;
  postId?: number | null;
  chatRoomId?: number | null;
  messageId?: number | null;
  content: string;
  read: boolean;
  createdAt: string; // ISO
};

function toIso(v: unknown): string {
  if (typeof v === "string") return v;
  const t = new Date(v as any).toISOString();
  return t;
}

export async function fetchNotifications(): Promise<NotificationDto[]> {

  const res = await api.get<ApiEnvelope<NotificationDto[]>>("/notifications");
  const list = res.data.data ?? [];
  return list.map(n => ({ ...n, createdAt: toIso(n.createdAt) }));
}

export async function markRead(id: number): Promise<NotificationDto> {

  const res = await api.patch<ApiEnvelope<NotificationDto>>(`/notifications/${id}/read`);
  const n = res.data.data;
  return { ...n, createdAt: toIso(n.createdAt) };
}

export async function markAllRead(ids: number[]): Promise<void> {
  if (!ids?.length) return;
  await Promise.all(ids.map(id => markRead(id).catch(() => undefined)));
}
