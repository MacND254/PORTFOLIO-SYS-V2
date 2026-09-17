import { ScanEngine } from '../scanEngine';
import { AiExtractor } from '../../extractors/aiExtractor';
import { ContactNormalizer } from '../../normalizers/contactNormalizer';

describe('ScanEngine & Normalizers - Strict Gemini Engine & PO Box Disambiguation', () => {
  const sampleCvText = `
    Alex Mwangi
    Senior Cloud Architect
    P.O. Box 284-00900 Kiambu, Kenya
    Email: alex.mwangi@example.com
    Tel: +254 712 345 678

    PROFESSIONAL SUMMARY
    Senior Cloud Architect with 8+ years experience in AWS, GCP, and Kubernetes.

    WORK EXPERIENCE
    Lead Architect | Safaricom PLC
    Jan 2020 - Present
    - Designed microservices architecture on AWS EKS
    - Reduced cloud infrastructure costs by 35%

    EDUCATION
    Bachelor of Science in Computer Science
    University of Nairobi
    2015 - 2019

    SKILLS
    AWS, Kubernetes, Docker, TypeScript, Go, Python
  `;

  const mockGeminiOutput = {
    identity: {
      fullName: 'Alex Mwangi',
      title: 'Senior Cloud Architect',
      headline: 'Senior Cloud Architect',
      summary: 'Senior Cloud Architect with 8+ years experience in AWS, GCP, and Kubernetes.',
      location: { raw: 'P.O. Box 284-00900 Kiambu, Kenya' },
    },
    contact: {
      emails: [{ email: 'alex.mwangi@example.com', type: 'WORK', isPrimary: true }],
      phones: [{ phone: '+254 712 345 678', type: 'MOBILE', isPrimary: true }],
      location: { raw: 'P.O. Box 284-00900 Kiambu, Kenya' },
    },
    workExperience: [
      {
        id: 'exp-1',
        company: 'Safaricom PLC',
        jobTitle: 'Lead Architect',
        location: null,
        startDate: { raw: 'Jan 2020', year: 2020, month: 1 },
        endDate: null,
        current: true,
        description: 'Designed microservices architecture on AWS EKS',
        bullets: ['Designed microservices architecture on AWS EKS', 'Reduced cloud infrastructure costs by 35%'],
        technologies: ['AWS', 'EKS'],
      },
    ],
    education: [
      {
        id: 'edu-1',
        institution: 'University of Nairobi',
        degree: 'Bachelor of Science in Computer Science',
        fieldOfStudy: 'Computer Science',
        location: null,
        startDate: { raw: '2015', year: 2015, month: null },
        endDate: { raw: '2019', year: 2019, month: null },
        current: false,
        grade: null,
        activities: [],
      },
    ],
    skills: [
      { name: 'AWS', category: 'CLOUD', proficiency: 'EXPERT' },
      { name: 'Kubernetes', category: 'CLOUD', proficiency: 'EXPERT' },
      { name: 'TypeScript', category: 'PROGRAMMING_LANGUAGE', proficiency: 'EXPERT' },
    ],
    meta: {
      engineUsed: 'gemini',
      model: 'gemini-2.5-flash',
      processedAt: new Date().toISOString(),
      durationMs: 450,
    },
  };

  beforeEach(() => {
    jest.spyOn(AiExtractor, 'extractWithGemini').mockResolvedValue(mockGeminiOutput as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should correctly disambiguate PO Box and phone numbers via ContactNormalizer', () => {
    const rawPhones = ['284-00900', '+254 712 345 678'];
    const poBox = ContactNormalizer.extractPoBoxCandidate(rawPhones);
    expect(poBox).toBe('284-00900');

    const normalizedPhones = ContactNormalizer.normalizePhones(rawPhones);
    expect(normalizedPhones.some((p) => p.phone.includes('28400900'))).toBe(false);
    expect(normalizedPhones.some((p) => p.phone === '+254712345678')).toBe(true);
  });

  it('should process scan strictly with Gemini engine without placing PO Box in phone field', async () => {
    const result = await ScanEngine.processScan(sampleCvText);

    expect(result.identity.fullName).toBe('Alex Mwangi');
    expect(result.contact.phones.length).toBeGreaterThan(0);
    expect(result.contact.phones[0].phone).toBe('+254712345678');
    expect(result.contact.phones.some((p) => p.phone.includes('28400900'))).toBe(false);
    expect(result.meta?.engineUsed).toBe('gemini');
  });

  it('should adapt to ExtractedCvData correctly for database consumption', async () => {
    const result = await ScanEngine.processScan(sampleCvText);
    const legacyData = ScanEngine.toExtractedCvData(result);

    expect(legacyData.personalInfo.fullName).toBe('Alex Mwangi');
    expect(legacyData.personalInfo.phone).toBe('+254712345678');
    expect(legacyData.personalInfo.location).toContain('284-00900');
  });
});
