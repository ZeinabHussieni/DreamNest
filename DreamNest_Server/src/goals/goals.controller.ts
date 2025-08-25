import { Controller, Get, Post, Param, Body, Delete, ParseIntPipe, UseGuards, Res } from '@nestjs/common';
import type { Response } from 'express';
import { join } from 'path';
import { GoalsService } from './goals.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { GetUser } from '../common/decorators/get-user.decorator';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { GoalResponseDto } from './responseDto/goal-response.dto';

@Controller('goals')
@UseGuards(AccessTokenGuard)
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}


 @Post('create_goal')
   async create( @GetUser('sub') userId: number, @Body() body: CreateGoalDto): Promise<GoalResponseDto> {
     return this.goalsService.createGoalWithAI({
     ...body,
     user_id: userId,
   });
  }

  @Get('vision-board/file/:filename')
   async getVisionBoard( @Param('filename') filename: string, @Res() res: Response) {
   const filePath = join(__dirname, '..', 'storage/private/visionBoard', filename);
   return res.sendFile(filePath);
  }

  @Get()
  async getAllByUser(@GetUser('sub') userId: number) : Promise<GoalResponseDto[]>{
    return this.goalsService.getAllByUserId(userId);
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number): Promise<GoalResponseDto> {
    return this.goalsService.findById(id);
  }

  @Delete(':id')
  async deleteById(
    @GetUser('sub') userId: number, 
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.goalsService.deleteById(id);
  }

  @Get('status/:status')
  async getByStatus(
    @GetUser('sub') userId: number,
    @Param('status') status: 'completed' | 'in-progress',
  ): Promise<GoalResponseDto[]> {
    return this.goalsService.getGoalsByStatus(userId, status);
  }
}
