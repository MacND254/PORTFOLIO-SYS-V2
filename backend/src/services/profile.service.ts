import { prisma } from '../database/client';
import { NotFoundError, ValidationError } from '../utils/errors';
import { MailService } from './mail.service';

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
        verifiedDocuments: { orderBy: { orderIndex: 'asc' } },
        documentAccessKeys: { orderBy: { createdAt: 'desc' } },
        customization: true,
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
    let profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) {
      profile = await prisma.profile.create({
        data: { userId, title: 'Professional' },
      });
    }

    // Whitelist only valid Profile model columns so extras from generalState are ignored
    const allowedFields = [
      'title', 'headline', 'summary', 'careerObjective', 'bio', 'contactEmail',
      'phone', 'location', 'address', 'website', 'linkedin', 'github',
      'twitter', 'behance', 'dribbble', 'facebook', 'instagram', 'youtube',
      'avatarUrl', 'coverUrl', 'logoUrl',
      'isPublicEmail', 'isPublicPhone', 'isPublicLocation', 'isPublicAddress', 'isPublicSocial',
      'employmentStatus', 'employmentStatusCustom', 'showEmploymentBadge',
      'yearsOfExperience',
    ];
    const safeData: Record<string, any> = {};
    if (data.experiencePeriod !== undefined && data.yearsOfExperience === undefined) {
      safeData.yearsOfExperience = data.experiencePeriod;
    }
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

  public static async resetProfile(userId: string) {
    const profile = await this.getProfileRef(userId);

    await prisma.$transaction([
      prisma.experience.deleteMany({ where: { profileId: profile.id } }),
      prisma.education.deleteMany({ where: { profileId: profile.id } }),
      prisma.skill.deleteMany({ where: { profileId: profile.id } }),
      prisma.certification.deleteMany({ where: { profileId: profile.id } }),
      prisma.award.deleteMany({ where: { profileId: profile.id } }),
      prisma.project.deleteMany({ where: { profileId: profile.id } }),
      prisma.publication.deleteMany({ where: { profileId: profile.id } }),
      prisma.language.deleteMany({ where: { profileId: profile.id } }),
      prisma.service.deleteMany({ where: { profileId: profile.id } }),
      prisma.reference.deleteMany({ where: { profileId: profile.id } }),
      prisma.membership.deleteMany({ where: { profileId: profile.id } }),
      prisma.customSection.deleteMany({ where: { profileId: profile.id } }),
      prisma.profile.update({
        where: { id: profile.id },
        data: {
          title: '',
          headline: '',
          summary: '',
          careerObjective: '',
          bio: '',
          contactEmail: '',
          phone: '',
          location: '',
          address: '',
          website: '',
          linkedin: '',
          github: '',
          twitter: '',
          behance: '',
          dribbble: '',
          facebook: '',
          instagram: '',
          youtube: '',
          avatarUrl: null,
          coverUrl: null,
          logoUrl: null,
          completenessScore: 0,
        },
      }),
    ]);

    return this.getProfileByUserId(userId);
  }

  // --- CRUD HELPERS FOR SECTIONS ---
  public static async addExperience(userId: string, data: any) {
    const profile = await this.getProfileRef(userId);
    const cleanData: any = {
      profileId: profile.id,
      company: data.company,
      position: data.position,
      location: data.location || null,
      startDate: data.startDate,
      endDate: data.isCurrent ? null : (data.endDate || null),
      isCurrent: Boolean(data.isCurrent),
      description: data.description || null,
      responsibilities: Array.isArray(data.responsibilities) ? data.responsibilities : [],
      achievements: Array.isArray(data.achievements) ? data.achievements : [],
      orderIndex: typeof data.orderIndex === 'number' ? data.orderIndex : 0,
    };
    const created = await prisma.experience.create({ data: cleanData });
    await this.updateProfileCompleteness(profile.id);
    return created;
  }

  public static async updateExperience(id: string, userId: string, data: any) {
    const profile = await this.getProfileRef(userId);
    const existing = await prisma.experience.findFirst({ where: { id, profileId: profile.id } });
    if (!existing) throw new NotFoundError('Experience entry not found.');

    const cleanData: any = {};
    if (data.company !== undefined) cleanData.company = data.company;
    if (data.position !== undefined) cleanData.position = data.position;
    if (data.location !== undefined) cleanData.location = data.location || null;
    if (data.startDate !== undefined) cleanData.startDate = data.startDate;
    if (data.endDate !== undefined || data.isCurrent !== undefined) {
      const isCurrent = data.isCurrent !== undefined ? Boolean(data.isCurrent) : existing.isCurrent;
      cleanData.isCurrent = isCurrent;
      cleanData.endDate = isCurrent ? null : (data.endDate || null);
    }
    if (data.description !== undefined) cleanData.description = data.description || null;
    if (data.responsibilities !== undefined) {
      cleanData.responsibilities = Array.isArray(data.responsibilities) ? data.responsibilities : [];
    } else if (data.description) {
      const lines = data.description.split('\n').map((l: string) => l.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);
      if (lines.length > 1) {
        cleanData.responsibilities = lines;
      }
    }
    if (data.achievements !== undefined) cleanData.achievements = Array.isArray(data.achievements) ? data.achievements : [];
    if (data.orderIndex !== undefined) cleanData.orderIndex = data.orderIndex;

    const updated = await prisma.experience.update({
      where: { id: existing.id },
      data: cleanData,
    });
    await this.updateProfileCompleteness(profile.id);
    return updated;
  }

  public static async deleteExperience(id: string, userId: string) {
    const profile = await this.getProfileRef(userId);
    const existing = await prisma.experience.findFirst({ where: { id, profileId: profile.id } });
    if (!existing) throw new NotFoundError('Experience entry not found.');
    const deleted = await prisma.experience.delete({ where: { id: existing.id } });
    await this.updateProfileCompleteness(profile.id);
    return deleted;
  }

  private static async updateProfileCompleteness(profileId: string) {
    try {
      const fullProfile = await prisma.profile.findUnique({
        where: { id: profileId },
        include: {
          experiences: true,
          educations: true,
          skills: true,
          projects: true,
          certifications: true,
          awards: true,
          publications: true,
          languages: true,
          services: true,
          references: true,
          memberships: true,
          customSections: true,
        },
      });
      if (fullProfile) {
        const scoreDetails = this.calculateCompletenessScore(fullProfile);
        if (fullProfile.completenessScore !== scoreDetails.totalScore) {
          await prisma.profile.update({
            where: { id: profileId },
            data: { completenessScore: scoreDetails.totalScore },
          });
        }
      }
    } catch {
      // Non-fatal score refresh
    }
  }

  public static async addEducation(userId: string, data: any) {
    const profile = await this.getProfileRef(userId);
    const created = await prisma.education.create({ data: { ...data, profileId: profile.id } });
    await this.updateProfileCompleteness(profile.id);
    return created;
  }

  public static async updateEducation(id: string, userId: string, data: any) {
    const profile = await this.getProfileRef(userId);
    const existing = await prisma.education.findFirst({ where: { id, profileId: profile.id } });
    if (!existing) throw new NotFoundError('Education entry not found.');
    const updated = await prisma.education.update({ where: { id: existing.id }, data });
    await this.updateProfileCompleteness(profile.id);
    return updated;
  }

  public static async deleteEducation(id: string, userId: string) {
    const profile = await this.getProfileRef(userId);
    const existing = await prisma.education.findFirst({ where: { id, profileId: profile.id } });
    if (!existing) throw new NotFoundError('Education entry not found.');
    const deleted = await prisma.education.delete({ where: { id: existing.id } });
    await this.updateProfileCompleteness(profile.id);
    return deleted;
  }

  public static async addSkill(userId: string, data: any) {
    const profile = await this.getProfileRef(userId);
    const created = await prisma.skill.create({ data: { ...data, profileId: profile.id } });
    await this.updateProfileCompleteness(profile.id);
    return created;
  }

  public static async updateSkill(id: string, userId: string, data: any) {
    const profile = await this.getProfileRef(userId);
    const existing = await prisma.skill.findFirst({ where: { id, profileId: profile.id } });
    if (!existing) throw new NotFoundError('Skill entry not found.');
    const updated = await prisma.skill.update({ where: { id: existing.id }, data });
    await this.updateProfileCompleteness(profile.id);
    return updated;
  }

  public static async deleteSkill(id: string, userId: string) {
    const profile = await this.getProfileRef(userId);
    const existing = await prisma.skill.findFirst({ where: { id, profileId: profile.id } });
    if (!existing) throw new NotFoundError('Skill entry not found.');
    const deleted = await prisma.skill.delete({ where: { id: existing.id } });
    await this.updateProfileCompleteness(profile.id);
    return deleted;
  }

  public static async addProject(userId: string, data: any) {
    const profile = await this.getProfileRef(userId);
    const created = await prisma.project.create({ data: { ...data, profileId: profile.id } });
    await this.updateProfileCompleteness(profile.id);
    return created;
  }

  public static async updateProject(id: string, userId: string, data: any) {
    const profile = await this.getProfileRef(userId);
    const existing = await prisma.project.findFirst({ where: { id, profileId: profile.id } });
    if (!existing) throw new NotFoundError('Project entry not found.');
    const updated = await prisma.project.update({ where: { id: existing.id }, data });
    await this.updateProfileCompleteness(profile.id);
    return updated;
  }

  public static async deleteProject(id: string, userId: string) {
    const profile = await this.getProfileRef(userId);
    const existing = await prisma.project.findFirst({ where: { id, profileId: profile.id } });
    if (!existing) throw new NotFoundError('Project entry not found.');
    const deleted = await prisma.project.delete({ where: { id: existing.id } });
    await this.updateProfileCompleteness(profile.id);
    return deleted;
  }

  public static async addCertification(userId: string, data: any) {
    const profile = await this.getProfileRef(userId);
    const created = await prisma.certification.create({ data: { ...data, profileId: profile.id } });
    await this.updateProfileCompleteness(profile.id);
    return created;
  }

  public static async updateCertification(id: string, userId: string, data: any) {
    const profile = await this.getProfileRef(userId);
    const existing = await prisma.certification.findFirst({ where: { id, profileId: profile.id } });
    if (!existing) throw new NotFoundError('Certification entry not found.');
    const updated = await prisma.certification.update({ where: { id: existing.id }, data });
    await this.updateProfileCompleteness(profile.id);
    return updated;
  }

  public static async deleteCertification(id: string, userId: string) {
    const profile = await this.getProfileRef(userId);
    const existing = await prisma.certification.findFirst({ where: { id, profileId: profile.id } });
    if (!existing) throw new NotFoundError('Certification entry not found.');
    const deleted = await prisma.certification.delete({ where: { id: existing.id } });
    await this.updateProfileCompleteness(profile.id);
    return deleted;
  }

  // --- SERVICES ---
  public static async addService(userId: string, data: any) {
    const profile = await this.getProfileRef(userId);
    return prisma.service.create({ data: { ...data, profileId: profile.id } });
  }
  public static async updateService(id: string, userId: string, data: any) {
    const profile = await this.getProfileRef(userId);
    return prisma.service.updateMany({ where: { id, profileId: profile.id }, data });
  }
  public static async deleteService(id: string, userId: string) {
    const profile = await this.getProfileRef(userId);
    return prisma.service.deleteMany({ where: { id, profileId: profile.id } });
  }

  // --- PUBLICATIONS ---
  public static async addPublication(userId: string, data: any) {
    const profile = await this.getProfileRef(userId);
    return prisma.publication.create({ data: { ...data, profileId: profile.id } });
  }
  public static async updatePublication(id: string, userId: string, data: any) {
    const profile = await this.getProfileRef(userId);
    return prisma.publication.updateMany({ where: { id, profileId: profile.id }, data });
  }
  public static async deletePublication(id: string, userId: string) {
    const profile = await this.getProfileRef(userId);
    return prisma.publication.deleteMany({ where: { id, profileId: profile.id } });
  }

  // --- AWARDS ---
  public static async addAward(userId: string, data: any) {
    const profile = await this.getProfileRef(userId);
    return prisma.award.create({ data: { ...data, profileId: profile.id } });
  }
  public static async updateAward(id: string, userId: string, data: any) {
    const profile = await this.getProfileRef(userId);
    return prisma.award.updateMany({ where: { id, profileId: profile.id }, data });
  }
  public static async deleteAward(id: string, userId: string) {
    const profile = await this.getProfileRef(userId);
    return prisma.award.deleteMany({ where: { id, profileId: profile.id } });
  }

  // --- LANGUAGES ---
  public static async addLanguage(userId: string, data: any) {
    const profile = await this.getProfileRef(userId);
    return prisma.language.create({ data: { ...data, profileId: profile.id } });
  }
  public static async updateLanguage(id: string, userId: string, data: any) {
    const profile = await this.getProfileRef(userId);
    return prisma.language.updateMany({ where: { id, profileId: profile.id }, data });
  }
  public static async deleteLanguage(id: string, userId: string) {
    const profile = await this.getProfileRef(userId);
    return prisma.language.deleteMany({ where: { id, profileId: profile.id } });
  }

  // --- REFERENCES ---
  public static async addReference(userId: string, data: any) {
    const profile = await this.getProfileRef(userId);
    const created = await prisma.reference.create({ data: { ...data, profileId: profile.id } });
    await this.updateProfileCompleteness(profile.id);
    return created;
  }

  public static async updateReference(id: string, userId: string, data: any) {
    const profile = await this.getProfileRef(userId);
    const existing = await prisma.reference.findFirst({ where: { id, profileId: profile.id } });
    if (!existing) throw new NotFoundError('Reference entry not found.');
    const updated = await prisma.reference.update({ where: { id: existing.id }, data });
    await this.updateProfileCompleteness(profile.id);
    return updated;
  }

  public static async deleteReference(id: string, userId: string) {
    const profile = await this.getProfileRef(userId);
    const existing = await prisma.reference.findFirst({ where: { id, profileId: profile.id } });
    if (!existing) throw new NotFoundError('Reference entry not found.');
    const deleted = await prisma.reference.delete({ where: { id: existing.id } });
    await this.updateProfileCompleteness(profile.id);
    return deleted;
  }

  // --- CUSTOM SECTIONS ---
  public static async addCustomSection(userId: string, data: any) {
    const profile = await this.getProfileRef(userId);
    return prisma.customSection.create({ data: { ...data, profileId: profile.id } });
  }
  public static async updateCustomSection(id: string, userId: string, data: any) {
    const profile = await this.getProfileRef(userId);
    return prisma.customSection.updateMany({ where: { id, profileId: profile.id }, data });
  }
  public static async deleteCustomSection(id: string, userId: string) {
    const profile = await this.getProfileRef(userId);
    return prisma.customSection.deleteMany({ where: { id, profileId: profile.id } });
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

  // VERIFIED DOCUMENTS
  public static async getVerifiedDocuments(userId: string) {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundError('Profile not found.');

    return prisma.verifiedDocument.findMany({
      where: { profileId: profile.id },
      orderBy: { orderIndex: 'asc' },
    });
  }

  public static async addVerifiedDocument(userId: string, data: {
    documentType: string;
    title: string;
    documentNumber?: string;
    fileUrl: string;
    fileSize?: number;
    mimeType?: string;
  }) {
    let profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) {
      profile = await prisma.profile.create({ data: { userId, title: 'Professional' } });
    }

    const count = await prisma.verifiedDocument.count({ where: { profileId: profile.id } });

    return prisma.verifiedDocument.create({
      data: {
        profileId: profile.id,
        documentType: data.documentType || 'OTHER',
        title: data.title,
        documentNumber: data.documentNumber || null,
        fileUrl: data.fileUrl,
        fileSize: data.fileSize || null,
        mimeType: data.mimeType || null,
        orderIndex: count,
      },
    });
  }

  public static async deleteVerifiedDocument(userId: string, documentId: string) {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundError('Profile not found.');

    const doc = await prisma.verifiedDocument.findUnique({ where: { id: documentId } });
    if (!doc || doc.profileId !== profile.id) {
      throw new NotFoundError('Verified document not found.');
    }

    await prisma.verifiedDocument.delete({ where: { id: documentId } });
    return { message: 'Document deleted successfully.' };
  }

  // DOCUMENT ACCESS KEYS
  public static async getDocumentAccessKeys(userId: string) {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundError('Profile not found.');

    return prisma.documentAccessKey.findMany({
      where: { profileId: profile.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  public static async generateDocumentAccessKey(
    userId: string,
    recipientName?: string,
    validityHours: number = 24,
    recipientEmail?: string
  ) {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundError('Profile not found.');

    // Generate clean 6-character random code e.g. DOC-9A7K2X
    const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
    const code = `DOC-${randomChars}`;

    const expiresAt = new Date(Date.now() + (validityHours || 24) * 60 * 60 * 1000);

    const keyRecord = await prisma.documentAccessKey.create({
      data: {
        profileId: profile.id,
        code,
        recipientName: recipientName || null,
        expiresAt,
      },
    });

    if (recipientEmail && recipientEmail.trim()) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subdomains: { where: { isPrimary: true } } },
      });
      if (user) {
        const subdomain = user.subdomains[0]?.slug || 'portfolio';
        try {
          await MailService.sendDocumentAccessKeyEmail({
            recruiterEmail: recipientEmail.trim(),
            recruiterName: recipientName || 'Recipient',
            tenantName: user.fullName,
            tenantEmail: user.email,
            accessCode: code,
            validityHours: validityHours || 24,
            subdomain,
          });
        } catch (mailErr: any) {
          console.error('[generateDocumentAccessKey] Failed to dispatch key email:', mailErr.message);
        }
      }
    }

    return keyRecord;
  }

  public static async deleteDocumentAccessKey(userId: string, keyId: string) {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundError('Profile not found.');

    const keyRecord = await prisma.documentAccessKey.findUnique({ where: { id: keyId } });
    if (!keyRecord || keyRecord.profileId !== profile.id) {
      throw new NotFoundError('Access key not found.');
    }

    await prisma.documentAccessKey.delete({ where: { id: keyId } });
    return { message: 'Access key revoked successfully.' };
  }

  public static async unlockVerifiedDocumentsByPublicSubdomain(subdomain: string, keyCode: string) {
    const normSlug = subdomain.toLowerCase().trim();
    const subRecord: any = await prisma.subdomain.findUnique({
      where: { slug: normSlug },
      include: {
        user: {
          select: {
            profile: {
              include: {
                verifiedDocuments: { orderBy: { orderIndex: 'asc' } },
              },
            },
          },
        },
      },
    });

    if (!subRecord || !subRecord.user || !subRecord.user.profile) {
      throw new NotFoundError('Portfolio profile not found.');
    }

    const profileId = subRecord.user.profile.id;
    const cleanCode = keyCode.trim().toUpperCase();

    const keyRecord = await prisma.documentAccessKey.findFirst({
      where: {
        profileId,
        code: cleanCode,
      },
    });

    if (!keyRecord) {
      throw new ValidationError('Invalid document access key. Please request a valid key from the portfolio owner.');
    }

    if (new Date() > new Date(keyRecord.expiresAt)) {
      throw new ValidationError('This document access key has expired. Please ask the portfolio owner for a new key.');
    }

    if (keyRecord.isUsed) {
      throw new ValidationError('This one-time access key has already been used. Please request a new key from the portfolio owner.');
    }

    // Mark key as used upon successful unlock
    await prisma.documentAccessKey.update({
      where: { id: keyRecord.id },
      data: {
        isUsed: true,
        usedAt: new Date(),
      },
    });

    return {
      recipientName: keyRecord.recipientName,
      unlockedAt: new Date(),
      documents: subRecord.user.profile.verifiedDocuments,
    };
  }
}

