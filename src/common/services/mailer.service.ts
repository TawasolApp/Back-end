import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async sendVerificationEmail(email: string, token: string) {
    const verificationUrl = `http://localhost:3000/auth/verify-email?token=${token}`;

    await this.transporter.sendMail({
      from: '"TawasolApp" <noreply@tawasolapp.com>',
      to: email,
      subject: 'Verify Your Email',
      html: `<p>Click <a href="${verificationUrl}">here</a> to verify your email.</p>`,
    });

    console.log(`✅ Verification email sent to ${email}`);
  }
}
