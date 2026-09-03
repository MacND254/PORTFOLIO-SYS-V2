import { SkillNormalizer } from '../../normalizers/skillNormalizer';
import { SkillItem } from '../../types/schema';

export class SkillExtractor {
  private static KNOWN_SKILLS = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Dart',
    'React', 'Next.js', 'Angular', 'Vue', 'Node.js', 'Express', 'NestJS', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'Laravel',
    'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Git',
    'CI/CD', 'GitHub Actions', 'Terraform', 'Figma', 'Linux', 'TailwindCSS', 'GraphQL', 'REST API', 'Agile', 'Scrum',
    'Communication', 'Leadership', 'Problem Solving', 'Project Management', 'Teamwork'
  ];

  public static extractSkills(sectionLines: string[], allText: string): SkillItem[] {
    const rawTokens: string[] = [];

    for (const line of sectionLines) {
      const cleanLine = line.replace(/^(skills?|technologies|proficiencies|tools|languages)\s*:\s*/i, '');
      const parts = cleanLine.split(/[,|•;/]/).map((s) => s.trim()).filter(Boolean);
      rawTokens.push(...parts);
    }

    const fullContext = `${sectionLines.join(' ')} ${allText}`;
    for (const skill of this.KNOWN_SKILLS) {
      const regex = new RegExp(`\\b${skill.replace('.', '\\.').replace('+', '\\+')}\\b`, 'i');
      if (regex.test(fullContext)) {
        rawTokens.push(skill);
      }
    }

    return SkillNormalizer.normalizeSkills(rawTokens);
  }
}
