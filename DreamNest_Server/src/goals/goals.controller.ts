import { Controller, Get, Post, Param, Body, Delete, ParseIntPipe, UseGuards, BadRequestException } from '@nestjs/common';
import { GoalsService } from './goals.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { GetUser } from '../common/decorators/get-user.decorator';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';

@Controller('goals')
@UseGuards(AccessTokenGuard) 
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Post('create_goal')
  async create(@GetUser('sub') userId: any, @Body() body: CreateGoalDto) {
    const id = Number(userId);
    if (isNaN(id)) throw new BadRequestException('Invalid user ID from token');

    return this.goalsService.createGoalWithAI({ ...body, user_id: id });
  }


  @Get()
  async getAllByUser(@GetUser('sub') userId: number) {
    return this.goalsService.getAllByUserId(userId);
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    return this.goalsService.findById(id);
  }

  @Delete(':id')
  async deleteById(@GetUser('sub') userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.goalsService.deleteById(id);
  }

  @Get('status/:status')
  async getByStatus(
    @GetUser('sub') userId: number,
    @Param('status') status: 'completed' | 'in-progress',
  ) {
    return this.goalsService.getGoalsByStatus(userId, status);
  }
}
