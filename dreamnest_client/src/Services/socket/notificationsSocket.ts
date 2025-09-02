import api from "../axios/axios";

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
  createdAt: string;
};

function unwrap<T>(payload: any): T {
  const p = payload?.data ?? payload;
  if (Array.isArray(p)) return p as T;
  if (Array.isArray(p?.data)) return p.data as T;
  return p as T;
}

export async function fetchNotifications(): Promise<NotificationDto[]> {
  const res = await api.get("/notifications");
  const list = unwrap<unknown>(res);
  const arr = Array.isArray(list) ? list : [];
  return arr.map((n: any) => ({
    ...n,
    createdAt:
      typeof n.createdAt === "string"
        ? n.createdAt
        : new Date(n.createdAt).toISOString(),
  })) as NotificationDto[];
}

export async function markRead(id: number): Promise<NotificationDto> {
  const res = await api.patch(`/notifications/${id}/read`);
  return unwrap<NotificationDto>(res);
}

export async function markAllRead(ids: number[]): Promise<void> {
  if (!ids?.length) return;
  await Promise.all(ids.map((id) => markRead(id).catch(() => undefined)));
}
