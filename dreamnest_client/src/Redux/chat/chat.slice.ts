import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { ChatRoom, Message } from './chat.types'
import { loadRoomsThunk, loadMessagesThunk } from './chat.thunks'
import type { RootState } from '../../store/store'

type Status = 'idle' | 'pending' | 'succeeded' | 'failed'

export type ChatState = {
  rooms: ChatRoom[]
  roomsStatus: Status
  roomsError: string | null
  activeRoomId: number | null
  messages: Message[]           
  messagesStatus: Status
  messagesError: string | null
}

const initialState: ChatState = {
  rooms: [],
  roomsStatus: 'idle',
  roomsError: null,
  activeRoomId: null,
  messages: [],
  messagesStatus: 'idle',
  messagesError: null,
}

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveRoomId(state, action: PayloadAction<number | null>) {
      state.activeRoomId = action.payload
    },
    appendMessageIfActive(state, action: PayloadAction<Message>) {
      const msg = action.payload
      if (state.activeRoomId && msg.chatRoomId === state.activeRoomId) {
        if (!state.messages.some(m => m.id === msg.id)) {
          state.messages.push(msg)
        }
      }
    },
    resetChat() {
      return initialState
    },
  },
  extraReducers: (b) => {
    b.addCase(loadRoomsThunk.pending, (s) => {
      s.roomsStatus = 'pending'
      s.roomsError = null
    })
    b.addCase(loadRoomsThunk.fulfilled, (s, a) => {
      s.roomsStatus = 'succeeded'
      s.rooms = a.payload
      if (s.activeRoomId == null && s.rooms[0]) {
        s.activeRoomId = s.rooms[0].id
      }
    })
    b.addCase(loadRoomsThunk.rejected, (s, a) => {
      s.roomsStatus = 'failed'
      s.roomsError = a.error.message || 'Failed to load rooms'
      s.rooms = []
    })

    b.addCase(loadMessagesThunk.pending, (s) => {
      s.messagesStatus = 'pending'
      s.messagesError = null
      s.messages = []
    })
    b.addCase(loadMessagesThunk.fulfilled, (s, a) => {
      s.messagesStatus = 'succeeded'
      s.messages = a.payload
    })
    b.addCase(loadMessagesThunk.rejected, (s, a) => {
      s.messagesStatus = 'failed'
      s.messagesError = a.error.message || 'Failed to load messages'
      s.messages = []
    })
  }
})

export const { setActiveRoomId, appendMessageIfActive, resetChat } = chatSlice.actions
export default chatSlice.reducer
export const selectRooms = (s: RootState) => (s.chat as ChatState).rooms
export const selectRoomsStatus  = (s: RootState) =>  (s.chat as ChatState).roomsStatus
export const selectActiveRoomId = (s: RootState) =>  (s.chat as ChatState).activeRoomId

export const selectActiveRoom   = (s: RootState) => {
  const id =  (s.chat as ChatState).activeRoomId
  return id ?  (s.chat as ChatState).rooms.find(r => r.id === id) ?? null : null
}

export const selectMessages       = (s: RootState) =>  (s.chat as ChatState).messages
export const selectMessagesStatus = (s: RootState) =>  (s.chat as ChatState).messagesStatus