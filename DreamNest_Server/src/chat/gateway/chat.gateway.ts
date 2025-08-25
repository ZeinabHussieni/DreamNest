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

  // this listen to "joinRoom" event
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() data: { chatRoomId: number },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`room-${data.chatRoomId}`);
    console.log(`Client ${client.id} joined room ${data.chatRoomId}`);
  }

  // this listen to "sendMessage" event
  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: { chatRoomId: number; senderId: number; content: string },
  ) {
    const message = await this.chatService.createMessage(
      data.chatRoomId,
      data.senderId,
      data.content,
    );

    // to emit message to everyone in the room
    this.server.to(`room-${data.chatRoomId}`).emit('newMessage', message);
  }
}
