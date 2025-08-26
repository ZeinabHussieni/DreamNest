import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ReportsService } from '../reports/reports.service';
import { EmailService } from '../email/email.service';
import { EmailTemplateService } from '../email/email-template.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reportsService: ReportsService,
    private readonly emailService: EmailService,
    private readonly emailTemplate: EmailTemplateService,
  ) {}


@Cron('* * * * *') 
async sendDailyReports() {
  this.logger.log('Starting daily reports automation...');

  const users = await this.prisma.user.findMany();

  for (const user of users) {
    try {
      const report = await this.reportsService.generateUserDailyReport(user.id);

 
      if (!report.didNothing) {
        const html = this.emailTemplate.dailyReportTemplate(user, report);
        await this.emailService.sendEmail(
          user.email,
          'Your Daily Progress Report',
          html,
        );
        this.logger.log(`Report sent to ${user.email}`);
      } else {
         const html = this.emailTemplate.noProgressTemplate(user); 
         await this.emailService.sendEmail(
         user.email,
         'We Missed You Today!',
         html,
          );
          this.logger.log(`No progress email sent to ${user.email}`);
       }

    } catch (err) {
      this.logger.error(`Failed to process report for ${user.email}`, err.stack);
    }
  }
}
}