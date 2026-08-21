import { prisma } from '../database/client';
import { NotFoundError, ValidationError } from '../utils/errors';
import { NotificationService } from './notification.service';
import { AuditService } from './audit.service';
import { MailService } from './mail.service';

export class MessageService {
  public static async submitContactMessage(
    subdomain: string,
    data: {
      name: string;
      email: string;
      subject: string;
      message: string;
      honeypot?: string;
    },
    reqMeta?: { ipAddress?: string; userAgent?: string }
  ) {
    if (data.honeypot && data.honeypot.trim().length > 0) {
      // Anti-bot spam honeypot triggered — drop silently and return success
      return { id: 'honeypot-ignored', message: 'Message received.' };
    }

    const subRecord: any = await prisma.subdomain.findUnique({
      where: { slug: subdomain },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            profile: { select: { id: true, contactEmail: true } as any },
          },
        },
      },
    });

    if (!subRecord || !subRecord.user || !subRecord.user.profile) {
      throw new NotFoundError('Portfolio not found.');
    }

    const contactMsg = await prisma.contactMessage.create({
      data: {
        profileId: subRecord.user.profile.id,
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        subject: data.subject.trim(),
        message: data.message.trim(),
        ipAddress: reqMeta?.ipAddress,
        userAgent: reqMeta?.userAgent,
      },
    });

    // In-App Notification
    await NotificationService.create({
      userId: subRecord.user.id,
      title: 'New Portfolio Inquiry Received!',
      message: `Message from ${data.name}: "${data.subject}"`,
      type: 'INFO',
      link: '/admin/messages',
    });

    // Email Forwarding to Tenant's contactEmail or primary account email
    const recipientEmail = subRecord.user.profile.contactEmail || subRecord.user.email;
    if (recipientEmail) {
      MailService.forwardTenantContactMessage({
        tenantEmail: recipientEmail,
        tenantName: subRecord.user.fullName,
        senderName: data.name.trim(),
        senderEmail: data.email.trim().toLowerCase(),
        subject: data.subject.trim(),
        message: data.message.trim(),
        subdomain,
      }).catch((err) => {
        console.error('Failed to dispatch contact email to tenant:', err);
      });
    }

    return contactMsg;
  }

  public static async getMessagesForAdmin(userId: string) {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundError('Profile not found.');

    return prisma.contactMessage.findMany({
      where: { profileId: profile.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  public static async markMessageStatus(
    messageId: string,
    userId: string,
    status: { isRead?: boolean; isArchived?: boolean }
  ) {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundError('Profile not found.');

    return prisma.contactMessage.updateMany({
      where: { id: messageId, profileId: profile.id },
      data: status,
    });
  }

  public static async deleteMessage(messageId: string, userId: string) {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundError('Profile not found.');

    return prisma.contactMessage.deleteMany({
      where: { id: messageId, profileId: profile.id },
    });
  }

  public static async submitAccessKeyRequest(
    subdomain: string,
    data: {
      name: string;
      email: string;
      company?: string;
      message?: string;
    },
    reqMeta?: { ipAddress?: string; userAgent?: string }
  ) {
    const subRecord: any = await prisma.subdomain.findUnique({
      where: { slug: subdomain },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            profile: { select: { id: true, contactEmail: true } as any },
          },
        },
      },
    });

    if (!subRecord || !subRecord.user || !subRecord.user.profile) {
      throw new NotFoundError('Portfolio not found.');
    }

    const companyName = data.company?.trim() ? ` (${data.company.trim()})` : '';
    const subject = `[DOCUMENT_ACCESS_REQUEST] Key Request from ${data.name.trim()}${companyName}`;
    const fullMessage = data.message?.trim() || 'Requesting one-time access key to view verified identity credentials.';

    const contactMsg = await (prisma.contactMessage as any).create({
      data: {
        profileId: subRecord.user.profile.id,
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        subject,
        message: fullMessage,
        type: 'DOCUMENT_ACCESS_REQUEST',
        status: 'PENDING',
        ipAddress: reqMeta?.ipAddress,
        userAgent: reqMeta?.userAgent,
      },
    });

    // In-App Notification to tenant
    await NotificationService.create({
      userId: subRecord.user.id,
      title: '🔑 Verified Document Access Requested!',
      message: `${data.name}${companyName} requested access to your verified credentials.`,
      type: 'WARNING',
      link: '/admin/messages',
    });

    // Also forward email to tenant so they know immediately
    const recipientEmail = subRecord.user.profile.contactEmail || subRecord.user.email;
    if (recipientEmail) {
      MailService.forwardTenantContactMessage({
        tenantEmail: recipientEmail,
        tenantName: subRecord.user.fullName,
        senderName: data.name.trim(),
        senderEmail: data.email.trim().toLowerCase(),
        subject,
        message: `${fullMessage}\n\nCompany: ${data.company || 'N/A'}\nLog in to your dashboard to Accept or Decline this request.`,
        subdomain,
      }).catch((err) => console.error('Failed to notify tenant of key request:', err));
    }

    return contactMsg;
  }

  public static async acceptKeyRequest(
    messageId: string,
    userId: string,
    options: { validityHours?: number }
  ) {
    const profile: any = await prisma.profile.findUnique({
      where: { userId },
      include: { user: true },
    });
    if (!profile) throw new NotFoundError('Profile not found.');

    const msg: any = await prisma.contactMessage.findFirst({
      where: { id: messageId, profileId: profile.id },
    });
    if (!msg) throw new NotFoundError('Message request not found.');

    const validityHours = Math.max(1, Math.min(168, options.validityHours || 24)); // 1 hour to 7 days
    const expiresAt = new Date(Date.now() + validityHours * 60 * 60 * 1000);

    // Generate unique code DOC-XXXXXX
    const crypto = await import('crypto');
    const randomChars = crypto.randomBytes(3).toString('hex').toUpperCase();
    const code = `DOC-${randomChars}`;

    // Create DocumentAccessKey
    await prisma.documentAccessKey.create({
      data: {
        profileId: profile.id,
        code,
        recipientName: msg.name,
        expiresAt,
      },
    });

    // Update message status
    await (prisma.contactMessage as any).update({
      where: { id: messageId },
      data: {
        status: 'ACCEPTED',
        generatedKey: code,
        isRead: true,
      },
    });

    // Dispatch key to recruiter's email via Gateway 1 (Portfolio Message Forwarder)
    const subRecord = await prisma.subdomain.findFirst({ where: { userId: profile.userId } });
    const subdomain = subRecord?.slug || 'portfolio';

    await MailService.sendDocumentAccessKeyEmail({
      recruiterEmail: msg.email,
      recruiterName: msg.name,
      tenantName: profile.user.fullName,
      accessCode: code,
      validityHours,
      subdomain,
    });

    return { message: 'Access key generated and dispatched to recruiter email.', code, validityHours };
  }

  public static async declineKeyRequest(messageId: string, userId: string) {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundError('Profile not found.');

    const msg: any = await prisma.contactMessage.findFirst({
      where: { id: messageId, profileId: profile.id },
    });
    if (!msg) throw new NotFoundError('Message request not found.');

    await (prisma.contactMessage as any).update({
      where: { id: messageId },
      data: {
        status: 'DECLINED',
        isRead: true,
      },
    });

    return { message: 'Access request declined.' };
  }
}
