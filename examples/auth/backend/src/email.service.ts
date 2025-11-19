import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { IEmailService } from '@sottosviluppo/auth-backend';

@Injectable()
export class EmailService implements IEmailService {
  constructor(private readonly mailer: MailerService) {}

  async sendPasswordResetEmail(
    email: string,
    token: string,
    resetUrl: string,
  ): Promise<void> {
    // Send email with resetUrl
    // Example: https://app.com/reset-password?token=abc123
    await this.mailer.sendMail({
      to: email,
      subject: 'Reset your password',
      html: `Click here to reset: <a href="${resetUrl}">${resetUrl}</a>`,
    });
  }

  async sendInvitationEmail(
    email: string,
    token: string,
    invitationUrl: string,
  ): Promise<void> {
    // Send invitation email
    await this.mailer.sendMail({
      to: email,
      subject: "You've been invited!",
      html: `Set your password: <a href="${invitationUrl}">${invitationUrl}</a>`,
    });
  }
}
