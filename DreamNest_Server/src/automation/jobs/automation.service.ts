
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ReportsService } from '../reports/reports.service';
import { EmailService } from '../email/email.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { LlmService } from 'src/llm/llm.service';
import axios from 'axios';
import { EmailTemplateService } from '../email/email-template.service';

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);
  private useN8n = process.env.USE_N8N === 'true';
  private n8nUrl = process.env.N8N_WEBHOOK_URL || ''; // e.g. https://n8n.example.com/webhook/daily-digest-<secret>
  private n8nSecret = process.env.N8N_WEBHOOK_SECRET || '';

  constructor(
    private readonly prisma: PrismaService,
    private readonly reports: ReportsService,
    private readonly email: EmailService,
    private readonly llm: LlmService,
      private readonly emailTpl: EmailTemplateService, 
  ) {}

  @Cron('0 23 * * *', { timeZone: 'Asia/Beirut' })
  async sendDailyReports() {
    this.logger.log('Daily digest cron started...');
   const users = await this.prisma.user.findMany({
  select: { id: true, email: true, userName: true }, 
});


    for (const user of users) {
      try {
        const digest = await this.reports.getDailyDigest(user.id);


        let pepTalk = '';
        if (digest.stats.missedCount > 0) {
          const system = `
You are DreamNest’s supportive coach.
Rules:
- 2–4 sentences (~40–80 words).
- Reference 1–2 missed items by title.
- 1–2 emojis max.
- Suggest one tiny action for tomorrow.
- No markdown.
`.trim();

          const userMsg = `
User: ${user.userName}
Date: ${digest.date}
Missed steps: ${JSON.stringify(digest.missedSteps.slice(0,3))}
`.trim();

 
         const res = await this.llm.chatJson<{ text?: string; msg?: string }>(system, userMsg);
let pepTalk: string = res.text ?? res.msg ?? '';

        }

        const payload = {
          user: { id: user.id, email: user.email, firstName: user.userName },
          summary: {
            date: digest.date,
            avgProgress: digest.stats.avgProgress,
            totalGoals: digest.stats.totalGoals,
            missedCount: digest.stats.missedCount,
            updatedCount: digest.stats.updatedCount,
          },
          missedSteps: digest.missedSteps,
          updatedToday: digest.updatedToday,
          tone: { pepTalk },
        
        };

        if (this.useN8n && this.n8nUrl) {
    
          await axios.post(this.n8nUrl, payload, {
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': this.n8nSecret,
            },
            timeout: 15000,
          });
          this.logger.log(`Posted digest to n8n for ${user.email}`);
        } else {

const mode: 'PROGRESS' | 'MISSED' | 'NEUTRAL' =
  digest.stats.updatedCount > 0 ? 'PROGRESS'
  : digest.stats.missedCount > 0 ? 'MISSED'
  : 'NEUTRAL';

const userView = { firstName: user.userName };

let html: string;
if (mode === 'PROGRESS') {
  html = this.emailTpl.progressTemplate(userView, {
    avgProgress: digest.stats.avgProgress,
    goals: digest.goals,
    updatedToday: digest.updatedToday,
  });
} else if (mode === 'MISSED') {
  html = this.emailTpl.missedTemplate(userView, {
    avgProgress: digest.stats.avgProgress,
    missedSteps: digest.missedSteps,
  });
} else {
  html = this.emailTpl.neutralTemplate(userView, {
    avgProgress: digest.stats.avgProgress,
  });
}

await this.email.sendEmail(
  user.email,
  mode === 'MISSED'
    ? 'Tiny nudge for tomorrow 💫'
    : mode === 'PROGRESS'
      ? 'You moved your dreams today! 🎉'
      : 'Daily check-in ✨',
  html,
);




          this.logger.log(`Email sent to ${user.email}`);
        }
      } catch (err) {
        this.logger.error(`Failed digest for ${user.email}`, err.stack);
      }
    }
  }
private renderNeutralEmail(name: string, p: any) {
  return `
    <div style="font-family:Arial,sans-serif">
      <h2>Daily check-in, ${name} ✨</h2>
      <p>No updates or misses today. Tomorrow is a fresh chance—pick one tiny step and schedule it! 💪</p>
      <p>Avg progress: ${p.summary.avgProgress.toFixed(1)}%</p>
      <p>— DreamNest</p>
    </div>
  `;
}


  private renderMissedEmail(name: string, p: any) {
    const items = p.missedSteps.map(s =>
      `<li><strong>${s.goalTitle}:</strong> ${s.title} (due ${new Date(s.due_date).toISOString().slice(0,10)})</li>`
    ).join('');
    const pep = p.tone.pepTalk ? `<p>${p.tone.pepTalk}</p>` : '';
    return `
      <div style="font-family:Arial,sans-serif">
        <h2>Hey ${name}, tiny nudge for tomorrow 💫</h2>
        ${pep}
        <p><strong>Missed items:</strong></p>
        <ul>${items || '<li>No items</li>'}</ul>
        <p>Avg progress: ${p.summary.avgProgress.toFixed(1)}%</p>
        <p>— DreamNest</p>
      </div>
    `;
  }

  private renderProgressEmail(name: string, p: any) {
    const items = p.updatedToday.map(s =>
      `<li><strong>${s.goalTitle}:</strong> ${s.title} (updated ${new Date(s.updatedAt).toLocaleTimeString()})</li>`
    ).join('');
    return `
      <div style="font-family:Arial,sans-serif">
        <h2>You moved your dreams today, ${name}! 🎉</h2>
        <p>Highlights:</p>
        <ul>${items || '<li>Nice steady day ✨</li>'}</ul>
        <p>Avg progress: ${p.summary.avgProgress.toFixed(1)}%</p>
        <p>— DreamNest</p>
      </div>
    `;
  }
}
