import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailTemplateService {
  

  dailyReportTemplate(user, report) {
    const { goals, plansToday, avgProgress } = report;

    return `
      <div style="font-family: Helvetica, Arial, sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px; background-color: #f4f6f8; border-radius: 8px;">
        <div style="background-color: #6C63FF; padding: 20px; border-radius: 8px 8px 0 0; color: white; text-align: center;">
          <h1 style="margin:0; font-size:24px;">DreamNest Daily Progress</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Hello ${user.firstName}!</h2>
          <p>Here is your daily progress summary:</p>
          ${this.goalsTable(goals)}
          <p style="margin-top:15px;">Your average progress today: ${avgProgress.toFixed(1)}%</p>
          <p style="font-size:12px; color:#999; margin-top:20px;">Sent by DreamNest</p>
        </div>
      </div>
    `;
  }

 
  noProgressTemplate(user) {
    return `
      <div style="font-family: Helvetica, Arial, sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px; background-color: #f4f6f8; border-radius: 8px;">
        <div style="background-color: #FF6B6B; padding: 20px; border-radius: 8px 8px 0 0; color: white; text-align: center;">
          <h1>We Missed You Today!</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Hello ${user.firstName},</h2>
          <p>Looks like you didn’t make progress on any of your goals today.</p>
          <p>Let’s get moving tomorrow and make some progress!</p>
          <p style="font-size:12px; color:#999; margin-top:20px;">Sent by DreamNest</p>
        </div>
      </div>
    `;
  }

  private goalsTable(goals) {
  return `
    <table style="width:100%; border-collapse:collapse; margin-top:10px;">
      <thead>
        <tr style="background-color: #eaeaf0;">
          <th style="text-align:left; padding:12px; color:#333;">Goal</th>
          <th style="text-align:right; padding:12px; color:#333;">Progress</th>
        </tr>
      </thead>
      <tbody>
        ${goals.map(goal => `
          <tr>
            <td style="padding:12px; border-bottom:1px solid #eee; color:#6C63FF; font-weight:500;">
              ${goal.title}
            </td>
            <td style="padding:12px; border-bottom:1px solid #eee; text-align:right;">
              <div style="background:#e0e0e0; border-radius:12px; width:100%; height:16px;">
                <div style="width:${goal.progress}%; background-color:#6C63FF; height:100%; border-radius:12px;"></div>
              </div>
              <span style="font-size:12px;">${goal.progress}%</span>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

}
