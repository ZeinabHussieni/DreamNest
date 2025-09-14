import { createAsyncThunk } from '@reduxjs/toolkit';
import type { ChatRoom, Message } from './chat.types';
import { isMessage } from './chat.types';
import { getChatRooms, getRoomMessages,sendVoice, sendImage  } from '../../Services/chat/chatService'
import { toast } from "react-toastify";
import {
  setActiveRoomId,
  appendMessageIfActive,
  setUnreadSummary,
  setDelivered,
  applyReadEvent,
  zeroUnreadForRoom,
  setTyping,
  seedStatusesFromMessages,
  setPresence,
  selectActiveRoomId,
} from './chat.slice';
import {
  subscribeChatEvents,
  joinRoom,
  requestUnreadSummary,
  markReadUntil,
} from '../../Services/socket/socket';
import type { RootState } from '../../store/store';

const getMyUserId = (): number => {
  const raw = localStorage.getItem('user');
  if (raw) {
    try {
      const u = JSON.parse(raw);
      const id = Number(u?.id ?? u?.user?.id);
      if (Number.isFinite(id)) return id;
    } catch {
    }
  }
  const uid = Number(localStorage.getItem('userId'));
  return Number.isFinite(uid) ? uid : 0;
};

export const loadRoomsThunk = createAsyncThunk<ChatRoom[]>(
  'chat/loadRooms',
  async () => getChatRooms()
);

export const loadMessagesThunk = createAsyncThunk<Message[], number>(
  'chat/loadMessages',
  async (roomId, { dispatch }) => {
    dispatch(setActiveRoomId(roomId));
    joinRoom(roomId);

    const msgs = await getRoomMessages(roomId);

    const myUserId = getMyUserId();
    dispatch(seedStatusesFromMessages({ myUserId, msgs }));

    requestUnreadSummary();
    return msgs;
  }
);

let unsub: null | (() => void) = null;

export const initChatSocketThunk = createAsyncThunk<void, void, { state: RootState }>(
  'chat/initSocket',
  async (_void, { dispatch, getState }) => {
    if (unsub) { try { unsub(); } catch {} }
    unsub = null;

    const myUserId = ((): number => {
      const raw = localStorage.getItem('user');
      if (raw) {
        try {
          const u = JSON.parse(raw);
          const id = Number(u?.id ?? u?.user?.id);
          if (Number.isFinite(id)) return id;
        } catch {}
      }
      const uid = Number(localStorage.getItem('userId'));
      return Number.isFinite(uid) ? uid : 0;
    })();

    if (!myUserId) return;

    unsub = subscribeChatEvents({
      onConnect: () => {
        const activeId = selectActiveRoomId(getState());
        if (activeId) joinRoom(activeId);
        requestUnreadSummary();
      },
      onJoined: () => requestUnreadSummary(),
      onNewMessage: (msg) => {
        if (isMessage(msg)) {
          dispatch(appendMessageIfActive(msg));
        } else {
        }
      },
      onDelivered: (messageId) => dispatch(setDelivered(messageId)),
      onRead: (p) => {
        if (p.readerId !== myUserId) {
          dispatch(applyReadEvent({ ...p, myUserId }));
        }
      },
      onTyping: (p) => dispatch(setTyping(p)),
      onPresence: (p) => dispatch(setPresence(p)),
      onUnreadSummary: (rooms) => dispatch(setUnreadSummary(rooms)),
    });
  }
);

export const markRoomReadThunk = createAsyncThunk<
  void,
  { roomId: number; untilMessageId: number }
>(
  'chat/markRead',
  async ({ roomId, untilMessageId }, { dispatch }) => {
    dispatch(zeroUnreadForRoom({ roomId }));
    markReadUntil(roomId, untilMessageId);
  }
);


export const sendVoiceThunk = createAsyncThunk(
  "chat/sendVoice",
  async ({ roomId, file }: { roomId: number; file: File }, { rejectWithValue }) => {
    try {
      const msg = await sendVoice(roomId, file);

      if (msg?.status === "blocked") {
        toast.error("Voice message not sent: contains inappropriate words.");
        return rejectWithValue({ blocked: true });
      }

      return msg;
    } catch (err: any) {
      if (err.status === 400 && err.message === "VOICE_BLOCKED") {
        toast.error("Voice message not sent: contains inappropriate words.");
      } else {
        toast.error(`Failed to send voice note: ${err.message || "Unknown error"}`);
      }
      return rejectWithValue(err);
    }
  }
);
export const sendImageThunk = createAsyncThunk(
  "chat/sendImage",
  async ({ roomId, file }: { roomId: number; file: File }, { rejectWithValue }) => {
    try {
      const msg = await sendImage(roomId, file);
      if (msg?.status === "blocked") {
        toast.error("Image was blocked by moderation.");
        return rejectWithValue({ blocked: true });
      }
      return msg;
    } catch (err: any) {
      toast.error(`Failed to send image: ${err?.message || "Unknown error"}`);
      return rejectWithValue(err);
    }
  }
);