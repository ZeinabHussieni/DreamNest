export type ID = number;
export type ISODateString = string;


export interface Message {
  id: ID;
  content: string;
  createdAt: ISODateString;
  deliveredAt?: ISODateString | null;
  senderId: ID;
  chatRoomId: ID;
}

//for message payloads 
export function isMessage(x: unknown): x is Message {
  if (!x || typeof x !== "object") return false;
  const m = x as Record<string, unknown>;
  const deliveredOk =
    m.deliveredAt === undefined ||
    m.deliveredAt === null ||
    typeof m.deliveredAt === "string";

  return (
    typeof m.id === "number" &&
    typeof m.content === "string" &&
    typeof m.createdAt === "string" &&
    typeof m.senderId === "number" &&
    typeof m.chatRoomId === "number" &&
    deliveredOk
  );
}


export interface ParticipantUser {
  id: ID;
  userName: string;
  profilePicture?: string | null;
  lastActiveAt?: ISODateString | null;
}


export interface ChatParticipant {
  id: ID;
  userId: ID;
  chatRoomId: ID;
  lastSeenAt: ISODateString;
  user: ParticipantUser;
}


export interface ChatRoom {
  id: ID;
  name?: string | null;
  messages?: Message[];
  participants?: ChatParticipant[];
}


export interface ChatRoomWithRelations extends ChatRoom {
  messages: Message[];
  participants: ChatParticipant[];
}


export interface UnreadSummaryItem {
  roomId: ID;
  count: number;
  firstUnreadId: ID | null;
}


export interface ReadEvent {
  roomId: ID;
  untilMessageId: ID;
  readerId: ID;
}

export interface TypingEvent {
  roomId: ID;
  userId: ID;
  typing: boolean;
}

export interface PresenceEvent {
  userId: ID;
  online: boolean;
}


export type MsgStatus = "sent" | "delivered" | "read";
