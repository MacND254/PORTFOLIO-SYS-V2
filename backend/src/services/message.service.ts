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
}
