import {WebSocketGateway,WebSocketServer,SubscribeMessage,MessageBody,OnGatewayInit,} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { DashboardService } from './dashboard.service';

@WebSocketGateway({ namespace: '/dashboard' })
export class DashboardGateway implements OnGatewayInit {
  @WebSocketServer() server: Server;

  constructor(private readonly dashboardService: DashboardService) {}

  afterInit(server: Server) {
    console.log('Dashboard WebSocket initialized');
  }

 
  @SubscribeMessage('getDashboard')
  async handleGetDashboard(@MessageBody() userId: number) {
    const dashboard = await this.dashboardService.getUserDashboard(userId);
    return { event: 'dashboardData', data: dashboard };
  }


  async emitDashboardUpdate(userId: number) {
    const dashboard = await this.dashboardService.getUserDashboard(userId);
    this.server.to(`user_${userId}`).emit('dashboardUpdate', dashboard);
  }
}
