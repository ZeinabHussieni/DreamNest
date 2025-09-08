import type { AppDispatch } from '../../store/store'
import type { NotificationDto } from './notifications.types'
import { upsertOneLocal } from './notifications.slice'
import { getNotifSocket } from '../../Services/socket/socket'



export function attachNotificationsSocket(dispatch: AppDispatch) {
  const socket = getNotifSocket()

  const onNew = (raw: NotificationDto) => {
    dispatch(upsertOneLocal(raw))
  }

  socket.off('newNotification', onNew)
  socket.on('newNotification', onNew)

  return () => {
    socket?.removeAllListeners?.('newNotification')
  }
}
