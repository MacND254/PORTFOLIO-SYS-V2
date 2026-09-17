import path from 'path';
import { prisma } from '../database/client';
import { NotFoundError, ValidationError } from '../utils/errors';
import { StorageService } from './storage.service';
import { GeminiCvService, ExtractedCvData } from './gemini-cv.service';
import { AuditService } from './audit.service';
import { NotificationService } from './notification.service';
import { ProfileService } from './profile.service';
import { logger } from '../config/logger';

export interface ImportOptions {
  importMode?: 'replace' | 'append' | 'selective';
  selectedSections?: string[]; // e.g. ['general', 'contacts', 'experience', 'education', 'skills', 'projects', 'certifications', 'languages', 'awards', 'publications']
  fieldOverrides?: Record<string, any>;
}

export interface FieldDiffItem {
  field: string;
  label: string;
  section: string;
  currentValue: any;
  extractedValue: any;
  status: 'UNCHANGED' | 'NEW' | 'UPDATED' | 'CONFLICT' | 'UNMATCHED';
  confidence: number;
  evidence?: string;
}

export interface SectionDiffAnalysis {
  general: FieldDiffItem[];
  contacts: FieldDiffItem[];
  experiences: {
    items: Array<{
      status: 'NEW' | 'UPDATED' | 'UNCHANGED';
      extracted: any;
      matchedExisting?: any;
    }>;
  };
  education: {
    items: Array<{
      status: 'NEW' | 'UPDATED' | 'UNCHANGED';
      extracted: any;
      matchedExisting?: any;
    }>;
  };
  skills: {
    items: Array<{
      status: 'NEW' | 'UPDATED' | 'UNCHANGED';
      extracted: any;
      matchedExisting?: any;
    }>;
  };
  projects: {
    items: Array<{
      status: 'NEW' | 'UPDATED' | 'UNCHANGED';
      extracted: any;
      matchedExisting?: any;
    }>;
  };
  certifications: {
    items: Array<{
      status: 'NEW' | 'UPDATED' | 'UNCHANGED';
      extracted: any;
      matchedExisting?: any;
    }>;
  };
  languages: {
    items: Array<{
      status: 'NEW' | 'UPDATED' | 'UNCHANGED';
      extracted: any;
      matchedExisting?: any;
    }>;
  };
  references?: {
    items: Array<{
      status: 'NEW' | 'UPDATED' | 'UNCHANGED';
      extracted: any;
      matchedExisting?: any;
    }>;
  };
}

export class CVService {
  /**
   * Saves the uploaded CV file, creates a PROCESSING record in the database,
   * and immediately returns — then fires off Gemini extraction in the background
   * so the HTTP request never times out waiting for AI processing.
   */
  public static async uploadCV(userId: string, file: Express.Multer.File) {
    if (!file) throw new ValidationError('No file uploaded.');

    const relativeUrl = await StorageService.saveFile(file, 'cvs');

    // Create CV record in DB with PROCESSING status
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

    // Fire background extraction WITHOUT awaiting — the HTTP response returns immediately.
    // The client should poll GET /api/cv/latest to check when status becomes REVIEW_REQUIRED.
    this.processCVBackground(cv.id, userId, file.path, file.mimetype).catch((err: any) => {
      logger.error(`[CVService] Background extraction failed for CV ${cv.id}: ${err?.message || err}`);
    });

    return { ...cv, status: 'PROCESSING' };
  }

  /**
   * Executes document text extraction with Google Gemini AI and profile diff calculation.
   */
  public static async processCVBackground(cvId: string, userId: string, filePath: string, mimeType: string) {
    try {
      await prisma.cV.update({
        where: { id: cvId },
        data: { status: 'PROCESSING' },
      });

      // 1. Fetch current profile for context and comparison
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: {
            include: {
              experiences: true,
              educations: true,
              skills: true,
              certifications: true,
              projects: true,
              languages: true,
              awards: true,
              publications: true,
            },
          },
        },
      });

      // 2. Intelligent document extraction exclusively powered by Google Gemini AI.
      const scan = await GeminiCvService.extract(filePath, mimeType);
      const rawText = scan.rawText;
      const extractedData: ExtractedCvData = scan.data;

      // 3. Compute comprehensive field diff analysis against current profile
      const diffAnalysis = this.computeProfileDiff(user, extractedData);

      // 4. Keep the extraction pipeline's evidence, quality score, and metrics with the data.
      const confidenceScores = {
        ...this.calculateConfidenceScores(extractedData),
        aiEngine: 'gemini',
        qualityScore: scan.structured?.qualityScore,
        engineUsed: scan.structured?.meta?.engineUsed || 'gemini',
      };

      // 5. Create Extraction Record in database
      const extraction = await prisma.cVExtraction.create({
        data: {
          cvId,
          userId,
          extractedData: {
            ...extractedData,
            diffAnalysis,
            structuredResume: scan.structured,
          } as any,
          confidenceScores: confidenceScores as any,
          status: 'REVIEW_REQUIRED',
        },
      });

      // 6. Update CV status
      await prisma.cV.update({
        where: { id: cvId },
        data: {
          rawText: rawText.slice(0, 15000),
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
        message: 'Your CV has been scanned. Review the matched fields before applying to your profile.',
        type: 'SUCCESS',
        category: 'PORTFOLIO',
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

  /**
   * Compares extracted CV data against the user's current profile to detect NEW, UPDATED, UNCHANGED and CONFLICT fields
   */
  public static computeProfileDiff(user: any, extracted: ExtractedCvData): SectionDiffAnalysis {
    const profile = user?.profile || {};
    const clean = (v: any) => typeof v === 'string' ? v.trim() : '';

    const computeField = (
      field: string,
      label: string,
      section: string,
      currentVal: any,
      extractedVal: any
    ): FieldDiffItem => {
      const c = clean(currentVal);
      const e = clean(extractedVal);

      let status: FieldDiffItem['status'] = 'UNCHANGED';
      let confidence = 0.95;

      if (!e) {
        status = 'UNMATCHED';
        confidence = 0;
      } else if (!c && e) {
        status = 'NEW';
        confidence = 0.95;
      } else if (c.toLowerCase() === e.toLowerCase()) {
        status = 'UNCHANGED';
        confidence = 1.0;
      } else {
        // Both exist but are different
        status = 'UPDATED';
        confidence = 0.90;
      }

      return {
        field,
        label,
        section,
        currentValue: c,
        extractedValue: e,
        status,
        confidence,
        evidence: extracted.fieldEvidence?.[`${section}.${field}`]?.sourceSnippet,
      };
    };

    // 1. General Bio diffs
    const generalDiffs: FieldDiffItem[] = [
      computeField('fullName', 'Full Name', 'general', user?.fullName, extracted.personalInfo?.fullName),
      computeField('title', 'Professional Title', 'general', profile.title, extracted.personalInfo?.title),
      computeField('headline', 'Tagline / Headline', 'general', profile.headline, extracted.headline),
      computeField('summary', 'Professional Summary', 'general', profile.summary, extracted.summary),
      computeField('location', 'Location', 'general', profile.location, extracted.personalInfo?.location),
    ];

    // 2. Contacts diffs
    const contactsDiffs: FieldDiffItem[] = [
      computeField('contactEmail', 'Contact Email', 'contacts', profile.contactEmail || user?.email, extracted.personalInfo?.email),
      computeField('phone', 'Phone Number', 'contacts', profile.phone, extracted.personalInfo?.phone),
      computeField('address', 'Physical Address', 'contacts', profile.address, extracted.personalInfo?.address),
      computeField('website', 'Personal Website', 'contacts', profile.website, extracted.personalInfo?.website),
      computeField('linkedin', 'LinkedIn Profile', 'contacts', profile.linkedin, extracted.personalInfo?.linkedin),
      computeField('github', 'GitHub Profile', 'contacts', profile.github, extracted.personalInfo?.github),
      computeField('twitter', 'Twitter / X', 'contacts', profile.twitter, extracted.personalInfo?.twitter),
    ];

    // 3. Repeatable collections comparison
    const existingExp = Array.isArray(profile.experiences) ? profile.experiences : [];
    const experienceItems = (extracted.experiences || []).map((exp) => {
      const match = existingExp.find((e: any) =>
        clean(e.company).toLowerCase() === clean(exp.company).toLowerCase() ||
        clean(e.position).toLowerCase() === clean(exp.position).toLowerCase()
      );
      return {
        status: (match ? (clean(match.position).toLowerCase() === clean(exp.position).toLowerCase() ? 'UNCHANGED' : 'UPDATED') : 'NEW') as 'NEW' | 'UPDATED' | 'UNCHANGED',
        extracted: exp,
        matchedExisting: match,
      };
    });

    const existingEdu = Array.isArray(profile.educations) ? profile.educations : [];
    const educationItems = (extracted.education || []).map((edu) => {
      const match = existingEdu.find((e: any) =>
        clean(e.institution).toLowerCase() === clean(edu.institution).toLowerCase()
      );
      return {
        status: (match ? 'UNCHANGED' : 'NEW') as 'NEW' | 'UPDATED' | 'UNCHANGED',
        extracted: edu,
        matchedExisting: match,
      };
    });

    const existingSkills = Array.isArray(profile.skills) ? profile.skills : [];
    const skillItems = (extracted.skills || []).map((s) => {
      const match = existingSkills.find((es: any) => clean(es.name).toLowerCase() === clean(s.name).toLowerCase());
      return {
        status: (match ? 'UNCHANGED' : 'NEW') as 'NEW' | 'UPDATED' | 'UNCHANGED',
        extracted: s,
        matchedExisting: match,
      };
    });

    const existingProjects = Array.isArray(profile.projects) ? profile.projects : [];
    const projectItems = (extracted.projects || []).map((p) => {
      const match = existingProjects.find((ep: any) => clean(ep.title).toLowerCase() === clean(p.title).toLowerCase());
      return {
        status: (match ? 'UNCHANGED' : 'NEW') as 'NEW' | 'UPDATED' | 'UNCHANGED',
        extracted: p,
        matchedExisting: match,
      };
    });

    const existingCerts = Array.isArray(profile.certifications) ? profile.certifications : [];
    const certItems = (extracted.certifications || []).map((c) => {
      const match = existingCerts.find((ec: any) => clean(ec.name).toLowerCase() === clean(c.name).toLowerCase());
      return {
        status: (match ? 'UNCHANGED' : 'NEW') as 'NEW' | 'UPDATED' | 'UNCHANGED',
        extracted: c,
        matchedExisting: match,
      };
    });

    const existingLangs = Array.isArray(profile.languages) ? profile.languages : [];
    const langItems = (extracted.languages || []).map((l) => {
      const match = existingLangs.find((el: any) => clean(el.language).toLowerCase() === clean(l.language).toLowerCase());
      return {
        status: (match ? 'UNCHANGED' : 'NEW') as 'NEW' | 'UPDATED' | 'UNCHANGED',
        extracted: l,
        matchedExisting: match,
      };
    });

    const existingRefs = Array.isArray(profile.references) ? profile.references : [];
    const refItems = (extracted.references || []).map((r) => {
      const match = existingRefs.find((er: any) => clean(er.name).toLowerCase() === clean(r.name).toLowerCase());
      return {
        status: (match ? 'UNCHANGED' : 'NEW') as 'NEW' | 'UPDATED' | 'UNCHANGED',
        extracted: r,
        matchedExisting: match,
      };
    });

    return {
      general: generalDiffs,
      contacts: contactsDiffs,
      experiences: { items: experienceItems },
      education: { items: educationItems },
      skills: { items: skillItems },
      projects: { items: projectItems },
      certifications: { items: certItems },
      languages: { items: langItems },
      references: { items: refItems },
    };
  }

  /**
   * Calculates realistic section confidence scores based on extracted field completeness
   */
  private static calculateConfidenceScores(data: ExtractedCvData): Record<string, number> {
    const scoreField = (val: any) => (val && String(val).trim().length > 0 ? 1 : 0);

    const personalScore = (
      scoreField(data.personalInfo?.fullName) * 0.4 +
      scoreField(data.personalInfo?.email) * 0.3 +
      scoreField(data.personalInfo?.phone) * 0.15 +
      scoreField(data.personalInfo?.title) * 0.15
    );

    return {
      personalInfo: Math.round(personalScore * 100) / 100,
      summary: data.summary && data.summary.length > 20 ? 0.95 : (data.summary ? 0.7 : 0),
      experiences: data.experiences && data.experiences.length > 0 ? 0.92 : 0,
      education: data.education && data.education.length > 0 ? 0.90 : 0,
      skills: data.skills && data.skills.length > 0 ? 0.95 : 0,
      projects: data.projects && data.projects.length > 0 ? 0.88 : 0,
      certifications: data.certifications && data.certifications.length > 0 ? 0.90 : 0,
      languages: data.languages && data.languages.length > 0 ? 0.95 : 0,
      references: data.references && data.references.length > 0 ? 0.90 : 0,
    };
  }

  public static async getLatestExtraction(userId: string) {
    const extraction = await prisma.cVExtraction.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { cv: true },
    });

    // If an extraction record exists, return it directly (covers REVIEW_REQUIRED and FAILED).
    if (extraction) return extraction;

    // No extraction record yet — check if a CV is currently being processed.
    // This happens during the window between upload and Gemini finishing.
    const latestCv = await prisma.cV.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestCv) throw new NotFoundError('No CV extractions found.');

    // Return a lightweight processing-state object so the frontend can poll correctly.
    return {
      id: null,
      status: latestCv.status, // 'PROCESSING' | 'FAILED'
      cv: latestCv,
      extractedData: null,
      confidenceScores: null,
      createdAt: latestCv.createdAt,
      updatedAt: latestCv.updatedAt,
    };
  }

  public static async resetExtraction(userId: string) {
    const extractions = await prisma.cVExtraction.findMany({
      where: { userId },
      select: { id: true, cvId: true },
    });
    const cvIds = extractions.map((e: any) => e.cvId).filter(Boolean);

    await prisma.cVExtraction.deleteMany({
      where: { userId },
    });

    if (cvIds.length > 0) {
      await prisma.cV.deleteMany({
        where: { id: { in: cvIds } },
      });
    }

    await AuditService.log({
      userId,
      action: 'CV_EXTRACTION_RESET',
      target: userId,
    });

    return { success: true };
  }

  /**
   * Transactional import of verified CV data into existing Profile tables.
   * PHASE 30 COMPLIANCE: Absence from CV never erases existing profile information.
   */
  public static async importExtraction(userId: string, confirmedData: any, options: ImportOptions = {}) {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundError('Profile not found.');

    if (!confirmedData || typeof confirmedData !== 'object') {
      throw new ValidationError('No extracted CV data was supplied.');
    }

    const {
      personalInfo,
      summary,
      headline,
      careerObjective,
      bio,
      experiences,
      education,
      skills,
      certifications,
      projects,
      languages,
      awards,
      publications,
      references,
    } = confirmedData;

    const mode = options.importMode || 'replace';
    if (mode !== 'replace' && mode !== 'append') {
      throw new ValidationError('Invalid import mode. Expected "replace" or "append".');
    }

    const selected = options.selectedSections || [
      'general',
      'contacts',
      'experience',
      'education',
      'skills',
      'certifications',
      'languages',
      'references',
    ];

    const shouldImport = (section: string) => selected.includes(section);
    const clean = (value: unknown) => typeof value === 'string' ? value.trim() : '';
    const cleanArray = (value: unknown) => Array.isArray(value) ? value : [];

    // Filter and sanitize entries
    const validExperiences = cleanArray(experiences).map((exp: any) => ({
      company: clean(exp?.company),
      position: clean(exp?.position),
      location: clean(exp?.location),
      startDate: clean(exp?.startDate),
      endDate: clean(exp?.endDate),
      description: clean(exp?.description),
      isCurrent: Boolean(exp?.isCurrent) || /^(present|current)$/i.test(clean(exp?.endDate)),
      responsibilities: cleanArray(exp?.responsibilities).map(clean).filter(Boolean),
      achievements: cleanArray(exp?.achievements).map(clean).filter(Boolean),
    })).filter((exp) => exp.company && exp.position);

    const validEducation = cleanArray(education).map((edu: any) => ({
      institution: clean(edu?.institution),
      qualification: clean(edu?.qualification),
      field: clean(edu?.field),
      startDate: clean(edu?.startDate),
      endDate: clean(edu?.endDate),
      isCurrent: Boolean(edu?.isCurrent),
      grade: clean(edu?.grade),
      description: clean(edu?.description),
    })).filter((edu) => edu.institution && edu.qualification);

    const seenSkills = new Set<string>();
    const validSkills = cleanArray(skills).map((skill: any) => {
      const name = clean(typeof skill === 'string' ? skill : skill?.name);
      const category = ['Technical', 'Soft', 'Tool', 'Industry'].includes(skill?.category) ? skill.category : 'Technical';
      const level = ['Beginner', 'Intermediate', 'Expert'].includes(skill?.level) ? skill.level : undefined;
      return {
        name: name,
        category,
        proficiency: null,
        level,
      };
    }).filter((skill) => skill.name && !seenSkills.has(skill.name.toLowerCase()) && Boolean(seenSkills.add(skill.name.toLowerCase())));

    const validProjects = cleanArray(projects).map((project: any) => ({
      title: clean(project?.title),
      description: clean(project?.description),
      longDescription: clean(project?.longDescription),
      role: clean(project?.role),
      demoUrl: clean(project?.demoUrl),
      githubUrl: clean(project?.githubUrl),
      featured: Boolean(project?.featured),
      technologies: cleanArray(project?.technologies).map(clean).filter(Boolean),
    })).filter((project) => project.title && project.description);

    const validCertifications = cleanArray(certifications).map((cert: any) => ({
      name: clean(cert?.name),
      issuingOrganization: clean(cert?.issuingOrganization),
      issueDate: clean(cert?.issueDate),
      expiryDate: clean(cert?.expiryDate),
      credentialId: clean(cert?.credentialId),
      credentialUrl: clean(cert?.credentialUrl),
    })).filter((cert) => cert.name && cert.issuingOrganization);

    const validLanguages = cleanArray(languages).map((language: any) => ({
      language: clean(language?.language),
      proficiency: ['Native', 'Fluent', 'Professional', 'Intermediate', 'Basic'].includes(language?.proficiency) ? language.proficiency : 'Professional',
    })).filter((l) => l.language);

    const validAwards = cleanArray(awards).map((a: any) => ({
      title: clean(a?.title),
      organization: clean(a?.organization),
      date: clean(a?.date),
      description: clean(a?.description),
    })).filter((a) => a.title && a.organization);

    const validPublications = cleanArray(publications).map((pub: any) => ({
      title: clean(pub?.title),
      publisher: clean(pub?.publisher),
      date: clean(pub?.date),
      url: clean(pub?.url),
      description: clean(pub?.description),
    })).filter((pub) => pub.title && pub.publisher);

    const validReferences = cleanArray(references).map((ref: any) => ({
      name: clean(ref?.name),
      position: clean(ref?.position || ref?.title),
      organization: clean(ref?.organization || ref?.company),
      email: clean(ref?.email) || null,
      phone: clean(ref?.phone) || null,
      relationship: clean(ref?.relationship) || null,
    })).filter((r) => r.name);

    // Atomic Database Transaction
    await prisma.$transaction(async (tx: any) => {
      // 0. Update User Full Name if selected and provided
      if (shouldImport('general') && clean(personalInfo?.fullName)) {
        await tx.user.update({
          where: { id: userId },
          data: { fullName: clean(personalInfo.fullName) },
        });
      }

      // 1. Update Profile Main Details (only update fields that have extracted content)
      const profileUpdates: any = {};

      if (shouldImport('general')) {
        if (clean(personalInfo?.title)) profileUpdates.title = clean(personalInfo.title);
        if (clean(headline)) profileUpdates.headline = clean(headline);
        if (clean(summary)) profileUpdates.summary = clean(summary);
        if (clean(careerObjective)) profileUpdates.careerObjective = clean(careerObjective);
        if (clean(bio)) profileUpdates.bio = clean(bio);
        if (clean(personalInfo?.location)) profileUpdates.location = clean(personalInfo.location);
      }

      if (shouldImport('contacts')) {
        if (clean(personalInfo?.email)) profileUpdates.contactEmail = clean(personalInfo.email);
        if (clean(personalInfo?.phone)) profileUpdates.phone = clean(personalInfo.phone);
        if (clean(personalInfo?.address)) profileUpdates.address = clean(personalInfo.address);
        if (clean(personalInfo?.website)) profileUpdates.website = clean(personalInfo.website);
        if (clean(personalInfo?.linkedin)) profileUpdates.linkedin = clean(personalInfo.linkedin);
        if (clean(personalInfo?.github)) profileUpdates.github = clean(personalInfo.github);
        if (clean(personalInfo?.twitter)) profileUpdates.twitter = clean(personalInfo.twitter);
        if (clean(personalInfo?.facebook)) profileUpdates.facebook = clean(personalInfo.facebook);
        if (clean(personalInfo?.instagram)) profileUpdates.instagram = clean(personalInfo.instagram);
        if (clean(personalInfo?.behance)) profileUpdates.behance = clean(personalInfo.behance);
        if (clean(personalInfo?.dribbble)) profileUpdates.dribbble = clean(personalInfo.dribbble);
      }

      if (Object.keys(profileUpdates).length > 0) {
        await tx.profile.update({
          where: { id: profile.id },
          data: profileUpdates,
        });
      }

      // 2. Import Experiences
      if (shouldImport('experience') && validExperiences.length > 0) {
        if (mode === 'replace') {
          await tx.experience.deleteMany({ where: { profileId: profile.id } });
          for (let i = 0; i < validExperiences.length; i++) {
            const exp = validExperiences[i];
            await tx.experience.create({
              data: {
                profileId: profile.id,
                company: exp.company,
                position: exp.position,
                location: exp.location || null,
                startDate: exp.startDate || '2022',
                endDate: exp.isCurrent ? null : (exp.endDate || null),
                isCurrent: exp.isCurrent,
                description: exp.description || null,
                responsibilities: exp.responsibilities,
                achievements: exp.achievements,
                orderIndex: i,
              },
            });
          }
        } else {
          // Smart append: avoid duplicate company + position
          const existing = await tx.experience.findMany({ where: { profileId: profile.id } });
          const existingKeys = new Set(existing.map((e: any) => `${e.company.toLowerCase().trim()}_${e.position.toLowerCase().trim()}`));
          let orderIdx = existing.length;
          for (const exp of validExperiences) {
            const key = `${exp.company.toLowerCase().trim()}_${exp.position.toLowerCase().trim()}`;
            if (!existingKeys.has(key)) {
              existingKeys.add(key);
              await tx.experience.create({
                data: {
                  profileId: profile.id,
                  company: exp.company,
                  position: exp.position,
                  location: exp.location || null,
                  startDate: exp.startDate || '2022',
                  endDate: exp.isCurrent ? null : (exp.endDate || null),
                  isCurrent: exp.isCurrent,
                  description: exp.description || null,
                  responsibilities: exp.responsibilities,
                  achievements: exp.achievements,
                  orderIndex: orderIdx++,
                },
              });
            }
          }
        }
      }

      // 3. Import Education
      if (shouldImport('education') && validEducation.length > 0) {
        if (mode === 'replace') {
          await tx.education.deleteMany({ where: { profileId: profile.id } });
          for (let i = 0; i < validEducation.length; i++) {
            const edu = validEducation[i];
            await tx.education.create({
              data: {
                profileId: profile.id,
                institution: edu.institution,
                qualification: edu.qualification,
                field: edu.field || null,
                startDate: edu.startDate || '2018',
                endDate: edu.isCurrent ? null : (edu.endDate || null),
                isCurrent: edu.isCurrent,
                grade: edu.grade || null,
                description: edu.description || null,
                orderIndex: i,
              },
            });
          }
        } else {
          const existing = await tx.education.findMany({ where: { profileId: profile.id } });
          const existingKeys = new Set(existing.map((e: any) => `${e.institution.toLowerCase().trim()}_${e.qualification.toLowerCase().trim()}`));
          let orderIdx = existing.length;
          for (const edu of validEducation) {
            const key = `${edu.institution.toLowerCase().trim()}_${edu.qualification.toLowerCase().trim()}`;
            if (!existingKeys.has(key)) {
              existingKeys.add(key);
              await tx.education.create({
                data: {
                  profileId: profile.id,
                  institution: edu.institution,
                  qualification: edu.qualification,
                  field: edu.field || null,
                  startDate: edu.startDate || '2018',
                  endDate: edu.isCurrent ? null : (edu.endDate || null),
                  isCurrent: edu.isCurrent,
                  grade: edu.grade || null,
                  description: edu.description || null,
                  orderIndex: orderIdx++,
                },
              });
            }
          }
        }
      }

      // 4. Import Skills
      if (shouldImport('skills') && validSkills.length > 0) {
        if (mode === 'replace') {
          await tx.skill.deleteMany({ where: { profileId: profile.id } });
          for (let i = 0; i < validSkills.length; i++) {
            const s = validSkills[i];
            await tx.skill.create({
              data: {
                profileId: profile.id,
                name: s.name,
                category: s.category,
                proficiency: null,
                level: s.level || null,
                orderIndex: i,
              },
            });
          }
        } else {
          const existing = await tx.skill.findMany({ where: { profileId: profile.id } });
          const existingSkillNames = new Set(existing.map((s: any) => s.name.toLowerCase().trim()));
          let orderIdx = existing.length;
          for (const s of validSkills) {
            if (!existingSkillNames.has(s.name.toLowerCase().trim())) {
              existingSkillNames.add(s.name.toLowerCase().trim());
              await tx.skill.create({
                data: {
                  profileId: profile.id,
                  name: s.name,
                  category: s.category,
                  proficiency: null,
                  level: s.level || null,
                  orderIndex: orderIdx++,
                },
              });
            }
          }
        }
      }

      // 5. Import Certifications
      if (shouldImport('certifications') && validCertifications.length > 0) {
        if (mode === 'replace') {
          await tx.certification.deleteMany({ where: { profileId: profile.id } });
          for (let i = 0; i < validCertifications.length; i++) {
            const c = validCertifications[i];
            await tx.certification.create({
              data: {
                profileId: profile.id,
                name: c.name,
                issuingOrganization: c.issuingOrganization,
                issueDate: c.issueDate || '2022',
                expiryDate: c.expiryDate || null,
                credentialId: c.credentialId || null,
                credentialUrl: c.credentialUrl || null,
                orderIndex: i,
              },
            });
          }
        } else {
          const existing = await tx.certification.findMany({ where: { profileId: profile.id } });
          const existingKeys = new Set(existing.map((c: any) => c.name.toLowerCase().trim()));
          let orderIdx = existing.length;
          for (const c of validCertifications) {
            if (!existingKeys.has(c.name.toLowerCase().trim())) {
              existingKeys.add(c.name.toLowerCase().trim());
              await tx.certification.create({
                data: {
                  profileId: profile.id,
                  name: c.name,
                  issuingOrganization: c.issuingOrganization,
                  issueDate: c.issueDate || '2022',
                  expiryDate: c.expiryDate || null,
                  credentialId: c.credentialId || null,
                  credentialUrl: c.credentialUrl || null,
                  orderIndex: orderIdx++,
                },
              });
            }
          }
        }
      }

      // 6. Import Projects
      if (shouldImport('projects') && validProjects.length > 0) {
        if (mode === 'replace') {
          await tx.project.deleteMany({ where: { profileId: profile.id } });
          for (let i = 0; i < validProjects.length; i++) {
            const p = validProjects[i];
            await tx.project.create({
              data: {
                profileId: profile.id,
                title: p.title,
                description: p.description,
                longDescription: p.longDescription || null,
                technologies: p.technologies,
                demoUrl: p.demoUrl || null,
                githubUrl: p.githubUrl || null,
                role: p.role || null,
                featured: Boolean(p.featured),
                orderIndex: i,
              },
            });
          }
        } else {
          const existing = await tx.project.findMany({ where: { profileId: profile.id } });
          const existingKeys = new Set(existing.map((p: any) => p.title.toLowerCase().trim()));
          let orderIdx = existing.length;
          for (const p of validProjects) {
            if (!existingKeys.has(p.title.toLowerCase().trim())) {
              existingKeys.add(p.title.toLowerCase().trim());
              await tx.project.create({
                data: {
                  profileId: profile.id,
                  title: p.title,
                  description: p.description,
                  longDescription: p.longDescription || null,
                  technologies: p.technologies,
                  demoUrl: p.demoUrl || null,
                  githubUrl: p.githubUrl || null,
                  role: p.role || null,
                  featured: Boolean(p.featured),
                  orderIndex: orderIdx++,
                },
              });
            }
          }
        }
      }

      // 7. Import Languages
      if (shouldImport('languages') && validLanguages.length > 0) {
        if (mode === 'replace') {
          await tx.language.deleteMany({ where: { profileId: profile.id } });
          for (let i = 0; i < validLanguages.length; i++) {
            const lang = validLanguages[i];
            await tx.language.create({
              data: {
                profileId: profile.id,
                language: lang.language,
                proficiency: lang.proficiency,
                orderIndex: i,
              },
            });
          }
        } else {
          const existing = await tx.language.findMany({ where: { profileId: profile.id } });
          const existingKeys = new Set(existing.map((l: any) => l.language.toLowerCase().trim()));
          let orderIdx = existing.length;
          for (const lang of validLanguages) {
            if (!existingKeys.has(lang.language.toLowerCase().trim())) {
              existingKeys.add(lang.language.toLowerCase().trim());
              await tx.language.create({
                data: {
                  profileId: profile.id,
                  language: lang.language,
                  proficiency: lang.proficiency,
                  orderIndex: orderIdx++,
                },
              });
            }
          }
        }
      }

      // 8. Import Awards if present
      if (shouldImport('awards') && validAwards.length > 0) {
        if (mode === 'replace') {
          await tx.award.deleteMany({ where: { profileId: profile.id } });
          for (let i = 0; i < validAwards.length; i++) {
            const a = validAwards[i];
            await tx.award.create({
              data: {
                profileId: profile.id,
                title: a.title,
                organization: a.organization,
                date: a.date,
                description: a.description || null,
                orderIndex: i,
              },
            });
          }
        }
      }

      // 9. Import Publications if present
      if (shouldImport('publications') && validPublications.length > 0) {
        if (mode === 'replace') {
          await tx.publication.deleteMany({ where: { profileId: profile.id } });
          for (let i = 0; i < validPublications.length; i++) {
            const pub = validPublications[i];
            await tx.publication.create({
              data: {
                profileId: profile.id,
                title: pub.title,
                publisher: pub.publisher,
                date: pub.date,
                url: pub.url || null,
                description: pub.description || null,
                orderIndex: i,
              },
            });
          }
        }
      }

      // 10. Import References if present
      if (shouldImport('references') && validReferences.length > 0) {
        if (mode === 'replace') {
          await tx.reference.deleteMany({ where: { profileId: profile.id } });
          for (let i = 0; i < validReferences.length; i++) {
            const ref = validReferences[i];
            await tx.reference.create({
              data: {
                profileId: profile.id,
                name: ref.name,
                position: ref.position,
                organization: ref.organization,
                email: ref.email,
                phone: ref.phone,
                relationship: ref.relationship,
                isPublic: false,
                orderIndex: i,
              },
            });
          }
        } else {
          const existing = await tx.reference.findMany({ where: { profileId: profile.id } });
          const existingKeys = new Set(existing.map((r: any) => r.name.toLowerCase().trim()));
          let orderIdx = existing.length;
          for (const ref of validReferences) {
            if (!existingKeys.has(ref.name.toLowerCase().trim())) {
              existingKeys.add(ref.name.toLowerCase().trim());
              await tx.reference.create({
                data: {
                  profileId: profile.id,
                  name: ref.name,
                  position: ref.position,
                  organization: ref.organization,
                  email: ref.email,
                  phone: ref.phone,
                  relationship: ref.relationship,
                  isPublic: false,
                  orderIndex: orderIdx++,
                },
              });
            }
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

    // Return complete updated profile
    return ProfileService.getProfileByUserId(userId);
  }
}
