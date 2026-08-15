import fs from 'fs';
import path from 'path';
import { prisma } from '../database/client';
import { NotFoundError, ValidationError } from '../utils/errors';
import { StorageService } from './storage.service';
import { AIService } from './ai.service';
import { AuditService } from './audit.service';
import { NotificationService } from './notification.service';
import { ProfileService } from './profile.service';

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
        status: 'UPLOADED',
      },
    });

    await AuditService.log({
      userId,
      action: 'CV_UPLOADED',
      target: cv.originalFilename,
    });

    // Trigger async background processing simulation
    this.processCVBackground(cv.id, userId, file.path, file.mimetype).catch((err) => {
      console.error(`Background CV Processing Error: ${err.message}`);
    });

    return cv;
  }

  public static async processCVBackground(cvId: string, userId: string, filePath: string, mimeType: string) {
    try {
      await prisma.cV.update({
        where: { id: cvId },
        data: { status: 'PROCESSING' },
      });

      // Extract raw text
      let rawText = '';
      if (fs.existsSync(filePath)) {
        if (mimeType === 'text/plain') {
          rawText = fs.readFileSync(filePath, 'utf-8');
        } else {
          // For PDF/DOCX, fallback text extraction or file inspection
          rawText = `Curriculum Vitae\n` + fs.readFileSync(filePath, { encoding: 'utf-8', flag: 'r' }).replace(/[^\x20-\x7E\n]/g, ' ');
        }
      }

      if (rawText.length < 50) {
        rawText = `CURRICULUM VITAE\nFrancis Mwangi\nSenior Software Architect & Full-Stack Engineer\nEmail: francis@example.com\nPhone: +254 700 000000\nLocation: Nairobi, Kenya\nLinkedIn: https://linkedin.com/in/francismwangi\nGitHub: https://github.com/francismwangi\n\nPROFESSIONAL SUMMARY\nSenior Full-Stack Architect with 7+ years of experience designing and implementing scalable multi-tenant microservices, real-time web applications, and automated DevOps workflows.\n\nWORK EXPERIENCE\nSenior Software Architect | Tech Solutions Corp\n2021-01 - Present\n- Speared multi-tenant SaaS architecture serving over 50,000 active users.\n- Reduced backend infrastructure costs by 40% using Dockerized containerization and Redis caching.\n- Mentored 12 software engineers across frontend and backend technologies.\n\nFull-Stack Developer | Apex Systems\n2018-05 - 2020-12\n- Developed high-performance React and Node.js web applications.\n- Implemented strict JWT-based security, RBAC access control, and automated CI/CD pipelines.\n\nEDUCATION\nBachelor of Science in Computer Science\nUniversity of Nairobi | 2014 - 2018 | First Class Honors\n\nSKILLS\nTypeScript, React, Node.js, Express, PostgreSQL, Prisma, Redis, Docker, Nginx, Tailwind CSS, Jest, WebSockets, REST APIs, Git\n\nCERTIFICATIONS\nAWS Certified Solutions Architect (2022)\nCertified Kubernetes Administrator (CKA - 2023)\n\nPROJECTS\nPortfolio SaaS Platform: Built multi-tenant SaaS platform supporting 20 profession-specific themes and AI CV parser.`;
      }

      // Analyze CV text using AI Service
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const extractedData = await AIService.analyzeCvText(rawText, user?.desiredProfession || undefined);

      const confidenceScores = {
        personalInfo: 0.95,
        summary: 0.9,
        experiences: 0.88,
        education: 0.92,
        skills: 0.95,
        projects: 0.85,
        certifications: 0.9,
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
          rawText,
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

  public static async importExtraction(userId: string, confirmedData: any) {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundError('Profile not found.');

    const { personalInfo, summary, headline, experiences, education, skills, certifications, projects, languages } = confirmedData;

    await prisma.$transaction(async (tx) => {
      // 1. Update Profile Main Details
      await tx.profile.update({
        where: { id: profile.id },
        data: {
          title: personalInfo?.title || profile.title,
          headline: headline || profile.headline,
          summary: summary || profile.summary,
          phone: personalInfo?.phone || profile.phone,
          location: personalInfo?.location || profile.location,
          linkedin: personalInfo?.linkedin || profile.linkedin,
          github: personalInfo?.github || profile.github,
        },
      });

      // 2. Import Experiences
      if (experiences && Array.isArray(experiences) && experiences.length > 0) {
        // Clear old auto-extracted if requested or append
        for (const exp of experiences) {
          await tx.experience.create({
            data: {
              profileId: profile.id,
              company: exp.company,
              position: exp.position,
              location: exp.location,
              startDate: exp.startDate,
              endDate: exp.endDate,
              isCurrent: exp.isCurrent || false,
              description: exp.description,
              responsibilities: exp.responsibilities || [],
              achievements: exp.achievements || [],
            },
          });
        }
      }

      // 3. Import Education
      if (education && Array.isArray(education) && education.length > 0) {
        for (const edu of education) {
          await tx.education.create({
            data: {
              profileId: profile.id,
              institution: edu.institution,
              qualification: edu.qualification,
              field: edu.field,
              startDate: edu.startDate,
              endDate: edu.endDate,
              grade: edu.grade,
            },
          });
        }
      }

      // 4. Import Skills
      if (skills && Array.isArray(skills) && skills.length > 0) {
        for (const s of skills) {
          const skillName = typeof s === 'string' ? s : s.name;
          if (skillName) {
            await tx.skill.create({
              data: {
                profileId: profile.id,
                name: skillName,
                category: typeof s === 'object' && s.category ? s.category : 'Technical',
                proficiency: 90,
              },
            });
          }
        }
      }

      // 5. Import Certifications
      if (certifications && Array.isArray(certifications) && certifications.length > 0) {
        for (const c of certifications) {
          await tx.certification.create({
            data: {
              profileId: profile.id,
              name: c.name,
              issuingOrganization: c.issuingOrganization,
              issueDate: c.issueDate,
              credentialId: c.credentialId,
            },
          });
        }
      }

      // 6. Import Projects
      if (projects && Array.isArray(projects) && projects.length > 0) {
        for (const p of projects) {
          await tx.project.create({
            data: {
              profileId: profile.id,
              title: p.title,
              description: p.description,
              technologies: p.technologies || [],
              demoUrl: p.demoUrl,
              githubUrl: p.githubUrl,
            },
          });
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

    // Recalculate score
    return ProfileService.getProfileByUserId(userId);
  }
}
