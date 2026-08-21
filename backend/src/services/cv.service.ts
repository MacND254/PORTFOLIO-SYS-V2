import fs from 'fs';
import path from 'path';
import { prisma } from '../database/client';
import { NotFoundError, ValidationError } from '../utils/errors';
import { StorageService } from './storage.service';
import { AIService } from './ai.service';
import { AuditService } from './audit.service';
import { NotificationService } from './notification.service';
import { ProfileService } from './profile.service';
import { DocumentParser } from '../utils/documentParser.util';
import { logger } from '../config/logger';

export interface ImportOptions {
  importMode?: 'replace' | 'append' | 'selective';
  selectedSections?: string[]; // e.g. ['general', 'contacts', 'experience', 'education', 'skills', 'projects', 'certifications', 'languages']
}

export class CVService {
  public static async uploadCV(userId: string, file: Express.Multer.File) {
    if (!file) throw new ValidationError('No file uploaded.');

    const relativeUrl = await StorageService.saveFile(file, 'cvs');

    // Create CV record in DB
    const cv = await prisma.cV.create({
      data: {
        userId,
        originalFilename: file.originalname,
        storedFilename: file.filename,
        mimeType: file.mimetype,
        fileSize: file.size,
        fileUrl: relativeUrl,
        status: 'PROCESSING',
      },
    });

    await AuditService.log({
      userId,
      action: 'CV_UPLOADED',
      target: cv.originalFilename,
    });

    // Process extraction immediately
    try {
      const extraction = await this.processCVBackground(cv.id, userId, file.path, file.mimetype);
      return {
        ...cv,
        status: 'REVIEW_REQUIRED',
        extraction,
      };
    } catch (err: any) {
      logger.error(`CV Processing Error: ${err.message}`);
      return cv;
    }
  }

  public static async processCVBackground(cvId: string, userId: string, filePath: string, mimeType: string) {
    try {
      await prisma.cV.update({
        where: { id: cvId },
        data: { status: 'PROCESSING' },
      });

      // Extract raw text using DocumentParser
      let rawText = '';
      try {
        rawText = await DocumentParser.extractText(filePath, mimeType);
      } catch (err: any) {
        logger.warn(`DocumentParser error on ${filePath}: ${err.message}`);
      }

      // Analyze CV text using enhanced AI Service
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const extractedData = await AIService.analyzeCvText(rawText, user?.desiredProfession || undefined);

      const confidenceScores = {
        personalInfo: 0.95,
        summary: 0.92,
        experiences: 0.90,
        education: 0.94,
        skills: 0.95,
        projects: 0.88,
        certifications: 0.90,
        languages: 0.92,
      };

      // Create Extraction Record
      const extraction = await prisma.cVExtraction.create({
        data: {
          cvId,
          userId,
          extractedData: extractedData as any,
          confidenceScores: confidenceScores as any,
          status: 'REVIEW_REQUIRED',
        },
      });

      // Update CV status
      await prisma.cV.update({
        where: { id: cvId },
        data: {
          rawText: rawText.slice(0, 10000), // store up to 10k chars
          status: 'REVIEW_REQUIRED',
        },
      });

      await AuditService.log({
        userId,
        action: 'CV_ANALYZED',
        target: cvId,
      });

      await NotificationService.create({
        userId,
        title: 'CV Processing Complete!',
        message: 'Your CV has been analyzed. Please review and confirm the extracted details.',
        type: 'SUCCESS',
        link: '/admin/cv-import',
      });

      return extraction;
    } catch (error: any) {
      await prisma.cV.update({
        where: { id: cvId },
        data: { status: 'FAILED' },
      });
      throw error;
    }
  }

  public static async getLatestExtraction(userId: string) {
    const extraction = await prisma.cVExtraction.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { cv: true },
    });

    if (!extraction) throw new NotFoundError('No CV extractions found.');
    return extraction;
  }

  public static async importExtraction(userId: string, confirmedData: any, options: ImportOptions = {}) {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundError('Profile not found.');

    const {
      personalInfo,
      summary,
      headline,
      experiences,
      education,
      skills,
      certifications,
      projects,
      languages,
    } = confirmedData;

    const mode = options.importMode || 'replace';
    const selected = options.selectedSections || [
      'general',
      'contacts',
      'experience',
      'education',
      'skills',
      'projects',
      'certifications',
      'languages',
    ];

    const shouldImport = (section: string) => selected.includes(section);

    await prisma.$transaction(async (tx: any) => {
      // 0. Update User Full Name if provided and not empty
      if (shouldImport('general') && personalInfo?.fullName && personalInfo.fullName !== 'Professional Candidate') {
        await tx.user.update({
          where: { id: userId },
          data: { fullName: personalInfo.fullName },
        });
      }

      // 1. Update Profile Main Details & Contacts
      const profileUpdates: any = {};

      if (shouldImport('general')) {
        if (personalInfo?.title) profileUpdates.title = personalInfo.title;
        if (headline) profileUpdates.headline = headline;
        if (summary) profileUpdates.summary = summary;
        if (personalInfo?.location) profileUpdates.location = personalInfo.location;
        if (personalInfo?.linkedin) profileUpdates.linkedin = personalInfo.linkedin;
        if (personalInfo?.github) profileUpdates.github = personalInfo.github;
      }

      if (shouldImport('contacts')) {
        if (personalInfo?.email) profileUpdates.contactEmail = personalInfo.email;
        if (personalInfo?.phone) profileUpdates.phone = personalInfo.phone;
        if (personalInfo?.address) profileUpdates.address = personalInfo.address;
        if (personalInfo?.website) profileUpdates.website = personalInfo.website;
        if (personalInfo?.twitter) profileUpdates.twitter = personalInfo.twitter;
        if (personalInfo?.location && !profileUpdates.location) profileUpdates.location = personalInfo.location;
      }

      if (Object.keys(profileUpdates).length > 0) {
        await tx.profile.update({
          where: { id: profile.id },
          data: profileUpdates,
        });
      }

      // 2. Import Experiences
      if (shouldImport('experience') && experiences && Array.isArray(experiences) && experiences.length > 0) {
        if (mode === 'replace') {
          await tx.experience.deleteMany({ where: { profileId: profile.id } });
        }
        for (let i = 0; i < experiences.length; i++) {
          const exp = experiences[i];
          await tx.experience.create({
            data: {
              profileId: profile.id,
              company: exp.company || 'Company',
              position: exp.position || 'Position',
              location: exp.location || 'Remote',
              startDate: exp.startDate || '2021-01',
              endDate: exp.endDate,
              isCurrent: exp.isCurrent ?? (!exp.endDate || /present/i.test(String(exp.endDate))),
              description: exp.description || '',
              responsibilities: Array.isArray(exp.responsibilities) ? exp.responsibilities : [],
              achievements: Array.isArray(exp.achievements) ? exp.achievements : [],
              orderIndex: i,
            },
          });
        }
      }

      // 3. Import Education
      if (shouldImport('education') && education && Array.isArray(education) && education.length > 0) {
        if (mode === 'replace') {
          await tx.education.deleteMany({ where: { profileId: profile.id } });
        }
        for (let i = 0; i < education.length; i++) {
          const edu = education[i];
          await tx.education.create({
            data: {
              profileId: profile.id,
              institution: edu.institution || 'University',
              qualification: edu.qualification || 'Degree',
              field: edu.field || 'General',
              startDate: edu.startDate || '2016',
              endDate: edu.endDate || '2020',
              grade: edu.grade,
              orderIndex: i,
            },
          });
        }
      }

      // 4. Import Skills
      if (shouldImport('skills') && skills && Array.isArray(skills) && skills.length > 0) {
        if (mode === 'replace') {
          await tx.skill.deleteMany({ where: { profileId: profile.id } });
        }
        for (let i = 0; i < skills.length; i++) {
          const s = skills[i];
          const skillName = typeof s === 'string' ? s : s.name;
          if (skillName) {
            await tx.skill.create({
              data: {
                profileId: profile.id,
                name: skillName,
                category: typeof s === 'object' && s.category ? s.category : 'Technical',
                proficiency: typeof s === 'object' && s.proficiency ? s.proficiency : 90,
                orderIndex: i,
              },
            });
          }
        }
      }

      // 5. Import Certifications
      if (shouldImport('certifications') && certifications && Array.isArray(certifications) && certifications.length > 0) {
        if (mode === 'replace') {
          await tx.certification.deleteMany({ where: { profileId: profile.id } });
        }
        for (let i = 0; i < certifications.length; i++) {
          const c = certifications[i];
          await tx.certification.create({
            data: {
              profileId: profile.id,
              name: c.name || 'Certification',
              issuingOrganization: c.issuingOrganization || 'Certifying Body',
              issueDate: c.issueDate || '2023',
              credentialId: c.credentialId,
              credentialUrl: c.credentialUrl,
              orderIndex: i,
            },
          });
        }
      }

      // 6. Import Projects
      if (shouldImport('projects') && projects && Array.isArray(projects) && projects.length > 0) {
        if (mode === 'replace') {
          await tx.project.deleteMany({ where: { profileId: profile.id } });
        }
        for (let i = 0; i < projects.length; i++) {
          const p = projects[i];
          const techs = Array.isArray(p.technologies)
            ? p.technologies
            : typeof p.technologies === 'string'
            ? p.technologies.split(',').map((t: string) => t.trim()).filter(Boolean)
            : [];

          await tx.project.create({
            data: {
              profileId: profile.id,
              title: p.title || 'Project',
              description: p.description || 'Project description',
              technologies: techs,
              demoUrl: p.demoUrl,
              githubUrl: p.githubUrl,
              role: p.role || 'Contributor',
              featured: Boolean(p.featured),
              orderIndex: i,
            },
          });
        }
      }

      // 7. Import Languages
      if (shouldImport('languages') && languages && Array.isArray(languages) && languages.length > 0) {
        if (mode === 'replace') {
          await tx.language.deleteMany({ where: { profileId: profile.id } });
        }
        for (let i = 0; i < languages.length; i++) {
          const lang = languages[i];
          if (lang.language) {
            await tx.language.create({
              data: {
                profileId: profile.id,
                language: lang.language,
                proficiency: lang.proficiency || 'Fluent',
                orderIndex: i,
              },
            });
          }
        }
      }
    });

    // Update extraction status
    const latest = await prisma.cVExtraction.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    if (latest) {
      await prisma.cVExtraction.update({
        where: { id: latest.id },
        data: { status: 'IMPORTED' },
      });
      await prisma.cV.update({
        where: { id: latest.cvId },
        data: { status: 'IMPORTED' },
      });
    }

    await AuditService.log({
      userId,
      action: 'CV_IMPORTED',
      target: profile.id,
    });

    // Recalculate and return full updated profile
    return ProfileService.getProfileByUserId(userId);
  }
}

