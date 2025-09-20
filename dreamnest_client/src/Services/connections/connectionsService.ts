import api from "../axios/axios";
import type { ApiEnvelope } from "../axios/types";

export type Decision = "pending" | "accepted" | "rejected";
export type Status   = "pending" | "accepted" | "rejected";

export type UserMini = {
  id: number;
  userName: string;
  profilePicture?: string | null;
};

export type GoalMini = {
  id: number;
  title: string;
};

export type Connection = {
  id: number;
  helper_id: number;
  seeker_id: number;
  goal_id: number;
  similarityScore?: number;
  status: Status;
  helperDecision: Decision;
  seekerDecision: Decision;
  chatRoomId?: number | null;
  createdAt: string;
  updatedAt: string;
  helper: UserMini;
  seeker: UserMini;
  goal: GoalMini;
};


export async function getConnections(): Promise<Connection[]> {
  const res = await api.get<ApiEnvelope<Connection[]>>("/connections");
  return res.data.data ?? [];
}


export async function acceptConnection(
  id: number
): Promise<{ connection: Connection; chatRoom: any | null }> {
  const res = await api.patch<ApiEnvelope<{ connection: Connection; chatRoom: any | null }>>(
    `/connections/${id}/accept`
  );
  const { connection, chatRoom } = res.data.data;
  return { connection, chatRoom };
}

export async function rejectConnection(
  id: number
): Promise<{ connection: Connection }> {
  const res = await api.patch<ApiEnvelope<{ connection: Connection }>>(
    `/connections/${id}/reject`
  );
  return { connection: res.data.data.connection };
}
