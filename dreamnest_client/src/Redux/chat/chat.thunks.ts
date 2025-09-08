import { createAsyncThunk } from '@reduxjs/toolkit'
import type { ChatRoom, Message } from './chat.types'
import { getChatRooms, getRoomMessages } from '../../Services/chat/chatService'
import { setActiveRoomId } from './chat.slice'

export const loadRoomsThunk = createAsyncThunk<ChatRoom[]>(
  'chat/loadRooms',
  async () => {
    const rooms = await getChatRooms()
    return rooms
  }
)

export const loadMessagesThunk = createAsyncThunk<
  Message[],
  number
>(
  'chat/loadMessages',
  async (roomId, { dispatch }) => {
    dispatch(setActiveRoomId(roomId))
    const msgs = await getRoomMessages(roomId)
    return msgs
  }
)
