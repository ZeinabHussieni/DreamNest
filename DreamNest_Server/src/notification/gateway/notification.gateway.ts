import { WebSocketGateway, OnGatewayConnection, WebSocketServer } from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';

@WebSocketGateway({ namespace: '/notifications', cors: { origin: true, credentials: true } })
export class NotificationGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;

  handleConnection(client: Socket) {
    const auth = client.handshake.auth || {};
    const userIdRaw = auth.userId ?? client.handshake.query?.userId;
    const userId = Number(userIdRaw);

    if (!Number.isFinite(userId) || userId <= 0) {
      client.emit('error', 'missing userId');
      client.disconnect(true);
      return;
    }

    client.join(`user-${userId}`);
    client.emit('ready');
  }

  pushNotification(userId: number, notification: any) {
    this.server.to(`user-${userId}`).emit('newNotification', notification);
  }
}
