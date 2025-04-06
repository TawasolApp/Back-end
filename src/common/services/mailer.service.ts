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
    const verificationUrl = `https://tawasolapp.me/api/auth/verify-email?token=${token}`;

    await this.transporter.sendMail({
      from: '"TawasolApp" <noreply@tawasolapp.com>',
      to: email,
      subject: 'Verify Your Email',
      html: `<p>Click <a href="${verificationUrl}">here</a> to verify your email.</p>`,
    });

    console.log(`✅ Verification email sent to ${email}`);
  }

  async sendEmailChangeConfirmation(to: string, token: string) {
    const link = `https://tawasolapp.me/api/user/update-email?token=${token}`;
    await this.transporter.sendMail({
      to,
      from: '"TawasolApp" <noreply@tawasolapp.com>',
      subject: 'Confirm Your Email Change',
      html: `<p>Click <a href="${link}">here</a> to confirm your email change.</p>`,
    });
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const resetUrl = `https://tawasolapp.me/api/auth/forgot-password?token=${token}`;

    await this.transporter.sendMail({
      from: '"TawasolApp" <noreply@tawasolapp.com>',
      to,
      subject: 'Reset Your Password',
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link will expire in 15 minutes.</p>`,
    });

    console.log(`📨 Password reset email sent to ${to}`);
  }
}
