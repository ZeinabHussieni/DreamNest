import {Controller, Get, Post, Param, Body, Delete, ParseIntPipe, UseGuards, Res, Query,} from '@nestjs/common';
import type { Response } from 'express';
import { join } from 'path';
import { GoalsService } from './goals.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { GetUser } from '../common/decorators/get-user.decorator';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { GoalResponseDto } from './responseDto/goal-response.dto';

import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
  ApiProduces,
} from '@nestjs/swagger';

@ApiTags('goals')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@UseGuards(AccessTokenGuard)
@Controller('goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new goal (with AI assistance)' })
  @ApiBody({ type: CreateGoalDto })
  @ApiCreatedResponse({ type: GoalResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async create(
    @GetUser('sub') userId: number,
    @Body() body: CreateGoalDto,
  ): Promise<GoalResponseDto> {
    return this.goalsService.createGoalWithAI({
      ...body,
      user_id: userId,
    });
  }

  @Get('visionBoard/file/:filename')
  @ApiOperation({ summary: 'Download a vision board file' })
  @ApiParam({ name: 'filename', type: String, example: 'vision-123.png' })
  @ApiProduces('application/octet-stream')
  @ApiOkResponse({
    description: 'Binary file',
    schema: { type: 'string', format: 'binary' },
  })
  async getVisionBoard(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(process.cwd(), 'storage/private/visionBoard', filename);
    return res.sendFile(filePath);
  }

  @Get()
  @ApiOperation({ summary: 'List goals for the current user' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['completed', 'in-progress'],
    description: 'Optional status filter',
  })
  @ApiOkResponse({ type: GoalResponseDto, isArray: true })
  async getGoals(
    @GetUser('sub') userId: number,
    @Query('status') status?: 'completed' | 'in-progress',
  ): Promise<GoalResponseDto[]> {
    return this.goalsService.getGoals(userId, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a goal by ID' })
  @ApiParam({ name: 'id', type: Number, example: 101 })
  @ApiOkResponse({ type: GoalResponseDto })
  async getById(@Param('id', ParseIntPipe) id: number): Promise<GoalResponseDto> {
    return this.goalsService.findById(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a goal by ID' })
  @ApiParam({ name: 'id', type: Number, example: 101 })
  @ApiOkResponse({ description: 'Goal deleted' })
  async deleteById(
    @GetUser('sub') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.goalsService.deleteById(id);
  }
}
