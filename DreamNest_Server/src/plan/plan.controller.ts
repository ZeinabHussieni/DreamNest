import {Controller,Get,Post,Patch,Res,Param,Body,ParseIntPipe,UseGuards,} from '@nestjs/common';
import { PlanService } from './plan.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import type { Response } from 'express';
import { join } from 'path';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { PlanResponseDto } from './responseDto/plan-response.dto';

@Controller('goals')
@UseGuards(AccessTokenGuard)
export class PlanController {
  constructor(private readonly planService: PlanService) {}


  @Post(':goalId/plans')
  async create(
    @Param('goalId', ParseIntPipe) goalId: number,
    @Body() body: CreatePlanDto,
  ): Promise<PlanResponseDto> {
    return this.planService.create(goalId, body);
  }

   @UseGuards(AccessTokenGuard)
    @Get('visionBoard/:filename')
    async getVisionBoard(@Param('filename') filename: string, @Res() res: Response) {
      const filePath = join(process.cwd(), 'storage/private/visionBoard', filename);
      return res.sendFile(filePath);
    }
  

  @Get(':goalId/plans')
  async getAllByGoal(@Param('goalId', ParseIntPipe) goalId: number) : Promise<PlanResponseDto[]>{
    return this.planService.getAllByGoal(goalId);
  }


  @Patch('/plans/:planId/toggle')
  async togglePlanDone(@Param('planId', ParseIntPipe) planId: number): Promise<PlanResponseDto> {
    return this.planService.togglePlanDone(planId);
  }


  @Get('/plans/:planId')
  async getById(@Param('planId', ParseIntPipe) planId: number): Promise<PlanResponseDto> {
    return this.planService.findById(planId);
  }
}
