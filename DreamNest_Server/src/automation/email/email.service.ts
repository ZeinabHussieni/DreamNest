import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter;

  constructor() {
   const host = process.env.EMAIL_HOST;
   const port = process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : 587;
   const user = process.env.EMAIL_USER;
   const pass = process.env.EMAIL_PASS;

    if (!host || !user || !pass) {
      throw new Error('Email environment variables are not properly set.');
    }

    this.transporter = nodemailer.createTransport({
    host,
    port,
    secure: false, 
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
    });
  }
  async sendEmail(to: string, subject: string, html: string) {
  const info = await this.transporter.sendMail({
  from: '"DreamNest" <zei.alhussieni@gmail.com>', 
  to,
  subject,
  html,
 });

  console.log('Email sent:', info.messageId);
  return info;
}
  
  
}
