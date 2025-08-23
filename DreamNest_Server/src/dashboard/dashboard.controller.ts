import { Controller, Get, Param } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get(':userId')
  async getDashboard(@Param('userId') userId: number) {
    return this.dashboardService.getUserDashboard(userId);
  }
}
