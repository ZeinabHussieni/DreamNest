import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayInit, OnGatewayConnection } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { DashboardService } from "../dashboard.service";

@WebSocketGateway({
  namespace: "/dashboard",
  cors: { origin: true, credentials: true },
})
export class DashboardGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer() server: Server;

  constructor(private readonly dashboardService: DashboardService) {}

  afterInit() {
    console.log("Dashboard WebSocket initialized");
  }

  handleConnection(client: Socket) {
    const userId = Number(client.handshake.auth?.userId);
    if (Number.isFinite(userId)) {
      client.join(`user-${userId}`);
    }

    const wantsAdmin = client.handshake.auth?.admin === true || client.handshake.auth?.admin === 'true';
    if (wantsAdmin) {
      client.join('admin-global');
    }
  }

  @SubscribeMessage("getDashboard")
  async handleGetDashboard(@MessageBody() body: { userId?: number }, @ConnectedSocket() client: Socket) {
    const uid = Number(body?.userId) || Number(client.handshake.auth?.userId);
    if (!Number.isFinite(uid)) {
      client.emit("dashboard:error", "Invalid or missing userId");
      return;
    }
    const dashboard = await this.dashboardService.getUserDashboard(uid);
    client.emit("dashboardData", dashboard);
  }

  async emitDashboardUpdate(userId: number) {
    const dashboard = await this.dashboardService.getUserDashboard(userId);
    this.server.to(`user-${userId}`).emit("dashboardUpdate", dashboard);
  }


  @SubscribeMessage("getAdminDashboard")
  async handleGetAdminDashboard(@ConnectedSocket() client: Socket) {
    const snap = await this.dashboardService.getGlobalAdminDashboard();
    client.emit("adminDashboardData", snap);
  }

  async emitAdminDashboardUpdate() {
    const snap = await this.dashboardService.getGlobalAdminDashboard();
    this.server.to('admin-global').emit("adminDashboardUpdate", snap);
  }
}
