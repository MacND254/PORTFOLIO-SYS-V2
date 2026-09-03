import { z } from 'zod';

export const experienceSchema = z.object({
  company: z.string().min(1, 'Company name is required'),
  position: z.string().min(1, 'Position title is required'),
  location: z.string().optional().nullable(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional().nullable(),
  isCurrent: z.boolean().optional(),
  description: z.string().optional().nullable(),
  responsibilities: z.array(z.string()).optional(),
  achievements: z.array(z.string()).optional(),
  orderIndex: z.number().int().optional(),
});

export const educationSchema = z.object({
  institution: z.string().min(1, 'Institution is required'),
  qualification: z.string().min(1, 'Qualification is required'),
  field: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional().nullable(),
  isCurrent: z.boolean().optional(),
  grade: z.string().optional(),
  description: z.string().optional(),
  certificateUrl: z.string().optional().nullable(),
});

export const skillSchema = z.object({
  name: z.string().min(1, 'Skill name is required'),
  category: z.string().optional(),
  proficiency: z.number().min(1).max(100).optional().nullable(),
  level: z.string().optional(),
});

export const projectSchema = z.object({
  title: z.string().min(1, 'Project title is required'),
  description: z.string().min(1, 'Description is required'),
  longDescription: z.string().optional(),
  imageUrl: z.string().optional(),
  demoUrl: z.string().optional(),
  githubUrl: z.string().optional(),
  technologies: z.array(z.string()).optional(),
  role: z.string().optional(),
  featured: z.boolean().optional(),
});

export const certificationSchema = z.object({
  name: z.string().min(1, 'Certification name is required'),
  issuingOrganization: z.string().min(1, 'Issuing organization is required'),
  issueDate: z.string().min(1, 'Issue date is required'),
  expiryDate: z.string().optional().nullable(),
  credentialId: z.string().optional(),
  credentialUrl: z.string().optional(),
  certificateUrl: z.string().optional().nullable(),
});

export const referenceSchema = z.object({
  name: z.string().min(1, 'Referee name is required'),
  position: z.string().min(1, 'Position is required'),
  organization: z.string().min(1, 'Organization is required'),
  email: z.string().email().optional().or(z.literal('')).nullable(),
  phone: z.string().optional().nullable(),
  relationship: z.string().optional().nullable(),
  isPublic: z.boolean().optional(),
  orderIndex: z.number().int().optional(),
});

