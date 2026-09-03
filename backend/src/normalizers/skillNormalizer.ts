import crypto from 'crypto';
import { SkillCategory, SkillItem, SkillProficiency } from '../types/schema';

export class SkillNormalizer {
  private static CATEGORY_DICTIONARY: Record<SkillCategory, Set<string>> = {
    PROGRAMMING_LANGUAGE: new Set([
      'javascript', 'typescript', 'python', 'java', 'c', 'c++', 'c#', 'csharp', 'go', 'golang',
      'rust', 'ruby', 'php', 'swift', 'kotlin', 'dart', 'scala', 'r', 'matlab', 'perl', 'haskell',
      'elixir', 'clojure', 'lua', 'shell', 'bash', 'powershell', 'html', 'html5', 'css', 'css3', 'sass', 'scss'
    ]),
    FRAMEWORK: new Set([
      'react', 'react.js', 'reactjs', 'react native', 'angular', 'angularjs', 'vue', 'vue.js', 'vuejs',
      'next.js', 'nextjs', 'nuxt.js', 'nuxtjs', 'svelte', 'express', 'express.js', 'expressjs',
      'nest.js', 'nestjs', 'node.js', 'nodejs', 'django', 'flask', 'fastapi', 'spring', 'spring boot',
      'laravel', 'symfony', 'ruby on rails', 'rails', 'asp.net', '.net core', 'flutter', 'tailwind',
      'tailwindcss', 'bootstrap', 'material-ui', 'chakra-ui', 'redux', 'mobx', 'zustand', 'graphql',
      'apollo', 'prisma', 'typeorm', 'hibernate', 'junit', 'jest', 'cypress', 'playwright', 'selenium'
    ]),
    DATABASE: new Set([
      'sql', 'postgresql', 'postgres', 'mysql', 'mariadb', 'sqlite', 'oracle', 'mssql', 'sql server',
      'mongodb', 'cassandra', 'dynamodb', 'redis', 'elasticsearch', 'couchdb', 'neo4j', 'firebase firestore',
      'supabase', 'prisma', 'cockroachdb', 'snowflake', 'bigquery', 'clickhouse'
    ]),
    CLOUD: new Set([
      'aws', 'amazon web services', 'azure', 'microsoft azure', 'gcp', 'google cloud', 'google cloud platform',
      'docker', 'kubernetes', 'k8s', 'terraform', 'ansible', 'helm', 'ci/cd', 'github actions', 'gitlab ci',
      'jenkins', 'circleci', 'serverless', 'lambda', 'ec2', 's3', 'ecs', 'eks', 'digitalocean', 'vercel',
      'netlify', 'cloudflare', 'heroku', 'linux', 'unix', 'nginx', 'apache'
    ]),
    TOOL: new Set([
      'git', 'github', 'gitlab', 'bitbucket', 'jira', 'confluence', 'trello', 'asana', 'figma', 'sketch',
      'adobe xd', 'photoshop', 'illustrator', 'postman', 'insomnia', 'vscode', 'visual studio', 'intellij',
      'pycharm', 'vim', 'neovim', 'excel', 'microsoft excel', 'power bi', 'tableau', 'datadog', 'grafana', 'prometheus', 'sentry'
    ]),
    SOFT: new Set([
      'communication', 'teamwork', 'collaboration', 'leadership', 'problem solving', 'critical thinking',
      'adaptability', 'flexibility', 'time management', 'work ethic', 'conflict resolution', 'negotiation',
      'mentoring', 'decision making', 'creativity', 'presentation', 'active listening', 'organization'
    ]),
    DOMAIN: new Set([
      'agile', 'scrum', 'kanban', 'devops', 'microservices', 'rest api', 'restful api', 'machine learning',
      'deep learning', 'artificial intelligence', 'nlp', 'computer vision', 'data science', 'data analytics',
      'data engineering', 'etl', 'system architecture', 'object-oriented programming', 'oop', 'functional programming',
      'test-driven development', 'tdd', 'cybersecurity', 'ui/ux', 'seo', 'financial modeling', 'fintech'
    ]),
    OTHER: new Set([]),
  };

  /**
   * Normalizes an array of skills, deduping and classifying into taxonomy categories.
   */
  public static normalizeSkills(skills?: Array<Partial<SkillItem> | string> | null): SkillItem[] {
    if (!skills || !Array.isArray(skills)) return [];

    const seen = new Map<string, SkillItem>();

    for (const item of skills) {
      let rawName = '';
      let category: SkillCategory | undefined;
      let proficiency: SkillProficiency | undefined;
      let years: number | null | undefined = null;
      let id = '';

      if (typeof item === 'string') {
        rawName = item.trim();
      } else if (item && typeof item === 'object') {
        rawName = (item.name || '').trim();
        category = item.category;
        proficiency = item.proficiency;
        years = item.yearsOfExperience;
        id = item.id || '';
      }

      // Filter out invalid or noisy names
      if (!rawName || rawName.length < 2 || rawName.length > 50) continue;

      const normalizedKey = rawName.toLowerCase();
      if (seen.has(normalizedKey)) {
        // If existing had fewer details, enrich it
        const existing = seen.get(normalizedKey)!;
        if (!existing.proficiency && proficiency) existing.proficiency = proficiency;
        if (!existing.yearsOfExperience && years) existing.yearsOfExperience = years;
        continue;
      }

      const inferredCategory = category || this.inferCategory(rawName);
      const inferredProficiency = proficiency || this.inferProficiency(rawName);

      seen.set(normalizedKey, {
        id: id || crypto.randomUUID(),
        name: this.formatSkillName(rawName),
        category: inferredCategory,
        proficiency: inferredProficiency,
        yearsOfExperience: typeof years === 'number' ? years : null,
      });
    }

    return Array.from(seen.values());
  }

  public static inferCategory(skillName: string): SkillCategory {
    const lower = skillName.toLowerCase().trim();

    for (const [cat, set] of Object.entries(this.CATEGORY_DICTIONARY)) {
      if (set.has(lower)) {
        return cat as SkillCategory;
      }
    }

    // Pattern heuristics
    if (/\b(js|script|lang|programming|coding)\b/i.test(lower)) return 'PROGRAMMING_LANGUAGE';
    if (/\b(framework|library|sdk)\b/i.test(lower)) return 'FRAMEWORK';
    if (/\b(db|database|sql|nosql|storage)\b/i.test(lower)) return 'DATABASE';
    if (/\b(cloud|devops|aws|azure|gcp|infra|server|pipeline)\b/i.test(lower)) return 'CLOUD';
    if (/\b(tool|ide|editor|suite|software)\b/i.test(lower)) return 'TOOL';
    if (/\b(management|communication|leadership|team|soft)\b/i.test(lower)) return 'SOFT';
    if (/\b(methodology|analytics|architecture|security|intelligence)\b/i.test(lower)) return 'DOMAIN';

    return 'OTHER';
  }

  public static inferProficiency(text: string): SkillProficiency | undefined {
    const lower = text.toLowerCase();
    if (/\b(expert|master|principal|lead)\b/i.test(lower)) return 'EXPERT';
    if (/\b(advanced|senior|proficient)\b/i.test(lower)) return 'ADVANCED';
    if (/\b(intermediate|moderate|mid)\b/i.test(lower)) return 'INTERMEDIATE';
    if (/\b(beginner|basic|novice|entry|junior)\b/i.test(lower)) return 'BEGINNER';
    return undefined;
  }

  private static formatSkillName(name: string): string {
    // Preserve special standard skill brandings
    const specialMap: Record<string, string> = {
      javascript: 'JavaScript',
      typescript: 'TypeScript',
      nodejs: 'Node.js',
      'node.js': 'Node.js',
      reactjs: 'React',
      'react.js': 'React',
      react: 'React',
      nextjs: 'Next.js',
      'next.js': 'Next.js',
      vuejs: 'Vue.js',
      'vue.js': 'Vue.js',
      postgresql: 'PostgreSQL',
      mysql: 'MySQL',
      mongodb: 'MongoDB',
      graphql: 'GraphQL',
      aws: 'AWS',
      gcp: 'GCP',
      html: 'HTML5',
      html5: 'HTML5',
      css: 'CSS3',
      css3: 'CSS3',
      ui: 'UI/UX',
      'ui/ux': 'UI/UX',
      sql: 'SQL',
      nosql: 'NoSQL',
      cicd: 'CI/CD',
      'ci/cd': 'CI/CD',
    };

    const lower = name.toLowerCase();
    if (specialMap[lower]) return specialMap[lower];

    // Capitalize first letter of each word
    return name
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
}
