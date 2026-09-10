import crypto from 'crypto';
import { prisma } from '../database/client';
import { MailService } from './mail.service';
import { NotificationService } from './notification.service';
import { AuditService } from './audit.service';
import { config } from '../config/env';
import { NotFoundError, ValidationError } from '../utils/errors';
import { JobStatus, EmploymentType, WorkplaceType } from '@prisma/client';

export interface CreateInviteInput {
  companyName?: string;
  email?: string;
  emails?: string[];
  expiresInDays?: number;
  sendEmail?: boolean;
}

export interface RegisterCompanyInput {
  token: string;
  email: string;
  fullName: string;
  password: string;
  companyName: string;
  website?: string;
  logoUrl?: string;
  industry?: string;
  companySize?: string;
  location?: string;
  description?: string;
  contactPerson?: string;
  contactEmail?: string;
}

export interface CreateJobInput {
  title: string;
  department?: string;
  employmentType?: EmploymentType;
  workplaceType?: WorkplaceType;
  location?: string;
  experienceLevel?: string;
  salaryRange?: string;
  description: string;
  requirements?: string;
  skills?: string[];
}

export function parseEmailList(raw?: string | string[]): string[] {
  if (!raw) return [];
  let list: string[] = [];
  if (Array.isArray(raw)) {
    list = raw;
  } else if (typeof raw === 'string') {
    list = raw.split(/[\s,;]+/).map((e) => e.trim()).filter(Boolean);
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return Array.from(
    new Set(list.map((e) => e.toLowerCase()).filter((e) => emailRegex.test(e)))
  );
}

export class CompanyService {
  /**
   * Superadmin: Create a private invitation link for one or multiple companies
   */
  public static async createInvite(
    superAdminId: string,
    input: CreateInviteInput
  ) {
    const { companyName, expiresInDays = 30, sendEmail = true } = input;
    const recipientEmails = parseEmailList(input.emails || input.email);

    if (recipientEmails.length === 0) {
      throw new ValidationError(
        'Please provide at least one valid recipient company email address.'
      );
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const invite = await (prisma as any).companyInvite.create({
      data: {
        token,
        companyName: companyName?.trim() || null,
        email: recipientEmails.join(', '),
        status: 'PENDING',
        invitedById: superAdminId,
        expiresAt,
        usageCount: 0,
      },
    });

    if (sendEmail && recipientEmails.length > 0) {
      const inviteUrl = `${config.frontendUrl}/register/company?token=${token}`;
      // Fire-and-forget marketing emails to all recipients concurrently
      Promise.allSettled(
        recipientEmails.map((email) =>
          MailService.sendCompanyMarketingInvitationEmail({
            email,
            companyName: companyName?.trim() || undefined,
            inviteUrl,
            expiresAt,
          })
        )
      ).catch(() => {/* ignore background email dispatch errors */});
    }

    return invite;
  }

  /**
   * Superadmin: List all invitations with optional filters
   */
  public static async getInvites(options: {
    status?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const { status, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;
    const now = new Date();

    const where: any = {};
    if (status === 'REVOKED') {
      where.status = 'REVOKED';
    } else if (status === 'EXPIRED') {
      where.OR = [
        { status: 'EXPIRED' },
        { expiresAt: { lt: now }, status: { not: 'REVOKED' } },
      ];
    } else if (status === 'ACCEPTED') {
      where.OR = [
        { status: 'ACCEPTED' },
        { usageCount: { gt: 0 } },
      ];
      where.status = { not: 'REVOKED' };
    } else if (status === 'PENDING') {
      where.status = 'PENDING';
      where.usageCount = 0;
      where.expiresAt = { gte: now };
    }

    const [invites, total] = await Promise.all([
      (prisma as any).companyInvite.findMany({
        where,
        include: {
          invitedBy: { select: { id: true, fullName: true, email: true } },
          companies: {
            select: {
              id: true,
              name: true,
              industry: true,
              _count: { select: { jobs: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      (prisma as any).companyInvite.count({ where }),
    ]);

    const computedInvites = invites.map((invite: any) => {
      let realStatus = invite.status;
      const isExpired = new Date(invite.expiresAt) < now;
      if (invite.status === 'REVOKED') {
        realStatus = 'REVOKED';
      } else if (isExpired) {
        realStatus = 'EXPIRED';
      } else if ((invite.usageCount && invite.usageCount > 0) || (invite.companies && invite.companies.length > 0)) {
        realStatus = 'ACCEPTED';
      } else {
        realStatus = 'PENDING';
      }
      return {
        ...invite,
        status: realStatus,
        isExpired,
      };
    });

    return { invites: computedInvites, total, page, limit };
  }

  /**
   * Superadmin: Revoke / Deactivate an invitation link
   */
  public static async revokeInvite(inviteId: string, adminUserId?: string) {
    const invite = await (prisma as any).companyInvite.findUnique({
      where: { id: inviteId },
    });

    if (!invite) throw new NotFoundError('Invitation not found.');
    if (invite.status === 'REVOKED') {
      throw new ValidationError('This invitation is already revoked / deactivated.');
    }

    const updated = await (prisma as any).companyInvite.update({
      where: { id: inviteId },
      data: { status: 'REVOKED' },
    });

    if (adminUserId) {
      await AuditService.log({
        userId: adminUserId,
        action: 'COMPANY_INVITE_REVOKED',
        target: invite.companyName || invite.email,
        metadata: { inviteId, token: invite.token },
      });
    }

    return updated;
  }

  /**
   * Superadmin: Reactivate a revoked / deactivated invitation link
   */
  public static async reactivateInvite(inviteId: string, adminUserId?: string) {
    const invite = await (prisma as any).companyInvite.findUnique({
      where: { id: inviteId },
    });

    if (!invite) throw new NotFoundError('Invitation not found.');

    const isExpired = new Date(invite.expiresAt) < new Date();
    const newExpiresAt = isExpired
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      : invite.expiresAt;
    const newStatus = (invite.usageCount > 0) ? 'ACCEPTED' : 'PENDING';

    const updated = await (prisma as any).companyInvite.update({
      where: { id: inviteId },
      data: {
        status: newStatus,
        expiresAt: newExpiresAt,
      },
    });

    if (adminUserId) {
      await AuditService.log({
        userId: adminUserId,
        action: 'COMPANY_INVITE_REACTIVATED',
        target: invite.companyName || invite.email,
        metadata: { inviteId, token: invite.token },
      });
    }

    return updated;
  }

  /**
   * Superadmin: Permanently delete an invitation
   */
  public static async deleteInvite(inviteId: string, adminUserId?: string) {
    const invite = await (prisma as any).companyInvite.findUnique({
      where: { id: inviteId },
    });

    if (!invite) throw new NotFoundError('Invitation not found.');

    await (prisma as any).companyInvite.delete({
      where: { id: inviteId },
    });

    if (adminUserId) {
      await AuditService.log({
        userId: adminUserId,
        action: 'COMPANY_INVITE_DELETED',
        target: invite.companyName || invite.email,
        metadata: { inviteId, token: invite.token },
      });
    }

    return { message: 'Invitation deleted successfully.' };
  }

  /**
   * Superadmin: Resend marketing email to all recipients in an invite campaign
   */
  public static async resendInviteEmail(inviteId: string) {
    const invite = await (prisma as any).companyInvite.findUnique({
      where: { id: inviteId },
    });
    if (!invite) throw new NotFoundError('Invitation not found.');
    if (invite.status === 'REVOKED') {
      throw new ValidationError('Cannot resend email for a REVOKED invitation.');
    }
    if (invite.expiresAt < new Date()) {
      throw new ValidationError('This invitation has expired. Create a new invite.');
    }

    const recipientEmails = parseEmailList(invite.email);
    if (recipientEmails.length === 0) {
      throw new ValidationError('No valid recipient emails found for this invitation.');
    }

    const inviteUrl = `${config.frontendUrl}/register/company?token=${invite.token}`;
    await Promise.allSettled(
      recipientEmails.map((email) =>
        MailService.sendCompanyMarketingInvitationEmail({
          email,
          companyName: invite.companyName || undefined,
          inviteUrl,
          expiresAt: invite.expiresAt,
        })
      )
    );

    return { message: `Marketing email resent to ${recipientEmails.length} recipient(s).` };
  }

  /**
   * Public: Validate invite token (used on company registration page)
   */
  public static async validateInviteToken(token: string) {
    const invite = await (prisma as any).companyInvite.findUnique({
      where: { token },
    });

    if (!invite) {
      throw new ValidationError('Invalid or unrecognized invitation token.');
    }
    if (invite.status === 'REVOKED') {
      throw new ValidationError('This invitation link has been revoked by the administrator.');
    }
    if (invite.status === 'EXPIRED' || invite.expiresAt < new Date()) {
      if (invite.status !== 'EXPIRED') {
        await (prisma as any).companyInvite.update({
          where: { id: invite.id },
          data: { status: 'EXPIRED' },
        });
      }
      throw new ValidationError('This invitation has expired. Please contact support for a new link.');
    }

    return {
      valid: true,
      companyName: invite.companyName || null,
      expiresAt: invite.expiresAt,
      usageCount: invite.usageCount || 0,
    };
  }

  /**
   * Public: Register a company using a valid invite token
   */
  public static async registerCompany(input: RegisterCompanyInput) {
    const { token, email, fullName, password, companyName, ...companyData } = input;

    if (!email) {
      throw new ValidationError('Corporate email is required for registration.');
    }
    const normalizedEmail = email.toLowerCase().trim();

    // Validate token is active and unexpired
    await this.validateInviteToken(token);

    const invite = await (prisma as any).companyInvite.findUnique({
      where: { token },
    });

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      throw new ValidationError('An account with this email already exists. Please login instead.');
    }

    // Hash password
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user + company profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          fullName,
          password: hashedPassword,
          role: 'COMPANY' as any,
          status: 'ACTIVE',
        },
      });

      const company = await (tx as any).company.create({
        data: {
          userId: user.id,
          inviteId: invite.id,
          name: companyName,
          ...companyData,
        },
      });

      // Increment usage count, update acceptedAt, and set status to ACCEPTED without revoking the token
      await (tx as any).companyInvite.update({
        where: { id: invite.id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
          usageCount: { increment: 1 },
        },
      });

      return { user, company };
    });

    // Issue JWT
    const jwt = await import('jsonwebtoken');
    const config = await import('../config/env');
    const accessToken = (jwt as any).default.sign(
      { id: result.user.id, email: result.user.email, role: result.user.role },
      config.config.jwtSecret,
      { expiresIn: '7d' }
    );

    const responsePayload = {
      user: {
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName,
        role: result.user.role,
      },
      company: result.company,
      accessToken,
    };

    // Send welcome notification and alert SuperAdmins
    await NotificationService.create({
      userId: result.user.id,
      title: 'Welcome to the Employer Partner Portal!',
      message: 'Post jobs, review matched talent, and connect with vetted candidates directly.',
      type: 'SUCCESS',
      link: '/company/dashboard',
    });

    await NotificationService.notifySuperAdmins({
      title: 'New Company Partner Registered',
      message: `${companyName} (${fullName} - ${normalizedEmail}) joined as an employer partner`,
      type: 'SUCCESS',
      link: '/superadmin/companies',
    });

    return responsePayload;
  }

  /**
   * Company: Get own company profile
   */
  public static async getCompanyProfile(userId: string) {
    const company = await (prisma as any).company.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, email: true, fullName: true, status: true } },
        _count: { select: { jobs: true } },
      },
    });

    if (!company) throw new NotFoundError('Company profile not found.');
    return company;
  }

  /**
   * Company: Update own company profile
   */
  public static async updateCompanyProfile(userId: string, data: Partial<{
    name: string;
    website: string;
    logoUrl: string;
    industry: string;
    companySize: string;
    location: string;
    description: string;
    contactPerson: string;
    contactEmail: string;
  }>) {
    const company = await (prisma as any).company.findUnique({ where: { userId } });
    if (!company) throw new NotFoundError('Company profile not found.');

    return (prisma as any).company.update({
      where: { userId },
      data,
    });
  }

  /**
   * Company: Create a job posting
   */
  public static async createJobPosting(userId: string, data: CreateJobInput) {
    const company = await (prisma as any).company.findUnique({ where: { userId } });
    if (!company) throw new NotFoundError('Company profile not found. Complete your company registration first.');

    if (!data.title || !data.description) {
      throw new ValidationError('Job title and description are required.');
    }

    return (prisma as any).jobPosting.create({
      data: {
        companyId: company.id,
        title: data.title,
        department: data.department || null,
        employmentType: data.employmentType || 'FULL_TIME',
        workplaceType: data.workplaceType || 'REMOTE',
        location: data.location || null,
        experienceLevel: data.experienceLevel || null,
        salaryRange: data.salaryRange || null,
        description: data.description,
        requirements: data.requirements || null,
        skills: data.skills || [],
        status: 'ACTIVE',
      },
    });
  }

  /**
   * Company: Get all job postings for the company
   */
  public static async getCompanyJobs(
    userId: string,
    options: { status?: JobStatus; page?: number; limit?: number } = {}
  ) {
    const company = await (prisma as any).company.findUnique({ where: { userId } });
    if (!company) throw new NotFoundError('Company profile not found.');

    const { status, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;
    const where: any = { companyId: company.id };
    if (status) where.status = status;

    const [jobs, total] = await Promise.all([
      (prisma as any).jobPosting.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      (prisma as any).jobPosting.count({ where }),
    ]);

    return { jobs, total, page, limit };
  }

  /**
   * Company: Get a single job posting
   */
  public static async getJobById(userId: string, jobId: string) {
    const company = await (prisma as any).company.findUnique({ where: { userId } });
    if (!company) throw new NotFoundError('Company profile not found.');

    const job = await (prisma as any).jobPosting.findFirst({
      where: { id: jobId, companyId: company.id },
    });
    if (!job) throw new NotFoundError('Job posting not found.');
    return job;
  }

  /**
   * Company: Update a job posting
   */
  public static async updateJobPosting(
    userId: string,
    jobId: string,
    data: Partial<CreateJobInput & { status: JobStatus }>
  ) {
    const company = await (prisma as any).company.findUnique({ where: { userId } });
    if (!company) throw new NotFoundError('Company profile not found.');

    const job = await (prisma as any).jobPosting.findFirst({
      where: { id: jobId, companyId: company.id },
    });
    if (!job) throw new NotFoundError('Job posting not found or access denied.');

    return (prisma as any).jobPosting.update({ where: { id: jobId }, data });
  }

  /**
   * Company: Delete a job posting
   */
  public static async deleteJobPosting(userId: string, jobId: string) {
    const company = await (prisma as any).company.findUnique({ where: { userId } });
    if (!company) throw new NotFoundError('Company profile not found.');

    const job = await (prisma as any).jobPosting.findFirst({
      where: { id: jobId, companyId: company.id },
    });
    if (!job) throw new NotFoundError('Job posting not found or access denied.');

    await (prisma as any).jobPosting.delete({ where: { id: jobId } });
    return { message: 'Job posting deleted successfully.' };
  }

  /**
   * Superadmin: List all registered companies
   */
  public static async listAllCompanies(options: { page?: number; limit?: number } = {}) {
    const { page = 1, limit = 50 } = options;
    const skip = (page - 1) * limit;

    const [companies, total] = await Promise.all([
      (prisma as any).company.findMany({
        include: {
          user: { select: { id: true, email: true, fullName: true, status: true, emailVerified: true } },
          invite: { select: { id: true, companyName: true, token: true, status: true } },
          _count: { select: { jobs: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      (prisma as any).company.count(),
    ]);

    return { companies, total, page, limit };
  }

  /**
   * Superadmin: Permanently delete a company, its jobs, and associated user account
   */
  public static async deleteCompany(companyId: string, adminUserId?: string) {
    const company = await (prisma as any).company.findUnique({
      where: { id: companyId },
      include: { user: true },
    });

    if (!company) throw new NotFoundError('Company not found.');

    const companyName = company.name;
    const userId = company.userId;

    // Delete associated jobs first
    await (prisma as any).jobPosting.deleteMany({
      where: { companyId },
    });

    // Delete company profile
    await (prisma as any).company.delete({
      where: { id: companyId },
    });

    // Delete associated user account if it exists
    if (userId) {
      await (prisma as any).user.delete({
        where: { id: userId },
      }).catch(() => {});
    }

    if (adminUserId) {
      await AuditService.log({
        userId: adminUserId,
        action: 'COMPANY_DELETED',
        target: companyName,
        metadata: { companyId, userId },
      });
    }

    return { message: `Company "${companyName}" and its associated account were deleted successfully.` };
  }

  /**
   * Superadmin: Toggle or set company verification status
   */
  public static async toggleVerifyCompany(companyId: string, isVerified?: boolean, adminUserId?: string) {
    const company = await (prisma as any).company.findUnique({
      where: { id: companyId },
      include: { user: true },
    });

    if (!company) throw new NotFoundError('Company not found.');

    const currentVerified = company.user?.emailVerified ?? false;
    const targetVerified = typeof isVerified === 'boolean' ? isVerified : !currentVerified;

    await (prisma as any).user.update({
      where: { id: company.userId },
      data: { emailVerified: targetVerified },
    });

    if (adminUserId) {
      await AuditService.log({
        userId: adminUserId,
        action: targetVerified ? 'COMPANY_VERIFIED' : 'COMPANY_UNVERIFIED',
        target: company.name,
        metadata: { companyId, isVerified: targetVerified },
      });
    }

    return {
      companyId,
      isVerified: targetVerified,
      message: targetVerified ? `"${company.name}" verified successfully.` : `"${company.name}" verification removed.`,
    };
  }

  /**
   * Superadmin: Update company account status (ACTIVE, SUSPENDED, DEACTIVATED)
   */
  public static async updateCompanyStatus(companyId: string, status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED', adminUserId?: string) {
    const company = await (prisma as any).company.findUnique({
      where: { id: companyId },
      include: { user: true },
    });

    if (!company) throw new NotFoundError('Company not found.');

    const updatedUser = await (prisma as any).user.update({
      where: { id: company.userId },
      data: { status },
    });

    if (adminUserId) {
      await AuditService.log({
        userId: adminUserId,
        action: `COMPANY_STATUS_${status}`,
        target: company.name,
        metadata: { companyId, status },
      });
    }

    return {
      companyId,
      status: updatedUser.status,
      message: `Company account status changed to ${status}.`,
    };
  }
}
