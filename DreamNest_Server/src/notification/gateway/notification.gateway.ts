import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: true })
export class NotificationGateway {
  @WebSocketServer()
  server: Server;

  //  this will  push notification to a specific user
  pushNotification(userId: number, notification: any) {
    this.server.to(`user-${userId}`).emit('newNotification', notification);
  }
}
