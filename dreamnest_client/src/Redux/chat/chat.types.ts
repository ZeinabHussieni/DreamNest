export type ID = number;
export type ISODateString = string;

// chat.types.ts
export type MessageStatus =
  | "sent"
  | "delivered"
  | "read"
  | "delivered_censored"  
  | "blocked";          

export type Message = {
  id: number;
  type: 'text' | 'voice' | 'image';
  content: string | null;
  censoredContent?: string | null;
  audioUrl: string | null;
  transcript: string | null;
  imageUrl: string | null;          
  status: 'sent' | 'delivered' | 'read' | string;
  isBad?: boolean;
  badReason?: string | null;
  moderatedAt?: string | null;
  createdAt: string;
  deliveredAt?: string | null;
  senderId: number;
  chatRoomId: number;
};




export function isMessage(x: unknown): x is Message {
  if (!x || typeof x !== "object") return false;
  const m = x as Record<string, unknown>;
  const nullableStr = (v: unknown) => v == null || typeof v === "string";
  const statusOk =
    typeof m.status === "string" &&
    ["sent","delivered","read","delivered_censored","blocked"].includes(m.status as string);

  return (
    typeof m.id === "number" &&
    (m.type === "text" || m.type === "voice" || m.type === "image") &&
    nullableStr(m.content) &&
    nullableStr(m.censoredContent) &&
    nullableStr(m.audioUrl) &&
    nullableStr(m.transcript) &&
    nullableStr(m.imageUrl) &&        
    statusOk &&
    typeof m.createdAt === "string" &&
    typeof m.senderId === "number" &&
    typeof m.chatRoomId === "number"
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
