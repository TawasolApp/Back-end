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
    const verificationUrl = `https://tawasolapp.me/auth/verify-email?token=${token}`;

    await this.transporter.sendMail({
      from: '"TawasolApp" <noreply@tawasolapp.com>',
      to: email,
      subject: 'Verify Your Email',
      html: `<p>Click <a href="${verificationUrl}">here</a> to verify your email.</p>`,
    });

    console.log(`✅ Verification email sent to ${email}`);
  }

  async sendEmailChangeConfirmation(email: string, token: string) {
    const link = `https://tawasolapp.me/users/confirm-email-change?token=${token}`;
    await this.transporter.sendMail({
      from: '"TawasolApp" <noreply@tawasolapp.com>',
      to: email,
      subject: 'Confirm Your Email Change',
      html: `<p>Click <a href="${link}">here</a> to confirm your email change.</p>`,
    });
  }

  async sendPasswordResetEmail(
    email: string,
    token: string,
    isAndroid: boolean,
  ) {
    const resetUrl = isAndroid
      ? `https://tawasolapp.me/forgot_password?token=${token}`
      : `https://tawasolapp.me/forgot_password?token=${token}`;

    await this.transporter.sendMail({
      from: '"TawasolApp" <noreply@tawasolapp.com>',
      to: email,
      subject: 'Reset Your Password',
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link will expire in 15 minutes.</p>`,
    });

    console.log(`📨 Password reset email sent to ${email}`);
  }

  async resendConfirmationEmail(
    email: string,
    type: 'verifyEmail' | 'forgotPassword' | 'emailUpdate',
    token: string,
  ) {
    let subject: string;
    let url: string;

    switch (type) {
      case 'verifyEmail':
        subject = 'Verify Your Email';
        url = `https://tawasolapp.me/auth/verify-email?token=${token}`;
        break;

      case 'forgotPassword':
        subject = 'Reset Your Password';
        url = `https://tawasolapp.me/forgot_password?token=${token}`;
        break;

      case 'emailUpdate':
        subject = 'Confirm Your Email Change';
        url = `https://tawasolapp.me/users/confirm-email-change?token=${token}`;
        break;

      default:
        throw new Error('Invalid email type');
    }

    await this.transporter.sendMail({
      from: '"TawasolApp" <noreply@tawasolapp.com>',
      to: email,
      subject,
      html: `<p>Click <a href="${url}">here</a> to ${subject.toLowerCase()}.</p>`,
    });

    console.log(`📨 ${type} email sent to ${email}`);
  }
}
