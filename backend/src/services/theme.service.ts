import { prisma } from '../database/client';

export interface ThemeConfig {
  themeId: string;
  name: string;
  profession: string;
  description: string;
  layoutConfig: any;
  defaultColors: any;
  typography: any;
  orderIndex: number;
}

export const THEME_COLOR_KEYS = ['primary', 'secondary', 'accent', 'background', 'surface', 'text'] as const;
export const THEME_FONT_OPTIONS = [
  'Inter', 'Outfit', 'Poppins', 'Roboto', 'Space Grotesk', 'JetBrains Mono',
  'Fira Code', 'Plus Jakarta Sans', 'Syne', 'Cinzel', 'Merriweather', 'Lora',
  'Playfair Display', 'Libre Baskerville', 'Lato', 'Nunito', 'Raleway', 'DM Sans',
] as const;
export const THEME_LAYOUT_OPTIONS = ['classic', 'sidebar', 'grid', 'timeline', 'fullwidth', 'minimal', 'card-deck'] as const;
export const THEME_CARD_STYLE_OPTIONS = ['glass', 'solid', 'shadow', 'flat', 'neon', 'raised'] as const;
export const THEME_ANIMATION_OPTIONS = ['none', 'fade', 'slide', 'zoom', 'flip', 'glitch', 'ripple', 'bounce'] as const;
export const THEME_FEATURE_KEYS = ['showCodeBadges', 'showCharts', 'showTerminalHeader', 'showPrototypes', 'showQrInPdf'] as const;

export const SEEDED_THEMES: ThemeConfig[] = [
  {
    themeId: 'software-engineer',
    name: 'Software Engineer',
    profession: 'Software Engineering',
    description: 'Modern developer portfolio with code accents, technology badges, and terminal aesthetics.',
    layoutConfig: { layout: 'sidebar', heroStyle: 'code-split', cardStyle: 'glass', animation: 'slide', showCodeBadges: true },
    defaultColors: { primary: '#6366f1', secondary: '#3b82f6', background: '#0f172a', surface: '#1e293b', text: '#f8fafc', accent: '#22c55e' },
    typography: { heading: 'Inter', body: 'Inter', code: 'Fira Code' },
    orderIndex: 1,
  },
  {
    themeId: 'data-scientist',
    name: 'Data Scientist',
    profession: 'Data Science & AI',
    description: 'Analytics-oriented design with metrics grids, data visualization cards, and research highlights.',
    layoutConfig: { layout: 'grid', heroStyle: 'metrics-banner', cardStyle: 'raised', animation: 'zoom', showCharts: true },
    defaultColors: { primary: '#0ea5e9', secondary: '#2563eb', background: '#090d16', surface: '#111827', text: '#f3f4f6', accent: '#8b5cf6' },
    typography: { heading: 'Outfit', body: 'Inter' },
    orderIndex: 2,
  },
  {
    themeId: 'cybersecurity',
    name: 'Cybersecurity Professional',
    profession: 'Cybersecurity',
    description: 'Security-focused dark technical aesthetic with terminal vibes and matrix accents.',
    layoutConfig: { layout: 'timeline', heroStyle: 'cyber-hud', cardStyle: 'neon', animation: 'glitch', showTerminalHeader: true },
    defaultColors: { primary: '#10b981', secondary: '#059669', background: '#050b0a', surface: '#0d1815', text: '#ecfdf5', accent: '#00ff66' },
    typography: { heading: 'Fira Code', body: 'Fira Code' },
    orderIndex: 3,
  },
  {
    themeId: 'network-engineer',
    name: 'Network Engineer',
    profession: 'Network Engineering',
    description: 'Infrastructure and network topology-inspired visual language with status indicators.',
    layoutConfig: { layout: 'grid', heroStyle: 'topology-header', cardStyle: 'solid', animation: 'slide' },
    defaultColors: { primary: '#0284c7', secondary: '#0369a1', background: '#0c131d', surface: '#16202e', text: '#f0f9ff', accent: '#f59e0b' },
    typography: { heading: 'Space Grotesk', body: 'Inter' },
    orderIndex: 4,
  },
  {
    themeId: 'devops-cloud',
    name: 'DevOps & Cloud Engineer',
    profession: 'DevOps / Cloud Architecture',
    description: 'Cloud, infrastructure, and automation-oriented design featuring deployment pipelines.',
    layoutConfig: { layout: 'card-deck', heroStyle: 'cloud-architecture', cardStyle: 'glass', animation: 'fade' },
    defaultColors: { primary: '#ec4899', secondary: '#8b5cf6', background: '#0f0e17', surface: '#1a192b', text: '#fffffe', accent: '#3b82f6' },
    typography: { heading: 'JetBrains Mono', body: 'Inter' },
    orderIndex: 5,
  },
  {
    themeId: 'ui-ux-designer',
    name: 'UI/UX Designer',
    profession: 'UI/UX Design',
    description: 'Clean, highly visual layout emphasizing case studies, interactive prototypes, and typography.',
    layoutConfig: { layout: 'minimal', heroStyle: 'minimal-editorial', cardStyle: 'shadow', animation: 'fade', showPrototypes: true },
    defaultColors: { primary: '#f43f5e', secondary: '#fb7185', background: '#ffffff', surface: '#f8fafc', text: '#0f172a', accent: '#8b5cf6' },
    typography: { heading: 'Outfit', body: 'Inter' },
    orderIndex: 6,
  },
  {
    themeId: 'graphic-designer',
    name: 'Graphic Designer',
    profession: 'Graphic Design',
    description: 'Visual-first portfolio showcasing large media previews, masonry galleries, and bold headers.',
    layoutConfig: { layout: 'grid', heroStyle: 'bold-hero', cardStyle: 'shadow', animation: 'slide' },
    defaultColors: { primary: '#a855f7', secondary: '#d946ef', background: '#09090b', surface: '#18181b', text: '#fafafa', accent: '#f43f5e' },
    typography: { heading: 'Syne', body: 'Plus Jakarta Sans' },
    orderIndex: 7,
  },
  {
    themeId: 'architect',
    name: 'Architect',
    profession: 'Architecture',
    description: 'Elegant editorial layout with structured line work, project galleries, and blueprint elements.',
    layoutConfig: { layout: 'classic', heroStyle: 'monochrome-hero', cardStyle: 'flat', animation: 'zoom' },
    defaultColors: { primary: '#27272a', secondary: '#52525b', background: '#fafafa', surface: '#ffffff', text: '#18181b', accent: '#d97706' },
    typography: { heading: 'Cinzel', body: 'Inter' },
    orderIndex: 8,
  },
  {
    themeId: 'civil-engineer',
    name: 'Civil Engineer',
    profession: 'Civil Engineering',
    description: 'Professional engineering portfolio showcasing major projects, structural blueprints, and certifications.',
    layoutConfig: { layout: 'timeline', heroStyle: 'structural-hero', cardStyle: 'solid', animation: 'slide' },
    defaultColors: { primary: '#2563eb', secondary: '#1d4ed8', background: '#f8fafc', surface: '#ffffff', text: '#0f172a', accent: '#eab308' },
    typography: { heading: 'Roboto', body: 'Roboto' },
    orderIndex: 9,
  },
  {
    themeId: 'electrical-engineer',
    name: 'Electrical Engineer',
    profession: 'Electrical Engineering',
    description: 'Technical portfolio featuring project diagrams, circuit schematics, and hardware specifications.',
    layoutConfig: { layout: 'sidebar', heroStyle: 'hardware-hero', cardStyle: 'neon', animation: 'glitch' },
    defaultColors: { primary: '#ea580c', secondary: '#c2410c', background: '#0a0f1d', surface: '#11192e', text: '#f8fafc', accent: '#06b6d4' },
    typography: { heading: 'Space Grotesk', body: 'Inter' },
    orderIndex: 10,
  },
  {
    themeId: 'mechanical-engineer',
    name: 'Mechanical Engineer',
    profession: 'Mechanical Engineering',
    description: 'Industrial clean aesthetic featuring CAD showcases, mechanical projects, and technical timeline.',
    layoutConfig: { layout: 'card-deck', heroStyle: 'cad-hero', cardStyle: 'raised', animation: 'slide' },
    defaultColors: { primary: '#475569', secondary: '#334155', background: '#0f172a', surface: '#1e293b', text: '#f8fafc', accent: '#f97316' },
    typography: { heading: 'Inter', body: 'Inter' },
    orderIndex: 11,
  },
  {
    themeId: 'medical-professional',
    name: 'Medical Professional',
    profession: 'Healthcare & Medical',
    description: 'Clean, trustworthy healthcare-oriented layout with clinical background, credentials, and publications.',
    layoutConfig: { layout: 'minimal', heroStyle: 'trust-hero', cardStyle: 'solid', animation: 'ripple' },
    defaultColors: { primary: '#0d9488', secondary: '#0f766e', background: '#f0fdf4', surface: '#ffffff', text: '#134e4a', accent: '#0284c7' },
    typography: { heading: 'Plus Jakarta Sans', body: 'Inter' },
    orderIndex: 12,
  },
  {
    themeId: 'legal-professional',
    name: 'Lawyer / Legal Professional',
    profession: 'Legal Services',
    description: 'Formal, authoritative serif design with navy & gold accents, case highlights, and client trust badges.',
    layoutConfig: { layout: 'classic', heroStyle: 'authoritative-hero', cardStyle: 'flat', animation: 'fade' },
    defaultColors: { primary: '#1e3a8a', secondary: '#1e40af', background: '#f8fafc', surface: '#ffffff', text: '#0f172a', accent: '#d97706' },
    typography: { heading: 'Merriweather', body: 'Lora' },
    orderIndex: 13,
  },
  {
    themeId: 'finance-professional',
    name: 'Accountant / Finance Professional',
    profession: 'Finance & Accounting',
    description: 'Corporate finance layout emphasizing financial metrics, advisory services, and credentials.',
    layoutConfig: { layout: 'grid', heroStyle: 'financial-summary', cardStyle: 'solid', animation: 'zoom' },
    defaultColors: { primary: '#059669', secondary: '#047857', background: '#ffffff', surface: '#f8fafc', text: '#064e3b', accent: '#1e3a8a' },
    typography: { heading: 'Libre Baskerville', body: 'Inter' },
    orderIndex: 14,
  },
  {
    themeId: 'marketing-professional',
    name: 'Marketing Professional',
    profession: 'Marketing & PR',
    description: 'Dynamic, high-impact gradient layout focusing on campaign stats, ROI metrics, and brand showcases.',
    layoutConfig: { layout: 'fullwidth', heroStyle: 'gradient-vibrant', cardStyle: 'raised', animation: 'bounce' },
    defaultColors: { primary: '#7c3aed', secondary: '#9333ea', background: '#090514', surface: '#140c2c', text: '#fafafa', accent: '#f43f5e' },
    typography: { heading: 'Poppins', body: 'Inter' },
    orderIndex: 15,
  },
  {
    themeId: 'photographer',
    name: 'Photographer',
    profession: 'Photography',
    description: 'Darkroom aesthetic image-first portfolio featuring fullscreen sliders, albums, and booking form.',
    layoutConfig: { layout: 'fullwidth', heroStyle: 'fullscreen-image', cardStyle: 'flat', animation: 'zoom' },
    defaultColors: { primary: '#18181b', secondary: '#27272a', background: '#000000', surface: '#121212', text: '#f4f4f5', accent: '#e4e4e7' },
    typography: { heading: 'Playfair Display', body: 'Inter' },
    orderIndex: 16,
  },
  {
    themeId: 'educator',
    name: 'Teacher / Educator',
    profession: 'Education & Pedagogy',
    description: 'Academic and warm layout presenting teaching philosophies, subject courses, and student reviews.',
    layoutConfig: { layout: 'card-deck', heroStyle: 'educator-banner', cardStyle: 'shadow', animation: 'fade' },
    defaultColors: { primary: '#0284c7', secondary: '#0369a1', background: '#fffbe8', surface: '#ffffff', text: '#1e293b', accent: '#16a34a' },
    typography: { heading: 'Outfit', body: 'Inter' },
    orderIndex: 17,
  },
  {
    themeId: 'academic-researcher',
    name: 'Researcher / Academic',
    profession: 'Academia & Research',
    description: 'Publication and IEEE paper heavy layout with citation counters, co-authors, and grant awards.',
    layoutConfig: { layout: 'classic', heroStyle: 'academic-profile', cardStyle: 'flat', animation: 'slide' },
    defaultColors: { primary: '#334155', secondary: '#1e293b', background: '#ffffff', surface: '#f8fafc', text: '#0f172a', accent: '#2563eb' },
    typography: { heading: 'Lora', body: 'Inter' },
    orderIndex: 18,
  },
  {
    themeId: 'freelancer-consultant',
    name: 'Freelancer / Consultant',
    profession: 'Consulting & Advisory',
    description: 'Service package oriented layout featuring client testimonials, case studies, and scheduling CTA.',
    layoutConfig: { layout: 'sidebar', heroStyle: 'cta-headline', cardStyle: 'raised', animation: 'fade' },
    defaultColors: { primary: '#4f46e5', secondary: '#4338ca', background: '#ffffff', surface: '#f8fafc', text: '#1e1b4b', accent: '#10b981' },
    typography: { heading: 'Plus Jakarta Sans', body: 'Inter' },
    orderIndex: 19,
  },
  {
    themeId: 'creative-professional',
    name: 'Creative Professional',
    profession: 'Creative Arts & Design',
    description: 'Flexible artistic asymmetrical portfolio layout breaking traditional grids with vibrant micro-interactions.',
    layoutConfig: { layout: 'grid', heroStyle: 'avant-garde', cardStyle: 'glass', animation: 'flip' },
    defaultColors: { primary: '#ec4899', secondary: '#d946ef', background: '#0c0a09', surface: '#1c1917', text: '#fafaf9', accent: '#eab308' },
    typography: { heading: 'Syne', body: 'Outfit' },
    orderIndex: 20,
  },
];

export class ThemeService {
  public static async getAllThemes() {
    return prisma.portfolioTheme.findMany({
      where: { isPublished: true },
      orderBy: { orderIndex: 'asc' },
    });
  }

  public static async getThemeById(themeId: string) {
    return prisma.portfolioTheme.findUnique({
      where: { themeId },
    });
  }

  public static async seedThemes() {
    for (const theme of SEEDED_THEMES) {
      await prisma.portfolioTheme.upsert({
        where: { themeId: theme.themeId },
        update: theme,
        create: theme,
      });
    }
  }
}
