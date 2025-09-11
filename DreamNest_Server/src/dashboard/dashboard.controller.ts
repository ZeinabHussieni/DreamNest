import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardResponseDto } from './responseDto/dashboard-response.dto';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { GetUser } from '../common/decorators/get-user.decorator';

import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('dashboard')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@UseGuards(AccessTokenGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get the current user dashboard' })
  @ApiOkResponse({ type: DashboardResponseDto })
  async getDashboard(@GetUser('sub') userId: number): Promise<DashboardResponseDto> {
    return this.dashboardService.getUserDashboard(userId);
  }
}
