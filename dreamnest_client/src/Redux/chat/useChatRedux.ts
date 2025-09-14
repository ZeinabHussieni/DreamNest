import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  selectRooms, selectRoomsStatus, selectActiveRoomId, selectActiveRoom,
  selectMessages, selectMessagesStatus, setActiveRoomId, appendMessageIfActive
} from './chat.slice';
import { toast } from "react-toastify";
import { loadRoomsThunk, loadMessagesThunk,sendVoiceThunk } from './chat.thunks';
import { getChatSocket } from '../../Services/socket/socket';
import type { Message } from './chat.types';
import { sendImageThunk } from './chat.thunks';  

export default function useChatRedux(currentUserId: number) {
  const dispatch = useAppDispatch();

  const rooms = useAppSelector(selectRooms);
  const roomsStatus = useAppSelector(selectRoomsStatus);
  const activeRoomId = useAppSelector(selectActiveRoomId);
  const activeRoom = useAppSelector(selectActiveRoom);
  const messages = useAppSelector(selectMessages);
  const messagesStatus = useAppSelector(selectMessagesStatus);

 
  useEffect(() => {
    if (currentUserId) dispatch(loadRoomsThunk());
  }, [currentUserId, dispatch]);

  // to make sure we always use the freshest socket after auth changes
  useEffect(() => {
  if (!currentUserId) return;

  const socket = getChatSocket();

  const onError = (p: { code?: string; message?: string }) => {
  const msg = p?.message ?? "";
  if (msg === "MESSAGE_BLOCKED" || msg.includes("MESSAGE_BLOCKED") || p?.code === "BAD_REQUEST") {
    toast.error("Message not sent: inappropriate words detected.");
  } else if (msg) {
    toast.error(` ${msg}`);
  } else {
    toast.error("Failed to send message.");
  }
};


  socket.on("chat:error", onError);
  return () => {
    socket.off("chat:error", onError);
  };
}, [currentUserId]);

useEffect(() => {
  if (!activeRoom || !currentUserId) return;

  dispatch(loadMessagesThunk(activeRoom.id));

  const socket = getChatSocket();

  const onNew = (msg: Message) => {
  if (msg.chatRoomId === activeRoom.id) {
    dispatch(appendMessageIfActive(msg));
  }

  if (msg.senderId === currentUserId) {
    if (msg.status === "delivered_censored") {
      toast.info("Your message was moderated and shown with masking.");
    } else if (msg.status === "blocked") {
      toast.error("Your voice message was blocked for inappropriate content.");
    }
  }
};



  socket.off('chat:newMessage', onNew);
  socket.on('chat:newMessage', onNew);

  return () => {
    socket.off('chat:newMessage', onNew);
  };
}, [activeRoom?.id, currentUserId, dispatch]);


  const setActiveId = useCallback((id: number) => {
    dispatch(setActiveRoomId(id));
  }, [dispatch]);

  const send = useCallback((content: string) => {
    if (!content.trim() || !activeRoomId) return;
    getChatSocket().emit('sendMessage', {
      chatRoomId: activeRoomId,
      senderId: currentUserId,
      content,
    });
  }, [activeRoomId, currentUserId]);


  const sendVoice = useCallback(
     async (file: File) => {
     if (!activeRoomId) return;
     console.log("VOICE DEBUG sending:", { roomId: activeRoomId, file });
     dispatch(sendVoiceThunk({ roomId: activeRoomId, file }));
    },
    [activeRoomId, dispatch]
  );

  const sendImage = useCallback(
    async (file: File) => {
      if (!activeRoomId) return;
      dispatch(sendImageThunk({ roomId: activeRoomId, file }));
    },
    [activeRoomId, dispatch]
  );


  return {
    rooms,
    activeRoom,
    messages,
    loadingRooms: roomsStatus === 'pending',
    loadingMsgs: messagesStatus === 'pending',
    setActiveId,
    send,
    sendVoice,
    sendImage,
    reloadRooms: () => dispatch(loadRoomsThunk()),
  } as const;
}
