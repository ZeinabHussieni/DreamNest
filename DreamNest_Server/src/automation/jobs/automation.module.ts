import { Module } from '@nestjs/common';
import { AutomationService } from './automation.service';
import { EmailService } from '../email/email.service';
import { ReportsModule } from '../reports/reports.module';
import { EmailModule } from '../email/email.module';

@Module({
  providers: [AutomationService,EmailService],
  imports: [ReportsModule,EmailModule],
  controllers: []
})
export class AutomationModule {}
