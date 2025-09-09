import { useEffect, useRef, useCallback } from 'react'
import Swal from 'sweetalert2'
import { useAuth } from '../../Context/AuthContext'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import {
  selectAllNotifications,
  selectUnreadCount,
  selectNotificationsStatus,
  reset,
} from './notifications.slice'
import {
  deleteAllNotificationsThunk,
  deleteNotificationThunk,
  loadNotificationsThunk,
  markAllReadThunk,
  markOneReadThunk,
} from './notifications.thunks'
import { attachNotificationsSocket } from './notifications.socket'

export default function useNotificationsRedux(opts?: { autoLoad?: boolean; autoSocket?: boolean }) {
  const { autoLoad = true, autoSocket = true } = opts ?? {}

  const dispatch = useAppDispatch()
  const { isAuthenticated, user } = useAuth()
  const userId = user?.id ?? 0

  const items = useAppSelector(selectAllNotifications)
  const unreadCount = useAppSelector(selectUnreadCount)
  const status = useAppSelector(selectNotificationsStatus)

  const detachRef = useRef<null | (() => void)>(null)
  const lastUserIdRef = useRef<number | null>(null)

  useEffect(() => {

    if (!isAuthenticated || !userId) {
      lastUserIdRef.current = null
      detachRef.current?.()
      detachRef.current = null
      dispatch(reset())
      return
    }

    const userChanged = lastUserIdRef.current !== userId
    lastUserIdRef.current = userId

    // this for detach any old listener before attaching a new one
    detachRef.current?.()
    detachRef.current = null

    // If user switched or first login clear old user’s notifications
    if (userChanged) {
      dispatch(reset())
    }

    if (autoLoad) {
      dispatch(loadNotificationsThunk())
    }

    if (autoSocket) {

      detachRef.current = attachNotificationsSocket(dispatch)
    }

    return () => {}
  }, [dispatch, isAuthenticated, userId, autoLoad, autoSocket]) 

  const handleMarkAllRead = useCallback(() => {
    if (unreadCount === 0) return
    dispatch(markAllReadThunk())
  }, [dispatch, unreadCount])

  const handleActivateItem = useCallback((id: number) => {
    dispatch(markOneReadThunk(id))
  }, [dispatch])

  const handleRemoveOne = useCallback(async (id: number) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Delete this notification?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#e0524c',
      cancelButtonColor: '#6f56c5',
      reverseButtons: true,
      focusCancel: true,
      width: 400,
    })
    if (!isConfirmed) return
    try {
      await dispatch(deleteNotificationThunk(id)).unwrap()
      await Swal.fire({ title: 'Deleted', text: 'Notification removed successfully.', icon: 'success', timer: 1200, showConfirmButton: false })
    } catch (e: any) {
      await Swal.fire({ title: 'Failed', text: e?.response?.data?.message || 'Failed to delete', icon: 'error' })
    }
  }, [dispatch])

  const handleRemoveAll = useCallback(async () => {
    const { isConfirmed } = await Swal.fire({
      title: 'Delete all notifications?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#e0524c',
      cancelButtonColor: '#6f56c5',
      reverseButtons: true,
      focusCancel: true,
      width: 400,
    })
    if (!isConfirmed) return
    try {
      await dispatch(deleteAllNotificationsThunk()).unwrap()
      await Swal.fire({ title: 'Deleted', text: 'Notifications removed successfully.', icon: 'success', timer: 1200, showConfirmButton: false })
    } catch (e: any) {
      await Swal.fire({ title: 'Failed', text: e?.response?.data?.message || 'Failed to delete', icon: 'error' })
    }
  }, [dispatch])

  return { items, unreadCount, status, handleMarkAllRead, handleActivateItem, handleRemoveOne, handleRemoveAll } as const
}
