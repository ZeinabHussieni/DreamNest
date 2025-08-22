import {Controller,Get,Post,Patch,Param,Body,ParseIntPipe,UseGuards,} from '@nestjs/common';
import { PlanService } from './plan.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';

@Controller('goals')
@UseGuards(AccessTokenGuard)
export class PlanController {
  constructor(private readonly planService: PlanService) {}


  @Post(':goalId/plans')
  async create(
    @Param('goalId', ParseIntPipe) goalId: number,
    @Body() body: CreatePlanDto,
  ) {
    return this.planService.create(goalId, body);
  }

  @Get(':goalId/plans')
  async getAllByGoal(@Param('goalId', ParseIntPipe) goalId: number) {
    return this.planService.getAllByGoal(goalId);
  }


  @Patch('/plans/:planId/toggle')
  async togglePlanDone(@Param('planId', ParseIntPipe) planId: number) {
    return this.planService.togglePlanDone(planId);
  }


  @Get('/plans/:planId')
  async getById(@Param('planId', ParseIntPipe) planId: number) {
    return this.planService.findById(planId);
  }
}
