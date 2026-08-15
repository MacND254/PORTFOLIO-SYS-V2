import { prisma } from '../database/client';
import { NotFoundError, ValidationError } from '../utils/errors';

export class ProfileService {
  public static async getProfileByUserId(userId: string) {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        experiences: { orderBy: { orderIndex: 'asc' } },
        educations: { orderBy: { orderIndex: 'asc' } },
        skills: { orderBy: { orderIndex: 'asc' } },
        certifications: { orderBy: { orderIndex: 'asc' } },
        awards: { orderBy: { orderIndex: 'asc' } },
        projects: { orderBy: { orderIndex: 'asc' } },
        publications: { orderBy: { orderIndex: 'asc' } },
        languages: { orderBy: { orderIndex: 'asc' } },
        services: { orderBy: { orderIndex: 'asc' } },
        references: { orderBy: { orderIndex: 'asc' } },
        memberships: { orderBy: { orderIndex: 'asc' } },
        customSections: { orderBy: { orderIndex: 'asc' } },
        customization: {
          include: { theme: true },
        },
        portfolioStatus: true,
        user: {
          select: {
            fullName: true,
            email: true,
            subdomains: { where: { isPrimary: true } },
          },
        },
      },
    });

    if (!profile) throw new NotFoundError('Profile not found.');

    const scoreDetails = this.calculateCompletenessScore(profile);

    // If score changed, update in DB
    if (profile.completenessScore !== scoreDetails.totalScore) {
      await prisma.profile.update({
        where: { id: profile.id },
        data: { completenessScore: scoreDetails.totalScore },
      });
      profile.completenessScore = scoreDetails.totalScore;
    }

    return {
      ...profile,
      completeness: scoreDetails,
    };
  }

  public static async updateProfile(userId: string, data: any) {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundError('Profile not found.');

    // Whitelist only valid Profile model columns so extras from generalState are ignored
    const allowedFields = [
      'title', 'headline', 'summary', 'careerObjective', 'bio',
      'phone', 'location', 'email', 'website', 'linkedin', 'github',
      'twitter', 'behance', 'dribbble', 'medium', 'youtube', 'instagram',
      'avatarUrl', 'coverUrl',
    ];
    const safeData: Record<string, any> = {};
    allowedFields.forEach((key) => {
      if (key in data) safeData[key] = data[key];
    });

    const updated = await prisma.profile.update({
      where: { id: profile.id },
      data: safeData,
    });

    // Recalculate score
    const fullProfile = await this.getProfileByUserId(userId);
    return fullProfile;
  }

  // --- CRUD HELPERS FOR SECTIONS ---
  public static async addExperience(userId: string, data: any) {
    const profile = await this.getProfileRef(userId);
    return prisma.experience.create({ data: { ...data, profileId: profile.id } });
  }

  public static async updateExperience(id: string, userId: string, data: any) {
    const profile = await this.getProfileRef(userId);
    return prisma.experience.updateMany({ where: { id, profileId: profile.id }, data });
  }

  public static async deleteExperience(id: string, userId: string) {
    const profile = await this.getProfileRef(userId);
    return prisma.experience.deleteMany({ where: { id, profileId: profile.id } });
  }

  public static async addEducation(userId: string, data: any) {
    const profile = await this.getProfileRef(userId);
    return prisma.education.create({ data: { ...data, profileId: profile.id } });
  }

  public static async updateEducation(id: string, userId: string, data: any) {
    const profile = await this.getProfileRef(userId);
    return prisma.education.updateMany({ where: { id, profileId: profile.id }, data });
  }

  public static async deleteEducation(id: string, userId: string) {
    const profile = await this.getProfileRef(userId);
    return prisma.education.deleteMany({ where: { id, profileId: profile.id } });
  }

  public static async addSkill(userId: string, data: any) {
    const profile = await this.getProfileRef(userId);
    return prisma.skill.create({ data: { ...data, profileId: profile.id } });
  }

  public static async updateSkill(id: string, userId: string, data: any) {
    const profile = await this.getProfileRef(userId);
    return prisma.skill.updateMany({ where: { id, profileId: profile.id }, data });
  }

  public static async deleteSkill(id: string, userId: string) {
    const profile = await this.getProfileRef(userId);
    return prisma.skill.deleteMany({ where: { id, profileId: profile.id } });
  }

  public static async addProject(userId: string, data: any) {
    const profile = await this.getProfileRef(userId);
    return prisma.project.create({ data: { ...data, profileId: profile.id } });
  }

  public static async updateProject(id: string, userId: string, data: any) {
    const profile = await this.getProfileRef(userId);
    return prisma.project.updateMany({ where: { id, profileId: profile.id }, data });
  }

  public static async deleteProject(id: string, userId: string) {
    const profile = await this.getProfileRef(userId);
    return prisma.project.deleteMany({ where: { id, profileId: profile.id } });
  }

  public static async addCertification(userId: string, data: any) {
    const profile = await this.getProfileRef(userId);
    return prisma.certification.create({ data: { ...data, profileId: profile.id } });
  }

  public static async updateCertification(id: string, userId: string, data: any) {
    const profile = await this.getProfileRef(userId);
    return prisma.certification.updateMany({ where: { id, profileId: profile.id }, data });
  }

  public static async deleteCertification(id: string, userId: string) {
    const profile = await this.getProfileRef(userId);
    return prisma.certification.deleteMany({ where: { id, profileId: profile.id } });
  }

  private static async getProfileRef(userId: string) {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundError('Profile not found.');
    return profile;
  }

  public static calculateCompletenessScore(profile: any) {
    const breakdown = {
      profileInfo: 0,
      experience: 0,
      education: 0,
      skills: 0,
      projects: 0,
      extras: 0,
    };
    const recommendations: string[] = [];

    // Profile Info (max 20)
    if (profile.title) breakdown.profileInfo += 5;
    if (profile.summary || profile.bio) breakdown.profileInfo += 5;
    if (profile.location) breakdown.profileInfo += 5;
    if (profile.avatarUrl) breakdown.profileInfo += 5;
    else recommendations.push('Add a professional profile photo');

    // Experience (max 20)
    if (profile.experiences && profile.experiences.length > 0) {
      breakdown.experience = Math.min(20, profile.experiences.length * 10);
    } else {
      recommendations.push('Add at least one work experience item');
    }

    // Education (max 15)
    if (profile.educations && profile.educations.length > 0) {
      breakdown.education = 15;
    } else {
      recommendations.push('Add your educational background');
    }

    // Skills (max 15)
    if (profile.skills && profile.skills.length >= 3) {
      breakdown.skills = 15;
    } else if (profile.skills && profile.skills.length > 0) {
      breakdown.skills = 8;
      recommendations.push('Add at least 3 skills to highlight your expertise');
    } else {
      recommendations.push('Add skills to your profile');
    }

    // Projects (max 15)
    if (profile.projects && profile.projects.length >= 1) {
      breakdown.projects = 15;
    } else {
      recommendations.push('Add at least one project showcase');
    }

    // Extras (LinkedIn, GitHub, Certifications, Services) (max 15)
    if (profile.linkedin || profile.github) breakdown.extras += 5;
    else recommendations.push('Link your LinkedIn or GitHub profile');

    if (profile.certifications && profile.certifications.length > 0) breakdown.extras += 5;
    if (profile.services && profile.services.length > 0) breakdown.extras += 5;

    const totalScore =
      breakdown.profileInfo +
      breakdown.experience +
      breakdown.education +
      breakdown.skills +
      breakdown.projects +
      breakdown.extras;

    return {
      totalScore,
      breakdown,
      recommendations,
    };
  }
}
