import crypto from 'crypto';
import { config } from '../config/env';
import { logger } from '../config/logger';
import { AiExtractor } from '../extractors/aiExtractor';
import { HeuristicExtractor } from '../extractors/heuristic';
import { ContactNormalizer } from '../normalizers/contactNormalizer';
import { DateNormalizer } from '../normalizers/dateNormalizer';
import { SkillNormalizer } from '../normalizers/skillNormalizer';
import { UrlNormalizer } from '../normalizers/urlNormalizer';
import {
  ExtractedCvData
} from './ocr-cv.service';
import {
  FieldEvidence,
  QualityScoreReport,
  StructuredResume
} from '../types/schema';

export interface ScanEngineOptions {
  forceEngine?: 'gemini' | 'heuristic';
  layoutSummary?: string;
  ocrApplied?: boolean;
}

export class ScanEngine {
  /**
   * Main entrypoint for CV-SCAN processing.
   * Runs AI extraction with Gemini 1.5 Flash -> Fallback to Heuristic rules -> Normalization -> Quality Scoring.
   */
  public static async processScan(
    rawText: string,
    options: ScanEngineOptions = {}
  ): Promise<StructuredResume> {
    const startTime = Date.now();
    const extractionEngine = options.forceEngine || config.extractionEngine || 'gemini';
    const hasGeminiKey = Boolean(config.geminiApiKey || process.env.GEMINI_API_KEY);

    let extracted: Partial<StructuredResume> | null = null;
    let engineUsed: 'gemini' | 'heuristic' = 'heuristic';

    // ─────────────────────────────────────────────────────────────
    // STEP 1: AI Extraction (Gemini 1.5 Flash)
    // ─────────────────────────────────────────────────────────────
    if (extractionEngine === 'gemini' && hasGeminiKey) {
      try {
        logger.info('[ScanEngine] Initiating AI Extraction with Google Gemini Flash...');
        extracted = await AiExtractor.extractWithGemini(rawText, options.layoutSummary);
        if (extracted) {
          engineUsed = 'gemini';
        }
      } catch (err: any) {
        logger.warn(`[ScanEngine] Gemini extraction threw an error: ${err.message}. Falling back to heuristics.`);
        extracted = null;
      }
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 2: Heuristic Fallback
    // ─────────────────────────────────────────────────────────────
    if (!extracted) {
      logger.info('[ScanEngine] Running deterministic Heuristic Rule Extractors...');
      extracted = HeuristicExtractor.extract(rawText);
      engineUsed = 'heuristic';
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 3: Deterministic Validation & Normalization
    // ─────────────────────────────────────────────────────────────
    const normalized = this.applyNormalizers(extracted, rawText, engineUsed, Date.now() - startTime, options.ocrApplied);

    // ─────────────────────────────────────────────────────────────
    // STEP 4: Quality Scoring & Confidence Assessment
    // ─────────────────────────────────────────────────────────────
    normalized.qualityScore = this.computeQualityScore(normalized, rawText);

    logger.info(`[ScanEngine] Extraction completed with engine=${engineUsed}, overallQualityScore=${normalized.qualityScore.overall}/100.`);

    return normalized;
  }

  /**
   * Applies all normalizers to enforce strict canonical formatting.
   */
  private static applyNormalizers(
    rawObj: Partial<StructuredResume>,
    rawText: string,
    engineUsed: 'gemini' | 'heuristic',
    durationMs: number,
    ocrApplied = false
  ): StructuredResume {
    const rawIdentity = rawObj.identity || { fullName: '', title: '', headline: '', summary: '', location: { raw: '' } };
    const rawContact = rawObj.contact || { emails: [], phones: [], location: { raw: '' } };

    // Check if raw contact phones had a PO Box candidate (e.g. 284-00900)
    const poBoxFromPhones = ContactNormalizer.extractPoBoxCandidate(rawContact.phones || []);
    let initialLocation = rawIdentity.location || rawContact.location || { raw: '' };
    if (poBoxFromPhones && !initialLocation.raw?.includes(poBoxFromPhones)) {
      initialLocation = {
        ...initialLocation,
        raw: initialLocation.raw ? `${poBoxFromPhones}, ${initialLocation.raw}` : poBoxFromPhones,
      };
    }

    const normalizedLocation = ContactNormalizer.normalizeLocation(initialLocation);
    const normalizedEmails = ContactNormalizer.normalizeEmails(rawContact.emails);
    let normalizedPhones = ContactNormalizer.normalizePhones(rawContact.phones);

    // Fallback: If no valid phone was found (or if a PO Box was stripped from phones), recover from rawText
    if (normalizedPhones.length === 0 && rawText) {
      normalizedPhones = ContactNormalizer.recoverPhonesFromText(rawText);
    }

    const normalizedProfiles = UrlNormalizer.normalizeProfiles(rawObj.profiles);
    const normalizedSkills = SkillNormalizer.normalizeSkills(rawObj.skills);

    const normalizedExperience = (rawObj.workExperience || []).map((exp) => ({
      id: exp.id || crypto.randomUUID(),
      company: exp.company || 'Company',
      jobTitle: exp.jobTitle || 'Role',
      location: exp.location || null,
      startDate: DateNormalizer.normalize(exp.startDate) || { raw: '' },
      endDate: exp.current ? null : (DateNormalizer.normalize(exp.endDate) || null),
      current: Boolean(exp.current),
      responsibilities: Array.isArray(exp.responsibilities) ? exp.responsibilities : [],
      achievements: Array.isArray(exp.achievements) ? exp.achievements : [],
      technologies: Array.isArray(exp.technologies) ? exp.technologies : [],
    }));

    const normalizedEducation = (rawObj.education || []).map((edu) => ({
      id: edu.id || crypto.randomUUID(),
      institution: edu.institution || '',
      degree: edu.degree || '',
      fieldOfStudy: edu.fieldOfStudy || null,
      startDate: DateNormalizer.normalize(edu.startDate) || null,
      endDate: DateNormalizer.normalize(edu.endDate) || null,
      honors: Array.isArray(edu.honors) ? edu.honors : [],
      gpa: edu.gpa != null ? (typeof edu.gpa === 'number' ? edu.gpa : String(edu.gpa)) : null,
      grade: edu.grade != null ? (typeof edu.grade === 'number' ? edu.grade : String(edu.grade)) : (edu.gpa != null ? (typeof edu.gpa === 'number' ? edu.gpa : String(edu.gpa)) : null),
      activities: Array.isArray(edu.activities) ? edu.activities : [],
    }));

    const normalizedCertifications = (rawObj.certifications || []).map((cert) => ({
      id: cert.id || crypto.randomUUID(),
      name: cert.name || '',
      issuer: cert.issuer || '',
      issueDate: DateNormalizer.normalize(cert.issueDate) || null,
      expiryDate: DateNormalizer.normalize(cert.expiryDate) || null,
      credentialId: cert.credentialId || null,
      credentialUrl: UrlNormalizer.cleanUrl(cert.credentialUrl) || null,
      doesNotExpire: Boolean(cert.doesNotExpire),
    }));

    const normalizedProjects = (rawObj.projects || []).map((proj) => ({
      id: proj.id || crypto.randomUUID(),
      name: proj.name || '',
      role: proj.role || null,
      startDate: DateNormalizer.normalize(proj.startDate) || null,
      endDate: proj.current ? null : (DateNormalizer.normalize(proj.endDate) || null),
      current: Boolean(proj.current),
      description: proj.description || '',
      highlights: Array.isArray(proj.highlights) ? proj.highlights : [],
      technologies: Array.isArray(proj.technologies) ? proj.technologies : [],
      url: UrlNormalizer.cleanUrl(proj.url) || null,
      repositoryUrl: UrlNormalizer.cleanUrl(proj.repositoryUrl) || null,
    }));

    const normalizedAwards = (rawObj.awards || []).map((award) => ({
      id: award.id || crypto.randomUUID(),
      title: award.title || '',
      issuer: award.issuer || null,
      date: DateNormalizer.normalize(award.date) || null,
      description: award.description || null,
    }));

    const normalizedLanguages = (rawObj.languages || []).map((lang) => ({
      id: lang.id || crypto.randomUUID(),
      language: lang.language || '',
      proficiency: lang.proficiency || 'PROFESSIONAL',
    }));

    const normalizedVolunteering = (rawObj.volunteering || []).map((v) => ({
      id: v.id || crypto.randomUUID(),
      organization: v.organization || '',
      role: v.role || '',
      startDate: DateNormalizer.normalize(v.startDate) || null,
      endDate: v.current ? null : (DateNormalizer.normalize(v.endDate) || null),
      current: Boolean(v.current),
      description: v.description || null,
      cause: v.cause || null,
    }));

    const normalizedPublications = (rawObj.publications || []).map((pub) => ({
      id: pub.id || crypto.randomUUID(),
      title: pub.title || '',
      publisher: pub.publisher || null,
      publicationDate: DateNormalizer.normalize(pub.publicationDate) || null,
      url: UrlNormalizer.cleanUrl(pub.url) || null,
      description: pub.description || null,
      authors: Array.isArray(pub.authors) ? pub.authors : [],
    }));

    const normalizedReferences = (rawObj.references || []).map((ref) => ({
      id: ref.id || crypto.randomUUID(),
      name: ref.name || '',
      title: ref.title || null,
      company: ref.company || null,
      email: ref.email || null,
      phone: ref.phone || null,
      relationship: ref.relationship || null,
      isAvailableUponRequest: Boolean(ref.isAvailableUponRequest),
    }));

    return {
      identity: {
        fullName: (rawIdentity.fullName || '').trim(),
        title: (rawIdentity.title || '').trim(),
        headline: (rawIdentity.headline || rawIdentity.title || '').trim(),
        summary: (rawIdentity.summary || '').trim(),
        location: normalizedLocation,
      },
      contact: {
        emails: normalizedEmails,
        phones: normalizedPhones,
        location: normalizedLocation,
      },
      profiles: normalizedProfiles,
      workExperience: normalizedExperience,
      education: normalizedEducation,
      skills: normalizedSkills,
      certifications: normalizedCertifications,
      projects: normalizedProjects,
      awards: normalizedAwards,
      languages: normalizedLanguages,
      volunteering: normalizedVolunteering,
      publications: normalizedPublications,
      references: normalizedReferences,
      customSections: Array.isArray(rawObj.customSections) ? rawObj.customSections : [],
      rawText,
      meta: {
        engineUsed,
        model: rawObj.meta?.model,
        processedAt: new Date().toISOString(),
        durationMs,
        ocrApplied,
      },
    };
  }

  /**
   * Computes an exhaustive Quality Score (0-100) and section-level confidence scores.
   */
  public static computeQualityScore(resume: StructuredResume, rawText: string): QualityScoreReport {
    let completenessScore = 0;
    let formatValidityScore = 0;
    const warnings: string[] = [];
    const sectionConfidence: Record<string, number> = {};
    const fieldEvidence: Record<string, FieldEvidence> = {};

    const createEvidence = (snippet: string, conf: number) => ({
      sourceSnippet: snippet.slice(0, 160),
      confidence: Math.min(1, Math.max(0, conf)),
    });

    // 1. Identity Evaluation (30 pts completeness)
    if (resume.identity.fullName) {
      completenessScore += 10;
      sectionConfidence['fullName'] = resume.meta?.engineUsed === 'gemini' ? 0.98 : 0.92;
      fieldEvidence['identity.fullName'] = createEvidence(resume.identity.fullName, sectionConfidence['fullName']);
    } else {
      warnings.push('Full name could not be identified with certainty.');
    }

    if (resume.identity.title || resume.identity.headline) {
      completenessScore += 10;
      sectionConfidence['title'] = resume.meta?.engineUsed === 'gemini' ? 0.95 : 0.88;
      fieldEvidence['identity.title'] = createEvidence(resume.identity.title || resume.identity.headline, sectionConfidence['title']);
    }

    if (resume.identity.summary && resume.identity.summary.length > 20) {
      completenessScore += 10;
      sectionConfidence['summary'] = resume.meta?.engineUsed === 'gemini' ? 0.96 : 0.85;
      fieldEvidence['identity.summary'] = createEvidence(resume.identity.summary, sectionConfidence['summary']);
    }

    // 2. Contacts Evaluation (20 pts completeness)
    if (resume.contact.emails.length > 0) {
      completenessScore += 10;
      formatValidityScore += 10;
      sectionConfidence['emails'] = 0.99;
      fieldEvidence['contact.emails'] = createEvidence(resume.contact.emails[0].email, 0.99);
    } else {
      warnings.push('No email address detected.');
    }

    if (resume.contact.phones.length > 0) {
      completenessScore += 5;
      formatValidityScore += 10;
      sectionConfidence['phones'] = 0.95;
      fieldEvidence['contact.phones'] = createEvidence(resume.contact.phones[0].phone, 0.95);
    }

    if (resume.contact.location.raw || resume.contact.location.city) {
      completenessScore += 5;
      sectionConfidence['location'] = 0.90;
      fieldEvidence['contact.location'] = createEvidence(resume.contact.location.raw, 0.90);
    }

    // 3. Work Experience Evaluation (20 pts completeness)
    if (resume.workExperience.length > 0) {
      completenessScore += 20;
      formatValidityScore += 20;
      sectionConfidence['workExperience'] = resume.meta?.engineUsed === 'gemini' ? 0.97 : 0.88;
      fieldEvidence['workExperience'] = createEvidence(
        `${resume.workExperience[0].jobTitle} at ${resume.workExperience[0].company}`,
        sectionConfidence['workExperience']
      );
    }

    // 4. Education Evaluation (15 pts completeness)
    if (resume.education.length > 0) {
      completenessScore += 15;
      formatValidityScore += 20;
      sectionConfidence['education'] = resume.meta?.engineUsed === 'gemini' ? 0.97 : 0.89;
      fieldEvidence['education'] = createEvidence(
        `${resume.education[0].degree} at ${resume.education[0].institution}`,
        sectionConfidence['education']
      );
    }

    // 5. Skills Evaluation (10 pts completeness)
    if (resume.skills.length >= 3) {
      completenessScore += 10;
      formatValidityScore += 20;
      sectionConfidence['skills'] = 0.95;
      fieldEvidence['skills'] = createEvidence(resume.skills.map((s) => s.name).slice(0, 5).join(', '), 0.95);
    } else if (resume.skills.length > 0) {
      completenessScore += 5;
      formatValidityScore += 10;
      sectionConfidence['skills'] = 0.80;
    }

    // 6. Profiles & Extra Sections (5 pts completeness + 20 format)
    const hasExtras =
      resume.projects.length > 0 ||
      resume.certifications.length > 0 ||
      resume.languages.length > 0 ||
      resume.awards.length > 0 ||
      resume.volunteering.length > 0 ||
      resume.publications.length > 0;

    if (hasExtras) {
      completenessScore += 5;
      formatValidityScore += 20;
    }

    completenessScore = Math.min(100, completenessScore);
    formatValidityScore = Math.min(100, formatValidityScore);

    const overall = Math.round(completenessScore * 0.6 + formatValidityScore * 0.4);

    return {
      overall,
      completeness: completenessScore,
      formatValidity: formatValidityScore,
      sectionConfidence,
      fieldEvidence,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Adapts StructuredResume into ExtractedCvData for backward compatibility with Portfolio's DB importer.
   */
  public static toExtractedCvData(resume: StructuredResume): ExtractedCvData {
    const primaryEmail = resume.contact.emails.find((e) => e.isPrimary)?.email || resume.contact.emails[0]?.email || '';
    const primaryPhone = resume.contact.phones.find((p) => p.isPrimary)?.phone || resume.contact.phones[0]?.phone || '';

    return {
      personalInfo: {
        fullName: resume.identity.fullName,
        title: resume.identity.title,
        email: primaryEmail,
        phone: primaryPhone,
        location: resume.identity.location.raw || resume.identity.location.city || '',
        address: resume.identity.location.raw || undefined,
        website: resume.profiles.website || undefined,
        linkedin: resume.profiles.linkedin || undefined,
        github: resume.profiles.github || undefined,
        twitter: resume.profiles.twitter || undefined,
        behance: resume.profiles.behance || undefined,
        dribbble: resume.profiles.dribbble || undefined,
      },
      headline: resume.identity.headline,
      summary: resume.identity.summary,
      experiences: resume.workExperience.map((exp) => ({
        company: exp.company,
        position: exp.jobTitle,
        location: exp.location || undefined,
        startDate: typeof exp.startDate === 'object' ? exp.startDate.raw : exp.startDate,
        endDate: typeof exp.endDate === 'object' && exp.endDate ? exp.endDate.raw : (exp.endDate || undefined),
        isCurrent: exp.current,
        description: exp.responsibilities.join('\n'),
        responsibilities: exp.responsibilities,
        achievements: exp.achievements,
      })),
      education: resume.education.map((edu) => ({
        institution: edu.institution,
        qualification: edu.degree,
        field: edu.fieldOfStudy || undefined,
        startDate: typeof edu.startDate === 'object' && edu.startDate ? edu.startDate.raw : (edu.startDate || ''),
        endDate: typeof edu.endDate === 'object' && edu.endDate ? edu.endDate.raw : (edu.endDate || undefined),
        isCurrent: false,
        grade: edu.grade || edu.gpa ? String(edu.grade || edu.gpa) : undefined,
        description: edu.activities.join('\n') || undefined,
      })),
      skills: resume.skills.map((skill) => {
        let category: 'Technical' | 'Soft' | 'Tool' | 'Industry' = 'Technical';
        if (skill.category === 'SOFT') category = 'Soft';
        else if (skill.category === 'TOOL') category = 'Tool';
        else if (skill.category === 'DOMAIN') category = 'Industry';

        let level: 'Beginner' | 'Intermediate' | 'Expert' | undefined;
        if (skill.proficiency === 'BEGINNER') level = 'Beginner';
        else if (skill.proficiency === 'INTERMEDIATE') level = 'Intermediate';
        else if (skill.proficiency === 'ADVANCED' || skill.proficiency === 'EXPERT') level = 'Expert';

        return {
          name: skill.name,
          category,
          proficiency: null,
          level,
        };
      }),
      projects: resume.projects.map((proj) => ({
        title: proj.name,
        description: proj.description,
        longDescription: proj.highlights.join('\n') || undefined,
        technologies: proj.technologies,
        demoUrl: proj.url || undefined,
        githubUrl: proj.repositoryUrl || undefined,
        role: proj.role || undefined,
        featured: false,
      })),
      certifications: resume.certifications.map((cert) => ({
        name: cert.name,
        issuingOrganization: cert.issuer,
        issueDate: typeof cert.issueDate === 'object' && cert.issueDate ? cert.issueDate.raw : (cert.issueDate || ''),
        expiryDate: typeof cert.expiryDate === 'object' && cert.expiryDate ? cert.expiryDate.raw : (cert.expiryDate || undefined),
        credentialId: cert.credentialId || undefined,
        credentialUrl: cert.credentialUrl || undefined,
      })),
      languages: resume.languages.map((lang) => {
        let prof: 'Native' | 'Fluent' | 'Professional' | 'Intermediate' | 'Basic' = 'Professional';
        if (lang.proficiency === 'NATIVE') prof = 'Native';
        else if (lang.proficiency === 'FLUENT') prof = 'Fluent';
        else if (lang.proficiency === 'INTERMEDIATE') prof = 'Intermediate';
        else if (lang.proficiency === 'BASIC') prof = 'Basic';
        return {
          language: lang.language,
          proficiency: prof,
        };
      }),
      references: (resume.references || []).map((ref) => ({
        name: ref.name,
        position: ref.title || '',
        organization: ref.company || '',
        email: ref.email || undefined,
        phone: ref.phone || undefined,
        relationship: ref.relationship || undefined,
      })),
      fieldEvidence: resume.qualityScore?.fieldEvidence
        ? Object.fromEntries(
            Object.entries(resume.qualityScore.fieldEvidence).map(([k, v]) => [k, { sourceSnippet: v.sourceSnippet, confidence: v.confidence }])
          )
        : undefined,
    };
  }
}
