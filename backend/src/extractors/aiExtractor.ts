import { GoogleGenAI } from '@google/genai';
import crypto from 'crypto';
import { config } from '../config/env';
import { logger } from '../config/logger';
import { ContactNormalizer } from '../normalizers/contactNormalizer';
import { DateNormalizer } from '../normalizers/dateNormalizer';
import { StructuredResume } from '../types/schema';

export class AiExtractor {
  /**
   * Extracts full structured resume data from raw document text strictly using Google Gemini AI.
   * Throws an explicit error if the API key is missing or extraction fails — NO heuristic fallback.
   */
  public static async extractWithGemini(
    rawText: string,
    layoutSummary?: string
  ): Promise<Partial<StructuredResume>> {
    const apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      logger.error('[AiExtractor] GEMINI_API_KEY is missing. Strict Gemini AI extraction cannot proceed.');
      throw new Error('GEMINI_API_KEY is not configured in the server environment. Please configure your Google Gemini API key to enable CV extraction.');
    }

    if (!rawText || rawText.trim().length < 20) {
      throw new Error('Provided CV document text is empty or too short for extraction.');
    }

    const configuredModel = config.geminiModel || process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    let initialModel = configuredModel;
    if (initialModel === 'gemini-3.6-flash' || initialModel === 'gemini-flash') {
      initialModel = 'gemini-2.5-flash';
    }

    try {
      const ai = new GoogleGenAI({ apiKey });


      const systemPrompt = `You are a world-class Document Intelligence and CV Extraction Engine.
Your task is to extract every single detail from the provided CV/Resume text with 99%+ fidelity and deterministic accuracy.

CRITICAL EXTRACTION RULES:
1. ZERO HALLUCINATIONS: Only extract facts explicitly stated in the document text. Never guess, assume, or invent data. If a field or value is not present in the CV, output null or an empty array.
2. FAITHFUL SUMMARIES: In the summary field, preserve the candidate's exact wording or faithful distillation. Do not fabricate experience.
3. STRUCTURED DATES: All dates (startDate, endDate, issueDate, expiryDate, publicationDate, award date) must be formatted as an object: {"raw": "Original string", "year": number | null, "month": number | null, "isCurrent": boolean}.
4. CATEGORIZED TAXONOMY:
   - Skill category MUST be one of: "PROGRAMMING_LANGUAGE", "FRAMEWORK", "DATABASE", "CLOUD", "TOOL", "SOFT", "DOMAIN", "OTHER".
   - Skill proficiency (if mentioned) MUST be: "BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT", or null.
   - Language proficiency MUST be one of: "NATIVE", "FLUENT", "PROFESSIONAL", "INTERMEDIATE", "BASIC". Map CEFR levels (C1/C2 -> "PROFESSIONAL", B1/B2 -> "INTERMEDIATE", A1/A2 -> "BASIC").
   - Email type MUST be one of: "WORK", "PERSONAL", "OTHER".
   - Phone type MUST be one of: "MOBILE", "HOME", "WORK", "OTHER".
5. PHONE NUMBER & ADDRESS DISAMBIGUATION (STRICT):
   - A phone number MUST be a genuine telephone number consisting of at least 10 digits (for local numbers starting with 0, e.g., 0712345678, 0112345678, 0201234567) or at least 9 digits with a country code (starting with + or 00, e.g., +254712345678, +1-555-123-4567).
   - P.O. Box numbers, postal codes, and box-postal combinations (e.g., "284-00900", "P.O. Box 284-00900", "Box 12345-00100", "P.O. BOX 284, 00900", "00100", "00900") are ADDRESS / POSTAL LOCATION elements, NEVER phone numbers!
   - NEVER output a P.O. Box or postal code into "contact.phones", "phone", or a referee's phone. Place P.O. Box and postal codes strictly in "location.raw" and "location.postalCode".
   - When a CV contains BOTH an address/P.O. Box (e.g., "P.O. Box 284-00900 Kiambu") and a phone number (e.g., "+254 712 345 678" or "0712345678"), you MUST extract the phone number into "contact.phones" and the P.O. Box into "location". NEVER drop or omit the candidate's phone number.
6. CERTIFICATIONS, CERTIFICATES & CREDENTIALS EXTRACTION (EXHAUSTIVE & ACCURATE):
   - Scan the entire document for any professional certifications, certificates of completion, licenses, accreditations, short courses, specialized training, and bootcamps.
   - Look under headers like "Certifications", "Certificates", "Credentials", "Professional Training", "Licenses", "Courses", or even within "Education" or "Professional Development".
   - Examples include: AWS (Solutions Architect, Developer, Cloud Practitioner, DevOps), Microsoft (Azure, MCSA, MCSE), Google (GCP Associate/Professional, CyberSecurity, Data Analytics), Cisco (CCNA, CCNP, CCIE), CompTIA (Security+, Network+, A+), Oracle, PMP / PMI, Certified ScrumMaster (CSM), ITIL, KASNEB (CPA, CIFA, CS), Coursera, Udemy, edX, LinkedIn Learning, freeCodeCamp, ALX, Moringa School, or any university certificate/diploma programs.
   - For each entry, extract:
     - "name": Full certificate or credential title (e.g. "AWS Certified Solutions Architect – Associate", "Professional Scrum Master I").
     - "issuer": Issuing body, tech vendor, platform, or academic institution (e.g. "Amazon Web Services", "Microsoft", "Scrum.org", "Coursera / Google").
     - "issueDate": Structured date object with raw string and year/month.
     - "expiryDate": Structured date object if certificate expires, otherwise null.
     - "credentialId": Verification code, license number, or certificate ID if stated in text.
     - "credentialUrl": Verification URL, link, or badge link if present.
     - "doesNotExpire": true if the certificate does not expire or has no expiry date.
7. LANGUAGES EXTRACTION:
   - Extract ALL languages mentioned in the CV (e.g. English, Swahili, French, German, Spanish, Arabic, Chinese, etc.).
   - Accurately determine proficiency level: "NATIVE", "FLUENT", "PROFESSIONAL", "INTERMEDIATE", or "BASIC".
8. REFEREES & REFERENCES EXTRACTION (COMPREHENSIVE):
   - Extract ALL referees / references provided in the document.
   - For each referee, extract:
     - "name": Full name of the referee (preserve professional titles/prefixes such as Dr., Prof., Eng., Mr., Ms., Mrs. if present).
     - "title": Job title / position / academic rank (e.g. "Senior Software Architect", "Head of Department", "Associate Professor").
     - "company": Organization, university, company, or institution name.
     - "email": Contact email address.
     - "phone": Contact telephone number (apply phone disambiguation; exclude PO box strings).
     - "relationship": Working relationship if specified (e.g. "Former Supervisor", "Direct Manager", "Academic Mentor").
     - If the CV explicitly states "Available upon request" or "References available on request", output a single reference object with "name": "Available Upon Request", "isAvailableUponRequest": true.
9. SECTION DETECTIONS:
   - Identify Work Experience, Education, Skills, Certifications, Projects, Awards, Languages, Volunteering, Publications, References.
   - Any non-standard or custom section (e.g. "Speaking Engagements", "Patents", "Interests", "Affiliations") MUST be captured in "customSections" as {"sectionName": string, "items": string[], "content": string}.

OUTPUT JSON SCHEMA:
{
  "identity": {
    "fullName": string,
    "title": string,
    "headline": string,
    "summary": string,
    "location": {
      "raw": string,
      "city": string | null,
      "state": string | null,
      "country": string | null,
      "postalCode": string | null
    }
  },
  "contact": {
    "emails": [
      { "email": string, "type": "WORK" | "PERSONAL" | "OTHER", "isPrimary": boolean }
    ],
    "phones": [
      { "phone": string, "formatted": string | null, "type": "MOBILE" | "HOME" | "WORK" | "OTHER", "isPrimary": boolean }
    ],
    "location": {
      "raw": string,
      "city": string | null,
      "state": string | null,
      "country": string | null,
      "postalCode": string | null
    }
  },
  "profiles": {
    "linkedin": string | null,
    "github": string | null,
    "gitlab": string | null,
    "twitter": string | null,
    "behance": string | null,
    "dribbble": string | null,
    "medium": string | null,
    "stackoverflow": string | null,
    "youtube": string | null,
    "orcid": string | null,
    "website": string | null,
    "other": [ { "platform": string, "url": string } ]
  },
  "workExperience": [
    {
      "company": string,
      "jobTitle": string,
      "location": string | null,
      "startDate": { "raw": string, "year": number | null, "month": number | null, "isCurrent": boolean },
      "endDate": { "raw": string, "year": number | null, "month": number | null, "isCurrent": boolean } | null,
      "current": boolean,
      "responsibilities": string[],
      "achievements": string[],
      "technologies": string[]
    }
  ],
  "education": [
    {
      "institution": string,
      "degree": string,
      "fieldOfStudy": string | null,
      "startDate": { "raw": string, "year": number | null, "month": number | null, "isCurrent": boolean } | null,
      "endDate": { "raw": string, "year": number | null, "month": number | null, "isCurrent": boolean } | null,
      "honors": string[],
      "gpa": string | null,
      "grade": string | null,
      "activities": string[]
    }
  ],
  "skills": [
    {
      "name": string,
      "category": "PROGRAMMING_LANGUAGE" | "FRAMEWORK" | "DATABASE" | "CLOUD" | "TOOL" | "SOFT" | "DOMAIN" | "OTHER",
      "proficiency": "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT" | null,
      "yearsOfExperience": number | null
    }
  ],
  "certifications": [
    {
      "name": string,
      "issuer": string,
      "issueDate": { "raw": string, "year": number | null, "month": number | null, "isCurrent": boolean } | null,
      "expiryDate": { "raw": string, "year": number | null, "month": number | null, "isCurrent": boolean } | null,
      "credentialId": string | null,
      "credentialUrl": string | null,
      "doesNotExpire": boolean
    }
  ],
  "projects": [
    {
      "name": string,
      "role": string | null,
      "startDate": { "raw": string, "year": number | null, "month": number | null, "isCurrent": boolean } | null,
      "endDate": { "raw": string, "year": number | null, "month": number | null, "isCurrent": boolean } | null,
      "current": boolean,
      "description": string,
      "highlights": string[],
      "technologies": string[],
      "url": string | null,
      "repositoryUrl": string | null
    }
  ],
  "awards": [
    {
      "title": string,
      "issuer": string | null,
      "date": { "raw": string, "year": number | null, "month": number | null, "isCurrent": boolean } | null,
      "description": string | null
    }
  ],
  "languages": [
    {
      "language": string,
      "proficiency": "NATIVE" | "FLUENT" | "PROFESSIONAL" | "INTERMEDIATE" | "BASIC"
    }
  ],
  "volunteering": [
    {
      "organization": string,
      "role": string,
      "startDate": { "raw": string, "year": number | null, "month": number | null, "isCurrent": boolean } | null,
      "endDate": { "raw": string, "year": number | null, "month": number | null, "isCurrent": boolean } | null,
      "current": boolean,
      "description": string | null,
      "cause": string | null
    }
  ],
  "publications": [
    {
      "title": string,
      "publisher": string | null,
      "publicationDate": { "raw": string, "year": number | null, "month": number | null, "isCurrent": boolean } | null,
      "url": string | null,
      "description": string | null,
      "authors": string[]
    }
  ],
  "references": [
    {
      "name": string,
      "title": string | null,
      "company": string | null,
      "email": string | null,
      "phone": string | null,
      "relationship": string | null,
      "isAvailableUponRequest": boolean
    }
  ],
  "customSections": [
    {
      "sectionName": string,
      "items": string[],
      "content": string
    }
  ]
}
`;

      const userContent = layoutSummary
        ? `LAYOUT SUMMARY:\n${layoutSummary}\n\nDOCUMENT TEXT:\n${rawText}`
        : `DOCUMENT TEXT:\n${rawText}`;

      const candidateModels = [initialModel];
      for (const fallbackModel of ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash']) {
        if (!candidateModels.includes(fallbackModel)) {
          candidateModels.push(fallbackModel);
        }
      }

      let text: string | null = null;
      let usedModel = initialModel;
      let durationMs = 0;
      let lastCallError: any = null;

      for (const targetModel of candidateModels) {
        let brokeToNextModel = false;
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            logger.info(`[AiExtractor] Calling Gemini (${targetModel}, attempt ${attempt}/3)...`);
            const startTime = Date.now();
            const result = await ai.models.generateContent({
              model: targetModel,
              contents: `${systemPrompt}\n\n${userContent}`,
              config: {
                responseMimeType: 'application/json',
                temperature: 0.1,
              },
            });

            durationMs = Date.now() - startTime;
            // Safely extract text — result.text throws if candidates are empty
            try {
              text = result.text ?? null;
            } catch {
              text = null;
            }
            if (!text) {
              // Gemini returned an empty candidate — treat as transient and retry
              lastCallError = new Error('Gemini returned empty output (no text in candidates)');
              logger.warn(`[AiExtractor] Model ${targetModel} returned empty output on attempt ${attempt}/3. Retrying...`);
              if (attempt < 3) {
                await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
                continue;
              }
              // Exhausted retries — try next model
              brokeToNextModel = true;
              break;
            }
            usedModel = targetModel;
            break;
          } catch (callErr: any) {
            lastCallError = callErr;
            const errStr = callErr?.message || String(callErr);
            const is503 = errStr.includes('503') || errStr.includes('high demand') || errStr.includes('UNAVAILABLE');
            const is404 = errStr.includes('404') || errStr.includes('not found');
            // Empty output error from SDK — retryable
            const isEmptyOutput = errStr.includes('model output must contain') || errStr.includes('output text or tool calls');

            if ((is503 || isEmptyOutput) && attempt < 3) {
              const delay = attempt * 1500;
              logger.warn(`[AiExtractor] Model ${targetModel} returned retryable error (attempt ${attempt}/3): ${errStr}. Retrying in ${delay}ms...`);
              await new Promise((resolve) => setTimeout(resolve, delay));
              continue;
            }
            if ((is503 || is404 || isEmptyOutput) && targetModel !== candidateModels[candidateModels.length - 1]) {
              logger.warn(`[AiExtractor] Model ${targetModel} unavailable/empty (${errStr}). Trying next candidate model in chain...`);
              brokeToNextModel = true;
              break; // Try next candidate model
            }
            throw callErr;
          }
        }
        if (text) break;
        if (!brokeToNextModel) break; // Unexpected exit — stop the outer loop
      }

      if (!text) {
        throw new Error(`Google Gemini returned an empty response. Last error: ${lastCallError?.message || 'No response body'}`);
      }

      // Parse JSON from response — strip markdown fences if present
      const jsonStr = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
      const parsed = JSON.parse(jsonStr);
      logger.info(`[AiExtractor] Successfully extracted CV using ${usedModel} in ${durationMs}ms.`);

      return this.postProcessGeminiOutput(parsed, durationMs, usedModel, rawText);
    } catch (error: any) {
      const errMsg = error?.message || String(error);
      logger.error(`[AiExtractor] Gemini extraction failed: ${errMsg}`);
      if (errMsg.includes('API_KEY_INVALID') || errMsg.includes('API key not valid')) {
        logger.error('[AiExtractor] ❌ Your GEMINI_API_KEY is invalid or expired.');
        throw new Error('Google Gemini API key is invalid or expired. Please check your GEMINI_API_KEY environment variable.');
      } else if (errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) {
        logger.error('[AiExtractor] ⚠ Gemini API quota exceeded.');
        throw new Error('Google Gemini API quota exceeded. Please check your Google Cloud / AI Studio quota.');
      } else if (errMsg.includes('PERMISSION_DENIED') || errMsg.includes('403')) {
        logger.error('[AiExtractor] ❌ Permission denied accessing Google Gemini API.');
        throw new Error('Permission denied accessing Google Gemini API. Please check your API key permissions.');
      }
      throw error;
    }
  }

  private static postProcessGeminiOutput(
    data: any,
    durationMs: number,
    modelName: string,
    rawText?: string
  ): Partial<StructuredResume> {
    const ensureId = (item: any) => ({
      ...item,
      id: item?.id || crypto.randomUUID(),
    });

    const normalizeDate = (d: any) => (d ? DateNormalizer.normalize(d) : null);

    // Check if any raw phone candidate was actually a P.O. Box
    const rawPhones = Array.isArray(data.contact?.phones) ? data.contact.phones : [];
    const poBoxInPhones = ContactNormalizer.extractPoBoxCandidate(rawPhones);

    // Normalize location, enriching with PO box if found in phone candidates
    let initialLocation = data.contact?.location || data.identity?.location || { raw: '' };
    if (typeof initialLocation === 'string') {
      initialLocation = { raw: initialLocation };
    }
    if (poBoxInPhones && !initialLocation.raw?.includes(poBoxInPhones)) {
      initialLocation.raw = initialLocation.raw ? `${poBoxInPhones}, ${initialLocation.raw}` : poBoxInPhones;
    }
    const normalizedLocation = ContactNormalizer.normalizeLocation(initialLocation);

    // Normalize phones with strict validation
    let normalizedPhones = ContactNormalizer.normalizePhones(rawPhones);

    // Fallback: If no valid phone was captured by AI (or if a PO Box was stripped), recover from text
    if (normalizedPhones.length === 0 && rawText) {
      normalizedPhones = ContactNormalizer.recoverPhonesFromText(rawText);
    }

    return {
      identity: {
        fullName: data.identity?.fullName || '',
        title: data.identity?.title || '',
        headline: data.identity?.headline || data.identity?.title || '',
        summary: data.identity?.summary || '',
        location: normalizedLocation,
      },
      contact: {
        emails: Array.isArray(data.contact?.emails) ? data.contact.emails : [],
        phones: normalizedPhones,
        location: normalizedLocation,
      },
      profiles: data.profiles || {},
      workExperience: Array.isArray(data.workExperience)
        ? data.workExperience.map((exp: any) => ({
            ...ensureId(exp),
            company: exp.company || 'Company',
            jobTitle: exp.jobTitle || 'Role',
            location: exp.location || null,
            startDate: normalizeDate(exp.startDate) || { raw: '' },
            endDate: exp.current ? null : normalizeDate(exp.endDate),
            current: Boolean(exp.current),
            responsibilities: Array.isArray(exp.responsibilities) ? exp.responsibilities : [],
            achievements: Array.isArray(exp.achievements) ? exp.achievements : [],
            technologies: Array.isArray(exp.technologies) ? exp.technologies : [],
          }))
        : [],
      education: Array.isArray(data.education)
        ? data.education.map((edu: any) => ({
            ...ensureId(edu),
            institution: edu.institution || '',
            degree: edu.degree || '',
            fieldOfStudy: edu.fieldOfStudy || null,
            startDate: normalizeDate(edu.startDate),
            endDate: normalizeDate(edu.endDate),
            honors: Array.isArray(edu.honors) ? edu.honors : [],
            gpa: edu.gpa || null,
            grade: edu.grade || edu.gpa || null,
            activities: Array.isArray(edu.activities) ? edu.activities : [],
          }))
        : [],
      skills: Array.isArray(data.skills)
        ? data.skills.map((skill: any) => ({
            ...ensureId(skill),
            name: skill.name || '',
            category: skill.category || 'OTHER',
            proficiency: skill.proficiency || undefined,
            yearsOfExperience: typeof skill.yearsOfExperience === 'number' ? skill.yearsOfExperience : null,
          }))
        : [],
      certifications: Array.isArray(data.certifications)
        ? data.certifications.map((cert: any) => ({
            ...ensureId(cert),
            name: cert.name || '',
            issuer: cert.issuer || '',
            issueDate: normalizeDate(cert.issueDate),
            expiryDate: normalizeDate(cert.expiryDate),
            credentialId: cert.credentialId || null,
            credentialUrl: cert.credentialUrl || null,
            doesNotExpire: Boolean(cert.doesNotExpire),
          }))
        : [],
      projects: Array.isArray(data.projects)
        ? data.projects.map((proj: any) => ({
            ...ensureId(proj),
            name: proj.name || '',
            role: proj.role || null,
            startDate: normalizeDate(proj.startDate),
            endDate: proj.current ? null : normalizeDate(proj.endDate),
            current: Boolean(proj.current),
            description: proj.description || '',
            highlights: Array.isArray(proj.highlights) ? proj.highlights : [],
            technologies: Array.isArray(proj.technologies) ? proj.technologies : [],
            url: proj.url || null,
            repositoryUrl: proj.repositoryUrl || null,
          }))
        : [],
      awards: Array.isArray(data.awards)
        ? data.awards.map((award: any) => ({
            ...ensureId(award),
            title: award.title || '',
            issuer: award.issuer || null,
            date: normalizeDate(award.date),
            description: award.description || null,
          }))
        : [],
      languages: Array.isArray(data.languages)
        ? data.languages.map((lang: any) => ({
            ...ensureId(lang),
            language: lang.language || '',
            proficiency: lang.proficiency || 'PROFESSIONAL',
          }))
        : [],
      volunteering: Array.isArray(data.volunteering)
        ? data.volunteering.map((v: any) => ({
            ...ensureId(v),
            organization: v.organization || '',
            role: v.role || '',
            startDate: normalizeDate(v.startDate),
            endDate: v.current ? null : normalizeDate(v.endDate),
            current: Boolean(v.current),
            description: v.description || null,
            cause: v.cause || null,
          }))
        : [],
      publications: Array.isArray(data.publications)
        ? data.publications.map((pub: any) => ({
            ...ensureId(pub),
            title: pub.title || '',
            publisher: pub.publisher || null,
            publicationDate: normalizeDate(pub.publicationDate),
            url: pub.url || null,
            description: pub.description || null,
            authors: Array.isArray(pub.authors) ? pub.authors : [],
          }))
        : [],
      references: Array.isArray(data.references)
        ? data.references.map((ref: any) => ({
            ...ensureId(ref),
            name: ref.name || '',
            title: ref.title || null,
            company: ref.company || null,
            email: ref.email || null,
            phone: ref.phone || null,
            relationship: ref.relationship || null,
            isAvailableUponRequest: Boolean(ref.isAvailableUponRequest),
          }))
        : [],
      customSections: Array.isArray(data.customSections)
        ? data.customSections.map((sec: any) => ({
            sectionName: sec.sectionName || 'Custom Section',
            items: Array.isArray(sec.items) ? sec.items : undefined,
            content: sec.content || undefined,
          }))
        : [],
      meta: {
        engineUsed: 'gemini',
        model: modelName,
        processedAt: new Date().toISOString(),
        durationMs,
      },
    };
  }
}
