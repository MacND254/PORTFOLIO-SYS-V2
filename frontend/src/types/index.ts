export type Role = 'SUPER_ADMIN' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
export type CVStatus = 'UPLOADED' | 'PROCESSING' | 'ANALYZED' | 'REVIEW_REQUIRED' | 'IMPORTED' | 'FAILED';
export type PublishStatus = 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED' | 'SUSPENDED';

export const AVAILABLE_PROFESSIONS = [
  'Software Engineer',
  'Data Scientist',
  'Cybersecurity Professional',
  'Network Engineer',
  'DevOps & Cloud Engineer',
  'UI/UX Designer',
  'Graphic Designer',
  'Architect',
  'Civil Engineer',
  'Electrical Engineer',
  'Mechanical Engineer',
  'Medical Professional',
  'Lawyer / Legal Professional',
  'Accountant / Finance Professional',
  'Marketing Professional',
  'Photographer',
  'Teacher / Educator',
  'Researcher / Academic',
  'Freelancer / Consultant',
  'Creative Professional',
] as const;

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  status: UserStatus;
  subdomain?: string;
  desiredProfession?: string;
}

export type DocumentType =
  | 'GOVERNMENT_ID'
  | 'KRA_PIN'
  | 'GOOD_CONDUCT'
  | 'SHA_CARD'
  | 'NSSF_CARD'
  | 'OTHER';

export const VERIFIED_DOCUMENT_TYPES: { type: DocumentType; label: string }[] = [
  { type: 'GOVERNMENT_ID', label: 'Government ID / Passport' },
  { type: 'KRA_PIN', label: 'KRA PIN Certificate' },
  { type: 'GOOD_CONDUCT', label: 'Certificate of Good Conduct' },
  { type: 'SHA_CARD', label: 'SHA Card' },
  { type: 'NSSF_CARD', label: 'NSSF Card' },
  { type: 'OTHER', label: 'Other Verified Credential' },
];

export interface VerifiedDocument {
  id: string;
  profileId?: string;
  documentType: DocumentType | string;
  title: string;
  documentNumber?: string;
  fileUrl?: string;
  fileSize?: number;
  mimeType?: string;
  isVerified: boolean;
  createdAt: string;
}

export interface DocumentAccessKey {
  id: string;
  code: string;
  recipientName?: string;
  expiresAt: string;
  isUsed: boolean;
  usedAt?: string;
  createdAt: string;
}

export interface Profile {
  id: string;
  userId: string;
  title?: string;
  headline?: string;
  summary?: string;
  careerObjective?: string;
  bio?: string;
  phone?: string;
  location?: string;
  address?: string;
  website?: string;
  github?: string;
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
  behance?: string;
  dribbble?: string;
  researchgate?: string;
  scholar?: string;
  avatarUrl?: string;
  coverUrl?: string;
  isPublicEmail: boolean;
  isPublicPhone: boolean;
  isPublicLocation: boolean;
  completenessScore: number;
  experiences?: Experience[];
  educations?: Education[];
  skills?: Skill[];
  certifications?: Certification[];
  awards?: Award[];
  projects?: Project[];
  publications?: Publication[];
  languages?: Language[];
  services?: Service[];
  references?: Reference[];
  memberships?: Membership[];
  customSections?: CustomSection[];
  verifiedDocuments?: VerifiedDocument[];
  documentAccessKeys?: DocumentAccessKey[];
  customization?: PortfolioCustomization;
  portfolioStatus?: { isPublished: boolean; publishStatus: PublishStatus };
  reviews?: Review[];
  user?: { fullName: string; email?: string };
  completeness?: { totalScore: number; breakdown: any; recommendations: string[] };
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  location?: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description?: string;
  responsibilities: string[];
  achievements: string[];
  orderIndex: number;
}

export interface Education {
  id: string;
  institution: string;
  qualification: string;
  field?: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  grade?: string;
  description?: string;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  proficiency?: number;
  level?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  imageUrl?: string;
  demoUrl?: string;
  githubUrl?: string;
  technologies: string[];
  role?: string;
  featured: boolean;
}

export interface Certification {
  id: string;
  name: string;
  issuingOrganization: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
}

export interface Award {
  id: string;
  title: string;
  organization: string;
  date: string;
  description?: string;
}

export interface Publication {
  id: string;
  title: string;
  publisher: string;
  date: string;
  url?: string;
  description?: string;
}

export interface Language {
  id: string;
  language: string;
  proficiency: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon?: string;
  price?: string;
  features: string[];
}

export interface Reference {
  id: string;
  name: string;
  position: string;
  organization: string;
  email?: string;
  phone?: string;
  relationship?: string;
  isPublic: boolean;
}

export interface Membership {
  id: string;
  organization: string;
  membershipNumber?: string;
  position?: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  website?: string;
}

export interface CustomSection {
  id: string;
  title: string;
  content: string;
  isVisible: boolean;
}

export interface PortfolioTheme {
  id: string;
  themeId: string;
  name: string;
  profession: string;
  description: string;
  layoutConfig: any;
  defaultColors: any;
  typography: any;
  isPublished?: boolean;
}

export interface PortfolioCustomization {
  id: string;
  themeId: string;
  colorPalette?: any;
  fontHeading: string;
  fontBody: string;
  customCss?: string;
  avatarStyle?: any;
  sectionVisibility?: Record<string, boolean>;
  sectionOrder?: string[];
  customCtaText?: string;
  customCtaUrl?: string;
  showQrInPdf: boolean;
  showSocialLinks: boolean;
  theme?: PortfolioTheme;
}

export interface Review {
  id: string;
  token?: string;
  reviewerName: string;
  reviewerCompany?: string;
  reviewerJobTitle?: string;
  reviewerEmail: string;
  rating: number;
  reviewText: string;
  reviewerWebsite?: string;
  reviewerPhotoUrl?: string;
  isApproved: boolean;
  isFeatured: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  isArchived: boolean;
  createdAt: string;
}
