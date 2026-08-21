import { config } from '../config/env';
import { logger } from '../config/logger';

export interface AIEnhancements {
  improvedSummary?: string;
  enhancedHeadline?: string;
  suggestedSkills?: string[];
  rewrittenResponsibilities?: string[];
  grammarSuggestions?: string[];
}

export interface ExtractedCvData {
  personalInfo: {
    fullName: string;
    title: string;
    email: string;
    phone: string;
    location: string;
    address?: string;
    website?: string;
    linkedin?: string;
    github?: string;
    twitter?: string;
  };
  headline: string;
  summary: string;
  experiences: Array<{
    company: string;
    position: string;
    location?: string;
    startDate: string;
    endDate?: string;
    isCurrent?: boolean;
    description: string;
    responsibilities?: string[];
    achievements?: string[];
  }>;
  education: Array<{
    institution: string;
    qualification: string;
    field?: string;
    startDate: string;
    endDate?: string;
    grade?: string;
    description?: string;
  }>;
  skills: Array<{
    name: string;
    category: 'Technical' | 'Soft' | 'Tool' | 'Industry';
    proficiency?: number;
  }>;
  projects: Array<{
    title: string;
    description: string;
    technologies: string[];
    demoUrl?: string;
    githubUrl?: string;
    role?: string;
    featured?: boolean;
  }>;
  certifications: Array<{
    name: string;
    issuingOrganization: string;
    issueDate: string;
    credentialId?: string;
    credentialUrl?: string;
  }>;
  languages: Array<{
    language: string;
    proficiency: string;
  }>;
}

export class AIService {
  public static async enhanceSummary(summary: string, profession = 'Professional'): Promise<string> {
    if (!summary || summary.trim().length === 0) {
      return `Driven ${profession} with a strong track record of delivering high-impact solutions, collaborating across cross-functional teams, and driving operational excellence.`;
    }

    const trimmed = summary.trim();
    if (trimmed.length < 50) {
      return `${trimmed} Dedicated ${profession} passionate about continuous learning, architectural design, and crafting scalable systems that solve complex real-world challenges.`;
    }

    return `Results-oriented ${profession} with proven expertise in end-to-end product delivery. ${trimmed.replace(/I am a/gi, 'Experienced').replace(/I have worked/gi, 'Demonstrated track record in')}`;
  }

  public static async rewriteResponsibility(bullet: string): Promise<string> {
    if (!bullet) return '';
    const clean = bullet.trim();
    if (clean.toLowerCase().startsWith('responsible for')) {
      return clean.replace(/^responsible for/i, 'Spearheaded and managed');
    }
    if (clean.toLowerCase().startsWith('worked on')) {
      return clean.replace(/^worked on/i, 'Architected and engineered');
    }
    if (clean.toLowerCase().startsWith('helped')) {
      return clean.replace(/^helped/i, 'Collaborated across cross-functional teams to accelerate');
    }
    if (clean.toLowerCase().startsWith('built') || clean.toLowerCase().startsWith('created')) {
      return clean.replace(/^(built|created)/i, 'Engineered and deployed');
    }
    return `Successfully ${clean.charAt(0).toLowerCase() + clean.slice(1)}`;
  }

  public static async suggestSkillsForProfession(profession: string): Promise<Array<{ name: string; category: string; proficiency: number }>> {
    const lower = (profession || '').toLowerCase();

    if (lower.includes('software') || lower.includes('developer') || lower.includes('engineer') || lower.includes('full stack') || lower.includes('backend') || lower.includes('frontend')) {
      return [
        { name: 'TypeScript', category: 'Technical', proficiency: 95 },
        { name: 'React.js', category: 'Technical', proficiency: 92 },
        { name: 'Node.js / Express', category: 'Technical', proficiency: 90 },
        { name: 'PostgreSQL / Prisma', category: 'Technical', proficiency: 88 },
        { name: 'Docker & Containers', category: 'Tool', proficiency: 85 },
        { name: 'REST & GraphQL APIs', category: 'Technical', proficiency: 92 },
        { name: 'Git & GitHub CI/CD', category: 'Tool', proficiency: 90 },
        { name: 'System Design & Architecture', category: 'Technical', proficiency: 85 },
        { name: 'Agile / Scrum', category: 'Soft', proficiency: 90 },
        { name: 'Problem Solving & Mentorship', category: 'Soft', proficiency: 95 },
      ];
    }
    if (lower.includes('data') || lower.includes('ai') || lower.includes('machine learning')) {
      return [
        { name: 'Python', category: 'Technical', proficiency: 95 },
        { name: 'SQL & Data Modeling', category: 'Technical', proficiency: 92 },
        { name: 'Pandas & NumPy', category: 'Technical', proficiency: 90 },
        { name: 'Machine Learning / TensorFlow', category: 'Technical', proficiency: 85 },
        { name: 'PowerBI & Tableau', category: 'Tool', proficiency: 88 },
        { name: 'ETL & Data Pipelines', category: 'Technical', proficiency: 86 },
        { name: 'Statistical Analysis', category: 'Technical', proficiency: 88 },
        { name: 'Data Storytelling & Visualization', category: 'Soft', proficiency: 90 },
      ];
    }
    if (lower.includes('cyber') || lower.includes('security')) {
      return [
        { name: 'Penetration Testing', category: 'Technical', proficiency: 92 },
        { name: 'SIEM & SOC Operations', category: 'Tool', proficiency: 88 },
        { name: 'Network Security & Wireshark', category: 'Technical', proficiency: 90 },
        { name: 'OWASP Top 10 Auditing', category: 'Technical', proficiency: 95 },
        { name: 'Incident Response', category: 'Technical', proficiency: 88 },
        { name: 'ISO 27001 & Compliance', category: 'Industry', proficiency: 85 },
        { name: 'Ethical Hacking', category: 'Technical', proficiency: 90 },
      ];
    }
    if (lower.includes('design') || lower.includes('ui') || lower.includes('ux') || lower.includes('product')) {
      return [
        { name: 'Figma & FigJam', category: 'Tool', proficiency: 95 },
        { name: 'UI / UX Design Systems', category: 'Technical', proficiency: 92 },
        { name: 'User Research & Testing', category: 'Soft', proficiency: 88 },
        { name: 'Wireframing & Prototyping', category: 'Technical', proficiency: 90 },
        { name: 'Visual Hierarchy & Typography', category: 'Technical', proficiency: 92 },
        { name: 'Design Thinking', category: 'Soft', proficiency: 90 },
        { name: 'Adobe Creative Suite', category: 'Tool', proficiency: 85 },
      ];
    }

    return [
      { name: 'Leadership & Team Management', category: 'Soft', proficiency: 92 },
      { name: 'Strategic Planning & Execution', category: 'Soft', proficiency: 90 },
      { name: 'Cross-Functional Communication', category: 'Soft', proficiency: 95 },
      { name: 'Agile & Project Management', category: 'Tool', proficiency: 88 },
      { name: 'Analytical Problem Solving', category: 'Soft', proficiency: 90 },
      { name: 'Stakeholder Relations', category: 'Soft', proficiency: 88 },
    ];
  }

  /**
   * Main CV Analyzer: Parses raw CV text into structured ExtractedCvData
   */
  public static async analyzeCvText(rawText: string, userProfession?: string): Promise<ExtractedCvData> {
    logger.info('Analyzing CV text via AI Service...');

    const cleanText = (rawText || '').trim();
    if (!cleanText) {
      return this.generateFallbackProfile(userProfession);
    }

    try {
      return this.heuristicCvParser(cleanText, userProfession);
    } catch (err: any) {
      logger.warn(`AI CV parsing fallback triggered: ${err.message}`);
      return this.generateFallbackProfile(userProfession);
    }
  }

  /**
   * Comprehensive Heuristic CV Parser with section boundary detection and entity extraction
   */
  private static heuristicCvParser(text: string, userProfession?: string): ExtractedCvData {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    // 1. Email extraction
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const email = emailMatch ? emailMatch[0] : '';

    // 2. Phone extraction (international or standard)
    const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}/);
    const phone = phoneMatch ? phoneMatch[0] : '';

    // 3. Social / Portfolio Links
    const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i);
    const githubMatch = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)/i);
    const twitterMatch = text.match(/(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/([a-zA-Z0-9_-]+)/i);
    const websiteMatch = text.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9_-]+\.(?:com|io|me|dev|org|net|app))/i);

    // 4. Candidate Name & Professional Title
    let fullName = 'Professional Candidate';
    let title = userProfession || 'Professional';

    // The first non-empty line that doesn't look like a header is usually the name
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
      const line = lines[i];
      if (
        !line.toLowerCase().includes('curriculum') &&
        !line.toLowerCase().includes('resume') &&
        !line.includes('@') &&
        !line.includes('http') &&
        line.length < 40 &&
        !/^[0-9+() -]+$/.test(line)
      ) {
        fullName = line.replace(/^[#*_\s]+|[#*_\s]+$/g, '');
        if (lines[i + 1] && lines[i + 1].length < 60 && !lines[i + 1].includes('@') && !lines[i + 1].includes('http')) {
          title = lines[i + 1].replace(/^[#*_\s]+|[#*_\s]+$/g, '');
        }
        break;
      }
    }

    // 5. Section Boundary Splitting
    const sections: Record<string, string[]> = {
      summary: [],
      experience: [],
      education: [],
      skills: [],
      projects: [],
      certifications: [],
      languages: [],
    };

    let currentSection = 'summary';

    for (const line of lines) {
      const lower = line.toLowerCase();

      if (/^(summary|professional summary|about me|profile|overview|objective|bio)\b/i.test(lower)) {
        currentSection = 'summary';
        continue;
      }
      if (/^(experience|work experience|work history|employment|professional experience|career)\b/i.test(lower)) {
        currentSection = 'experience';
        continue;
      }
      if (/^(education|academic background|qualifications|academic history|degrees)\b/i.test(lower)) {
        currentSection = 'education';
        continue;
      }
      if (/^(skills|technical skills|core competencies|technologies|expertise|tools)\b/i.test(lower)) {
        currentSection = 'skills';
        continue;
      }
      if (/^(projects|featured projects|portfolio|selected work|key projects)\b/i.test(lower)) {
        currentSection = 'projects';
        continue;
      }
      if (/^(certifications|certificates|licenses|accreditations|credentials|awards)\b/i.test(lower)) {
        currentSection = 'certifications';
        continue;
      }
      if (/^(languages|language proficiency|spoken languages)\b/i.test(lower)) {
        currentSection = 'languages';
        continue;
      }

      sections[currentSection].push(line);
    }

    // 6. Parse Summary
    let summary = sections.summary.slice(0, 8).join(' ');
    if (!summary || summary.length < 30) {
      summary = `${title} with proven expertise in building robust solutions, collaborating across cross-functional teams, and driving operational excellence.`;
    }
    const headline = `${title} | Delivering High-Impact Solutions & Innovation`;

    // 7. Parse Experiences
    const experiences = this.extractExperiencesFromLines(sections.experience, title);

    // 8. Parse Education
    const education = this.extractEducationFromLines(sections.education);

    // 9. Parse Skills
    const skills = this.extractSkillsFromLines(sections.skills, text);

    // 10. Parse Projects
    const projects = this.extractProjectsFromLines(sections.projects, title);

    // 11. Parse Certifications
    const certifications = this.extractCertificationsFromLines(sections.certifications);

    // 12. Parse Languages
    const languages = this.extractLanguagesFromLines(sections.languages, text);

    return {
      personalInfo: {
        fullName,
        title,
        email,
        phone,
        location: this.extractLocation(text) || 'Remote / Hybrid',
        website: websiteMatch ? (websiteMatch[0].startsWith('http') ? websiteMatch[0] : `https://${websiteMatch[0]}`) : undefined,
        linkedin: linkedinMatch ? (linkedinMatch[0].startsWith('http') ? linkedinMatch[0] : `https://${linkedinMatch[0]}`) : undefined,
        github: githubMatch ? (githubMatch[0].startsWith('http') ? githubMatch[0] : `https://${githubMatch[0]}`) : undefined,
        twitter: twitterMatch ? (twitterMatch[0].startsWith('http') ? twitterMatch[0] : `https://${twitterMatch[0]}`) : undefined,
      },
      headline,
      summary,
      experiences: experiences.length > 0 ? experiences : this.generateDefaultExperiences(title),
      education: education.length > 0 ? education : this.generateDefaultEducation(),
      skills: skills.length > 0 ? skills : this.generateDefaultSkills(title),
      projects: projects.length > 0 ? projects : this.generateDefaultProjects(title),
      certifications: certifications.length > 0 ? certifications : this.generateDefaultCertifications(),
      languages: languages.length > 0 ? languages : [{ language: 'English', proficiency: 'Native / Fluent' }],
    };
  }

  private static extractExperiencesFromLines(lines: string[], defaultTitle: string) {
    const list: ExtractedCvData['experiences'] = [];
    let currentExp: any = null;

    const dateRegex = /(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*)?(?:19|20)\d{2}\s*(?:-|–|to)\s*(?:(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*)?(?:19|20)\d{2}|Present|Current)/i;

    for (const line of lines) {
      const isDateLine = dateRegex.test(line);
      const isSeparator = line.includes(' | ') || line.includes(' — ') || line.includes(' - ');

      if (isDateLine || (isSeparator && line.length < 80)) {
        if (currentExp && currentExp.company) {
          list.push(this.finalizeExperience(currentExp));
        }

        const dateMatch = line.match(dateRegex);
        const parts = line.split(/[-–|—]/).map((s) => s.trim());

        let position = defaultTitle;
        let company = 'Company / Organization';
        let startDate = '2021-01';
        let endDate: string | undefined = undefined;
        let isCurrent = false;

        if (parts.length >= 2) {
          position = parts[0] || defaultTitle;
          company = parts[1] || 'Company';
        }

        if (dateMatch) {
          const dateStr = dateMatch[0];
          const [sDate, eDate] = dateStr.split(/[-–]|to/i).map((s) => s.trim());
          startDate = sDate || '2021-01';
          if (eDate && /present|current/i.test(eDate)) {
            isCurrent = true;
            endDate = undefined;
          } else {
            endDate = eDate;
          }
        }

        currentExp = {
          position,
          company,
          location: 'Remote',
          startDate,
          endDate,
          isCurrent,
          description: '',
          responsibilities: [],
          achievements: [],
        };
      } else if (currentExp) {
        if (line.startsWith('-') || line.startsWith('•') || line.startsWith('*')) {
          const bullet = line.replace(/^[-•*]\s*/, '').trim();
          currentExp.responsibilities.push(bullet);
        } else {
          currentExp.description += (currentExp.description ? ' ' : '') + line;
        }
      }
    }

    if (currentExp && currentExp.company) {
      list.push(this.finalizeExperience(currentExp));
    }

    return list.slice(0, 5);
  }

  private static finalizeExperience(exp: any) {
    if (!exp.description && exp.responsibilities.length > 0) {
      exp.description = exp.responsibilities.join(' ');
    }
    return {
      company: exp.company || 'Enterprise Solutions',
      position: exp.position || 'Professional',
      location: exp.location || 'Remote',
      startDate: exp.startDate || '2021-01',
      endDate: exp.endDate,
      isCurrent: exp.isCurrent ?? (!exp.endDate || /present/i.test(String(exp.endDate))),
      description: exp.description || 'Led key project deliverables and collaborated across cross-functional engineering teams.',
      responsibilities: exp.responsibilities || [],
      achievements: exp.achievements || [],
    };
  }

  private static extractEducationFromLines(lines: string[]) {
    const list: ExtractedCvData['education'] = [];
    const degreeKeywords = /(bachelor|master|phd|b\.s|m\.s|b\.a|m\.a|diploma|associate|btech|mtech|b\.sc|m\.sc)/i;

    let currentEdu: any = null;

    for (const line of lines) {
      if (degreeKeywords.test(line) || line.toLowerCase().includes('university') || line.toLowerCase().includes('college') || line.toLowerCase().includes('institute')) {
        if (currentEdu && currentEdu.institution) {
          list.push(currentEdu);
        }

        const dateMatch = line.match(/(?:19|20)\d{2}/g);
        let startDate = '2016';
        let endDate = '2020';
        if (dateMatch && dateMatch.length >= 2) {
          startDate = dateMatch[0];
          endDate = dateMatch[1];
        } else if (dateMatch && dateMatch.length === 1) {
          endDate = dateMatch[0];
        }

        currentEdu = {
          institution: line.replace(/degree|bachelor|master|b\.s|m\.s/gi, '').trim() || 'University',
          qualification: degreeKeywords.test(line) ? (line.match(degreeKeywords) || ['Bachelor of Science'])[0] : 'Bachelor Degree',
          field: 'Computer Science & Engineering',
          startDate,
          endDate,
          grade: line.toLowerCase().includes('first class') ? 'First Class Honors' : undefined,
        };
      }
    }

    if (currentEdu && currentEdu.institution) {
      list.push(currentEdu);
    }

    return list.slice(0, 4);
  }

  private static extractSkillsFromLines(lines: string[], fullText: string) {
    const skillsList: ExtractedCvData['skills'] = [];
    const skillCandidates = [
      { name: 'TypeScript', category: 'Technical' as const, prof: 95 },
      { name: 'JavaScript', category: 'Technical' as const, prof: 95 },
      { name: 'React.js', category: 'Technical' as const, prof: 92 },
      { name: 'Node.js', category: 'Technical' as const, prof: 90 },
      { name: 'Python', category: 'Technical' as const, prof: 88 },
      { name: 'Java', category: 'Technical' as const, prof: 85 },
      { name: 'PostgreSQL', category: 'Technical' as const, prof: 90 },
      { name: 'MongoDB', category: 'Technical' as const, prof: 85 },
      { name: 'Docker', category: 'Tool' as const, prof: 88 },
      { name: 'Kubernetes', category: 'Tool' as const, prof: 82 },
      { name: 'AWS', category: 'Tool' as const, prof: 88 },
      { name: 'Azure', category: 'Tool' as const, prof: 82 },
      { name: 'Git & GitHub', category: 'Tool' as const, prof: 95 },
      { name: 'Tailwind CSS', category: 'Technical' as const, prof: 92 },
      { name: 'REST APIs', category: 'Technical' as const, prof: 94 },
      { name: 'GraphQL', category: 'Technical' as const, prof: 85 },
      { name: 'CI/CD Pipelines', category: 'Tool' as const, prof: 88 },
      { name: 'Redis', category: 'Technical' as const, prof: 85 },
      { name: 'Agile & Scrum', category: 'Soft' as const, prof: 90 },
      { name: 'System Architecture', category: 'Technical' as const, prof: 90 },
      { name: 'Figma', category: 'Tool' as const, prof: 85 },
      { name: 'Leadership & Mentoring', category: 'Soft' as const, prof: 92 },
    ];

    const detected = new Set<string>();

    // Check words in skills section + full document
    const textToCheck = lines.join(' ') + ' ' + fullText;

    for (const item of skillCandidates) {
      const regex = new RegExp(`\\b${item.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(textToCheck)) {
        detected.add(item.name);
        skillsList.push({
          name: item.name,
          category: item.category,
          proficiency: item.prof,
        });
      }
    }

    return skillsList.slice(0, 15);
  }

  private static extractProjectsFromLines(lines: string[], title: string) {
    const projects: ExtractedCvData['projects'] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.length > 5 && line.length < 60 && !line.startsWith('-') && !line.startsWith('•')) {
        const projTitle = line.replace(/[:—|-].*$/, '').trim();
        const desc = lines[i + 1] && lines[i + 1].length > 15 ? lines[i + 1] : `Engineered an innovative solution leveraging modern cloud technologies and scalable architectures.`;

        projects.push({
          title: projTitle || 'Cloud Portfolio Platform',
          description: desc,
          technologies: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
          role: title || 'Full Stack Engineer',
          featured: projects.length === 0,
        });

        if (projects.length >= 3) break;
      }
    }
    return projects;
  }

  private static extractCertificationsFromLines(lines: string[]) {
    const certs: ExtractedCvData['certifications'] = [];
    for (const line of lines) {
      if (line.length > 5 && line.length < 80) {
        certs.push({
          name: line.replace(/\((?:19|20)\d{2}\)/, '').trim(),
          issuingOrganization: line.toLowerCase().includes('aws') ? 'Amazon Web Services' : line.toLowerCase().includes('google') ? 'Google Cloud' : 'Professional Institute',
          issueDate: (line.match(/(?:19|20)\d{2}/) || ['2023'])[0],
        });
        if (certs.length >= 4) break;
      }
    }
    return certs;
  }

  private static extractLanguagesFromLines(lines: string[], text: string) {
    const commonLanguages = ['English', 'Spanish', 'French', 'German', 'Mandarin', 'Arabic', 'Swahili', 'Japanese', 'Portuguese', 'Hindi'];
    const langs: ExtractedCvData['languages'] = [];

    const searchTarget = lines.join(' ') + ' ' + text;
    for (const lang of commonLanguages) {
      if (new RegExp(`\\b${lang}\\b`, 'i').test(searchTarget)) {
        langs.push({
          language: lang,
          proficiency: langs.length === 0 ? 'Native / Fluent' : 'Professional Working',
        });
      }
    }

    return langs.length > 0 ? langs : [{ language: 'English', proficiency: 'Native / Fluent' }];
  }

  private static extractLocation(text: string): string {
    const cities = [
      'Nairobi, Kenya', 'San Francisco, CA', 'New York, NY', 'London, UK',
      'Toronto, Canada', 'Berlin, Germany', 'Austin, TX', 'Seattle, WA',
      'Sydney, Australia', 'Singapore', 'Amsterdam, Netherlands'
    ];
    for (const city of cities) {
      const cityName = city.split(',')[0];
      if (new RegExp(`\\b${cityName}\\b`, 'i').test(text)) {
        return city;
      }
    }
    return 'Remote / Hybrid';
  }

  private static generateFallbackProfile(userProfession?: string): ExtractedCvData {
    const title = userProfession || 'Senior Software Architect & Full-Stack Engineer';
    return {
      personalInfo: {
        fullName: 'Francis Mwangi',
        title,
        email: 'francis@example.com',
        phone: '+254 700 000000',
        location: 'Nairobi, Kenya',
        website: 'https://francismwangi.dev',
        linkedin: 'https://linkedin.com/in/francismwangi',
        github: 'https://github.com/francismwangi',
      },
      headline: `${title} | Designing Scalable Multi-Tenant Systems`,
      summary: `Senior Full-Stack Architect with 7+ years of experience designing and implementing scalable multi-tenant microservices, real-time web applications, and automated DevOps workflows.`,
      experiences: this.generateDefaultExperiences(title),
      education: this.generateDefaultEducation(),
      skills: this.generateDefaultSkills(title),
      projects: this.generateDefaultProjects(title),
      certifications: this.generateDefaultCertifications(),
      languages: [
        { language: 'English', proficiency: 'Native / Fluent' },
        { language: 'Swahili', proficiency: 'Professional' },
      ],
    };
  }

  private static generateDefaultExperiences(title: string) {
    return [
      {
        company: 'Tech Solutions Corp',
        position: title || 'Senior Software Architect',
        location: 'Nairobi, Kenya (Hybrid)',
        startDate: '2021-01',
        isCurrent: true,
        description: 'Spearheaded multi-tenant SaaS architecture serving over 50,000 active users with high uptime and automated deployments.',
        responsibilities: [
          'Architected high-throughput microservices handling real-time data sync.',
          'Reduced backend infrastructure costs by 40% using containerization & caching.',
          'Mentored 12 software engineers across frontend and backend technologies.',
        ],
        achievements: ['Awarded Top Engineering Performer Q3 2023'],
      },
      {
        company: 'Apex Systems',
        position: 'Full-Stack Developer',
        location: 'Remote',
        startDate: '2018-05',
        endDate: '2020-12',
        isCurrent: false,
        description: 'Developed responsive, high-performance web applications and engineered secure REST APIs.',
        responsibilities: [
          'Built responsive user interfaces with React and Tailwind CSS.',
          'Implemented strict JWT-based authentication and role-based access control.',
        ],
        achievements: ['Decreased page load times by 35% across web client'],
      },
    ];
  }

  private static generateDefaultEducation() {
    return [
      {
        institution: 'University of Nairobi',
        qualification: 'Bachelor of Science',
        field: 'Computer Science & Software Engineering',
        startDate: '2014-09',
        endDate: '2018-05',
        grade: 'First Class Honors',
      },
    ];
  }

  private static generateDefaultSkills(title: string) {
    return [
      { name: 'TypeScript', category: 'Technical' as const, proficiency: 95 },
      { name: 'React.js', category: 'Technical' as const, proficiency: 92 },
      { name: 'Node.js', category: 'Technical' as const, proficiency: 90 },
      { name: 'PostgreSQL', category: 'Technical' as const, proficiency: 88 },
      { name: 'Prisma ORM', category: 'Technical' as const, proficiency: 90 },
      { name: 'Docker', category: 'Tool' as const, proficiency: 85 },
      { name: 'Redis', category: 'Technical' as const, proficiency: 84 },
      { name: 'REST & GraphQL', category: 'Technical' as const, proficiency: 92 },
      { name: 'Git & GitHub Actions', category: 'Tool' as const, proficiency: 90 },
      { name: 'Tailwind CSS', category: 'Technical' as const, proficiency: 92 },
      { name: 'System Design', category: 'Technical' as const, proficiency: 88 },
      { name: 'Agile & Team Leadership', category: 'Soft' as const, proficiency: 94 },
    ];
  }

  private static generateDefaultProjects(title: string) {
    return [
      {
        title: 'Multi-Tenant Portfolio & CV Platform',
        description: 'Engineered a multi-tenant portfolio platform supporting 20 profession-specific themes, AI CV parsing, and instant PDF generation.',
        technologies: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker'],
        demoUrl: 'https://demo.myportfolio.com',
        githubUrl: 'https://github.com/example/portfolio-sys',
        role: 'Lead Architect',
        featured: true,
      },
    ];
  }

  private static generateDefaultCertifications() {
    return [
      {
        name: 'AWS Certified Solutions Architect',
        issuingOrganization: 'Amazon Web Services',
        issueDate: '2022-06',
        credentialId: 'AWS-SA-88942',
      },
      {
        name: 'Certified Kubernetes Administrator (CKA)',
        issuingOrganization: 'Cloud Native Computing Foundation',
        issueDate: '2023-03',
        credentialId: 'CKA-9921',
      },
    ];
  }
}

