import { ScanEngine } from '../scanEngine';
import { HeuristicExtractor } from '../../extractors/heuristic';

describe('ScanEngine & Heuristic Extractor - PO Box and Phone Disambiguation', () => {
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

  it('should correctly extract phone and location without confusing PO Box with phone number in Heuristics', () => {
    const extracted = HeuristicExtractor.extract(sampleCvText);

    // Identity / Location
    expect(extracted.identity?.location.raw).toContain('P.O. Box 284-00900');
    expect(extracted.identity?.location.postalCode).toBe('00900');

    // Contact
    expect(extracted.contact?.emails?.[0].email).toBe('alex.mwangi@example.com');
    expect(extracted.contact?.phones?.[0].phone).toBe('+254712345678');
    expect(extracted.contact?.phones?.some((p) => p.phone.includes('28400900'))).toBe(false);
  });

  it('should process scan with ScanEngine without placing PO Box in phone field', async () => {
    const result = await ScanEngine.processScan(sampleCvText, { forceEngine: 'heuristic' });

    expect(result.identity.fullName).toBe('Alex Mwangi');
    expect(result.contact.phones.length).toBeGreaterThan(0);
    expect(result.contact.phones[0].phone).toBe('+254712345678');
    expect(result.contact.phones.some((p) => p.phone.includes('28400900'))).toBe(false);
    expect(result.identity.location.postalCode).toBe('00900');
    expect(result.contact.location.raw).toContain('284-00900');
  });

  it('should adapt to ExtractedCvData correctly for database consumption', async () => {
    const result = await ScanEngine.processScan(sampleCvText, { forceEngine: 'heuristic' });
    const legacyData = ScanEngine.toExtractedCvData(result);

    expect(legacyData.personalInfo.fullName).toBe('Alex Mwangi');
    expect(legacyData.personalInfo.phone).toBe('+254712345678');
    expect(legacyData.personalInfo.location).toContain('284-00900');
  });
});
