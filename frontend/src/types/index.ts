export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'COMPANY';
export type CompanyInviteStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
export type JobStatus = 'ACTIVE' | 'PAUSED' | 'CLOSED';
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
export type WorkplaceType = 'REMOTE' | 'HYBRID' | 'ONSITE';

export interface CompanyInvite {
  id: string;
  token: string;
  companyName?: string;
  email: string;
  status: CompanyInviteStatus;
  expiresAt: string;
  acceptedAt?: string;
  usageCount: number;
  invitedBy?: { id: string; fullName: string; email: string };
  companies?: { id: string; name: string; industry?: string; _count?: { jobs: number } }[];
  company?: { id: string; name: string; industry?: string; _count?: { jobs: number } };
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  userId: string;
  inviteId?: string;
  name: string;
  website?: string;
  logoUrl?: string;
  industry?: string;
  companySize?: string;
  location?: string;
  description?: string;
  contactPerson?: string;
  contactEmail?: string;
  user?: { id: string; email: string; fullName: string; status: string; emailVerified?: boolean };
  _count?: { jobs: number };
  createdAt: string;
  updatedAt: string;
}

export interface JobPosting {
  id: string;
  companyId: string;
  title: string;
  department?: string;
  employmentType: EmploymentType;
  workplaceType: WorkplaceType;
  location?: string;
  experienceLevel?: string;
  salaryRange?: string;
  description: string;
  requirements?: string;
  skills: string[];
  status: JobStatus;
  viewsCount: number;
  company?: Pick<Company, 'id' | 'name' | 'logoUrl' | 'location'>;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateMatch {
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
  matchScore: number;
  scoreBreakdown: {
    skillsScore: number;
    roleTitleScore: number;
    experienceScore: number;
    verificationScore: number;
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
export type EmploymentStatusType =
  | 'OPEN_TO_WORK'
  | 'OPEN_TO_OFFERS'
  | 'FREELANCE'
  | 'EMPLOYED'
  | 'UNAVAILABLE';

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
  | 'TSC_CERTIFICATE'
  | 'OTHER';

export const VERIFIED_DOCUMENT_TYPES: { type: DocumentType; label: string }[] = [
  { type: 'GOVERNMENT_ID', label: 'Government ID / Passport' },
  { type: 'KRA_PIN', label: 'KRA PIN Certificate' },
  { type: 'GOOD_CONDUCT', label: 'Certificate of Good Conduct' },
  { type: 'SHA_CARD', label: 'SHA Card' },
  { type: 'NSSF_CARD', label: 'NSSF Card' },
  { type: 'TSC_CERTIFICATE', label: 'TSC Certificate' },
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
  employmentStatus?: EmploymentStatusType | string;
  employmentStatusCustom?: string;
  showEmploymentBadge?: boolean;
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
  interviews?: InterviewSchedule[];
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

export type InterviewStatus = 'PENDING' | 'ACCEPTED' | 'RESCHEDULED' | 'DECLINED' | 'CANCELLED';

export type InterviewType =
  | 'RECRUITER_SCREEN'
  | 'TECHNICAL_INTERVIEW'
  | 'HIRING_MANAGER'
  | 'INTRO_CALL'
  | 'PROJECT_DISCUSSION'
  | 'OTHER';

export interface InterviewSchedule {
  id: string;
  profileId: string;
  recruiterName: string;
  recruiterEmail: string;
  company: string;
  recruiterTitle?: string;
  interviewType: InterviewType;
  preferredDate: string;
  preferredTime: string;
  timezone: string;
  durationMinutes: number;
  platformPreference: string;
  notes?: string;
  alternateDate?: string;
  alternateTime?: string;
  status: InterviewStatus;
  meetingLink?: string;
  tenantNotes?: string;
  rescheduledDate?: string;
  rescheduledTime?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType = 'SUCCESS' | 'INFO' | 'WARNING' | 'ALERT' | 'ERROR';

export type NotificationTargetAudience = 'ALL' | 'TENANTS' | 'COMPANIES' | 'SPECIFIC';

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  link?: string | null;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: NotificationItem[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

