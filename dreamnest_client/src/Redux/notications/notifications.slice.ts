import { createSlice, createEntityAdapter, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../../store/store'
import type { NotificationDto } from './notifications.types'
import {
  deleteAllNotificationsThunk,
  deleteNotificationThunk,
  loadNotificationsThunk,
  markAllReadThunk,
  markOneReadThunk,
} from './notifications.thunks'


const byCreatedAtDesc: (a: NotificationDto, b: NotificationDto) => number =
  (a, b) => b.createdAt.localeCompare(a.createdAt)


const adapter = createEntityAdapter<NotificationDto>({
  sortComparer: byCreatedAtDesc,
})
type Status = 'idle' | 'pending' | 'succeeded' | 'failed'

const initialState = adapter.getInitialState({
  status: 'idle' as Status,
  error: null as string | null,
})

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {

    upsertOneLocal: adapter.upsertOne,
    markReadLocal: (state, action: PayloadAction<number>) => {
      const id = action.payload
      const n = state.entities[id]
      if (n) n.read = true
    },

    markAllReadLocal: (state) => {
      Object.values(state.entities).forEach((n) => {
        if (n) n.read = true
      })
    },

    removeByIdLocal: (state, action: PayloadAction<number>) => {
      adapter.removeOne(state, action.payload)
    },

    removeAllLocal: (state) => {
      adapter.removeAll(state)
    },

    reset: () => initialState,
  },

  extraReducers: (builder) => {

    builder
      .addCase(loadNotificationsThunk.pending, (state) => {
        state.status = 'pending'
        state.error = null
      })
      .addCase(loadNotificationsThunk.fulfilled, (state, action) => {
        state.status = 'succeeded'
        adapter.setAll(state, action.payload)
      })
      .addCase(loadNotificationsThunk.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.error.message || 'Failed to load notifications'
        adapter.removeAll(state)
      })


    builder.addCase(markOneReadThunk.rejected, (state, action) => {
      const id = action.meta.arg
      const n = state.entities[id]
      if (n) n.read = false
    })


    builder.addCase(markAllReadThunk.rejected, (state) => {
    })

    builder.addCase(deleteNotificationThunk.rejected, (state, action) => {

    })


    builder.addCase(deleteAllNotificationsThunk.rejected, (state) => {

    })
  },
})

export const {
  upsertOneLocal,
  markReadLocal,
  markAllReadLocal,
  removeByIdLocal,
  removeAllLocal,
  reset,
} = notificationsSlice.actions

export default notificationsSlice.reducer


const baseSelectors = adapter.getSelectors<RootState>(
  (s) => s.notifications
)

export const selectNotificationsStatus = (s: RootState) => s.notifications.status
export const selectNotificationsError = (s: RootState) => s.notifications.error
export const selectAllNotifications = baseSelectors.selectAll
export const selectNotificationById = baseSelectors.selectById

export const selectUnreadCount = (s: RootState) =>
  baseSelectors.selectAll(s).reduce((acc, n) => acc + (n.read ? 0 : 1), 0)
