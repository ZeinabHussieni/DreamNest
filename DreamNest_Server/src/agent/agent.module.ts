import { Module } from '@nestjs/common';
import { PlanningAgentService } from './agent.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { LlmModule } from 'src/llm/llm.module';

@Module({
  imports: [LlmModule],
  providers: [PlanningAgentService, PrismaService],
  exports: [PlanningAgentService], 
})
export class AgentModule {} 