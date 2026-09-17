/**
 * CV-SCAN Structured Resume Schema Contract
 * Provides exhaustive TypeScript interfaces and types for high-accuracy CV parsing.
 */

export type EmailType = 'WORK' | 'PERSONAL' | 'OTHER';
export type PhoneType = 'MOBILE' | 'HOME' | 'WORK' | 'OTHER';

export type SkillCategory = 
  | 'PROGRAMMING_LANGUAGE' 
  | 'FRAMEWORK' 
  | 'DATABASE' 
  | 'CLOUD' 
  | 'TOOL' 
  | 'SOFT' 
  | 'DOMAIN' 
  | 'OTHER';

export type SkillProficiency = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

export type LanguageProficiency = 'NATIVE' | 'FLUENT' | 'PROFESSIONAL' | 'INTERMEDIATE' | 'BASIC';

export interface StructuredDate {
  raw: string;
  year?: number | null;
  month?: number | null;
  isCurrent?: boolean;
}

export interface EmailContact {
  email: string;
  type: EmailType;
  isPrimary: boolean;
}

export interface PhoneContact {
  phone: string;
  formatted?: string;
  type: PhoneType;
  isPrimary: boolean;
}

export interface LocationInfo {
  raw: string;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
}

export interface SocialProfiles {
  linkedin?: string | null;
  github?: string | null;
  gitlab?: string | null;
  twitter?: string | null;
  behance?: string | null;
  dribbble?: string | null;
  medium?: string | null;
  stackoverflow?: string | null;
  youtube?: string | null;
  orcid?: string | null;
  website?: string | null;
  other?: Array<{ platform: string; url: string }> | Record<string, string>;
}

export interface WorkExperience {
  id: string;
  company: string;
  jobTitle: string;
  location?: string | null;
  startDate: StructuredDate | string;
  endDate?: StructuredDate | string | null;
  current: boolean;
  responsibilities: string[];
  achievements: string[];
  technologies: string[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy?: string | null;
  startDate?: StructuredDate | string | null;
  endDate?: StructuredDate | string | null;
  honors?: string[];
  gpa?: string | number | null;
  grade?: string | number | null;
  activities: string[];
}

export interface SkillItem {
  id: string;
  name: string;
  category: SkillCategory;
  proficiency?: SkillProficiency;
  yearsOfExperience?: number | null;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate?: StructuredDate | string | null;
  expiryDate?: StructuredDate | string | null;
  credentialId?: string | null;
  credentialUrl?: string | null;
  doesNotExpire?: boolean;
}

export interface Project {
  id: string;
  name: string;
  role?: string | null;
  startDate?: StructuredDate | string | null;
  endDate?: StructuredDate | string | null;
  current: boolean;
  description: string;
  highlights: string[];
  technologies: string[];
  url?: string | null;
  repositoryUrl?: string | null;
}

export interface Award {
  id: string;
  title: string;
  issuer?: string | null;
  date?: StructuredDate | string | null;
  description?: string | null;
}

export interface LanguageItem {
  id: string;
  language: string;
  proficiency: LanguageProficiency;
}

export interface Volunteering {
  id: string;
  organization: string;
  role: string;
  startDate?: StructuredDate | string | null;
  endDate?: StructuredDate | string | null;
  current: boolean;
  description?: string | null;
  cause?: string | null;
}

export interface Publication {
  id: string;
  title: string;
  publisher?: string | null;
  publicationDate?: StructuredDate | string | null;
  url?: string | null;
  description?: string | null;
  authors: string[];
}

export interface Reference {
  id: string;
  name: string;
  title?: string | null;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  relationship?: string | null;
  isAvailableUponRequest?: boolean;
}

export interface CustomSection {
  sectionName: string;
  items?: string[];
  content?: string;
}

export interface FieldEvidence {
  sourceSnippet: string;
  confidence: number;
  page?: number;
  coordinates?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface QualityScoreReport {
  overall: number; // 0 to 100
  completeness: number; // 0 to 100
  formatValidity: number; // 0 to 100
  sectionConfidence: Record<string, number>;
  fieldEvidence?: Record<string, FieldEvidence>;
  warnings?: string[];
}

export interface StructuredResume {
  identity: {
    fullName: string;
    title: string;
    headline: string;
    summary: string;
    location: LocationInfo;
  };
  contact: {
    emails: EmailContact[];
    phones: PhoneContact[];
    location: LocationInfo;
  };
  profiles: SocialProfiles;
  workExperience: WorkExperience[];
  education: Education[];
  skills: SkillItem[];
  certifications: Certification[];
  projects: Project[];
  awards: Award[];
  languages: LanguageItem[];
  volunteering: Volunteering[];
  publications: Publication[];
  references: Reference[];
  customSections: CustomSection[];
  qualityScore?: QualityScoreReport;
  rawText?: string;
  meta?: {
    engineUsed: 'gemini';
    model?: string;
    processedAt: string;
    durationMs?: number;
  };
}
