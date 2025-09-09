import { WebSocketGateway,SubscribeMessage,MessageBody,ConnectedSocket,OnGatewayConnection,OnGatewayDisconnect,WebSocketServer,} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { ChatService } from '../chat.service';

const socketUser = new Map<string, number>();
const userSockets = new Map<number, Set<string>>();
const userRooms = new Map<number, Set<number>>();
const onlineUsers = new Set<number>();

@WebSocketGateway({ namespace: '/chat', cors: { origin: true, credentials: true } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(private readonly chatService: ChatService) {}

  handleConnection(_client: Socket) {}

  handleDisconnect(client: Socket) {
    const userId = socketUser.get(client.id);
    if (!userId) return;

    socketUser.delete(client.id);

    const sockets = userSockets.get(userId);
    this.chatService.bumpLastActive(userId); 
    if (sockets) {
      sockets.delete(client.id);
      if (sockets.size === 0) {
        userSockets.delete(userId);
        onlineUsers.delete(userId);

        const rooms = userRooms.get(userId) || new Set<number>();
        for (const roomId of rooms) {
          this.server.to(`room-${roomId}`).emit('chat:presenceUpdate', { userId, online: false });
        }
        userRooms.delete(userId);
      }
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() d: { chatRoomId: number; userId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const isMember = await this.chatService.isParticipant(d.chatRoomId, d.userId);
    if (!isMember) return client.emit('chat:joinError', 'Not a participant');

    socketUser.set(client.id, d.userId);
    if (!userSockets.has(d.userId)) userSockets.set(d.userId, new Set());
    userSockets.get(d.userId)!.add(client.id);

    if (!userRooms.has(d.userId)) userRooms.set(d.userId, new Set());
    userRooms.get(d.userId)!.add(d.chatRoomId);

   // if first socket for this user, mark online and broadcast to this room
  if (!onlineUsers.has(d.userId)) {
    onlineUsers.add(d.userId);
    this.server.to(`room-${d.chatRoomId}`).emit('chat:presenceUpdate', {
      userId: d.userId,
      online: true,
    });
  }

  // join socket room
  client.join(`room-${d.chatRoomId}`);
  client.emit('chat:joined', { roomId: d.chatRoomId });

  // 🔵 presence SNAPSHOT for the joining client
  // everyone currently in this room → tell the joiner who is online right now
  const participantIds = await this.chatService.getRoomParticipantIds(d.chatRoomId);
  for (const pid of participantIds) {
    const isOnline = onlineUsers.has(pid);
    client.emit('chat:presenceUpdate', { userId: pid, online: isOnline });
  }

  // unread summary for sidebar
  const summary = await this.chatService.getUnreadSummary(d.userId);
  client.emit('chat:unreadSummary', { rooms: summary });

    await this.chatService.bumpLastActive(d.userId);

    
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(@MessageBody() d: { chatRoomId: number; senderId: number; content: string }) {
    const message = await this.chatService.createMessage(d.chatRoomId, d.senderId, d.content);
    this.server.to(`room-${d.chatRoomId}`).emit('chat:newMessage', message);
    await this.chatService.markDelivered(message.id);
    this.server.to(`room-${d.chatRoomId}`).emit('chat:messageDelivered', { messageId: message.id });
  }

  @SubscribeMessage('chat:requestUnreadSummary')
  async unreadSummary(@MessageBody() d: { userId: number }, @ConnectedSocket() client: Socket) {
    const summary = await this.chatService.getUnreadSummary(d.userId);
    client.emit('chat:unreadSummary', { rooms: summary });
  }

  @SubscribeMessage('chat:markReadUntil')
  async markRead(@MessageBody() d: { roomId: number; userId: number; untilMessageId: number }) {
    await this.chatService.markReadUntil(d.userId, d.roomId, d.untilMessageId);
    await this.chatService.bumpLastActive(d.userId);
    this.server
      .to(`room-${d.roomId}`)
      .emit('chat:messageRead', { roomId: d.roomId, untilMessageId: d.untilMessageId, readerId: d.userId });
  }

  @SubscribeMessage('chat:typing')
  async typing(@MessageBody() d: { roomId: number; userId: number; typing: boolean }) {
    await this.chatService.bumpLastActive(d.userId);  
    this.server.to(`room-${d.roomId}`).emit('chat:typing', { roomId: d.roomId, userId: d.userId, typing: d.typing });
  }

}
