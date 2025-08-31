import {WebSocketGateway,SubscribeMessage,MessageBody,ConnectedSocket,OnGatewayConnection,OnGatewayDisconnect,WebSocketServer} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { ChatService } from '../chat.service';

@WebSocketGateway({ cors: true }) 
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
    async handleJoinRoom(
    @MessageBody() data: { chatRoomId: number; userId: number }, 
    @ConnectedSocket() client: Socket,
   ) {
     const isMember = await this.chatService.isParticipant(data.chatRoomId, data.userId);
     if (!isMember) {
       client.emit('error', 'Not a participant of this room');
       return;
      }
      client.join(`room-${data.chatRoomId}`);
  }

  @SubscribeMessage('sendMessage')
    async handleMessage(
    @MessageBody() data: { chatRoomId: number; senderId: number; content: string },
   ) {
     const message = await this.chatService.createMessage(
     data.chatRoomId,
     data.senderId,
     data.content,
    );
     this.server.to(`room-${data.chatRoomId}`).emit('newMessage', message);
  }

}
