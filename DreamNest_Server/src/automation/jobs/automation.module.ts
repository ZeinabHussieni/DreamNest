import { Module } from '@nestjs/common';
import { AutomationService } from './automation.service';
import { EmailService } from '../email/email.service';
import { ReportsModule } from '../reports/reports.module';
import { EmailModule } from '../email/email.module';
import { LlmModule } from 'src/llm/llm.module';

@Module({
  providers: [AutomationService,EmailService],
  imports: [ReportsModule,EmailModule,  LlmModule,   ],
  controllers: []
})
export class AutomationModule {}
