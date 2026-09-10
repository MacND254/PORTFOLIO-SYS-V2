import { prisma } from '../database/client';
import { NotFoundError } from '../utils/errors';

export interface MatchedCandidate {
  profileId: string;
  userId: string;
  fullName: string;
  title: string;
  headline?: string;
  summary?: string;
  avatarUrl?: string;
  location?: string;
  subdomain?: string;
  portfolioUrl?: string;
  matchScore: number; // 0 - 100
  scoreBreakdown: {
    skillsScore: number;      // max 40
    roleTitleScore: number;   // max 25
    experienceScore: number;  // max 25
    verificationScore: number;// max 10
  };
  matchedSkills: string[];
  missingSkills: string[];
  candidateSkills: string[];
  experienceHighlights: string[];
  hasVerifiedDocs: boolean;
  completenessScore: number;
  employmentStatus?: string;
  employmentStatusCustom?: string;
  showEmploymentBadge?: boolean;
}

export class CandidateMatchService {
  /**
   * Matches published candidate portfolios against a specific job posting
   */
  public static async matchCandidatesForJob(
    jobId: string,
    options: {
      minScore?: number;
      limit?: number;
      search?: string;
    } = {}
  ): Promise<{
    job: any;
    matches: MatchedCandidate[];
    totalCandidatesEvaluated: number;
  }> {
    const job = await (prisma as any).jobPosting.findUnique({
      where: { id: jobId },
      include: {
        company: {
          select: { id: true, name: true, logoUrl: true, location: true },
        },
      },
    });

    if (!job) {
      throw new NotFoundError('Job posting not found.');
    }

    const minScore = Math.max(0, Math.min(100, options.minScore || 20));
    const limit = Math.min(100, Math.max(1, options.limit || 50));

    // Fetch all active, published candidate profiles
    const profiles = await prisma.profile.findMany({
      where: {
        user: { status: 'ACTIVE' },
        portfolioStatus: {
          isPublished: true,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            desiredProfession: true,
            subdomains: {
              where: { isPrimary: true },
              select: { slug: true },
            },
          },
        },
        skills: true,
        experiences: {
          orderBy: { startDate: 'desc' },
          take: 5,
        },
        projects: {
          orderBy: { orderIndex: 'asc' },
          take: 5,
        },
        certifications: true,
        verifiedDocuments: {
          select: { id: true, isVerified: true },
        },
      },
    });

    const evaluatedMatches: MatchedCandidate[] = [];

    // Parse job tokens
    const jobSkills = (job.skills || []).map((s: string) => s.trim().toLowerCase()).filter(Boolean);
    const jobTitleTokens = this.tokenize(job.title + ' ' + (job.department || ''));
    const jobDescTokens = this.tokenize(
      (job.description || '') + ' ' + (job.requirements || '')
    );

    for (const profile of profiles) {
      const user = profile.user;
      if (!user) continue;

      const subdomain = user.subdomains?.[0]?.slug;

      // 1. Skill Matching (Weight 40 points)
      const candSkills = (profile.skills || []).map((s: any) => ({
        name: s.name,
        lower: s.name.toLowerCase().trim(),
        proficiency: s.proficiency || 80,
      }));

      const candSkillNames = candSkills.map((s) => s.lower);
      const matchedSkillsSet = new Set<string>();
      const missingSkills: string[] = [];

      let skillPoints = 0;
      if (jobSkills.length > 0) {
        jobSkills.forEach((reqSkill: string) => {
          const matched = candSkills.find(
            (cs) => cs.lower === reqSkill || cs.lower.includes(reqSkill) || reqSkill.includes(cs.lower)
          );
          if (matched) {
            matchedSkillsSet.add(matched.name);
            const profBonus = (matched.proficiency / 100) * 1.0;
            skillPoints += profBonus;
          } else {
            missingSkills.push(reqSkill);
          }
        });

        const skillFraction = skillPoints / jobSkills.length;
        skillPoints = Math.round(skillFraction * 40);
      } else {
        // If job has no explicit skill tags, check candidate skills against description
        let matchedCount = 0;
        candSkills.forEach((cs) => {
          if (jobDescTokens.has(cs.lower)) {
            matchedSkillsSet.add(cs.name);
            matchedCount++;
          }
        });
        skillPoints = Math.min(40, matchedCount * 8);
      }

      // 2. Role & Title Matching (Weight 25 points)
      const candTitleTokens = this.tokenize(
        (profile.title || '') +
          ' ' +
          (profile.headline || '') +
          ' ' +
          (user.desiredProfession || '')
      );

      let titleMatches = 0;
      jobTitleTokens.forEach((token) => {
        if (candTitleTokens.has(token)) titleMatches++;
      });

      const titleFraction = jobTitleTokens.size > 0 ? titleMatches / jobTitleTokens.size : 0.5;
      const roleTitleScore = Math.min(25, Math.round(titleFraction * 25));

      // 3. Experience & Project Relevance (Weight 25 points)
      let experienceHits = 0;
      const highlights: string[] = [];

      profile.experiences.forEach((exp: any) => {
        const expText = `${exp.position} ${exp.company} ${exp.description || ''} ${(exp.responsibilities || []).join(' ')}`;
        const expTokens = this.tokenize(expText);
        let hits = 0;
        jobTitleTokens.forEach((t) => { if (expTokens.has(t)) hits += 2; });
        jobSkills.forEach((s: string) => { if (expTokens.has(s)) hits += 1.5; });

        if (hits > 0) {
          experienceHits += hits;
          if (highlights.length < 2) {
            highlights.push(`${exp.position} at ${exp.company}`);
          }
        }
      });

      profile.projects.forEach((proj: any) => {
        const projText = `${proj.title} ${proj.description || ''} ${(proj.technologies || []).join(' ')}`;
        const projTokens = this.tokenize(projText);
        jobSkills.forEach((s: string) => { if (projTokens.has(s)) experienceHits += 1; });
      });

      const experienceScore = Math.min(25, Math.round(Math.min(experienceHits, 15) * (25 / 15)));

      // 4. Verification & Completeness (Weight 10 points)
      const completenessBonus = Math.round(((profile.completenessScore || 50) / 100) * 6);
      const verifiedDocsCount = (profile.verifiedDocuments || []).filter((d: any) => d.isVerified).length;
      const certsCount = profile.certifications.length;
      const verifiedBonus = Math.min(4, verifiedDocsCount * 2 + (certsCount > 0 ? 2 : 0));
      const verificationScore = completenessBonus + verifiedBonus;

      // Composite Match Score
      const matchScore = Math.min(
        100,
        Math.max(5, skillPoints + roleTitleScore + experienceScore + verificationScore)
      );

      if (matchScore >= minScore) {
        evaluatedMatches.push({
          profileId: profile.id,
          userId: user.id,
          fullName: user.fullName,
          title: profile.title || user.desiredProfession || 'Software Professional',
          headline: profile.headline || undefined,
          summary: profile.summary || undefined,
          avatarUrl: profile.avatarUrl || undefined,
          location: profile.location || undefined,
          subdomain,
          portfolioUrl: subdomain ? `http://${subdomain}.myportfolio.com:5000` : undefined,
          matchScore,
          scoreBreakdown: {
            skillsScore: skillPoints,
            roleTitleScore,
            experienceScore,
            verificationScore,
          },
          matchedSkills: Array.from(matchedSkillsSet),
          missingSkills: missingSkills.slice(0, 5),
          candidateSkills: candSkills.map((s) => s.name).slice(0, 10),
          experienceHighlights: highlights,
          hasVerifiedDocs: verifiedDocsCount > 0,
          completenessScore: profile.completenessScore,
          employmentStatus: profile.employmentStatus || 'OPEN_TO_WORK',
          employmentStatusCustom: profile.employmentStatusCustom || undefined,
          showEmploymentBadge: profile.showEmploymentBadge ?? true,
        });
      }
    }

    // Sort descending by match score
    evaluatedMatches.sort((a, b) => b.matchScore - a.matchScore);

    let finalMatches = evaluatedMatches;
    if (options.search && options.search.trim()) {
      const q = options.search.trim().toLowerCase();
      finalMatches = finalMatches.filter(
        (m) =>
          m.fullName.toLowerCase().includes(q) ||
          m.title.toLowerCase().includes(q) ||
          m.matchedSkills.some((s) => s.toLowerCase().includes(q))
      );
    }

    return {
      job: {
        id: job.id,
        title: job.title,
        department: job.department,
        employmentType: job.employmentType,
        workplaceType: job.workplaceType,
        location: job.location,
        skills: job.skills,
        companyName: job.company?.name,
      },
      matches: finalMatches.slice(0, limit),
      totalCandidatesEvaluated: profiles.length,
    };
  }

  /**
   * Helper to normalize text into meaningful keyword tokens
   */
  private static tokenize(text: string): Set<string> {
    const stopWords = new Set([
      'and', 'the', 'is', 'in', 'at', 'of', 'for', 'with', 'to', 'a', 'an',
      'as', 'by', 'on', 'or', 'we', 'are', 'you', 'will', 'our', 'be', 'this',
      'that', 'from', 'have', 'has', 'work', 'working', 'job', 'team',
    ]);

    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9+#.-]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 1 && !stopWords.has(w));

    return new Set(words);
  }
}
