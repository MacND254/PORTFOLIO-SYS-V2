import { StructuredResume } from '../../types/schema';
import { IdentityExtractor } from './identityExtractor';
import { ContactExtractor } from './contactExtractor';
import { ProfileExtractor } from './profileExtractor';
import { ExperienceExtractor } from './experienceExtractor';
import { EducationExtractor } from './educationExtractor';
import { SkillExtractor } from './skillExtractor';
import { CertificationExtractor } from './certificationExtractor';
import { ProjectExtractor } from './projectExtractor';
import { AwardExtractor } from './awardExtractor';
import { LanguageExtractor } from './languageExtractor';
import { VolunteeringExtractor } from './volunteeringExtractor';
import { PublicationExtractor } from './publicationExtractor';
import { ReferenceExtractor } from './referenceExtractor';
import { CustomSectionExtractor } from './customSectionExtractor';

export * from './identityExtractor';
export * from './contactExtractor';
export * from './profileExtractor';
export * from './experienceExtractor';
export * from './educationExtractor';
export * from './skillExtractor';
export * from './certificationExtractor';
export * from './projectExtractor';
export * from './awardExtractor';
export * from './languageExtractor';
export * from './volunteeringExtractor';
export * from './publicationExtractor';
export * from './referenceExtractor';
export * from './customSectionExtractor';

export class HeuristicExtractor {
  private static SECTION_HEADERS: Array<[string, RegExp]> = [
    ['summary', /^(professional\s+)?(summary|profile|objective|about(\s+me)?|career\s+summary|personal\s+statement)$/i],
    ['experience', /^(work|professional|relevant|employment|career|industry|practical)?\s*(experience|history|employment\s+record|work\s+history)(?:\s*(?:and|&)\s*(?:achievements|responsibilities))?$/i],
    ['education', /^(education|academic\s+(background|history|qualifications)|qualifications|academic\s+degrees)$/i],
    ['skills', /^(technical\s+|core\s+|key\s+)?(skills|competencies|proficiencies|technologies|tools|stack)$/i],
    ['projects', /^(key\s+|personal\s+|selected\s+|academic\s+|portfolio\s+)?projects$/i],
    ['certifications', /^(professional\s+|relevant\s+|technical\s+)?(certifications?|certificates?|credentials?|licenses?|accreditations?|qualifications\s+(?:and|&)\s+certifications?|courses?\s+(?:and|&)\s+certifications?|training(?:\s+(?:and|&)\s+certifications?)?|certifications?\s*(?:and|&|,|\/)\s*(?:licenses?|credentials?|training|certificates?)|licenses?\s*(?:and|&|,|\/)\s*(?:certifications?|credentials?)|certificates?\s*(?:and|&|,|\/)\s*(?:training|licenses?|accreditations?|diplomas?))$/i],
    ['languages', /^(languages?(\s+spoken|\s+proficiency|\s+skills)?|spoken(\s+and\s+written)?\s+languages?|language\s+abilities)$/i],
    ['awards', /^(awards?|honors?|achievements?|accolades?|awards?\s+and\s+honors?)$/i],
    ['volunteering', /^(volunteering|volunteer\s+experience|community\s+service|leadership(\s+and\s+activities)?)$/i],
    ['publications', /^(publications?|research|papers?|articles?|publications?\s+and\s+research)$/i],
    ['references', /^(references?|referees?)$/i],
  ];

  public static extract(rawText: string): StructuredResume {
    const lines = rawText
      .replace(/\r/g, '')
      .split('\n')
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .filter(Boolean);

    const sections = this.detectSections(lines);
    const headerLines = sections['header'] || lines.slice(0, 10);
    const summaryLines = sections['summary'] || [];
    const allText = lines.join('\n');

    const identity = IdentityExtractor.extractIdentity(headerLines, lines, summaryLines);
    const contact = ContactExtractor.extractContacts(allText, headerLines, identity.location);
    const profiles = ProfileExtractor.extractProfiles(allText);

    const workExperience = ExperienceExtractor.extractExperience(sections['experience'] || []);
    const education = EducationExtractor.extractEducation(sections['education'] || []);
    const skills = SkillExtractor.extractSkills(sections['skills'] || [], allText);
    const certifications = CertificationExtractor.extractCertifications(sections['certifications'] || [], allText);
    const projects = ProjectExtractor.extractProjects(sections['projects'] || []);
    const awards = AwardExtractor.extractAwards(sections['awards'] || []);
    const languages = LanguageExtractor.extractLanguages(sections['languages'] || []);
    const volunteering = VolunteeringExtractor.extractVolunteering(sections['volunteering'] || []);
    const publications = PublicationExtractor.extractPublications(sections['publications'] || []);
    const references = ReferenceExtractor.extractReferences(sections['references'] || []);

    const knownKeys = new Set([
      'header',
      'summary',
      'experience',
      'education',
      'skills',
      'projects',
      'certifications',
      'languages',
      'awards',
      'volunteering',
      'publications',
      'references',
    ]);
    const customSections = CustomSectionExtractor.extractCustomSections(sections, knownKeys);

    return {
      identity,
      contact,
      profiles,
      workExperience,
      education,
      skills,
      certifications,
      projects,
      awards,
      languages,
      volunteering,
      publications,
      references,
      customSections,
      rawText,
      meta: {
        engineUsed: 'heuristic',
        processedAt: new Date().toISOString(),
      },
    };
  }

  private static detectSections(lines: string[]): Record<string, string[]> {
    const sections: Record<string, string[]> = { header: [] };
    let currentKey = 'header';

    for (const line of lines) {
      const cleanLine = line.replace(/[:|–—-]/g, '').replace(/\s+/g, ' ').trim();
      const match = this.SECTION_HEADERS.find(([, regex]) => regex.test(cleanLine));

      if (match) {
        currentKey = match[0];
        if (!sections[currentKey]) {
          sections[currentKey] = [];
        }
        continue;
      }

      if (!sections[currentKey]) {
        sections[currentKey] = [];
      }
      sections[currentKey].push(line);
    }

    return sections;
  }
}
