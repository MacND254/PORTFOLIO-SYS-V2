import { z } from 'zod';

export const reviewSubmissionSchema = z.object({
  reviewerName: z.string().min(2, 'Name is required'),
  reviewerEmail: z.string().email('Valid email required'),
  reviewerCompany: z.string().optional(),
  reviewerJobTitle: z.string().optional(),
  reviewerWebsite: z.string().optional(),
  reviewerPhotoUrl: z.string().optional(),
  rating: z.number().min(1).max(5),
  reviewText: z.string().min(10, 'Review text must be at least 10 characters'),
});

export const contactSubmissionSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  subject: z.string().min(2, 'Subject is required'),
  message: z.string().min(5, 'Message must be at least 5 characters'),
  honeypot: z.string().optional(),
});
