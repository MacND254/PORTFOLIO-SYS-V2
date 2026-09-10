import nodemailer from 'nodemailer';
import { prisma } from '../database/client';
import { logger } from '../config/logger';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  gatewayType?: 'portfolio' | 'reset';
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
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

      const mailOptions: any = {
        from: options.from || from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>?/gm, ''),
        replyTo: options.replyTo,
        attachments: options.attachments,
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
   * Dispatch reply email to recruiter / visitor via Gateway 1: Portfolio Message Forwarder
   */
  public static async sendContactReplyEmail(params: {
    recipientEmail: string;
    recipientName: string;
    tenantName: string;
    tenantEmail: string;
    subject: string;
    replyMessage: string;
    originalMessage?: string;
    subdomain?: string;
  }): Promise<boolean> {
    const { recipientEmail, recipientName, tenantName, tenantEmail, subject, replyMessage, originalMessage, subdomain } = params;
    const formattedSubject = subject.toLowerCase().startsWith('re:') ? subject : `Re: ${subject}`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #020817; color: #f8fafc; padding: 32px 16px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #0f172a; padding: 32px; border-radius: 16px; border: 1px solid #1e293b; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background-color: #6366f120; border: 1px solid #6366f150; padding: 6px 14px; border-radius: 9999px; color: #818cf8; font-weight: bold; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
              PORTFOLIO INQUIRY REPLY
            </div>
            <h2 style="color: #ffffff; margin: 6px 0 0 0; font-size: 22px; font-weight: 800;">Message from ${tenantName}</h2>
            ${subdomain ? `<p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">via ${subdomain}.myportfolio.com</p>` : ''}
          </div>

          <p style="color: #e2e8f0; font-size: 14px;">Hi <strong>${recipientName}</strong>,</p>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
            <strong>${tenantName}</strong> has sent you a reply regarding your inquiry:
          </p>

          <div style="background-color: #090d16; border-left: 4px solid #6366f1; border-radius: 0 12px 12px 0; padding: 20px; margin: 20px 0; border: 1px solid #334155; border-left-width: 4px;">
            <div style="color: #f1f5f9; white-space: pre-wrap; font-size: 14px; line-height: 1.6;">${replyMessage}</div>
          </div>

          ${originalMessage ? `
            <div style="background-color: #1e293b50; border-radius: 10px; padding: 16px; margin: 20px 0; border: 1px solid #334155; font-size: 12px; color: #94a3b8;">
              <strong style="color: #cbd5e1; display: block; margin-bottom: 6px;">Original Message:</strong>
              <div style="white-space: pre-wrap; font-style: italic; line-height: 1.5;">${originalMessage}</div>
            </div>
          ` : ''}

          <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #1e293b;">
            <p style="font-size: 12px; color: #64748b; margin: 0;">
              You can reply directly to this email to continue the conversation with <strong>${tenantName}</strong> (<a href="mailto:${tenantEmail}" style="color: #818cf8; text-decoration: none;">${tenantEmail}</a>).
            </p>
          </div>
        </div>
      </div>
    `;

    return this.sendMail({
      to: recipientEmail,
      from: `"${tenantName}" <${tenantEmail}>`,
      replyTo: tenantEmail,
      subject: formattedSubject,
      html,
      gatewayType: 'portfolio',
    });
  }

  /**
   * Dispatch Verified Document Access Key directly to Recruiter's Email via Gateway 1: Portfolio Message Forwarder
   */
  public static async sendDocumentAccessKeyEmail(params: {
    recruiterEmail: string;
    recruiterName: string;
    tenantName: string;
    tenantEmail: string;
    accessCode: string;
    validityHours: number;
    subdomain: string;
  }): Promise<boolean> {
    const { recruiterEmail, recruiterName, tenantName, tenantEmail, accessCode, validityHours, subdomain } = params;

    const html = `
      <div style="font-family: Arial, sans-serif; background-color: #020817; color: #f8fafc; padding: 32px;">
        <div style="max-width: 580px; margin: 0 auto; background-color: #0f172a; padding: 32px; border-radius: 16px; border: 1px solid #1e293b; text-align: left;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background-color: #10b98120; border: 1px solid #10b98150; padding: 8px 16px; border-radius: 9999px; color: #10b981; font-weight: bold; font-size: 12px; margin-bottom: 8px;">
              VERIFIED DOCUMENT ACCESS
            </div>
            <h2 style="color: #ffffff; margin: 4px 0 0 0; font-size: 22px;">Access Key Approved</h2>
            <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Portfolio of ${tenantName}</p>
          </div>

          <p style="color: #e2e8f0; font-size: 14px;">Hi <strong>${recruiterName || 'Hiring Manager'}</strong>,</p>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
            <strong>${tenantName}</strong> has granted you one-time access to view their verified identity credentials (Government ID, Tax PIN, Good Conduct, and Professional Certificates).
          </p>

          <div style="background-color: #020817; border: 2px dashed #10b981; border-radius: 14px; padding: 24px; text-align: center; margin: 24px 0;">
            <p style="color: #94a3b8; font-size: 11px; font-weight: bold; uppercase; tracking-wider; margin: 0 0 8px 0;">YOUR ONE-TIME ACCESS KEY</p>
            <div style="font-family: monospace; font-size: 32px; font-weight: 800; color: #10b981; letter-spacing: 6px;">${accessCode}</div>
            <p style="color: #f59e0b; font-size: 12px; margin: 12px 0 0 0;">⏱️ Valid for <strong>${validityHours} hour${validityHours > 1 ? 's' : ''}</strong> from issuance.</p>
          </div>

          <div style="background-color: #1e293b; padding: 16px; border-radius: 12px; font-size: 13px; color: #cbd5e1; margin-bottom: 24px;">
            <strong>How to view documents:</strong>
            <ol style="margin: 8px 0 0 0; padding-left: 20px; line-height: 1.6;">
              <li>Visit <strong>${tenantName}</strong>'s public portfolio.</li>
              <li>Click <strong>"Verified Docs"</strong> or <strong>"Enter One-Time Key"</strong>.</li>
              <li>Enter your access key <strong>${accessCode}</strong> to unlock and view the documents.</li>
            </ol>
          </div>

          <p style="font-size: 11px; color: #64748b; text-align: center; margin-top: 24px; border-top: 1px solid #1e293b; padding-top: 16px;">
            Dispatched via Gateway 1: Portfolio Message Forwarder (${tenantEmail || 'Tenant Sender'}).
          </p>
        </div>
      </div>
    `;

    const tenantSender = tenantEmail ? `"${tenantName}" <${tenantEmail}>` : undefined;

    return this.sendMail({
      from: tenantSender,
      to: recruiterEmail,
      replyTo: tenantEmail,
      subject: `🔑 [Verified Documents Access Key] Granted by ${tenantName}`,
      html,
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

  /**
   * RFC-5545 iCalendar (.ics) format generator for seamless Google Calendar / Outlook sync
   */
  public static generateIcsContent(params: {
    uid: string;
    summary: string;
    description: string;
    location?: string;
    startDate: Date;
    durationMinutes: number;
    organizerName: string;
    organizerEmail: string;
    attendeeName: string;
    attendeeEmail: string;
  }): string {
    const { uid, summary, description, location = 'Online Video Call', startDate, durationMinutes, organizerName, organizerEmail, attendeeName, attendeeEmail } = params;
    const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };

    const nowStr = formatDate(new Date());
    const startStr = formatDate(startDate);
    const endStr = formatDate(endDate);
    const cleanDesc = description.replace(/\r?\n/g, '\\n').replace(/,/g, '\\,');

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Portfolio SaaS//Interview Scheduler//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${nowStr}`,
      `DTSTART:${startStr}`,
      `DTEND:${endStr}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${cleanDesc}`,
      `LOCATION:${location}`,
      `ORGANIZER;CN="${organizerName}":mailto:${organizerEmail}`,
      `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;CN="${attendeeName}":mailto:${attendeeEmail}`,
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'ACTION:DISPLAY',
      `DESCRIPTION:Reminder: Interview with ${organizerName}`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
  }

  /**
   * 1. Alert Tenant of incoming interview/meeting schedule request
   */
  public static async sendInterviewRequestNotificationToTenant(params: {
    tenantEmail: string;
    tenantName: string;
    recruiterName: string;
    recruiterEmail: string;
    company: string;
    recruiterTitle?: string;
    interviewType: string;
    preferredDate: string;
    preferredTime: string;
    timezone: string;
    durationMinutes: number;
    platformPreference: string;
    notes?: string;
    alternateSlot?: string;
  }): Promise<boolean> {
    const { tenantEmail, tenantName, recruiterName, recruiterEmail, company, recruiterTitle, interviewType, preferredDate, preferredTime, timezone, durationMinutes, platformPreference, notes, alternateSlot } = params;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #020817; color: #f8fafc; padding: 32px 16px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #0f172a; padding: 32px; border-radius: 16px; border: 1px solid #1e293b;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background-color: #6366f120; border: 1px solid #6366f150; padding: 6px 14px; border-radius: 9999px; color: #818cf8; font-weight: bold; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
              NEW INTERVIEW REQUEST
            </div>
            <h2 style="color: #ffffff; margin: 6px 0 0 0; font-size: 22px; font-weight: 800;">Meeting Request Received!</h2>
            <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Recruiter from <strong>${company}</strong> wants to connect.</p>
          </div>

          <p style="color: #e2e8f0; font-size: 14px;">Hi <strong>${tenantName}</strong>,</p>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
            <strong>${recruiterName}</strong> ${recruiterTitle ? `(${recruiterTitle})` : ''} from <strong>${company}</strong> has requested a call through your public portfolio.
          </p>

          <div style="background-color: #090d16; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <div style="display: grid; gap: 12px; font-size: 13px;">
              <div><strong style="color: #94a3b8;">Meeting Type:</strong> <span style="color: #818cf8; font-weight: bold;">${interviewType.replace(/_/g, ' ')}</span></div>
              <div><strong style="color: #94a3b8;">Requested Slot:</strong> <span style="color: #ffffff; font-weight: 600;">${preferredDate} at ${preferredTime} (${timezone})</span></div>
              <div><strong style="color: #94a3b8;">Duration:</strong> <span style="color: #ffffff;">${durationMinutes} Minutes</span></div>
              <div><strong style="color: #94a3b8;">Platform:</strong> <span style="color: #38bdf8;">${platformPreference.replace(/_/g, ' ')}</span></div>
              <div><strong style="color: #94a3b8;">Recruiter Email:</strong> <a href="mailto:${recruiterEmail}" style="color: #6366f1; text-decoration: none;">${recruiterEmail}</a></div>
              ${alternateSlot ? `<div><strong style="color: #94a3b8;">Alternate Slot:</strong> <span style="color: #f59e0b;">${alternateSlot}</span></div>` : ''}
              ${notes ? `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #1e293b;"><strong style="color: #94a3b8;">Opportunity / Notes:</strong><p style="color: #e2e8f0; margin: 4px 0 0 0; font-style: italic;">"${notes}"</p></div>` : ''}
            </div>
          </div>

          <div style="text-align: center; margin: 28px 0 16px 0;">
            <p style="font-size: 13px; color: #94a3b8; margin-bottom: 12px;">Log in to your Dashboard to <strong>Accept</strong> (with meeting link), <strong>Reschedule</strong>, or <strong>Decline</strong>:</p>
            <div style="display: inline-block; background-color: #6366f1; color: #ffffff; padding: 12px 28px; border-radius: 10px; font-weight: 700; font-size: 14px; text-decoration: none;">
              Open Admin Dashboard
            </div>
          </div>

          <p style="font-size: 11px; color: #64748b; text-align: center; margin-top: 24px; border-top: 1px solid #1e293b; padding-top: 16px;">
            Dispatched automatically via Portfolio SaaS Scheduling Engine.
          </p>
        </div>
      </div>
    `;

    return this.sendMail({
      to: tenantEmail,
      subject: `📅 [Interview Request] ${recruiterName} (${company}) requested a ${durationMinutes}m call`,
      html,
      replyTo: recruiterEmail,
      gatewayType: 'portfolio',
    });
  }

  /**
   * 2. Recruiter request confirmation receipt
   */
  public static async sendInterviewRequestConfirmationToRecruiter(params: {
    recruiterEmail: string;
    recruiterName: string;
    tenantName: string;
    interviewType: string;
    preferredDate: string;
    preferredTime: string;
    timezone: string;
    durationMinutes: number;
    platformPreference: string;
  }): Promise<boolean> {
    const { recruiterEmail, recruiterName, tenantName, interviewType, preferredDate, preferredTime, timezone, durationMinutes, platformPreference } = params;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #020817; color: #f8fafc; padding: 32px 16px;">
        <div style="max-width: 580px; margin: 0 auto; background-color: #0f172a; padding: 32px; border-radius: 16px; border: 1px solid #1e293b;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background-color: #10b98120; border: 1px solid #10b98150; padding: 6px 14px; border-radius: 9999px; color: #34d399; font-weight: bold; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
              REQUEST RECEIVED
            </div>
            <h2 style="color: #ffffff; margin: 6px 0 0 0; font-size: 22px; font-weight: 800;">Interview Request Sent!</h2>
            <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">With <strong>${tenantName}</strong></p>
          </div>

          <p style="color: #e2e8f0; font-size: 14px;">Hi <strong>${recruiterName}</strong>,</p>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
            Thank you for reaching out! Your interview / meeting request has been dispatched directly to <strong>${tenantName}</strong>.
          </p>

          <div style="background-color: #090d16; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin: 24px 0; font-size: 13px;">
            <div style="margin-bottom: 8px;"><strong style="color: #94a3b8;">Type:</strong> <span style="color: #818cf8; font-weight: bold;">${interviewType.replace(/_/g, ' ')}</span></div>
            <div style="margin-bottom: 8px;"><strong style="color: #94a3b8;">Proposed Slot:</strong> <span style="color: #ffffff; font-weight: 600;">${preferredDate} at ${preferredTime} (${timezone})</span></div>
            <div style="margin-bottom: 8px;"><strong style="color: #94a3b8;">Duration:</strong> <span style="color: #ffffff;">${durationMinutes} Minutes</span></div>
            <div><strong style="color: #94a3b8;">Format:</strong> <span style="color: #38bdf8;">${platformPreference.replace(/_/g, ' ')}</span></div>
          </div>

          <p style="color: #94a3b8; font-size: 13px; line-height: 1.6;">
            ${tenantName} will review your request shortly. You will receive an automatic email confirmation once accepted, complete with calendar invites and the meeting URL.
          </p>
        </div>
      </div>
    `;

    return this.sendMail({
      to: recruiterEmail,
      subject: `Confirmation: Meeting Request with ${tenantName}`,
      html,
      gatewayType: 'portfolio',
    });
  }

  /**
   * 3. Tenant ACCEPTS interview: Dispatches confirmation email to Recruiter with meeting link & ICS calendar attachment
   */
  public static async sendInterviewAcceptedEmail(params: {
    recruiterEmail: string;
    recruiterName: string;
    tenantName: string;
    tenantEmail: string;
    interviewType: string;
    confirmedDate: Date;
    formattedDate: string;
    formattedTime: string;
    timezone: string;
    durationMinutes: number;
    meetingLink?: string;
    tenantNotes?: string;
    company: string;
  }): Promise<boolean> {
    const { recruiterEmail, recruiterName, tenantName, tenantEmail, interviewType, confirmedDate, formattedDate, formattedTime, timezone, durationMinutes, meetingLink, tenantNotes, company } = params;

    const summary = `${interviewType.replace(/_/g, ' ')}: ${tenantName} & ${company}`;
    const description = `Confirmed interview between ${tenantName} and ${recruiterName} (${company}).\n${meetingLink ? `Meeting Link: ${meetingLink}\n` : ''}${tenantNotes ? `Note from ${tenantName}: "${tenantNotes}"\n` : ''}`;

    // Generate .ics calendar invite content
    const icsContent = this.generateIcsContent({
      uid: `interview-${Date.now()}-${Math.random().toString(36).substring(2, 8)}@portfolio-sys`,
      summary,
      description,
      location: meetingLink || 'Online Video Meeting',
      startDate: confirmedDate,
      durationMinutes,
      organizerName: tenantName,
      organizerEmail: tenantEmail,
      attendeeName: recruiterName,
      attendeeEmail: recruiterEmail,
    });

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #020817; color: #f8fafc; padding: 32px 16px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #0f172a; padding: 36px; border-radius: 16px; border: 1px solid #10b98150; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
          <div style="text-align: center; margin-bottom: 28px;">
            <div style="display: inline-block; background-color: #10b98120; border: 1px solid #10b98160; padding: 8px 18px; border-radius: 9999px; color: #34d399; font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;">
              INTERVIEW CONFIRMED
            </div>
            <h2 style="color: #ffffff; margin: 4px 0 0 0; font-size: 24px; font-weight: 800;">You're on the Schedule!</h2>
            <p style="color: #94a3b8; font-size: 14px; margin-top: 6px;"><strong>${tenantName}</strong> has accepted your interview request.</p>
          </div>

          <p style="color: #e2e8f0; font-size: 15px;">Hi <strong>${recruiterName}</strong>,</p>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
            Great news! <strong>${tenantName}</strong> has confirmed the upcoming <strong>${interviewType.replace(/_/g, ' ')}</strong>.
          </p>

          <div style="background-color: #090d16; border: 1px solid #1e293b; border-radius: 14px; padding: 24px; margin: 24px 0;">
            <div style="margin-bottom: 12px; font-size: 14px;">
              <strong style="color: #94a3b8;">📅 Date & Time:</strong>
              <div style="color: #34d399; font-size: 16px; font-weight: 700; margin-top: 4px;">
                ${formattedDate} at ${formattedTime} (${timezone})
              </div>
            </div>
            <div style="margin-bottom: 12px; font-size: 14px;">
              <strong style="color: #94a3b8;">⏱️ Duration:</strong>
              <span style="color: #f1f5f9; margin-left: 8px;">${durationMinutes} Minutes</span>
            </div>
            ${meetingLink ? `
              <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #1e293b;">
                <strong style="color: #94a3b8; font-size: 13px;">🔗 Video Meeting Link:</strong>
                <div style="margin-top: 8px;">
                  <a href="${meetingLink}" target="_blank" style="display: inline-block; background-color: #6366f1; color: #ffffff; padding: 10px 22px; border-radius: 8px; font-weight: 700; font-size: 14px; text-decoration: none;">
                    Join Video Call
                  </a>
                </div>
                <p style="color: #64748b; font-size: 12px; margin-top: 6px; word-break: break-all;">${meetingLink}</p>
              </div>
            ` : ''}
            ${tenantNotes ? `
              <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #1e293b;">
                <strong style="color: #94a3b8; font-size: 13px;">💬 Message from ${tenantName}:</strong>
                <p style="color: #e2e8f0; font-size: 14px; font-style: italic; margin: 6px 0 0 0;">"${tenantNotes}"</p>
              </div>
            ` : ''}
          </div>

          <div style="background-color: #1e293b80; border-radius: 12px; padding: 16px; margin: 24px 0; font-size: 13px; color: #cbd5e1; border: 1px solid #334155;">
            <strong>📎 Calendar Invitation Attached:</strong>
            <p style="margin: 4px 0 0 0; color: #94a3b8;">
              An interactive <strong>.ics</strong> calendar file has been attached to this email. Open it to sync this event directly to Google Calendar, Apple Calendar, or Outlook.
            </p>
          </div>

          <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 28px; border-top: 1px solid #1e293b; padding-top: 16px;">
            Need to adjust? You can reply directly to this email to contact ${tenantName} (<a href="mailto:${tenantEmail}" style="color: #6366f1; text-decoration: none;">${tenantEmail}</a>).
          </p>
        </div>
      </div>
    `;

    return this.sendMail({
      to: recruiterEmail,
      subject: `🎉 Interview Confirmed: ${tenantName} & ${company} (${formattedDate})`,
      html,
      replyTo: tenantEmail,
      gatewayType: 'portfolio',
      attachments: [
        {
          filename: 'interview-invite.ics',
          content: icsContent,
          contentType: 'text/calendar; charset=utf-8; method=REQUEST',
        },
      ],
    });
  }

  /**
   * 4. Tenant RESCHEDULES interview: Dispatches proposed new slot to Recruiter
   */
  public static async sendInterviewRescheduledEmail(params: {
    recruiterEmail: string;
    recruiterName: string;
    tenantName: string;
    tenantEmail: string;
    company: string;
    newProposedDate: string;
    newProposedTime: string;
    timezone: string;
    tenantNotes?: string;
  }): Promise<boolean> {
    const { recruiterEmail, recruiterName, tenantName, tenantEmail, company, newProposedDate, newProposedTime, timezone, tenantNotes } = params;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #020817; color: #f8fafc; padding: 32px 16px;">
        <div style="max-width: 580px; margin: 0 auto; background-color: #0f172a; padding: 32px; border-radius: 16px; border: 1px solid #f59e0b50;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background-color: #f59e0b20; border: 1px solid #f59e0b50; padding: 6px 14px; border-radius: 9999px; color: #fbbf24; font-weight: bold; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
              RESCHEDULE PROPOSAL
            </div>
            <h2 style="color: #ffffff; margin: 6px 0 0 0; font-size: 22px; font-weight: 800;">Time Update Proposed</h2>
            <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">For Interview with <strong>${tenantName}</strong></p>
          </div>

          <p style="color: #e2e8f0; font-size: 14px;">Hi <strong>${recruiterName}</strong>,</p>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
            <strong>${tenantName}</strong> has reviewed your meeting request for <strong>${company}</strong> and proposed an alternative time slot that better fits their schedule:
          </p>

          <div style="background-color: #090d16; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <strong style="color: #94a3b8; font-size: 12px; text-transform: uppercase;">Proposed New Slot:</strong>
            <div style="color: #fbbf24; font-size: 18px; font-weight: 800; margin-top: 6px;">
              ${newProposedDate} at ${newProposedTime} (${timezone})
            </div>
            ${tenantNotes ? `
              <div style="margin-top: 16px; padding-top: 14px; border-top: 1px solid #1e293b;">
                <strong style="color: #94a3b8; font-size: 12px;">Note from ${tenantName}:</strong>
                <p style="color: #f1f5f9; font-size: 14px; margin: 4px 0 0 0; font-style: italic;">"${tenantNotes}"</p>
              </div>
            ` : ''}
          </div>

          <div style="text-align: center; margin: 24px 0 8px 0;">
            <p style="font-size: 13px; color: #cbd5e1; margin-bottom: 12px;">
              Does this new slot work for you? You can simply reply directly to this email to confirm with ${tenantName}.
            </p>
            <a href="mailto:${tenantEmail}?subject=Re: Interview with ${tenantName} (${company})" style="display: inline-block; background-color: #f59e0b; color: #020817; padding: 10px 24px; border-radius: 8px; font-weight: 700; font-size: 13px; text-decoration: none;">
              Reply to ${tenantName}
            </a>
          </div>

          <p style="font-size: 11px; color: #64748b; text-align: center; margin-top: 24px; border-top: 1px solid #1e293b; padding-top: 16px;">
            Direct reply-to is configured for ${tenantEmail}.
          </p>
        </div>
      </div>
    `;

    return this.sendMail({
      to: recruiterEmail,
      subject: `🔄 Reschedule Proposal: Interview with ${tenantName} (${newProposedDate})`,
      html,
      replyTo: tenantEmail,
      gatewayType: 'portfolio',
    });
  }

  /**
   * 5. Tenant DECLINES interview: Dispatches polite notification to Recruiter
   */
  public static async sendInterviewDeclinedEmail(params: {
    recruiterEmail: string;
    recruiterName: string;
    tenantName: string;
    tenantEmail: string;
    company: string;
    tenantNotes?: string;
  }): Promise<boolean> {
    const { recruiterEmail, recruiterName, tenantName, tenantEmail, company, tenantNotes } = params;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #020817; color: #f8fafc; padding: 32px 16px;">
        <div style="max-width: 580px; margin: 0 auto; background-color: #0f172a; padding: 32px; border-radius: 16px; border: 1px solid #334155;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #ffffff; margin: 4px 0 0 0; font-size: 20px; font-weight: 700;">Meeting Request Update</h2>
            <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Regarding ${company} &amp; ${tenantName}</p>
          </div>

          <p style="color: #e2e8f0; font-size: 14px;">Hi <strong>${recruiterName}</strong>,</p>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
            Thank you for considering <strong>${tenantName}</strong> for opportunities at <strong>${company}</strong>.
          </p>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
            ${tenantName} is unable to accept your meeting request at this time.
          </p>

          ${tenantNotes ? `
            <div style="background-color: #090d16; border: 1px solid #1e293b; border-radius: 12px; padding: 18px; margin: 20px 0; font-size: 13px;">
              <strong style="color: #94a3b8;">Message from ${tenantName}:</strong>
              <p style="color: #f1f5f9; margin: 6px 0 0 0; font-style: italic;">"${tenantNotes}"</p>
            </div>
          ` : ''}

          <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin-top: 20px;">
            Thank you again for your interest, and best of luck with your talent search!
          </p>
        </div>
      </div>
    `;

    return this.sendMail({
      to: recruiterEmail,
      subject: `Update regarding your meeting request with ${tenantName}`,
      html,
      replyTo: tenantEmail,
      gatewayType: 'portfolio',
    });
  }

  /**
   * Dispatches marketing invitation email to prospective employer companies
   */
  public static async sendCompanyMarketingInvitationEmail(params: {
    email: string;
    companyName?: string;
    inviteUrl: string;
    expiresAt: Date;
  }): Promise<boolean> {
    const { email, companyName, inviteUrl, expiresAt } = params;
    const recipientHeader = companyName
      ? `Private Access for <strong>${companyName}</strong>`
      : `Exclusive Access for Hiring Leaders`;
    const recipientSalutation = companyName
      ? `Dear ${companyName} Hiring Team,`
      : `Dear Hiring Team,`;
    const expiresFormatted = expiresAt.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #020817; color: #f8fafc; padding: 40px 16px;">
        <div style="max-width: 620px; margin: 0 auto; background-color: #0f172a; padding: 40px 32px; border-radius: 20px; border: 1px solid #1e293b; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
          
          <!-- Brand Badge -->
          <div style="text-align: center; margin-bottom: 28px;">
            <div style="display: inline-block; background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.2)); border: 1px solid rgba(99,102,241,0.4); padding: 6px 16px; rounded: 9999px; border-radius: 20px;">
              <span style="font-size: 11px; font-weight: 800; color: #a5b4fc; text-transform: uppercase; letter-spacing: 1.5px;">Exclusive Partner Invitation</span>
            </div>
            <h1 style="color: #ffffff; margin: 16px 0 6px 0; font-size: 26px; font-weight: 800; tracking-tight: -0.5px; line-height: 1.3;">
              Elevate Your Hiring with Pre-Vetted, Verified Talent
            </h1>
            <p style="color: #94a3b8; font-size: 14px; margin: 0;">${recipientHeader}</p>
          </div>

          <!-- Body intro -->
          <p style="color: #e2e8f0; font-size: 15px; line-height: 1.6;">
            ${recipientSalutation}
          </p>
          <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6;">
            We are thrilled to invite your company to our private <strong>Employer Partner Network</strong>. Sifting through hundreds of static PDF resumes is inefficient — our platform empowers modern engineering and product teams to discover, evaluate, and hire top-tier talent through <strong>rich, interactive portfolios</strong>.
          </p>

          <!-- Feature Cards Grid -->
          <div style="margin: 32px 0;">
            
            <div style="background-color: #1e293b50; border: 1px solid #334155; border-radius: 14px; padding: 18px 20px; margin-bottom: 14px;">
              <div style="display: flex; align-items: center; margin-bottom: 6px;">
                <span style="font-size: 16px; margin-right: 10px;">🎯</span>
                <strong style="color: #ffffff; font-size: 14px;">Instant AI Candidate Matching</strong>
              </div>
              <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin: 0;">
                Post open positions in seconds. Our algorithmic matcher automatically analyzes published candidate portfolios across verified skills, architecture case studies, and proven track records to rank the most qualified candidates with precise match scores.
              </p>
            </div>

            <div style="background-color: #1e293b50; border: 1px solid #334155; border-radius: 14px; padding: 18px 20px; margin-bottom: 14px;">
              <div style="display: flex; align-items: center; margin-bottom: 6px;">
                <span style="font-size: 16px; margin-right: 10px;">💎</span>
                <strong style="color: #ffffff; font-size: 14px;">Beyond Resumes: Verified Proof of Work</strong>
              </div>
              <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin: 0;">
                Review live GitHub projects, interactive prototypes, verified certificates, and peer recommendations directly inside candidate portfolios before scheduling a call.
              </p>
            </div>

            <div style="background-color: #1e293b50; border: 1px solid #334155; border-radius: 14px; padding: 18px 20px; margin-bottom: 14px;">
              <div style="display: flex; align-items: center; margin-bottom: 6px;">
                <span style="font-size: 16px; margin-right: 10px;">📅</span>
                <strong style="color: #ffffff; font-size: 14px;">1-Click Direct Calendar Scheduling</strong>
              </div>
              <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin: 0;">
                Eliminate recruiter email ping-pong. Schedule recruiter screens, technical rounds, or hiring manager syncs with automatic Google Meet and Zoom calendar sync.
              </p>
            </div>

            <div style="background-color: #1e293b50; border: 1px solid #334155; border-radius: 14px; padding: 18px 20px;">
              <div style="display: flex; align-items: center; margin-bottom: 6px;">
                <span style="font-size: 16px; margin-right: 10px;">⚡</span>
                <strong style="color: #ffffff; font-size: 14px;">Zero Agency Markups &amp; Unlimited Postings</strong>
              </div>
              <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin: 0;">
                Connect directly with candidates without paying 20-30% recruitment commissions or expensive recruiter platform subscriptions.
              </p>
            </div>

          </div>

          <!-- CTA Box -->
          <div style="background: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.15)); border: 1px solid rgba(99,102,241,0.3); border-radius: 16px; padding: 28px 20px; text-align: center; margin: 32px 0;">
            <p style="color: #f1f5f9; font-size: 14px; font-weight: 600; margin: 0 0 16px 0;">
              Your private partner registration link has been provisioned:
            </p>
            <div>
              <a href="${inviteUrl}" target="_blank" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-size: 15px; font-weight: 700; display: inline-block; box-shadow: 0 8px 25px rgba(99,102,241,0.4);">
                Activate Partner Account &rarr;
              </a>
            </div>
            <p style="color: #94a3b8; font-size: 11px; margin: 16px 0 0 0;">
              This private invitation is secure and valid until <strong>${expiresFormatted}</strong>.
            </p>
          </div>

          <!-- Direct URL Fallback -->
          <div style="border-top: 1px solid #1e293b; padding-top: 20px; margin-top: 20px;">
            <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0 0 6px 0;">
              If the button above does not work, copy and paste this link into your browser:
            </p>
            <p style="color: #818cf8; font-size: 11px; word-break: break-all; margin: 0;">
              ${inviteUrl}
            </p>
          </div>

          <div style="text-align: center; margin-top: 32px; border-top: 1px solid #1e293b; padding-top: 20px;">
            <p style="color: #475569; font-size: 12px; margin: 0;">
              &copy; ${new Date().getFullYear()} Portfolio SaaS Platform &bull; Employer Partner Network
            </p>
          </div>

        </div>
      </div>
    `;

    return this.sendMail({
      to: email,
      subject: `Exclusive Invitation: Hire Top-Tier Pre-Vetted Talent on Portfolio SaaS`,
      html,
      gatewayType: 'portfolio',
    });
  }
}

