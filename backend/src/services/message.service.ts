import { prisma } from '../database/client';
import { NotFoundError, ValidationError } from '../utils/errors';
import { NotificationService } from './notification.service';
import { AuditService } from './audit.service';

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
    if (data.honeypot) {
      // Spam honeypot triggered - return fake success silently
      return { success: true, message: 'Message received.' };
    }

    const subRecord = await prisma.subdomain.findUnique({
      where: { slug: subdomain },
      include: {
        user: {
          select: {
            id: true,
            profile: { select: { id: true } },
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
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
        ipAddress: reqMeta?.ipAddress,
        userAgent: reqMeta?.userAgent,
      },
    });

    await NotificationService.create({
      userId: subRecord.user.id,
      title: 'New Contact Message Received!',
      message: `Message from ${data.name}: "${data.subject}"`,
      type: 'INFO',
      link: '/admin/messages',
    });

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
