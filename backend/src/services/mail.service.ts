import nodemailer from 'nodemailer';
import { prisma } from '../database/client';
import { logger } from '../config/logger';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  gatewayType?: 'portfolio' | 'reset';
}

export class MailService {
  /**
   * Retrieves dynamic SMTP settings from SystemSetting table by gateway type
   */
  private static async getSmtpConfig(gatewayType: 'portfolio' | 'reset' = 'portfolio') {
    try {
      const keys = gatewayType === 'reset'
        ? [
            'SMTP_RESET_HOST',
            'SMTP_RESET_PORT',
            'SMTP_RESET_SECURE',
            'SMTP_RESET_USER',
            'SMTP_RESET_PASS',
            'SMTP_RESET_FROM_EMAIL',
            'SMTP_RESET_FROM_NAME',
            // Fallback primary keys
            'SMTP_HOST',
            'SMTP_PORT',
            'SMTP_SECURE',
            'SMTP_USER',
            'SMTP_PASS',
            'SMTP_FROM_EMAIL',
            'SMTP_FROM_NAME',
          ]
        : [
            'SMTP_HOST',
            'SMTP_PORT',
            'SMTP_SECURE',
            'SMTP_USER',
            'SMTP_PASS',
            'SMTP_FROM_EMAIL',
            'SMTP_FROM_NAME',
          ];

      const settings = await prisma.systemSetting.findMany({
        where: { key: { in: keys } },
      });

      const map: Record<string, string> = {};
      settings.forEach((s: any) => {
        map[s.key] = s.value;
      });

      if (gatewayType === 'reset') {
        const host = map['SMTP_RESET_HOST'] || map['SMTP_HOST'] || process.env.SMTP_HOST || 'smtp.gmail.com';
        const port = parseInt(map['SMTP_RESET_PORT'] || map['SMTP_PORT'] || process.env.SMTP_PORT || '587', 10);
        const secure = (map['SMTP_RESET_SECURE'] || map['SMTP_SECURE']) === 'true' || port === 465;
        const user = map['SMTP_RESET_USER'] || map['SMTP_USER'] || process.env.SMTP_USER || '';
        const pass = map['SMTP_RESET_PASS'] || map['SMTP_PASS'] || process.env.SMTP_PASSWORD || '';
        const fromEmail = map['SMTP_RESET_FROM_EMAIL'] || map['SMTP_FROM_EMAIL'] || user || 'security@myportfolio.com';
        const fromName = map['SMTP_RESET_FROM_NAME'] || map['SMTP_FROM_NAME'] || 'Portfolio Platform Security';

        return { host, port, secure, user, pass, from: `"${fromName}" <${fromEmail}>` };
      }

      // Portfolio forwarding gateway default
      const host = map['SMTP_HOST'] || process.env.SMTP_HOST || 'smtp.gmail.com';
      const port = parseInt(map['SMTP_PORT'] || process.env.SMTP_PORT || '587', 10);
      const secure = map['SMTP_SECURE'] === 'true' || port === 465;
      const user = map['SMTP_USER'] || process.env.SMTP_USER || '';
      const pass = map['SMTP_PASS'] || process.env.SMTP_PASSWORD || '';
      const fromEmail = map['SMTP_FROM_EMAIL'] || process.env.SMTP_FROM_EMAIL || user || 'noreply@myportfolio.com';
      const fromName = map['SMTP_FROM_NAME'] || process.env.SMTP_FROM_NAME || 'Portfolio SaaS Mailer';

      return { host, port, secure, user, pass, from: `"${fromName}" <${fromEmail}>` };
    } catch (err) {
      logger.error('Failed to load SMTP settings from DB, using defaults', err);
      return {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_PORT === '465',
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASSWORD || '',
        from: process.env.SMTP_FROM || '"Portfolio SaaS" <noreply@myportfolio.com>',
      };
    }
  }

  /**
   * Creates a Nodemailer Transporter
   */
  private static async createTransporter(gatewayType: 'portfolio' | 'reset' = 'portfolio') {
    const config = await this.getSmtpConfig(gatewayType);

    const transportOptions: nodemailer.TransportOptions = {
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.user ? { user: config.user, pass: config.pass } : undefined,
      tls: {
        rejectUnauthorized: false,
      },
    } as any;

    return {
      transporter: nodemailer.createTransport(transportOptions),
      from: config.from,
    };
  }

  /**
   * General Send Email method
   */
  public static async sendMail(options: EmailOptions): Promise<boolean> {
    try {
      const { transporter, from } = await this.createTransporter(options.gatewayType || 'portfolio');

      const mailOptions = {
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>?/gm, ''),
        replyTo: options.replyTo,
      };

      const info = await transporter.sendMail(mailOptions);
      logger.info(`Email sent via ${options.gatewayType || 'portfolio'} gateway to ${options.to}: ${info.messageId}`);
      return true;
    } catch (error: any) {
      logger.error(`Error sending email to ${options.to}: ${error?.message || error}`);
      return false;
    }
  }

  /**
   * Forward a visitor's portfolio message directly to tenant's email address
   */
  public static async forwardTenantContactMessage(params: {
    tenantEmail: string;
    tenantName: string;
    senderName: string;
    senderEmail: string;
    subject: string;
    message: string;
    subdomain: string;
  }): Promise<boolean> {
    const { tenantEmail, tenantName, senderName, senderEmail, subject, message, subdomain } = params;

    const html = `
      <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px; border-radius: 16px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; padding: 32px; border-radius: 16px; border: 1px solid #334155;">
          <h2 style="color: #6366f1; margin-top: 0;">New Contact Form Message!</h2>
          <p style="color: #cbd5e1;">Hi <strong>${tenantName}</strong>,</p>
          <p style="color: #cbd5e1;">You received a new inquiry on your public portfolio (<strong>${subdomain}.localhost</strong>):</p>
          
          <div style="background-color: #090d16; padding: 20px; border-radius: 12px; border-left: 4px solid #6366f1; margin: 20px 0;">
            <p style="margin: 0 0 8px 0; color: #94a3b8; font-size: 13px;"><strong>From:</strong> ${senderName} (&lt;${senderEmail}&gt;)</p>
            <p style="margin: 0 0 12px 0; color: #94a3b8; font-size: 13px;"><strong>Subject:</strong> ${subject}</p>
            <div style="color: #f1f5f9; white-space: pre-wrap; font-size: 14px; line-height: 1.6;">${message}</div>
          </div>

          <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">You can reply directly to this email to contact ${senderName}.</p>
        </div>
      </div>
    `;

    return this.sendMail({
      to: tenantEmail,
      subject: `[Portfolio Inquiry] ${subject}`,
      html,
      replyTo: senderEmail,
      gatewayType: 'portfolio',
    });
  }

  /**
   * Dispatch Password Reset Email using the dedicated Security Gateway
   */
  public static async sendPasswordResetEmail(params: {
    email: string;
    resetToken: string;
    userName: string;
    frontendUrl?: string;
  }): Promise<boolean> {
    const { email, resetToken, userName, frontendUrl } = params;
    const resetLink = `${frontendUrl || 'http://localhost:3080'}/reset-password?token=${resetToken}`;

    const html = `
      <div style="font-family: Arial, sans-serif; background-color: #020817; color: #f8fafc; padding: 32px;">
        <div style="max-width: 550px; margin: 0 auto; background-color: #0f172a; padding: 32px; border-radius: 16px; border: 1px solid #1e293b; text-align: left;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #f43f5e; margin: 0; font-size: 22px;">Security & Password Reset</h2>
            <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Portfolio SaaS Account Authentication Security</p>
          </div>

          <p style="color: #e2e8f0; font-size: 14px;">Hi <strong>${userName}</strong>,</p>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.5;">
            We received a request to reset the password for your account (<strong>${email}</strong>). Click the button below to specify a new strong password:
          </p>

          <div style="text-align: center; margin: 28px 0;">
            <a href="${resetLink}" target="_blank" style="background-color: #e11d48; color: #ffffff; padding: 14px 28px; border-radius: 12px; font-weight: bold; text-decoration: none; display: inline-block; font-size: 14px;">
              Reset My Password
            </a>
          </div>

          <div style="background-color: #020817; padding: 16px; border-radius: 10px; font-size: 12px; color: #94a3b8; margin: 20px 0;">
            <strong style="color: #f43f5e;">Note:</strong> This password reset link will expire in <strong>1 hour</strong>. If you did not request a password reset, please ignore this email.
          </div>

          <p style="font-size: 11px; color: #64748b; text-align: center; margin-top: 24px; border-top: 1px solid #1e293b; padding-top: 16px;">
            Dispatched automatically via Platform Password Reset Gateway.
          </p>
        </div>
      </div>
    `;

    return this.sendMail({
      to: email,
      subject: '🔑 Reset Your Portfolio SaaS Password',
      html,
      gatewayType: 'reset',
    });
  }

  /**
   * Dispatch Testimonial Invitation Email
   */
  public static async sendReviewInvitationEmail(params: {
    reviewerEmail: string;
    reviewerName: string;
    tenantName: string;
    reviewToken: string;
    subdomain: string;
  }): Promise<boolean> {
    const { reviewerEmail, reviewerName, tenantName, reviewToken, subdomain } = params;
    const reviewLink = `http://${subdomain}.localhost:3080?reviewToken=${reviewToken}#reviews`;

    const html = `
      <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px; border-radius: 16px;">
        <div style="max-width: 550px; margin: 0 auto; background-color: #1e293b; padding: 32px; border-radius: 16px; border: 1px solid #334155;">
          <h2 style="color: #8b5cf6; margin-top: 0;">Testimonial Invitation</h2>
          <p style="color: #cbd5e1;">Hi <strong>${reviewerName}</strong>,</p>
          <p style="color: #cbd5e1;"><strong>${tenantName}</strong> has invited you to write a brief testimonial or endorsement for their professional portfolio.</p>

          <div style="text-align: center; margin: 24px 0;">
            <a href="${reviewLink}" target="_blank" style="background-color: #7c3aed; color: #ffffff; padding: 12px 24px; border-radius: 10px; font-weight: bold; text-decoration: none; display: inline-block;">
              Submit Testimonial
            </a>
          </div>
          <p style="font-size: 12px; color: #64748b; text-align: center;">Thank you for helping highlight great professional work!</p>
        </div>
      </div>
    `;

    return this.sendMail({
      to: reviewerEmail,
      subject: `[Testimonial Request] ${tenantName} invited you to share a review`,
      html,
      gatewayType: 'portfolio',
    });
  }

  /**
   * Send a test email from SuperAdmin Mail Settings page
   */
  public static async sendTestEmail(recipientEmail: string, gatewayType: 'portfolio' | 'reset' = 'portfolio'): Promise<{ success: boolean; message: string }> {
    try {
      const { transporter, from } = await this.createTransporter(gatewayType);

      // Verify connection configuration
      await transporter.verify();

      const gatewayTitle = gatewayType === 'reset' ? 'Password Reset Gateway' : 'Portfolio Forwarding Gateway';
      const html = `
        <div style="font-family: Arial, sans-serif; background-color: #020817; color: #f1f5f9; padding: 24px;">
          <div style="max-width: 500px; margin: 0 auto; background-color: #0f172a; padding: 24px; border-radius: 12px; border: 1px solid #1e293b; text-align: center;">
            <h3 style="color: #10b981;">${gatewayTitle} Connection Successful!</h3>
            <p style="color: #94a3b8; font-size: 14px;">This test email confirms that your dynamic SMTP Mail Server configuration for <strong>${gatewayTitle}</strong> is active and working properly.</p>
            <div style="margin-top: 16px; font-size: 12px; color: #64748b;">Sent via Portfolio SaaS System Settings</div>
          </div>
        </div>
      `;

      await transporter.sendMail({
        from,
        to: recipientEmail,
        subject: `SMTP Connection Test (${gatewayTitle}) — Portfolio SaaS`,
        html,
      });

      return { success: true, message: `Test email sent successfully to ${recipientEmail} via ${gatewayTitle}` };
    } catch (err: any) {
      logger.error(`SMTP test email failed for ${gatewayType}`, err);
      return { success: false, message: `SMTP connection failed: ${err.message || err}` };
    }
  }
}
