import api from "../axios/axios";

export type Decision = "pending" | "accepted" | "rejected";
export type Status   = "pending" | "accepted" | "rejected";

export type Connection = {
  id: number;
  helper_id: number;
  seeker_id: number;
  goal: { id: number; title: string };
  helperDecision: Decision;
  seekerDecision: Decision;
  status: Status;
  helper: { id: number; userName: string; profilePicture?: string | null };
  seeker: { id: number; userName: string; profilePicture?: string | null };
};

function normalizeToArray<T = unknown>(payload: any): T[] {
  const p = payload?.data ?? payload;
  if (Array.isArray(p)) return p;
  if (Array.isArray(p?.connections)) return p.connections;
  if (Array.isArray(p?.data)) return p.data;
  if (Array.isArray(p?.items)) return p.items;
  return [];
}

export async function getConnections(): Promise<Connection[]> {
  const res = await api.get("/connections");
  return normalizeToArray<Connection>(res);
}


export async function acceptConnection(
  id: number
): Promise<{ connection: Connection; chatRoom: any | null }> {
  const res = await api.patch(`/connections/${id}/accept`);
  const d = res?.data ?? res;
  const connection: Connection = d?.connection ?? d;
  const chatRoom = d?.chatRoom ?? null;
  return { connection, chatRoom };
}

export async function rejectConnection(
  id: number
): Promise<{ connection: Connection }> {
  const res = await api.patch(`/connections/${id}/reject`);
  const d = res?.data ?? res;
  const connection: Connection = d?.connection ?? d;
  return { connection };
}
