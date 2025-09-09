import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  selectRooms, selectRoomsStatus, selectActiveRoomId, selectActiveRoom,
  selectMessages, selectMessagesStatus, setActiveRoomId, appendMessageIfActive
} from './chat.slice';
import { loadRoomsThunk, loadMessagesThunk } from './chat.thunks';
import { getChatSocket } from '../../Services/socket/socket';
import type { Message } from './chat.types';

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
    if (currentUserId) {
      getChatSocket(); 
    }
  }, [currentUserId]);

  useEffect(() => {
    if (!activeRoom || !currentUserId) return;

 
    dispatch(loadMessagesThunk(activeRoom.id));

    const socket = getChatSocket(); 

    const onNew = (msg: Message) => {
      if (msg.chatRoomId === activeRoom.id) {
        dispatch(appendMessageIfActive(msg));
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

  return {
    rooms,
    activeRoom,
    messages,
    loadingRooms: roomsStatus === 'pending',
    loadingMsgs: messagesStatus === 'pending',
    setActiveId,
    send,
    reloadRooms: () => dispatch(loadRoomsThunk()),
  } as const;
}
