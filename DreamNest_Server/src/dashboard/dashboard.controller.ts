import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardResponseDto } from './responseDto/dashboard-response.dto';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { GetUser } from '../common/decorators/get-user.decorator';

@Controller('dashboard')
@UseGuards(AccessTokenGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async getDashboard(@GetUser('sub') userId: number) : Promise<DashboardResponseDto>{
    return this.dashboardService.getUserDashboard(userId);
  }
}
