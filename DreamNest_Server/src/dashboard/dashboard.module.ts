import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { DashboardService } from './dashboard.service';
import { DashboardGateway } from './dashboard.gateway';
import { DashboardController } from './dashboard.controller'; 

@Module({
  providers: [DashboardService, DashboardGateway, PrismaService], 
  controllers: [DashboardController], 
  exports: [DashboardService, DashboardGateway], 
})
export class DashboardModule {}
