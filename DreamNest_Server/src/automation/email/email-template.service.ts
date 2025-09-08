
import { Injectable } from '@nestjs/common';

type UserLite = { firstName: string };
type DigestLite = {
  avgProgress: number;
  goals?: Array<{ title: string; progress?: number }>;
  updatedToday?: Array<{ title: string; updatedAt?: Date; goalTitle?: string }>;
  missedSteps?: Array<{ title: string; due_date: Date; goalTitle?: string }>;
};

@Injectable()
export class EmailTemplateService {
  progressTemplate(user: UserLite, data: DigestLite) {
    const { goals = [], updatedToday = [], avgProgress } = data;

    const updatedList = updatedToday.map(s =>
      `<li><strong>${s.goalTitle ?? ''}</strong> — ${s.title} (updated ${new Date(s.updatedAt ?? '').toLocaleTimeString()})</li>`
    ).join('');

    return `
      <div style="font-family: Helvetica, Arial, sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px; background-color: #f4f6f8; border-radius: 8px;">
        <div style="background-color: #6C63FF; padding: 20px; border-radius: 8px 8px 0 0; color: white; text-align: center;">
          <h1 style="margin:0; font-size:24px;">You moved your dreams today! 🎉</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Hello ${user.firstName}!</h2>
          <p>Highlights from today:</p>
          <ul>${updatedList || '<li>Nice steady day ✨</li>'}</ul>
          ${this.goalsTable(goals)}
          <p style="margin-top:15px;">Average progress today: ${avgProgress.toFixed(1)}%</p>
          <p style="font-size:12px; color:#999; margin-top:20px;">Sent by DreamNest</p>
        </div>
      </div>
    `;
  }

  missedTemplate(user: UserLite, data: DigestLite) {
    const { missedSteps = [], avgProgress } = data;

    const missedList = missedSteps.map(s =>
      `<li><strong>${s.goalTitle ?? ''}</strong> — ${s.title} (due ${new Date(s.due_date).toISOString().slice(0,10)})</li>`
    ).join('');

    return `
      <div style="font-family: Helvetica, Arial, sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px; background-color: #fef2f2; border-radius: 8px;">
        <div style="background-color: #FF6B6B; padding: 20px; border-radius: 8px 8px 0 0; color: white; text-align: center;">
          <h1 style="margin:0; font-size:24px;">We Missed You Today 💫</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Hello ${user.firstName},</h2>
          <p>Here are a few items to pick up tomorrow:</p>
          <ul>${missedList || '<li>No items</li>'}</ul>
          <p style="margin-top:15px;">Average progress so far: ${avgProgress.toFixed(1)}%</p>
          <p style="font-size:12px; color:#999; margin-top:20px;">Sent by DreamNest</p>
        </div>
      </div>
    `;
  }

  neutralTemplate(user: UserLite, data: DigestLite) {
    const { avgProgress } = data;
    return `
      <div style="font-family: Helvetica, Arial, sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px; background-color: #f4f6f8; border-radius: 8px;">
        <div style="background-color: #6C63FF; padding: 20px; border-radius: 8px 8px 0 0; color: white; text-align: center;">
          <h1 style="margin:0; font-size:24px;">DreamNest Daily Check-in</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Hello ${user.firstName}!</h2>
          <p>No updates or misses today. Tomorrow is a fresh chance—pick one tiny step and schedule it! 💪</p>
          <p style="margin-top:15px;">Average progress: ${avgProgress.toFixed(1)}%</p>
          <p style="font-size:12px; color:#999; margin-top:20px;">Sent by DreamNest</p>
        </div>
      </div>
    `;
  }

  private goalsTable(goals: Array<{ title: string; progress?: number }>) {
    return `
      <table style="width:100%; border-collapse:collapse; margin-top:10px;">
        <thead>
          <tr style="background-color: #eaeaf0;">
            <th style="text-align:left; padding:12px; color:#333;">Goal</th>
            <th style="text-align:right; padding:12px; color:#333;">Progress</th>
          </tr>
        </thead>
        <tbody>
          ${goals.map(g => `
            <tr>
              <td style="padding:12px; border-bottom:1px solid #eee; color:#6C63FF; font-weight:500;">
                ${g.title}
              </td>
              <td style="padding:12px; border-bottom:1px solid #eee; text-align:right;">
                <div style="background:#e0e0e0; border-radius:12px; width:100%; height:16px;">
                  <div style="width:${(g.progress ?? 0)}%; background-color:#6C63FF; height:100%; border-radius:12px;"></div>
                </div>
                <span style="font-size:12px;">${(g.progress ?? 0)}%</span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }
}
