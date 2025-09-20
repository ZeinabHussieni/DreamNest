import {Controller,Get,Post,Patch,Res,Param,Body,ParseIntPipe,UseGuards,BadRequestException,} from '@nestjs/common';
import { PlanService } from './plan.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import type { Response } from 'express';
import { join } from 'path';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { PlanResponseDto } from './responseDto/plan-response.dto';

import {ApiTags,ApiBearerAuth,ApiOperation,ApiOkResponse,ApiCreatedResponse,ApiBadRequestResponse,ApiUnauthorizedResponse,ApiParam,ApiBody,ApiProduces,} from '@nestjs/swagger';

@ApiTags('plans')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@UseGuards(AccessTokenGuard)
@Controller('plans')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Post(':goalId')
  @ApiOperation({ summary: 'Create a plan for a goal' })
  @ApiParam({ name: 'goalId', type: Number, example: 42 })
  @ApiBody({ type: CreatePlanDto })
  @ApiCreatedResponse({ type: PlanResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async create(
    @Param('goalId', ParseIntPipe) goalId: number,
    @Body() body: CreatePlanDto,
  ): Promise<PlanResponseDto> {
    if (Number.isNaN(goalId)) throw new BadRequestException('Invalid goalId');
    return this.planService.create(goalId, body);
  }

  @Get('visionBoard/:filename')
  @ApiOperation({ summary: 'Serve a vision board file for current user' })
  @ApiParam({ name: 'filename', type: String, example: 'vision-123.png' })
  @ApiProduces('application/octet-stream')
  @ApiOkResponse({
    description: 'Binary file',
    schema: { type: 'string', format: 'binary' },
  })
  async getProfile(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(process.cwd(), 'storage/private/visionBoard', filename);
    return res.sendFile(filePath);
  }

  @Get(':goalId')
  @ApiOperation({ summary: 'Get all plans for a goal' })
  @ApiParam({ name: 'goalId', type: Number, example: 42 })
  @ApiOkResponse({ type: PlanResponseDto, isArray: true })
  async getAllByGoal(
    @Param('goalId', ParseIntPipe) goalId: number,
  ): Promise<PlanResponseDto[]> {
    return this.planService.getAllByGoal(goalId);
  }

  @Patch('/:planId/toggle')
  @ApiOperation({ summary: 'Toggle completion for a plan' })
  @ApiParam({ name: 'planId', type: Number, example: 7 })
  @ApiOkResponse({ type: PlanResponseDto })
  async togglePlanDone(
    @Param('planId', ParseIntPipe) planId: number,
  ): Promise<PlanResponseDto> {
    return this.planService.togglePlanDone(planId);
  }

  @Get('/plan/:planId')
  @ApiOperation({ summary: 'Get a plan by ID' })
  @ApiParam({ name: 'planId', type: Number, example: 7 })
  @ApiOkResponse({ type: PlanResponseDto })
  async getById(
    @Param('planId', ParseIntPipe) planId: number,
  ): Promise<PlanResponseDto> {
    return this.planService.findById(planId);
  }
}
