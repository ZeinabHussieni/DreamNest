import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type {ChatRoom,Message,UnreadSummaryItem,ReadEvent,TypingEvent,PresenceEvent,MsgStatus,} from './chat.types';
import { loadRoomsThunk, loadMessagesThunk } from './chat.thunks';
import type { RootState } from '../../store/store';

type Status = 'idle' | 'pending' | 'succeeded' | 'failed';

export type ChatState = {
  rooms: ChatRoom[];
  roomsStatus: Status;
  roomsError: string | null;

  activeRoomId: number | null;

  messages: Message[];
  messagesStatus: Status;
  messagesError: string | null;

  unreadByRoom: Record<number, { count: number; firstUnreadId: number | null }>;
  globalUnread: number;

  messageStatus: Record<number, MsgStatus>; 

  presenceByUser: Record<number, boolean>; 
  typingByRoom: Record<number, Record<number, number>>; 
};

const initialState: ChatState = {
  rooms: [],
  roomsStatus: 'idle',
  roomsError: null,

  activeRoomId: null,

  messages: [],
  messagesStatus: 'idle',
  messagesError: null,

  unreadByRoom: {},
  globalUnread: 0,

  messageStatus: {},

  presenceByUser: {},
  typingByRoom: {},
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveRoomId(state, action: PayloadAction<number | null>) {
      state.activeRoomId = action.payload;
    },

    appendMessageIfActive(state, action: PayloadAction<Message>) {
      const msg = action.payload;

      if (state.activeRoomId && msg.chatRoomId === state.activeRoomId) {
        if (!state.messages.some((m) => m.id === msg.id)) {
          state.messages.push(msg);
        }
        return;
      }

      const cur = state.unreadByRoom[msg.chatRoomId] ?? { count: 0, firstUnreadId: null };
      const next = {
        count: cur.count + 1,
        firstUnreadId: cur.firstUnreadId ?? msg.id,
      };
      state.unreadByRoom[msg.chatRoomId] = next;
      state.globalUnread = Object.values(state.unreadByRoom).reduce((sum, u) => sum + u.count, 0);
    },

    setUnreadSummary(state, action: PayloadAction<UnreadSummaryItem[]>) {
      const map: ChatState['unreadByRoom'] = {};
      for (const u of action.payload) {
        map[u.roomId] = { count: u.count, firstUnreadId: u.firstUnreadId };
      }
      state.unreadByRoom = map;
      state.globalUnread = action.payload.reduce((acc, r) => acc + r.count, 0);
    },

    setDelivered(state, action: PayloadAction<number>) {
      const id = action.payload;
      const prev = state.messageStatus[id];
      if (!prev || prev === 'sent') state.messageStatus[id] = 'delivered';
    },

    applyReadEvent(state, action: PayloadAction<ReadEvent & { myUserId: number }>) {
      const { roomId, untilMessageId, readerId, myUserId } = action.payload;
      if (readerId === myUserId) return;

      for (const m of state.messages) {
        if (m.chatRoomId === roomId && m.senderId === myUserId && m.id <= untilMessageId) {
          state.messageStatus[m.id] = 'read';
        }
      }
    },

    seedStatusesFromMessages(
      state,
      action: PayloadAction<{ myUserId: number; msgs: Message[] }>
    ) {
      const { myUserId, msgs } = action.payload;
      for (const m of msgs) {
        if (m.senderId !== myUserId) continue;
        state.messageStatus[m.id] = m.deliveredAt ? 'delivered' : 'sent';
      }
    },

    zeroUnreadForRoom(state, action: PayloadAction<{ roomId: number }>) {
      const { roomId } = action.payload;
      state.unreadByRoom[roomId] = { count: 0, firstUnreadId: null };
      state.globalUnread = Object.values(state.unreadByRoom).reduce((sum, u) => sum + u.count, 0);
    },

    setPresence(state, action: PayloadAction<PresenceEvent>) {
      state.presenceByUser[action.payload.userId] = action.payload.online;
    },

    setTyping(state, action: PayloadAction<TypingEvent>) {
      const { roomId, userId, typing } = action.payload;
      if (!state.typingByRoom[roomId]) state.typingByRoom[roomId] = {};
      if (typing) state.typingByRoom[roomId][userId] = Date.now();
      else delete state.typingByRoom[roomId][userId];
    },

    resetChat() {
      return initialState;
    },
  },
  extraReducers: (b) => {
    b.addCase(loadRoomsThunk.pending, (s) => {
      s.roomsStatus = 'pending';
      s.roomsError = null;
    });
    b.addCase(loadRoomsThunk.fulfilled, (s, a) => {
      s.roomsStatus = 'succeeded';
      s.rooms = a.payload;
      if (s.activeRoomId == null && s.rooms[0]) s.activeRoomId = s.rooms[0].id;
    });
    b.addCase(loadRoomsThunk.rejected, (s, a) => {
      s.roomsStatus = 'failed';
      s.roomsError = a.error.message || 'Failed to load rooms';
      s.rooms = [];
    });

    b.addCase(loadMessagesThunk.pending, (s) => {
      s.messagesStatus = 'pending';
      s.messagesError = null;
      s.messages = [];
    });
    b.addCase(loadMessagesThunk.fulfilled, (s, a) => {
      s.messagesStatus = 'succeeded';
      s.messages = a.payload;
    });
    b.addCase(loadMessagesThunk.rejected, (s, a) => {
      s.messagesStatus = 'failed';
      s.messagesError = a.error.message || 'Failed to load messages';
      s.messages = [];
    });
  },
});

export const {
  setActiveRoomId,
  appendMessageIfActive,
  setUnreadSummary,
  setDelivered,
  applyReadEvent,
  zeroUnreadForRoom,
  setPresence,
  seedStatusesFromMessages,
  setTyping,
  resetChat,
} = chatSlice.actions;

export default chatSlice.reducer;


export const selectRooms = (s: RootState) => (s.chat as ChatState).rooms;
export const selectRoomsStatus = (s: RootState) => (s.chat as ChatState).roomsStatus;
export const selectActiveRoomId = (s: RootState) => (s.chat as ChatState).activeRoomId;
export const selectActiveRoom = (s: RootState) => {
  const id = (s.chat as ChatState).activeRoomId;
  return id ? (s.chat as ChatState).rooms.find((r) => r.id === id) ?? null : null;
};
export const selectMessages = (s: RootState) => (s.chat as ChatState).messages;
export const selectMessagesStatus = (s: RootState) => (s.chat as ChatState).messagesStatus;
export const selectUnreadByRoom = (s: RootState) => (s.chat as ChatState).unreadByRoom;
export const selectGlobalUnread = (s: RootState) => (s.chat as ChatState).globalUnread;
export const selectPresence = (s: RootState) => (s.chat as ChatState).presenceByUser;
export const selectTyping = (s: RootState) => (s.chat as ChatState).typingByRoom;
export const selectMessageStatusMap = (s: RootState) => (s.chat as ChatState).messageStatus;
