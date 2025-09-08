import { configureStore } from '@reduxjs/toolkit'
import notificationsReducer from '../Redux/notications/notifications.slice'
import chatReducer from '../Redux/chat/chat.slice'

export const store = configureStore({
  reducer: {
    notifications: notificationsReducer,
    chat: chatReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
