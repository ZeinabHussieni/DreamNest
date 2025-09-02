import {WebSocketGateway,OnGatewayConnection,WebSocketServer} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';


@WebSocketGateway({ namespace: '/notifications', cors: { origin: true, credentials: true } })
export class NotificationGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;

  handleConnection(client: Socket) {
    const userId = Number(client.handshake.auth?.userId);
    if (!userId || Number.isNaN(userId)) {
    return;
   }
    if (userId) client.join(`user-${userId}`);
  }


  pushNotification(userId: number, notification: any) {
    this.server.to(`user-${userId}`).emit('newNotification', notification);
  }
}