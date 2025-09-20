import { Module } from "@nestjs/common";
import { DashboardService } from "./dashboard.service";
import { DashboardController } from "./dashboard.controller";
import { DashboardGateway } from "./gateway/dashboard.gateway";
import { PrismaService } from "src/prisma/prisma.service";

@Module({
  providers: [PrismaService, DashboardService, DashboardGateway],
  controllers: [DashboardController],
  exports: [DashboardService, DashboardGateway], 
})
export class DashboardModule {}
