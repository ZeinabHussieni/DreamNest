import { createAsyncThunk } from '@reduxjs/toolkit'
import type { NotificationDto } from './notifications.types'
import {
  fetchNotifications as apiFetch,
  markRead as apiMarkRead,
  markAllRead as apiMarkAllRead,
  deleteNotificationById as apiDeleteOne,
  deleteAllForUser as apiDeleteAll,
} from '../../Services/socket/notificationsSocket'
import {
  markAllReadLocal,
  markReadLocal,
  removeAllLocal,
  removeByIdLocal,
} from './notifications.slice'

import type { RootState } from '../../store/store'

export const loadNotificationsThunk = createAsyncThunk<
  NotificationDto[]
>('notifications/loadAll', async () => {
  const list = await apiFetch()
  return list
})

export const markOneReadThunk = createAsyncThunk<
  void,
  number,
  { state: RootState }
>('notifications/markOneRead', async (id, { dispatch }) => {

  dispatch(markReadLocal(id))
  try {
    await apiMarkRead(id)
  } catch (e) {

    throw e
  }
})

export const markAllReadThunk = createAsyncThunk<
  void,
  void,
  { state: RootState }
>('notifications/markAllRead', async (_void, { getState, dispatch }) => {
  const state = getState()
  const ids = state.notifications.ids as number[]
  const unreadIds = ids.filter((id) => !state.notifications.entities[id]?.read)

  if (!unreadIds.length) return

 
  dispatch(markAllReadLocal())
  try {
    await apiMarkAllRead(unreadIds)
  } catch (e) {
    throw e
  }
})

export const deleteNotificationThunk = createAsyncThunk<
  void,
  number
>('notifications/deleteOne', async (id, { dispatch }) => {

  dispatch(removeByIdLocal(id))
  try {
    await apiDeleteOne(id)
  } catch (e) {
    throw e
  }
})

export const deleteAllNotificationsThunk = createAsyncThunk<
  void,
  void
>('notifications/deleteAll', async (_void, { dispatch }) => {

  dispatch(removeAllLocal())
  try {
    await apiDeleteAll()
  } catch (e) {
    throw e
  }
})
