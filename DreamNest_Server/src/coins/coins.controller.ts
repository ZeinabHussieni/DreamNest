import { BadRequestException, Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CoinsService } from './coins.service';
import { GetUser } from 'src/common/decorators/get-user.decorator';

@Controller('coins')
export class CoinsController {
  constructor(private readonly coins: CoinsService) {}

  @Post('daily-decay')
  async triggerDailyDecay(@Body() body: { date?: string }) {
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
  async leaderboard(@Query('limit') limit?: string) {
    return this.coins.getLeaderboard(Number(limit));
  }
}
