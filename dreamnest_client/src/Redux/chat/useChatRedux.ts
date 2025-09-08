import { useEffect, useRef, useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import {
  selectRooms, selectRoomsStatus, selectActiveRoomId, selectActiveRoom,
  selectMessages, selectMessagesStatus, setActiveRoomId, appendMessageIfActive
} from './chat.slice'
import { loadRoomsThunk, loadMessagesThunk } from './chat.thunks'
import { getChatSocket } from '../../Services/socket/socket'
import type { Message } from './chat.types'

export default function useChatRedux(currentUserId: number) {
  const dispatch = useAppDispatch()
  const rooms = useAppSelector(selectRooms)
  const roomsStatus = useAppSelector(selectRoomsStatus)
  const activeRoomId = useAppSelector(selectActiveRoomId)
  const activeRoom = useAppSelector(selectActiveRoom)
  const messages = useAppSelector(selectMessages)
  const messagesStatus = useAppSelector(selectMessagesStatus)

  const socketRef = useRef(getChatSocket())

  useEffect(() => {
    if (currentUserId) dispatch(loadRoomsThunk())
  }, [currentUserId, dispatch])


  useEffect(() => {
    if (!activeRoom || !currentUserId) return
    const socket = socketRef.current

    dispatch(loadMessagesThunk(activeRoom.id))

    socket.emit('joinRoom', { chatRoomId: activeRoom.id, userId: currentUserId })

    const onNew = (msg: Message) => {
      if (msg.chatRoomId === activeRoom.id) {
        dispatch(appendMessageIfActive(msg))
      }
    }

    socket.off('newMessage', onNew)
    socket.on('newMessage', onNew)

    return () => {
      socket.off('newMessage', onNew)
    }
  }, [activeRoom?.id, currentUserId, dispatch])

  const setActiveId = useCallback((id: number) => {
    dispatch(setActiveRoomId(id))
  }, [dispatch])

  const send = useCallback((content: string) => {
    if (!content.trim() || !activeRoomId) return
    socketRef.current.emit('sendMessage', {
      chatRoomId: activeRoomId,
      senderId: currentUserId,
      content,
    })
  }, [activeRoomId, currentUserId])

  return {
    rooms,
    activeRoom,
    messages,
    loadingRooms: roomsStatus === 'pending',
    loadingMsgs: messagesStatus === 'pending',
    setActiveId,
    send,
    reloadRooms: () => dispatch(loadRoomsThunk()),
  } as const
}
