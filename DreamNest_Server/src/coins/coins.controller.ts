import { BadRequestException, Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { CoinsService } from './coins.service';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';

import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiBody,
  ApiQuery,
  ApiPropertyOptional,
} from '@nestjs/swagger';

class DailyDecayDto {
  @ApiPropertyOptional({
    description: 'Date to run the decay for (defaults to today)',
    example: '2025-09-11',
    type: String,
    format: 'date',
  })
  date?: string;
}

@ApiTags('coins')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@UseGuards(AccessTokenGuard)
@Controller('coins')
export class CoinsController {
  constructor(private readonly coins: CoinsService) {}

  @Post('daily-decay')
  @ApiOperation({ summary: 'Trigger daily coin decay job (admin/cron)' })
  @ApiBody({ type: DailyDecayDto })
  @ApiOkResponse({
    description: 'Job executed',
    schema: {
      type: 'object',
      properties: { ok: { type: 'boolean', example: true } },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid date' })
  async triggerDailyDecay(@Body() body: DailyDecayDto) {
    let forDate: Date | undefined = undefined;
    if (body?.date) {
      const d = new Date(body.date);
      if (Number.isNaN(d.getTime())) throw new BadRequestException('Invalid date');
      forDate = d;
    }
    await this.coins.runDailyDecay(forDate);
    return { ok: true };
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get coin leaderboard' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Max rows' })
  async leaderboard(@Query('limit') limit?: string) {
    return this.coins.getLeaderboard(Number(limit));
  }
}
