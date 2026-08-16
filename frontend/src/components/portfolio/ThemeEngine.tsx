import React from 'react';
import { Profile } from '../../types';
import {
  Download, QrCode, Mail, Linkedin, Github, Twitter, Globe, Star,
  Briefcase, GraduationCap, Award as AwardIcon, Code, Terminal,
  ShieldCheck, Cpu, Layers, Database, ExternalLink, Phone, MapPin,
  CheckCircle2, Share2, Zap, BarChart2, BookOpen, Scale, TrendingUp,
  Camera, Users, FlaskConical, Menu, X as XIcon,
} from 'lucide-react';

interface ThemeEngineProps {
  profile: Profile;
  subdomain: string;
  onOpenQrModal: () => void;
  onOpenReviewModal: () => void;
  onDownloadPdf: () => void;
  onSendMessage: (data: any) => Promise<void>;
}

// ─── Derive full theme config from DB record ───────────────────────────────
function buildThemeVars(themeId: string, customization: any) {
  const theme = customization?.theme;
  const rawColors = customization?.colorPalette || theme?.defaultColors || getDefaultColors(themeId);
  const colors = {
    ...getDefaultColors(themeId),
    ...(theme?.defaultColors || {}),
    ...(typeof rawColors === 'object' ? rawColors : {}),
  };

  const headingFont = customization?.fontHeading || theme?.typography?.heading || getDefaultTypography(themeId).heading;
  const bodyFont = customization?.fontBody || theme?.typography?.body || getDefaultTypography(themeId).body;
  const typography = { heading: headingFont, body: bodyFont, code: theme?.typography?.code };

  const layout = theme?.layoutConfig || {};
  
  const customAnim = customization?.colorPalette?.animationStyle || customization?.animationStyle;
  const animation = customAnim || layout.animation || getDefaultAnimation(themeId);

  const customCard = customization?.colorPalette?.cardStyle || customization?.cardStyle;
  const rawCard = customCard || layout.cardStyle || getDefaultCardStyle(themeId);
  const cardStyle = LEGACY_CARD_STYLE_ALIASES[rawCard] || rawCard || 'solid';

  const avatarStyle = customization?.colorPalette?.avatarStyle || customization?.avatarStyle;

  return { colors, typography, animation, cardStyle, avatarStyle, layout, theme };
}

// Per-theme defaults (fallbacks if DB not yet loaded)
function getDefaultColors(themeId: string) {
  const map: Record<string, any> = {
    'software-engineer':   { primary:'#6366f1',secondary:'#3b82f6',background:'#0f172a',surface:'#1e293b',text:'#f8fafc',accent:'#22c55e' },
    'data-scientist':      { primary:'#0ea5e9',secondary:'#2563eb',background:'#090d16',surface:'#111827',text:'#f3f4f6',accent:'#8b5cf6' },
    'cybersecurity':       { primary:'#10b981',secondary:'#059669',background:'#050b0a',surface:'#0d1815',text:'#ecfdf5',accent:'#00ff66' },
    'network-engineer':    { primary:'#0284c7',secondary:'#0369a1',background:'#0c131d',surface:'#16202e',text:'#f0f9ff',accent:'#f59e0b' },
    'devops-cloud':        { primary:'#ec4899',secondary:'#8b5cf6',background:'#0f0e17',surface:'#1a192b',text:'#fffffe',accent:'#3b82f6' },
    'ui-ux-designer':      { primary:'#f43f5e',secondary:'#fb7185',background:'#ffffff',surface:'#f8fafc',text:'#0f172a',accent:'#8b5cf6' },
    'graphic-designer':    { primary:'#a855f7',secondary:'#d946ef',background:'#09090b',surface:'#18181b',text:'#fafafa',accent:'#f43f5e' },
    'architect':           { primary:'#27272a',secondary:'#52525b',background:'#fafafa',surface:'#ffffff',text:'#18181b',accent:'#d97706' },
    'civil-engineer':      { primary:'#2563eb',secondary:'#1d4ed8',background:'#f8fafc',surface:'#ffffff',text:'#0f172a',accent:'#eab308' },
    'electrical-engineer': { primary:'#ea580c',secondary:'#c2410c',background:'#0a0f1d',surface:'#11192e',text:'#f8fafc',accent:'#06b6d4' },
    'mechanical-engineer': { primary:'#475569',secondary:'#334155',background:'#0f172a',surface:'#1e293b',text:'#f8fafc',accent:'#f97316' },
    'medical-professional':{ primary:'#0d9488',secondary:'#0f766e',background:'#f0fdf4',surface:'#ffffff',text:'#134e4a',accent:'#0284c7' },
    'legal-professional':  { primary:'#1e3a8a',secondary:'#1e40af',background:'#f8fafc',surface:'#ffffff',text:'#0f172a',accent:'#d97706' },
    'finance-professional':{ primary:'#059669',secondary:'#047857',background:'#ffffff',surface:'#f8fafc',text:'#064e3b',accent:'#1e3a8a' },
    'marketing-professional':{ primary:'#7c3aed',secondary:'#9333ea',background:'#090514',surface:'#140c2c',text:'#fafafa',accent:'#f43f5e' },
    'photographer':        { primary:'#18181b',secondary:'#27272a',background:'#000000',surface:'#121212',text:'#f4f4f5',accent:'#e4e4e7' },
    'educator':            { primary:'#0284c7',secondary:'#0369a1',background:'#fffbe8',surface:'#ffffff',text:'#1e293b',accent:'#16a34a' },
    'academic-researcher': { primary:'#334155',secondary:'#1e293b',background:'#ffffff',surface:'#f8fafc',text:'#0f172a',accent:'#2563eb' },
    'freelancer-consultant':{ primary:'#4f46e5',secondary:'#4338ca',background:'#ffffff',surface:'#f8fafc',text:'#1e1b4b',accent:'#10b981' },
    'creative-professional':{ primary:'#ec4899',secondary:'#d946ef',background:'#0c0a09',surface:'#1c1917',text:'#fafaf9',accent:'#eab308' },
  };
  return map[themeId] || map['software-engineer'];
}

function getDefaultTypography(themeId: string) {
  const map: Record<string, any> = {
    'cybersecurity':        { heading:'Fira Code', body:'Fira Code', code:'Fira Code' },
    'legal-professional':   { heading:'Merriweather', body:'Lora' },
    'architect':            { heading:'Cinzel', body:'Inter' },
    'photographer':         { heading:'Playfair Display', body:'Inter' },
    'academic-researcher':  { heading:'Lora', body:'Inter' },
    'finance-professional': { heading:'Libre Baskerville', body:'Inter' },
    'marketing-professional':{ heading:'Poppins', body:'Inter' },
    'graphic-designer':     { heading:'Syne', body:'Plus Jakarta Sans' },
    'data-scientist':       { heading:'Outfit', body:'Inter' },
    'devops-cloud':         { heading:'JetBrains Mono', body:'Inter' },
    'creative-professional':{ heading:'Syne', body:'Outfit' },
  };
  return map[themeId] || { heading:'Inter', body:'Inter' };
}

function getDefaultAnimation(themeId: string) {
  const map: Record<string, string> = {
    'cybersecurity':'glitch', 'marketing-professional':'bounce',
    'creative-professional':'flip', 'medical-professional':'ripple',
    'data-scientist':'zoom', 'graphic-designer':'slide',
  };
  return map[themeId] || 'fade';
}

function getDefaultCardStyle(themeId: string) {
  const map: Record<string, string> = {
    'cybersecurity':'neon', 'graphic-designer':'shadow',
    'ui-ux-designer':'glass', 'photographer':'flat',
    'marketing-professional':'raised', 'civil-engineer':'solid',
  };
  return map[themeId] || 'solid';
}

const LEGACY_LAYOUT_ALIASES: Record<string, string> = {
  developer: 'sidebar', analytics: 'grid', 'matrix-terminal': 'timeline', infrastructure: 'grid',
  pipeline: 'card-deck', 'case-study': 'minimal', masonry: 'grid', editorial: 'classic',
  blueprint: 'timeline', schematic: 'sidebar', industrial: 'card-deck', clinical: 'minimal',
  'formal-legal': 'classic', 'corporate-finance': 'grid', 'campaign-impact': 'fullwidth',
  'darkroom-gallery': 'fullwidth', 'academic-warm': 'card-deck', 'paper-publication': 'classic',
  'consulting-packages': 'sidebar', 'asymmetrical-art': 'grid',
};

const LEGACY_CARD_STYLE_ALIASES: Record<string, string> = {
  'data-grid': 'raised', 'bordered-dark': 'neon', 'system-panel': 'solid', 'docker-card': 'glass',
  'soft-shadow': 'shadow', 'image-focus': 'shadow', 'architectural-grid': 'flat', 'steel-border': 'solid',
  'circuit-panel': 'neon', 'metallic-card': 'raised', 'clean-teal': 'solid', 'gold-trimmed': 'flat',
  'slate-border': 'solid', 'stat-highlight': 'raised', 'frameless-photo': 'flat', 'soft-card': 'shadow',
  'paper-bordered': 'flat', 'pricing-card': 'raised', 'floating-glass': 'glass',
};

// ─── Card style CSS ────────────────────────────────────────────────────────
function getCardClass(cardStyle: string) {
  return `theme-card theme-card--${cardStyle}`;
}

// ─── Animation CSS class ──────────────────────────────────────────────────
function getAnimClass(animation: string) {
  switch (animation) {
    case 'fade':
    case 'slide':
    case 'zoom':
    case 'flip':
    case 'glitch':
    case 'ripple':
    case 'bounce':
      return `theme-reveal theme-reveal--${animation}`;
    default:
      return '';
  }
}

// ─── Theme icon map ────────────────────────────────────────────────────────
function getThemeIcon(themeId: string) {
  const map: Record<string, React.ElementType> = {
    'software-engineer': Code, 'data-scientist': BarChart2, 'cybersecurity': ShieldCheck,
    'network-engineer': Layers, 'devops-cloud': Cpu, 'ui-ux-designer': Zap,
    'graphic-designer': Zap, 'architect': BookOpen, 'civil-engineer': Briefcase,
    'electrical-engineer': Zap, 'mechanical-engineer': Cpu,
    'medical-professional': FlaskConical, 'legal-professional': Scale,
    'finance-professional': TrendingUp, 'marketing-professional': TrendingUp,
    'photographer': Camera, 'educator': GraduationCap, 'academic-researcher': BookOpen,
    'freelancer-consultant': Users, 'creative-professional': Zap,
  };
  const Icon = map[themeId] || Code;
  return Icon;
}

// ─── Avatar Shape Helper ──────────────────────────────────────────────────
export type AvatarViewShape = 'round' | 'oval' | 'square';

function getDefaultAvatarShape(themeId: string): AvatarViewShape {
  const ovalThemes = [
    'ui-ux-designer', 'graphic-designer', 'photographer',
    'creative-professional', 'asymmetrical-art', 'marketing-professional',
  ];
  const squareThemes = [
    'data-scientist', 'architect', 'electrical-engineer',
    'mechanical-engineer', 'legal-professional', 'finance-professional',
    'educator', 'freelancer-consultant',
  ];

  if (ovalThemes.includes(themeId)) return 'oval';
  if (squareThemes.includes(themeId)) return 'square';
  return 'round';
}

// ─── Main Engine ──────────────────────────────────────────────────────────
export const ThemeEngine: React.FC<ThemeEngineProps> = ({
  profile, subdomain, onOpenQrModal, onOpenReviewModal, onDownloadPdf, onSendMessage,
}) => {
  const themeId = profile.customization?.themeId || 'software-engineer';
  const fullName = profile.user?.fullName || 'Portfolio Owner';
  const title = profile.title || 'Professional';

  const defaultAvatarShape = getDefaultAvatarShape(themeId);
  const activeCustomAvatarStyle = (profile.customization?.avatarStyle || profile.customization?.colorPalette?.avatarStyle) as AvatarViewShape | undefined;
  const [avatarShape, setAvatarShape] = React.useState<AvatarViewShape>(
    (activeCustomAvatarStyle && ['round', 'oval', 'square'].includes(activeCustomAvatarStyle)) ? activeCustomAvatarStyle : defaultAvatarShape
  );

  React.useEffect(() => {
    const shapeFromCustom = (profile.customization?.avatarStyle || profile.customization?.colorPalette?.avatarStyle) as AvatarViewShape | undefined;
    if (shapeFromCustom && ['round', 'oval', 'square'].includes(shapeFromCustom)) {
      setAvatarShape(shapeFromCustom);
    } else {
      setAvatarShape(getDefaultAvatarShape(themeId));
    }
  }, [themeId, profile.customization?.avatarStyle, profile.customization?.colorPalette?.avatarStyle]);

  const avatarShapeConfigs: Record<AvatarViewShape, { container: string; glow: string; image: string; name: string }> = {
    round: {
      container: 'w-64 h-64 md:w-76 md:h-76 rounded-full',
      glow: 'rounded-full',
      image: 'rounded-full',
      name: 'Round View',
    },
    oval: {
      container: 'w-60 h-72 md:w-68 md:h-84 rounded-[50%_50%_45%_45%] aspect-[4/5]',
      glow: 'rounded-[50%_50%_45%_45%]',
      image: 'rounded-[50%_50%_45%_45%]',
      name: 'Oval View',
    },
    square: {
      container: 'w-64 h-64 md:w-80 md:h-80 rounded-2xl md:rounded-3xl',
      glow: 'rounded-2xl md:rounded-3xl',
      image: 'rounded-2xl md:rounded-3xl',
      name: 'Rectangular View',
    },
  };

  const activeAvatarConfig = avatarShapeConfigs[avatarShape] || avatarShapeConfigs.round;

  const { colors, typography, animation, cardStyle, layout, theme } = buildThemeVars(themeId, profile.customization);
  const ThemeIcon = getThemeIcon(themeId);
  const cardCls = getCardClass(cardStyle);
  const revealCls = getAnimClass(animation);
  const layoutVariant = LEGACY_LAYOUT_ALIASES[layout.layout] || layout.layout || 'classic';
  const heroStyle = layout.heroStyle || 'standard';
  const showCodeBadges = Boolean(layout.showCodeBadges);
  const showCharts = Boolean(layout.showCharts);
  const showTerminalHeader = Boolean(layout.showTerminalHeader);
  const showPrototypes = Boolean(layout.showPrototypes);
  const showQrAction = layout.showQrInPdf !== false;

  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [contactState, setContactState] = React.useState({ name:'', email:'', subject:'', message:'', honeypot:'' });
  const [isSubmittingContact, setIsSubmittingContact] = React.useState(false);
  const [contactSuccess, setContactSuccess] = React.useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingContact(true);
    try {
      await onSendMessage(contactState);
      setContactSuccess(true);
      setContactState({ name:'', email:'', subject:'', message:'', honeypot:'' });
    } catch (err) { console.error(err); } finally { setIsSubmittingContact(false); }
  };

  // Inject CSS variables from theme colors
  const cssVars = {
    '--theme-primary': colors.primary,
    '--theme-secondary': colors.secondary,
    '--theme-accent': colors.accent,
    '--theme-bg': colors.background,
    '--theme-surface': colors.surface,
    '--theme-text': colors.text,
    '--theme-font-heading': `"${typography.heading || 'Inter'}", sans-serif`,
    '--theme-font-body': `"${typography.body || 'Inter'}", sans-serif`,
  } as React.CSSProperties;

  // Google Fonts dynamic injection
  React.useEffect(() => {
    const fonts = [typography.heading, typography.body, typography.code].filter(Boolean);
    const existing = document.getElementById('theme-fonts');
    if (existing) existing.remove();
    const link = document.createElement('link');
    link.id = 'theme-fonts';
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${fonts.map(f => f.replace(/ /g,'+')+':wght@400;600;700;800').join('&family=')}&display=swap`;
    document.head.appendChild(link);
  }, [themeId, typography.heading, typography.body]);

  return (
    <div
      style={{ ...cssVars, background: colors.background, color: colors.text, fontFamily: `var(--theme-font-body)` }}
      className={`portfolio-theme portfolio-layout--${layoutVariant} portfolio-hero--${heroStyle} min-h-screen transition-colors duration-500 selection:bg-indigo-500 selection:text-white`}
      data-theme-id={theme?.themeId || themeId}
      data-theme-animation={animation}
    >
      {/* ── Sticky Header ─────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 backdrop-blur-lg transition-all"
        style={{
          background: `${colors.background}e0`,
          borderBottom: `1px solid ${colors.primary}30`,
          boxShadow: `0 1px 20px ${colors.primary}15`,
        }}
      >
        {/* Main toolbar */}
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
          {/* Logo / Name */}
          <a href="#hero" className="flex items-center gap-2 sm:gap-3 min-w-0" onClick={() => setIsMobileMenuOpen(false)}>
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-lg text-base sm:text-lg shrink-0"
              style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
            >
              {fullName.charAt(0)}
            </div>
            <div className="min-w-0">
              <span className="font-bold text-sm sm:text-base md:text-lg tracking-tight truncate block" style={{ color: colors.text, fontFamily: `var(--theme-font-heading)` }}>
                {fullName}
              </span>
              <span className="block text-[10px] sm:text-xs truncate" style={{ color: colors.primary }}>{title}</span>
            </div>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-6 text-sm font-medium">
            {['About','Experience','Skills','Projects','Testimonials','Contact'].map(s => (
              <a key={s} href={`#${s.toLowerCase()}`}
                className="hover:opacity-100 transition whitespace-nowrap"
                style={{ color: `${colors.text}80` }}
                onMouseEnter={e => (e.currentTarget.style.color = colors.primary)}
                onMouseLeave={e => (e.currentTarget.style.color = `${colors.text}80`)}
              >{s}</a>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {showQrAction && (
              <button onClick={onOpenQrModal}
                className="hidden sm:flex p-2 rounded-lg border transition"
                style={{ borderColor: `${colors.primary}40`, color: colors.primary }}
                title="QR Code"
              ><QrCode className="w-4 h-4" /></button>
            )}
            <button onClick={onDownloadPdf}
              className="hidden sm:flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white shadow-md transition whitespace-nowrap"
              style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`, boxShadow: `0 4px 15px ${colors.primary}40` }}
            >
              <Download className="w-3.5 h-3.5" /><span>Resume</span>
            </button>
            {/* Mobile hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(prev => !prev)}
              className="md:hidden p-2 rounded-xl border transition-all"
              style={{ borderColor: `${colors.primary}40`, color: colors.primary, background: `${colors.surface}80` }}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen
                ? <XIcon className="w-5 h-5" />
                : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile slide-down nav drawer */}
        <div
          className="md:hidden overflow-hidden transition-all duration-300 ease-in-out"
          style={{
            maxHeight: isMobileMenuOpen ? '400px' : '0px',
            borderTop: isMobileMenuOpen ? `1px solid ${colors.primary}20` : 'none',
          }}
        >
          <nav className="flex flex-col px-4 py-3 gap-1"
               style={{ background: `${colors.background}f8` }}>
            {['About','Experience','Skills','Projects','Testimonials','Contact'].map(s => (
              <a
                key={s}
                href={`#${s.toLowerCase()}`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all active:scale-[0.98]"
                style={{ color: `${colors.text}90` }}
                onMouseEnter={e => { e.currentTarget.style.background = `${colors.primary}18`; e.currentTarget.style.color = colors.primary; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = `${colors.text}90`; }}
              >
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: colors.primary }} />
                {s}
              </a>
            ))}
            {/* Mobile resume button */}
            <div className="flex items-center gap-2 pt-2 pb-1 px-1">
              <button onClick={() => { onDownloadPdf(); setIsMobileMenuOpen(false); }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition"
                style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
              >
                <Download className="w-4 h-4" /><span>Download Resume</span>
              </button>
              {showQrAction && (
                <button onClick={() => { onOpenQrModal(); setIsMobileMenuOpen(false); }}
                  className="p-2.5 rounded-xl border transition"
                  style={{ borderColor: `${colors.primary}40`, color: colors.primary }}
                ><QrCode className="w-4 h-4" /></button>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section id="hero" className={`theme-hero theme-section ${revealCls} relative overflow-hidden`}
               style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
        {/* Cover banner background */}
        {profile.coverUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-25 pointer-events-none transition-all duration-700"
            style={{
              backgroundImage: `url(${profile.coverUrl})`,
              maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%)',
            }}
          />
        )}

        {/* Ambient background blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 sm:w-96 sm:h-96 rounded-full blur-3xl opacity-20"
               style={{ background: colors.primary }} />
          <div className="absolute -bottom-20 -left-20 w-56 h-56 sm:w-72 sm:h-72 rounded-full blur-3xl opacity-10"
               style={{ background: colors.accent }} />
          {themeId === 'cybersecurity' && (
            <div className="absolute inset-0 opacity-[0.03]"
                 style={{ backgroundImage: `repeating-linear-gradient(0deg,transparent,transparent 2px,${colors.accent} 2px,${colors.accent} 4px)` }} />
          )}
        </div>

        {/* ═══ MOBILE LAYOUT (< md) — stacked: text → avatar → body ═══ */}
        <div className="md:hidden relative px-4 xs:px-5 sm:px-6 space-y-5">

          {/* Theme badge */}
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium"
               style={{ background: `${colors.primary}15`, color: colors.primary, border: `1px solid ${colors.primary}35` }}>
            <ThemeIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="truncate max-w-[180px] sm:max-w-none">Available for Hire &amp; Speaking</span>
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-pulse shrink-0" style={{ background: colors.accent }} />
          </div>

          {showTerminalHeader && (
            <div className="theme-terminal-line text-xs" style={{ color: colors.accent, borderColor: `${colors.accent}45` }}>
              <Terminal className="w-3 h-3" />
              <span className="truncate">portfolio@{subdomain}:~$ whoami</span>
            </div>
          )}

          {/* Greeting + Name */}
          <h1
            className="text-[1.75rem] xs:text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight"
            style={{ fontFamily: `var(--theme-font-heading)`, color: colors.text }}
          >
            Hi, I'm{' '}
            <span style={{
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              {fullName}
            </span>
          </h1>

          {/* ★ Avatar — appears right after the name on mobile ★ */}
          <div className="flex justify-center py-2">
            <div className="relative group">
              <div className={`absolute -inset-1 sm:-inset-1.5 blur-xl sm:blur-2xl opacity-50 sm:opacity-60 group-hover:opacity-80 transition-all duration-700 ${activeAvatarConfig.glow}`}
                   style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})` }} />
              {/* Mobile avatar size: 160px on 320px, scales up */}
              <div
                className={`relative overflow-hidden shadow-2xl transition-all duration-500
                  w-36 h-36 xs:w-44 xs:h-44 sm:w-56 sm:h-56
                  ${avatarShape === 'round' ? 'rounded-full' : avatarShape === 'oval' ? 'rounded-[50%_50%_45%_45%]' : 'rounded-2xl'}`}
                style={{ border: `2px solid ${colors.primary}50` }}
              >
                <img
                  key={`mobile-${avatarShape}-${profile.avatarUrl}`}
                  src={profile.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80'}
                  alt={fullName}
                  className="w-full h-full object-cover object-[center_20%] group-hover:scale-105 transition-all duration-500"
                />
              </div>
            </div>
          </div>

          {/* Headline & Summary */}
          <p className="text-base xs:text-lg sm:text-xl font-medium leading-relaxed" style={{ color: `${colors.text}cc` }}>
            {profile.headline || `${title} crafting scalable solutions.`}
          </p>
          <p className="text-sm leading-relaxed" style={{ color: `${colors.text}75` }}>
            {profile.summary || 'Welcome to my professional portfolio.'}
          </p>

          {/* CTA Buttons — stacked on 320, side-by-side on sm */}
          <div className="flex flex-col xs:flex-row flex-wrap items-stretch xs:items-center gap-3 pt-1">
            <a href="#contact"
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-white shadow-lg transition hover:opacity-90 text-sm"
              style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`, boxShadow: `0 6px 20px ${colors.primary}40` }}
            >
              <Mail className="w-4 h-4" /><span>Get In Touch</span>
            </a>
            <button onClick={onDownloadPdf}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold border transition text-sm"
              style={{ borderColor: `${colors.primary}50`, color: colors.text, background: `${colors.surface}80` }}
            >
              <Download className="w-4 h-4" /><span>Download Resume</span>
            </button>
          </div>

          {/* Social links */}
          <div className="flex items-center gap-4 pt-1" style={{ color: `${colors.text}60` }}>
            {profile.github && <a href={profile.github} target="_blank" rel="noreferrer"
              style={{ color: `${colors.text}60` }}
              onMouseEnter={e => (e.currentTarget.style.color = colors.primary)}
              onMouseLeave={e => (e.currentTarget.style.color = `${colors.text}60`)}
            ><Github className="w-5 h-5" /></a>}
            {profile.linkedin && <a href={profile.linkedin} target="_blank" rel="noreferrer"
              style={{ color: `${colors.text}60` }}
              onMouseEnter={e => (e.currentTarget.style.color = colors.primary)}
              onMouseLeave={e => (e.currentTarget.style.color = `${colors.text}60`)}
            ><Linkedin className="w-5 h-5" /></a>}
            {profile.twitter && <a href={profile.twitter} target="_blank" rel="noreferrer"
              style={{ color: `${colors.text}60` }}
              onMouseEnter={e => (e.currentTarget.style.color = colors.primary)}
              onMouseLeave={e => (e.currentTarget.style.color = `${colors.text}60`)}
            ><Twitter className="w-5 h-5" /></a>}
            {profile.website && <a href={profile.website} target="_blank" rel="noreferrer"
              style={{ color: `${colors.text}60` }}
              onMouseEnter={e => (e.currentTarget.style.color = colors.primary)}
              onMouseLeave={e => (e.currentTarget.style.color = `${colors.text}60`)}
            ><Globe className="w-5 h-5" /></a>}
          </div>

          {showCharts && (
            <div className="theme-metrics-grid" style={{ borderColor: `${colors.primary}28` }}>
              {[
                { label: 'Projects', value: profile.projects?.length || 0 },
                { label: 'Skills', value: profile.skills?.length || 0 },
                { label: 'Experience', value: profile.experiences?.length || 0 },
              ].map((metric) => (
                <div key={metric.label} className="theme-metric" style={{ background: `${colors.surface}99` }}>
                  <strong style={{ color: colors.primary }}>{metric.value}</strong>
                  <span style={{ color: `${colors.text}75` }}>{metric.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ═══ DESKTOP / TABLET LAYOUT (≥ md) — original side-by-side ═══ */}
        <div className="hidden md:grid md:grid-cols-12 gap-8 lg:gap-12 items-start relative max-w-6xl mx-auto px-6" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
          <div className="md:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
                 style={{ background: `${colors.primary}15`, color: colors.primary, border: `1px solid ${colors.primary}35` }}>
              <ThemeIcon className="w-3.5 h-3.5" />
              <span>Available for Hire &amp; Keynote Speaking</span>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: colors.accent }} />
            </div>

            {showTerminalHeader && (
              <div className="theme-terminal-line" style={{ color: colors.accent, borderColor: `${colors.accent}45` }}>
                <Terminal className="w-3.5 h-3.5" />
                <span>portfolio@{subdomain}:~$ whoami --available</span>
              </div>
            )}

            <h1
              className="text-4xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight leading-tight"
              style={{ fontFamily: `var(--theme-font-heading)`, color: colors.text }}
            >
              Hi, I'm{' '}
              <span style={{
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                {fullName}
              </span>
            </h1>

            <p className="text-xl font-medium leading-relaxed" style={{ color: `${colors.text}cc` }}>
              {profile.headline || `${title} crafting scalable solutions.`}
            </p>
            <p className="text-base leading-relaxed" style={{ color: `${colors.text}80` }}>
              {profile.summary || 'Welcome to my professional portfolio.'}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a href="#contact"
                className="px-6 py-3 rounded-xl font-semibold text-white shadow-lg transition flex items-center gap-2 hover:opacity-90"
                style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`, boxShadow: `0 8px 25px ${colors.primary}40` }}
              >
                <Mail className="w-4 h-4" /><span>Get In Touch</span>
              </a>
              <button onClick={onDownloadPdf}
                className="px-6 py-3 rounded-xl font-semibold border transition flex items-center gap-2"
                style={{ borderColor: `${colors.primary}50`, color: colors.text, background: `${colors.surface}80` }}
              >
                <Download className="w-4 h-4" /><span>Download Resume</span>
              </button>
              {showPrototypes && (
                <a href="#projects"
                  className="px-6 py-3 rounded-xl font-semibold border transition flex items-center gap-2 hover:opacity-80"
                  style={{ borderColor: `${colors.accent}60`, color: colors.accent, background: `${colors.accent}10` }}
                >
                  <Layers className="w-4 h-4" /><span>Explore Selected Work</span>
                </a>
              )}
            </div>

            {showCharts && (
              <div className="theme-metrics-grid" style={{ borderColor: `${colors.primary}28` }}>
                {[
                  { label: 'Projects', value: profile.projects?.length || 0 },
                  { label: 'Capabilities', value: profile.skills?.length || 0 },
                  { label: 'Experience', value: profile.experiences?.length || 0 },
                ].map((metric) => (
                  <div key={metric.label} className="theme-metric" style={{ background: `${colors.surface}99` }}>
                    <strong style={{ color: colors.primary }}>{metric.value}</strong>
                    <span style={{ color: `${colors.text}75` }}>{metric.label}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-4 pt-4" style={{ color: `${colors.text}60` }}>
              {profile.github && <a href={profile.github} target="_blank" rel="noreferrer"
                style={{ color: `${colors.text}60` }}
                onMouseEnter={e => (e.currentTarget.style.color = colors.primary)}
                onMouseLeave={e => (e.currentTarget.style.color = `${colors.text}60`)}
              ><Github className="w-5 h-5" /></a>}
              {profile.linkedin && <a href={profile.linkedin} target="_blank" rel="noreferrer"
                style={{ color: `${colors.text}60` }}
                onMouseEnter={e => (e.currentTarget.style.color = colors.primary)}
                onMouseLeave={e => (e.currentTarget.style.color = `${colors.text}60`)}
              ><Linkedin className="w-5 h-5" /></a>}
              {profile.twitter && <a href={profile.twitter} target="_blank" rel="noreferrer"
                style={{ color: `${colors.text}60` }}
                onMouseEnter={e => (e.currentTarget.style.color = colors.primary)}
                onMouseLeave={e => (e.currentTarget.style.color = `${colors.text}60`)}
              ><Twitter className="w-5 h-5" /></a>}
              {profile.website && <a href={profile.website} target="_blank" rel="noreferrer"
                style={{ color: `${colors.text}60` }}
                onMouseEnter={e => (e.currentTarget.style.color = colors.primary)}
                onMouseLeave={e => (e.currentTarget.style.color = `${colors.text}60`)}
              ><Globe className="w-5 h-5" /></a>}
            </div>
          </div>

          <div className="md:col-span-5 flex justify-center md:justify-end items-start relative z-10 pt-1">
            <div className="relative group">
              <div className={`absolute -inset-1.5 blur-2xl opacity-60 group-hover:opacity-90 transition-all duration-700 ${activeAvatarConfig.glow}`}
                   style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})` }} />
              <div className={`relative ${activeAvatarConfig.container} overflow-hidden shadow-2xl transition-all duration-500 hover:-translate-y-1.5`}
                   style={{ border: `2px solid ${colors.primary}40` }}>
                <img
                  key={`${avatarShape}-${profile.avatarUrl}`}
                  src={profile.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80'}
                  alt={fullName}
                  className={`w-full h-full object-cover object-[center_20%] group-hover:scale-105 transition-all duration-500 ${activeAvatarConfig.image}`}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ABOUT ─────────────────────────────────────────────────── */}
      <section id="about" className={`theme-section ${revealCls} px-6 py-16`} style={{ background: `${colors.surface}99`, borderTop: `1px solid ${colors.primary}20`, borderBottom: `1px solid ${colors.primary}20` }}>
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold" style={{ fontFamily:`var(--theme-font-heading)`, color: colors.text }}>About Me</h2>
            <div className="w-12 h-1 mx-auto rounded-full" style={{ background: `linear-gradient(90deg, ${colors.primary}, ${colors.accent})` }} />
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: MapPin, label:'Location', value: profile.location || 'Remote / Global', color: colors.primary },
              { icon: Briefcase, label:'Profession', value: title, color: colors.accent },
              { icon: AwardIcon, label:'Completeness', value: `${profile.completenessScore}% Verified`, color: colors.secondary },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className={`p-6 rounded-2xl space-y-2 ${cardCls}`}
                   style={cardStyle === 'neon' ? { borderColor: color, boxShadow: `0 0 15px ${color}30` } : {}}>
                <Icon className="w-6 h-6" style={{ color }} />
                <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: `${colors.text}60` }}>{label}</h3>
                <p className="font-semibold" style={{ color: colors.text }}>{value}</p>
              </div>
            ))}
          </div>
          {profile.bio && (
            <div className={`p-8 rounded-2xl leading-relaxed ${cardCls}`} style={{ color: `${colors.text}cc` }}>
              <p>{profile.bio}</p>
            </div>
          )}
        </div>
      </section>

      {/* ── EXPERIENCE ────────────────────────────────────────────── */}
      {profile.experiences && profile.experiences.length > 0 && (
        <section id="experience" className={`theme-section ${revealCls} px-6 py-20`}>
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold" style={{ fontFamily:`var(--theme-font-heading)`, color: colors.text }}>Work Experience</h2>
              <div className="w-12 h-1 mx-auto rounded-full" style={{ background: `linear-gradient(90deg, ${colors.primary}, ${colors.accent})` }} />
            </div>
            <div className="relative space-y-8" style={{ borderLeft: `2px solid ${colors.primary}30`, marginLeft: '1rem' }}>
              {profile.experiences.map((exp) => (
                <div key={exp.id} className="relative pl-8 group">
                  <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2"
                       style={{ background: exp.isCurrent ? colors.accent : colors.surface, borderColor: colors.primary,
                                boxShadow: exp.isCurrent ? `0 0 12px ${colors.accent}80` : 'none' }} />
                  <div className={`p-6 rounded-2xl space-y-3 transition group-hover:scale-[1.01] ${cardCls}`}
                       style={cardStyle === 'neon' ? { borderColor: colors.primary, boxShadow: `0 0 15px ${colors.primary}20` } : {}}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="text-xl font-bold" style={{ fontFamily:`var(--theme-font-heading)`, color: colors.text }}>{exp.position}</h3>
                        <p className="font-medium text-sm" style={{ color: colors.primary }}>{exp.company}{exp.location ? ` • ${exp.location}` : ''}</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold"
                            style={{ background: `${colors.primary}20`, color: colors.primary }}>
                        {exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate || ''}
                      </span>
                    </div>
                    {exp.description && <p className="text-sm" style={{ color: `${colors.text}cc` }}>{exp.description}</p>}
                    {exp.responsibilities && exp.responsibilities.length > 0 && (
                      <ul className="space-y-1.5 text-xs pt-2" style={{ color: `${colors.text}80` }}>
                        {exp.responsibilities.map((r, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: colors.accent }} />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── SKILLS ────────────────────────────────────────────────── */}
      {profile.skills && profile.skills.length > 0 && (
        <section id="skills" className={`theme-section ${revealCls} px-6 py-16`} style={{ background: `${colors.surface}60`, borderTop: `1px solid ${colors.primary}20`, borderBottom: `1px solid ${colors.primary}20` }}>
          <div className="max-w-5xl mx-auto space-y-10">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold" style={{ fontFamily:`var(--theme-font-heading)`, color: colors.text }}>Skills & Expertise</h2>
              <div className="w-12 h-1 mx-auto rounded-full" style={{ background: `linear-gradient(90deg, ${colors.primary}, ${colors.accent})` }} />
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {profile.skills.map((skill) => (
                <div key={skill.id}
                     className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition hover:scale-105 cursor-default"
                       style={{
                         background: `${colors.primary}15`,
                         border: `1px solid ${colors.primary}40`,
                         color: colors.text,
                       }}>
                   {showCodeBadges ? <Code className="w-3.5 h-3.5" style={{ color: colors.primary }} /> : null}
                   <span className="w-2 h-2 rounded-full" style={{ background: colors.accent }} />
                  <span style={{ fontFamily:`var(--theme-font-body)` }}>{skill.name}</span>
                  {skill.proficiency && (
                    <span className="text-xs" style={{ color: `${colors.text}60` }}>({skill.proficiency}%)</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── PROJECTS ──────────────────────────────────────────────── */}
      {profile.projects && profile.projects.length > 0 && (
        <section id="projects" className={`theme-section ${revealCls} px-6 py-20`}>
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold" style={{ fontFamily:`var(--theme-font-heading)`, color: colors.text }}>Featured Projects</h2>
              <div className="w-12 h-1 mx-auto rounded-full" style={{ background: `linear-gradient(90deg, ${colors.primary}, ${colors.accent})` }} />
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {profile.projects.map((proj: any) => (
                <div key={proj.id}
                     className={`rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 ${cardCls}`}
                     style={cardStyle === 'neon' ? { borderColor: colors.primary, boxShadow: `0 0 20px ${colors.primary}25` } : {}}
                >
                  {proj.imageUrl && (
                    <div className="h-52 overflow-hidden relative group">
                      <img src={proj.imageUrl} alt={proj.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition" />
                      {proj.featured && (
                        <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase flex items-center gap-1 shadow-lg backdrop-blur-md"
                              style={{ background: `${colors.accent}ee`, color: '#090d16' }}>
                          <Star className="w-3 h-3 fill-current" /> Featured
                        </span>
                      )}
                    </div>
                  )}
                  <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {proj.role && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border"
                                style={{ background: `${colors.primary}15`, color: colors.primary, borderColor: `${colors.primary}30` }}>
                            {proj.role}
                          </span>
                        )}
                        {proj.featured && !proj.imageUrl && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase flex items-center gap-1 border"
                                style={{ background: `${colors.accent}15`, color: colors.accent, borderColor: `${colors.accent}30` }}>
                            <Star className="w-3 h-3 fill-current" /> Featured
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold transition" style={{ fontFamily:`var(--theme-font-heading)`, color: colors.text }}>{proj.title}</h3>
                      <p className="text-sm leading-relaxed" style={{ color: `${colors.text}cc` }}>{proj.description}</p>
                    </div>
                    {proj.technologies && proj.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {(Array.isArray(proj.technologies) ? proj.technologies : String(proj.technologies).split(',')).map((tech: string, idx: number) => (
                          <span key={idx} className="px-2.5 py-1 rounded-md text-[11px] font-mono font-medium border"
                                style={{ background: `${colors.accent}12`, color: colors.accent, borderColor: `${colors.accent}25` }}>
                            {tech.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-4 pt-4 border-t text-xs font-semibold"
                         style={{ borderColor: `${colors.primary}20` }}>
                      {proj.demoUrl && (
                        <a href={proj.demoUrl} target="_blank" rel="noreferrer"
                           className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition hover:opacity-90 shadow-sm"
                           style={{ background: colors.primary, color: '#ffffff' }}>
                          <span>Live Demo</span><ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {proj.githubUrl && (
                        <a href={proj.githubUrl} target="_blank" rel="noreferrer"
                           className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition hover:opacity-90 border"
                           style={{ background: `${colors.surface}80`, color: colors.text, borderColor: `${colors.text}20` }}>
                          <Github className="w-3.5 h-3.5" /><span>Source Code</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CERTIFICATIONS ────────────────────────────────────────── */}
      {profile.certifications && profile.certifications.length > 0 && (
        <section id="certifications" className={`theme-section ${revealCls} px-6 py-16`} style={{ background: `${colors.surface}40`, borderTop: `1px solid ${colors.primary}20` }}>
          <div className="max-w-5xl mx-auto space-y-10">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold" style={{ fontFamily:`var(--theme-font-heading)`, color: colors.text }}>Certifications</h2>
              <div className="w-12 h-1 mx-auto rounded-full" style={{ background: `linear-gradient(90deg, ${colors.primary}, ${colors.accent})` }} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {profile.certifications.map((cert: any) => (
                <div key={cert.id} className={`p-5 rounded-2xl flex items-center gap-4 ${cardCls}`}
                     style={cardStyle === 'neon' ? { borderColor: colors.accent, boxShadow: `0 0 12px ${colors.accent}20` } : {}}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                       style={{ background: `${colors.primary}20` }}>
                    <AwardIcon className="w-6 h-6" style={{ color: colors.primary }} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm" style={{ color: colors.text }}>{cert.name}</h4>
                    <p className="text-xs" style={{ color: colors.primary }}>{cert.issuingOrganization}</p>
                    <p className="text-xs" style={{ color: `${colors.text}50` }}>Issued: {cert.issueDate}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── TESTIMONIALS ──────────────────────────────────────────── */}
      <section id="testimonials" className={`theme-section ${revealCls} px-6 py-20`}>
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold" style={{ fontFamily:`var(--theme-font-heading)`, color: colors.text }}>Client & Employer Reviews</h2>
              <p className="text-sm mt-1" style={{ color: `${colors.text}70` }}>Verified testimonials from industry partners</p>
            </div>
            <button onClick={onOpenReviewModal}
              className="px-5 py-2.5 rounded-xl font-semibold text-xs border transition flex items-center gap-2"
              style={{ borderColor: `${colors.primary}50`, color: colors.text, background: `${colors.surface}60` }}
            >
              <Star className="w-4 h-4" style={{ color: colors.accent }} /><span>Leave a Review</span>
            </button>
          </div>
          {profile.reviews && profile.reviews.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {profile.reviews.map((rev) => (
                <div key={rev.id} className={`p-6 rounded-2xl space-y-4 ${cardCls}`}
                     style={cardStyle === 'neon' ? { borderColor: colors.accent, boxShadow: `0 0 12px ${colors.accent}15` } : {}}>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" style={{ color: colors.accent }} />
                    ))}
                  </div>
                  <p className="text-sm italic" style={{ color: `${colors.text}cc` }}>"{rev.reviewText}"</p>
                  <div className="flex items-center gap-3 pt-2 border-t" style={{ borderColor: `${colors.primary}20` }}>
                    <div className="w-10 h-10 rounded-full font-bold flex items-center justify-center"
                         style={{ background: `${colors.primary}30`, color: colors.primary }}>
                      {rev.reviewerName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm" style={{ color: colors.text }}>{rev.reviewerName}</h4>
                      <p className="text-xs" style={{ color: `${colors.text}60` }}>
                        {rev.reviewerJobTitle}{rev.reviewerCompany ? ` @ ${rev.reviewerCompany}` : ''}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 rounded-2xl border space-y-3"
                 style={{ borderColor: `${colors.primary}20`, background: `${colors.surface}40` }}>
              <Star className="w-8 h-8 mx-auto" style={{ color: `${colors.text}40` }} />
              <p className="text-sm" style={{ color: `${colors.text}60` }}>No public reviews yet.</p>
              <button onClick={onOpenReviewModal} className="text-xs font-semibold hover:opacity-80 transition"
                      style={{ color: colors.primary }}>Be the first to submit a review</button>
            </div>
          )}
        </div>
      </section>

      {/* ── CONTACT ───────────────────────────────────────────────── */}
      <section id="contact" className={`theme-section ${revealCls} px-6 py-20`} style={{ background: `${colors.surface}40`, borderTop: `1px solid ${colors.primary}20` }}>
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold" style={{ fontFamily:`var(--theme-font-heading)`, color: colors.text }}>Get In Touch</h2>
            <p className="text-sm" style={{ color: `${colors.text}70` }}>Send a direct message to {fullName}</p>
          </div>
          {contactSuccess ? (
            <div className="p-8 rounded-2xl text-center space-y-3"
                 style={{ background: `${colors.accent}15`, border: `1px solid ${colors.accent}40` }}>
              <CheckCircle2 className="w-12 h-12 mx-auto" style={{ color: colors.accent }} />
              <h3 className="text-xl font-bold" style={{ color: colors.text }}>Message Sent!</h3>
              <p className="text-sm" style={{ color: `${colors.text}cc` }}>Thank you! {fullName} will get back to you shortly.</p>
              <button onClick={() => setContactSuccess(false)} className="text-xs hover:opacity-80 transition" style={{ color: colors.primary }}>Send another message</button>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit}
                  className={`p-8 rounded-2xl space-y-6 ${cardCls}`}
                  style={cardStyle === 'neon' ? { borderColor: colors.primary, boxShadow: `0 0 20px ${colors.primary}15` } : {}}>
              <input type="text" name="honeypot" value={contactState.honeypot}
                     onChange={(e) => setContactState({ ...contactState, honeypot: e.target.value })}
                     className="hidden" tabIndex={-1} autoComplete="off" />
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  { key:'name', label:'Your Full Name', type:'text', placeholder:'John Doe' },
                  { key:'email', label:'Email Address', type:'email', placeholder:'john@example.com' },
                ].map(({ key, label, type, placeholder }) => (
                  <div key={key} className="space-y-2">
                    <label className="text-xs font-semibold" style={{ color: `${colors.text}cc` }}>{label}</label>
                    <input type={type} required placeholder={placeholder}
                           value={(contactState as any)[key]}
                           onChange={(e) => setContactState({ ...contactState, [key]: e.target.value })}
                           className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition"
                           style={{ background: `${colors.background}cc`, border: `1px solid ${colors.primary}30`, color: colors.text }}
                           onFocus={e => (e.currentTarget.style.borderColor = colors.primary)}
                           onBlur={e => (e.currentTarget.style.borderColor = `${colors.primary}30`)}
                    />
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold" style={{ color: `${colors.text}cc` }}>Subject</label>
                <input type="text" required placeholder="Project Consultation / Job Opportunity"
                       value={contactState.subject}
                       onChange={(e) => setContactState({ ...contactState, subject: e.target.value })}
                       className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition"
                       style={{ background: `${colors.background}cc`, border: `1px solid ${colors.primary}30`, color: colors.text }}
                       onFocus={e => (e.currentTarget.style.borderColor = colors.primary)}
                       onBlur={e => (e.currentTarget.style.borderColor = `${colors.primary}30`)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold" style={{ color: `${colors.text}cc` }}>Message</label>
                <textarea rows={4} required placeholder="Write your message here..."
                          value={contactState.message}
                          onChange={(e) => setContactState({ ...contactState, message: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition"
                          style={{ background: `${colors.background}cc`, border: `1px solid ${colors.primary}30`, color: colors.text }}
                          onFocus={e => (e.currentTarget.style.borderColor = colors.primary)}
                          onBlur={e => (e.currentTarget.style.borderColor = `${colors.primary}30`)}
                />
              </div>
              <button type="submit" disabled={isSubmittingContact}
                      className="w-full py-3 rounded-xl font-semibold text-white shadow-lg transition flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
                      style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`, boxShadow: `0 8px 25px ${colors.primary}40` }}>
                {isSubmittingContact ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────── */}
      <footer className="px-6 py-8 text-center text-xs" style={{ borderTop: `1px solid ${colors.primary}20`, color: `${colors.text}50` }}>
        <p>© {new Date().getFullYear()} {fullName}. All rights reserved. Powered by{' '}
          <span style={{ color: colors.primary }}>Portfolio SaaS Platform</span>.
        </p>
      </footer>
    </div>
  );
};
