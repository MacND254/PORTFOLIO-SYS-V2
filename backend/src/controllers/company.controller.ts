import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { CompanyService } from '../services/company.service';
import { CandidateMatchService } from '../services/candidateMatch.service';
import { ValidationError } from '../utils/errors';

// ─── Schemas ────────────────────────────────────────────────────────────────

const createInviteSchema = z.object({
  email: z.string().optional(),
  emails: z.array(z.string()).optional(),
  companyName: z.string().optional(),
  expiresInDays: z.number().int().min(1).max(365).optional().default(30),
  sendEmail: z.boolean().optional().default(true),
}).refine((data) => Boolean(data.email?.trim() || (data.emails && data.emails.length > 0)), {
  message: 'At least one recipient company email address is required',
});

const registerCompanySchema = z.object({
  token: z.string().min(1, 'Invitation token is required'),
  email: z.string().email('A valid corporate work email is required'),
  fullName: z.string().min(2, 'Contact person full name is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  companyName: z.string().min(2, 'Company name is required'),
  website: z.string().url().optional().or(z.literal('')),
  industry: z.string().optional(),
  companySize: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  contactPerson: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
});

const createJobSchema = z.object({
  title: z.string().min(3, 'Job title is required'),
  department: z.string().optional(),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP']).optional(),
  workplaceType: z.enum(['REMOTE', 'HYBRID', 'ONSITE']).optional(),
  location: z.string().optional(),
  experienceLevel: z.string().optional(),
  salaryRange: z.string().optional(),
  description: z.string().min(20, 'A detailed job description is required'),
  requirements: z.string().optional(),
  skills: z.array(z.string()).optional(),
});

const updateJobSchema = createJobSchema.partial().extend({
  status: z.enum(['ACTIVE', 'PAUSED', 'CLOSED']).optional(),
});

// ─── Controller ─────────────────────────────────────────────────────────────

export class CompanyController {
  // ── Superadmin: Invite Management ─────────────────────────────────────────

  /**
   * POST /companies/invites — Create a new private invitation
   */
  public static async createInvite(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createInviteSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);

      const invite = await CompanyService.createInvite(req.user!.id, parsed.data);
      res.status(201).json({ success: true, data: invite, message: 'Invitation created successfully.' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /companies/invites — List all invitations
   */
  public static async listInvites(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, page, limit } = req.query;
      const result = await CompanyService.getInvites({
        status: status as string | undefined,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /companies/invites/:id/revoke — Revoke a pending invitation
   */
  public static async revokeInvite(req: Request, res: Response, next: NextFunction) {
    try {
      const invite = await CompanyService.revokeInvite(req.params.id, req.user?.id);
      res.json({ success: true, data: invite, message: 'Invitation revoked.' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /companies/invites/:id/reactivate — Reactivate a revoked invitation
   */
  public static async reactivateInvite(req: Request, res: Response, next: NextFunction) {
    try {
      const invite = await CompanyService.reactivateInvite(req.params.id, req.user?.id);
      res.json({ success: true, data: invite, message: 'Invitation reactivated successfully.' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /companies/invites/:id — Permanently delete an invitation
   */
  public static async deleteInvite(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CompanyService.deleteInvite(req.params.id, req.user?.id);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /companies/invites/:id/resend — Resend marketing email
   */
  public static async resendInviteEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CompanyService.resendInviteEmail(req.params.id);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /companies/all — Superadmin: List all registered companies
   */
  public static async listAllCompanies(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = req.query;
      const result = await CompanyService.listAllCompanies({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /companies/:id — Superadmin: Permanently delete a company
   */
  public static async deleteCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CompanyService.deleteCompany(req.params.id, req.user?.id);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /companies/:id/verify — Superadmin: Toggle or set company verification
   */
  public static async toggleVerifyCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const { isVerified } = req.body;
      const result = await CompanyService.toggleVerifyCompany(req.params.id, isVerified, req.user?.id);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /companies/:id/status — Superadmin: Update company account status
   */
  public static async updateCompanyStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.body;
      if (!['ACTIVE', 'SUSPENDED', 'DEACTIVATED'].includes(status)) {
        throw new ValidationError('Status must be ACTIVE, SUSPENDED, or DEACTIVATED');
      }
      const result = await CompanyService.updateCompanyStatus(req.params.id, status, req.user?.id);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  // ── Public: Onboarding ────────────────────────────────────────────────────

  /**
   * GET /companies/invite/validate?token=... — Validate invite token (public)
   */
  public static async validateToken(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.query.token as string;
      if (!token) throw new ValidationError('Token query parameter is required.');
      const result = await CompanyService.validateInviteToken(token);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /companies/register — Register company via invite (public)
   */
  public static async registerCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = registerCompanySchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);

      const result = await CompanyService.registerCompany(parsed.data as any);
      res.status(201).json({ success: true, data: result, message: 'Company registered successfully.' });
    } catch (err) {
      next(err);
    }
  }

  // ── Company: Profile ──────────────────────────────────────────────────────

  /**
   * GET /companies/profile — Get own company profile
   */
  public static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const company = await CompanyService.getCompanyProfile(req.user!.id);
      res.json({ success: true, data: company });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /companies/profile — Update own company profile
   */
  public static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const company = await CompanyService.updateCompanyProfile(req.user!.id, req.body);
      res.json({ success: true, data: company, message: 'Company profile updated.' });
    } catch (err) {
      next(err);
    }
  }

  // ── Company: Job Postings ──────────────────────────────────────────────────

  /**
   * POST /companies/jobs — Create a job posting
   */
  public static async createJob(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createJobSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);

      const job = await CompanyService.createJobPosting(req.user!.id, parsed.data as any);
      res.status(201).json({ success: true, data: job, message: 'Job posting created successfully.' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /companies/jobs — List all company jobs
   */
  public static async listJobs(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, page, limit } = req.query;
      const result = await CompanyService.getCompanyJobs(req.user!.id, {
        status: status as any,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /companies/jobs/:id — Get a single job posting
   */
  public static async getJob(req: Request, res: Response, next: NextFunction) {
    try {
      const job = await CompanyService.getJobById(req.user!.id, req.params.id);
      res.json({ success: true, data: job });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /companies/jobs/:id — Update a job posting
   */
  public static async updateJob(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = updateJobSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);

      const job = await CompanyService.updateJobPosting(req.user!.id, req.params.id, parsed.data as any);
      res.json({ success: true, data: job, message: 'Job posting updated.' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /companies/jobs/:id — Delete a job posting
   */
  public static async deleteJob(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CompanyService.deleteJobPosting(req.user!.id, req.params.id);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  // ── Candidate Matching ─────────────────────────────────────────────────────

  /**
   * GET /companies/jobs/:id/matches — Run AI candidate matching for a job
   */
  public static async getJobMatches(req: Request, res: Response, next: NextFunction) {
    try {
      // Verify the job belongs to this company
      await CompanyService.getJobById(req.user!.id, req.params.id);

      const { minScore, limit, search } = req.query;
      const result = await CandidateMatchService.matchCandidatesForJob(req.params.id, {
        minScore: minScore ? parseInt(minScore as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        search: search as string | undefined,
      });

      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
