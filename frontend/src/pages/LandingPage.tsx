import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  FileText,
  Palette,
  Globe,
  Download,
  Star,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Code2,
  BarChart3,
  MessageSquare,
  QrCode,
  Sliders,
  ChevronRight,
  Cpu,
  Layers,
  Check,
  HelpCircle,
  ChevronDown,
  Building2,
  Stethoscope,
  Scale,
  Briefcase,
  Camera,
  GraduationCap,
  Play,
  Terminal,
  Activity,
  Share2,
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export const LandingPage: React.FC = () => {
  const [activeThemeIndex, setActiveThemeIndex] = useState(0);
  const [activeFeatureTab, setActiveFeatureTab] = useState<'ai' | 'subdomain' | 'pdf' | 'reviews' | 'analytics'>('ai');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const professionThemes = [
    {
      id: 'software-engineer',
      name: 'Software Engineer',
      category: 'Tech & Engineering',
      tag: 'Dark IDE Code Focus',
      gradient: 'from-indigo-600 via-purple-600 to-blue-600',
      badgeBg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
      accentColor: '#6366f1',
      icon: Code2,
      headline: 'Senior Full-Stack Architect & Open Source Contributor',
      description: 'Clean dark-mode aesthetic with terminal-inspired project cards, tech stack pills, and GitHub repository links.',
      sampleSkills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker', 'Kubernetes', 'Redis'],
    },
    {
      id: 'data-scientist',
      name: 'Data Scientist',
      category: 'AI & Analytics',
      tag: 'Cyan Data Stream',
      gradient: 'from-cyan-600 via-sky-600 to-blue-600',
      badgeBg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
      accentColor: '#06b6d4',
      icon: Zap,
      headline: 'Lead AI Engineer & Machine Learning Researcher',
      description: 'High-density metric highlights, interactive Python/PyTorch model cards, and notebook project showcases.',
      sampleSkills: ['Python', 'PyTorch', 'TensorFlow', 'pandas', 'Scikit-Learn', 'MLOps', 'SQL'],
    },
    {
      id: 'cybersecurity',
      name: 'Cybersecurity Specialist',
      category: 'Security & Operations',
      tag: 'Green Terminal HUD',
      gradient: 'from-emerald-600 via-teal-600 to-green-600',
      badgeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      accentColor: '#10b981',
      icon: ShieldCheck,
      headline: 'Information Security Lead & Ethical Hacker',
      description: 'Matrix security aesthetic with audit logs, vulnerability report highlights, and verified certifications.',
      sampleSkills: ['Penetration Testing', 'SIEM', 'ISO 27001', 'Zero Trust', 'SOC 2', 'Network Defense'],
    },
    {
      id: 'ui-ux-designer',
      name: 'UI/UX Designer',
      category: 'Design & Creative',
      tag: 'Vibrant Canvas',
      gradient: 'from-rose-600 via-pink-600 to-purple-600',
      badgeBg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
      accentColor: '#f43f5e',
      icon: Palette,
      headline: 'Principal Product Designer & Design System Lead',
      description: 'Generous whitespace, visual case studies, typography controls, and interactive prototype embedded frames.',
      sampleSkills: ['Figma', 'Design Systems', 'User Research', 'Prototyping', 'Wireframing', 'Tailwind CSS'],
    },
    {
      id: 'lawyer-legal',
      name: 'Lawyer / Legal Specialist',
      category: 'Legal & Executive',
      tag: 'Classic Gold & Navy',
      gradient: 'from-amber-700 via-yellow-700 to-slate-800',
      badgeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
      accentColor: '#d97706',
      icon: Scale,
      headline: 'Corporate Counsel & Intellectual Property Litigation Partner',
      description: 'Prestigious serif typography, practice area highlights, case verdict records, and formal client endorsements.',
      sampleSkills: ['Corporate Governance', 'M&A Law', 'IP Litigation', 'Contract Negotiation', 'Compliance'],
    },
    {
      id: 'medical-doctor',
      name: 'Medical Doctor',
      category: 'Healthcare & Clinical',
      tag: 'Clinical Teal',
      gradient: 'from-teal-600 via-cyan-700 to-blue-700',
      badgeBg: 'bg-teal-500/10 border-teal-500/30 text-teal-400',
      accentColor: '#14b8a6',
      icon: Stethoscope,
      headline: 'Consultant Cardiologist & Clinical Researcher',
      description: 'Clean medical layout featuring peer-reviewed publications, hospital affiliations, and verified clinical references.',
      sampleSkills: ['Cardiology', 'Clinical Trials', 'EHR Systems', 'Patient Care', 'Medical Research'],
    },
  ];

  const currentTheme = professionThemes[activeThemeIndex];

  const features = [
    {
      id: 'ai',
      title: 'AI CV Parsing Engine',
      subtitle: 'Upload PDF / DOCX ➔ Complete Profile in 10 Seconds',
      description: 'Our GPT-4o powered AI engine parses raw resumes, automatically categorizing your work experiences, skills, education, awards, and projects with 98% accuracy.',
      icon: Cpu,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      highlights: [
        'Automatic extraction of work experience & bullet points',
        'Intelligent skill classification (Technical, Soft, Tools)',
        'Human-in-the-loop verification before publishing',
        'One-click profile enhancement suggestions',
      ],
    },
    {
      id: 'subdomain',
      title: 'Multi-Tenant Subdomain Routing',
      subtitle: 'Publish instantly at yourname.myportfolio.com',
      description: 'Every user gets an isolated subdomain with instant DNS resolution, SSL security, and custom subdomain slug switching capabilities.',
      icon: Globe,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      highlights: [
        'Instant subdomain allocation (e.g. francis.myportfolio.com)',
        'Data isolation per tenant via Prisma & JWT RBAC',
        'Custom domain alias mapping support',
        'Automatic historical subdomain redirect tracking',
      ],
    },
    {
      id: 'pdf',
      title: 'PDF + QR Code Resume Generator',
      subtitle: 'One-click professional PDF downloads for recruiters',
      description: 'Render crisp, two-column high-resolution PDF resumes directly in the browser equipped with an embedded QR code linking back to your live portfolio.',
      icon: Download,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      highlights: [
        'Instant server-side & client-side PDF rendering',
        'Embedded QR code for quick scanning by recruiters',
        'Optimized two-column A4 print layout',
        'Custom accent colors & typography included',
      ],
    },
    {
      id: 'reviews',
      title: 'Client Testimonial Moderation',
      subtitle: 'Collect & feature verified 5-star client reviews',
      description: 'Send unique shareable review links to colleagues or clients. Moderate incoming feedback from your tenant dashboard before displaying them publicly.',
      icon: Star,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      highlights: [
        'Shareable single-use review invitation links',
        'Admin moderation pipeline (Approve / Reject / Feature)',
        'Verified client avatar & company title badges',
        'Direct email notifications on new reviews',
      ],
    },
    {
      id: 'analytics',
      title: 'Tenant Analytics & Lead Gateway',
      subtitle: 'Track profile visits, resume downloads & contact inquiries',
      description: 'Get real-time insights into your portfolio performance. Receive visitor contact messages forwarded straight to your inbox.',
      icon: BarChart3,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      highlights: [
        '30-day interactive page view chart with device breakdown',
        'Resume download count & referrer tracking',
        'Inbound contact message inbox & SMTP email forwarding',
        'Audit trail logging for all administrative actions',
      ],
    },
  ];

  const faqs = [
    {
      q: 'How does the AI CV extraction work?',
      a: 'Simply upload your existing resume in PDF or DOCX format. Our AI service scans the document, parses sections like Work Experience, Education, Skills, and Projects, and creates a pre-populated profile draft for you to review and customize.',
    },
    {
      q: 'Can I pick a custom subdomain for my portfolio?',
      a: 'Yes! Upon registration, you choose your personal subdomain slug (e.g. yourname.myportfolio.com). You can also change your subdomain slug at any time from your tenant customizer dashboard.',
    },
    {
      q: 'Are there theme templates tailored for non-tech professions?',
      a: 'Absolutely. We offer 20 profession-specific themes designed for Lawyers, Medical Doctors, Data Scientists, Designers, Financial Consultants, Architects, Engineers, Photographers, Researchers, and more.',
    },
    {
      q: 'Can recruiters download a PDF copy of my portfolio?',
      a: 'Yes. Every published portfolio features a one-click "Download PDF Resume" button that generates a professionally formatted PDF complete with a QR code linking directly back to your live portfolio.',
    },
    {
      q: 'Is my personal contact information protected?',
      a: 'Yes. You have granular privacy controls over every field. You can choose whether to display your phone number, physical address, or reference details publicly, or allow visitors to contact you via our secure contact message proxy.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Dynamic Background Glow Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px]" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-600/15 rounded-full blur-[128px]" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-blue-600/15 rounded-full blur-[128px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-6 py-4 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center font-extrabold text-white text-xl shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition">
              P
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl text-white tracking-tight leading-none">Portfolio SaaS</span>
              <span className="text-[10px] font-semibold text-indigo-400 tracking-wider uppercase mt-1">Multi-Tenant Platform</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-indigo-400 transition">Features</a>
            <a href="#themes" className="hover:text-indigo-400 transition">20 Themes</a>
            <a href="#how-it-works" className="hover:text-indigo-400 transition">How It Works</a>
            <a href="#faqs" className="hover:text-indigo-400 transition">FAQs</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-semibold text-slate-300 hover:text-white px-3 py-2 transition">
              Sign In
            </Link>
            <Link to="/register">
              <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />} className="shadow-lg shadow-indigo-600/30">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 px-6 pt-20 pb-28 md:pt-28 md:pb-36 text-center max-w-7xl mx-auto">
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-900/90 border border-indigo-500/30 text-indigo-300 text-xs font-semibold shadow-inner mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>AI-Powered CV Parsing & 20 Profession Themes</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.1] max-w-5xl mx-auto">
          Transform Your Resume Into a <br className="hidden md:inline" />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
            Stunning SaaS Portfolio
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
          Upload your CV, let AI extract your profile, pick from <strong className="text-white">20 profession-tailored themes</strong>, and publish under your personal subdomain in seconds — complete with client reviews & PDF downloads.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mt-10">
          <Link to="/register">
            <Button size="lg" variant="primary" rightIcon={<ArrowRight className="w-5 h-5" />} className="px-8 py-4 text-base shadow-2xl shadow-indigo-600/40">
              Create Portfolio Free
            </Button>
          </Link>
          <Link to="/p/francis" target="_blank">
            <Button size="lg" variant="outline" leftIcon={<Globe className="w-5 h-5 text-indigo-400" />} className="px-8 py-4 text-base border-slate-700 bg-slate-900/50 hover:bg-slate-800">
              Explore Live Demo
            </Button>
          </Link>
        </div>

        {/* Live Interactive Hero Preview Card */}
        <div className="mt-16 max-w-5xl mx-auto rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl p-4 sm:p-6 backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute -top-24 -right-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 font-mono text-slate-400 bg-slate-950 px-3 py-1 rounded-md border border-slate-800">
                https://francis.myportfolio.com
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20 text-[11px] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Live & Published
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 pt-6 text-left">
            <div className="md:col-span-2 space-y-4">
              <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Software Engineer Theme
              </div>
              <h3 className="text-2xl font-extrabold text-white">Francis Mwangi</h3>
              <p className="text-sm text-slate-300 font-medium">Senior Software Architect & Full-Stack Engineer</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                7+ years of experience engineering scalable multi-tenant SaaS platforms, real-time microservices, and high-performance Web APIs using React, Node.js, and PostgreSQL.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {['TypeScript', 'React 18', 'Node.js', 'PostgreSQL', 'Prisma', 'Redis', 'Docker'].map((tech, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700">
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Interactive Extras</span>
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium flex items-center gap-2">
                    <Download className="w-4 h-4 text-emerald-400" /> Resume PDF + QR
                  </span>
                  <span className="text-emerald-400 font-semibold">Ready</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> Verified Reviews
                  </span>
                  <span className="text-amber-400 font-semibold">5.0 (12)</span>
                </div>
              </div>

              <Link to="/p/francis" target="_blank" className="w-full">
                <Button size="sm" variant="primary" className="w-full justify-center">
                  Preview Full Portfolio
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Metric Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 pt-12 border-t border-slate-800/80 max-w-5xl mx-auto">
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60">
            <div className="text-3xl font-extrabold text-white">20+</div>
            <div className="text-xs text-slate-400 font-medium mt-1">Profession Archetypes</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60">
            <div className="text-3xl font-extrabold text-indigo-400">100%</div>
            <div className="text-xs text-slate-400 font-medium mt-1">Multi-Tenant Isolated</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60">
            <div className="text-3xl font-extrabold text-emerald-400">&lt; 10s</div>
            <div className="text-xs text-slate-400 font-medium mt-1">AI CV Extraction Time</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60">
            <div className="text-3xl font-extrabold text-purple-400">PDF + QR</div>
            <div className="text-xs text-slate-400 font-medium mt-1">Direct Download Engine</div>
          </div>
        </div>
      </section>

      {/* Interactive Feature Tabs */}
      <section id="features" className="relative z-10 px-6 py-24 bg-slate-900/60 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Everything You Need For Your Career Brand
            </h2>
            <p className="text-slate-400 text-base leading-relaxed">
              Designed from the ground up to give professionals, consultants, engineers, and executives a competitive edge.
            </p>
          </div>

          {/* Tab Selector Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {features.map((feat) => {
              const Icon = feat.icon;
              const isActive = activeFeatureTab === feat.id;
              return (
                <button
                  key={feat.id}
                  onClick={() => setActiveFeatureTab(feat.id as any)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105'
                      : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{feat.title}</span>
                </button>
              );
            })}
          </div>

          {/* Active Tab Content */}
          {(() => {
            const feat = features.find((f) => f.id === activeFeatureTab)!;
            const Icon = feat.icon;
            return (
              <div className="grid md:grid-cols-2 gap-12 items-center bg-slate-950 p-8 sm:p-12 rounded-3xl border border-slate-800 shadow-2xl">
                <div className="space-y-6">
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider ${feat.color}`}>
                    <Icon className="w-4 h-4" />
                    <span>Feature Spotlight</span>
                  </div>
                  <h3 className="text-3xl font-extrabold text-white">{feat.title}</h3>
                  <p className="text-indigo-400 font-semibold text-sm">{feat.subtitle}</p>
                  <p className="text-slate-300 text-sm leading-relaxed">{feat.description}</p>
                  <ul className="space-y-3 pt-2">
                    {feat.highlights.map((h, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-4">
                    <Link to="/register">
                      <Button variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                        Try This Feature Free
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-400 pb-3 border-b border-slate-800">
                    <span className="font-mono text-indigo-400">{feat.title} Console</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold text-[10px]">Active</span>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-indigo-400" /> Automated Workflow
                      </span>
                      <span className="text-slate-400 font-mono">100% Instant</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" /> Security & Privacy
                      </span>
                      <span className="text-emerald-400 font-mono">Isolated</span>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-950/80 border border-indigo-500/30 text-indigo-300 space-y-2">
                      <div className="font-bold flex items-center gap-2 text-white">
                        <Sparkles className="w-4 h-4 text-indigo-400" /> Executive Pro Advantage
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Never worry about outdated PDFs or manually editing HTML again. Update your tenant admin dashboard once, and all formats update simultaneously.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* 20 Profession Themes Showcase Section */}
      <section id="themes" className="relative z-10 px-6 py-24 max-w-7xl mx-auto space-y-16">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold">
            <Palette className="w-4 h-4" />
            <span>20 Profession-Optimized Themes</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Select Your Industry Aesthetic
          </h2>
          <p className="text-slate-400 text-base leading-relaxed">
            Choose from 20 themes engineered specifically for your profession — from dark-mode code terminals to formal legal serifs.
          </p>
        </div>

        {/* Theme Pill Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {professionThemes.map((theme, idx) => {
            const Icon = theme.icon;
            const isSelected = activeThemeIndex === idx;
            return (
              <button
                key={theme.id}
                onClick={() => setActiveThemeIndex(idx)}
                className={`p-4 rounded-2xl text-left border transition-all flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? 'bg-slate-900 border-indigo-500 shadow-xl shadow-indigo-500/10 scale-105'
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${theme.gradient} flex items-center justify-center text-white font-bold shadow-md`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>{theme.name}</h4>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{theme.category}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Live Active Theme Preview Card */}
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl grid md:grid-cols-3 gap-8 items-center">
          <div className="md:col-span-2 space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${currentTheme.badgeBg}`}>
                {currentTheme.tag}
              </span>
              <span className="text-xs text-slate-400 font-mono">Theme ID: {currentTheme.id}</span>
            </div>

            <h3 className="text-3xl font-extrabold text-white">{currentTheme.name} Theme</h3>
            <p className="text-lg font-medium text-indigo-300">{currentTheme.headline}</p>
            <p className="text-slate-300 text-sm leading-relaxed">{currentTheme.description}</p>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Sample Included Skills:</span>
              <div className="flex flex-wrap gap-2">
                {currentTheme.sampleSkills.map((sk, i) => (
                  <span key={i} className="px-3 py-1 rounded-lg bg-slate-950 text-slate-200 text-xs border border-slate-800 font-medium">
                    {sk}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center space-y-6">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${currentTheme.gradient} mx-auto flex items-center justify-center text-white font-bold shadow-xl`}>
              {React.createElement(currentTheme.icon, { className: 'w-8 h-8' })}
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">{currentTheme.name}</h4>
              <p className="text-xs text-slate-400 mt-1">Ready to publish in 1-click</p>
            </div>
            <Link to="/register" className="block w-full">
              <Button variant="primary" className="w-full justify-center shadow-lg shadow-indigo-600/30">
                Use This Theme
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Step-by-Step */}
      <section id="how-it-works" className="relative z-10 px-6 py-24 bg-slate-900/60 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Publish Your Portfolio In 4 Simple Steps
            </h2>
            <p className="text-slate-400 text-base leading-relaxed">
              No coding required. From raw resume document to a live published website in under 2 minutes.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Upload Your CV',
                desc: 'Upload your existing PDF or DOCX resume into our secure tenant pipeline.',
                icon: FileText,
              },
              {
                step: '02',
                title: 'AI Auto-Extracts',
                desc: 'Our AI engine parses your experiences, skills, education, and projects instantly.',
                icon: Cpu,
              },
              {
                step: '03',
                title: 'Choose Theme',
                desc: 'Select from 20 profession-tailored design templates and customize your brand.',
                icon: Palette,
              },
              {
                step: '04',
                title: 'Publish & Share',
                desc: 'Publish at your personalized subdomain and download your QR PDF resume.',
                icon: Globe,
              },
            ].map((st, i) => {
              const Icon = st.icon;
              return (
                <div key={i} className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 relative group hover:border-indigo-500/50 transition">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-extrabold font-mono text-indigo-400">{st.step}</span>
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white">{st.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{st.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faqs" className="relative z-10 px-6 py-24 max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold">
            <HelpCircle className="w-4 h-4 text-indigo-400" />
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Got Questions? We Have Answers</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden transition"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 font-bold text-white hover:text-indigo-400 transition"
                >
                  <span className="text-base">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-indigo-400' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 text-slate-300 text-sm leading-relaxed border-t border-slate-800/60 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Executive Call to Action Banner */}
      <section className="relative z-10 px-6 py-20 max-w-6xl mx-auto">
        <div className="rounded-3xl bg-gradient-to-r from-indigo-900/80 via-purple-900/80 to-slate-900 border border-indigo-500/30 p-10 sm:p-16 text-center space-y-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight max-w-3xl mx-auto">
            Ready to Build Your Professional SaaS Portfolio?
          </h2>

          <p className="text-slate-200 text-base sm:text-lg max-w-2xl mx-auto">
            Join software engineers, data scientists, lawyers, doctors, and creative executives presenting their best work.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link to="/register">
              <Button size="lg" variant="primary" rightIcon={<ArrowRight className="w-5 h-5" />} className="px-8 py-4 text-base shadow-xl shadow-indigo-600/40">
                Get Started Free Now
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="px-8 py-4 text-base border-slate-600 text-white hover:bg-slate-800">
                Sign In to Existing Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto px-6 py-12 border-t border-slate-800/80 bg-slate-950 text-slate-400 text-xs relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-sm">
              P
            </div>
            <span className="font-bold text-white text-sm">Portfolio SaaS Platform</span>
          </div>

          <div className="flex items-center gap-6 text-slate-400 text-xs">
            <Link to="/p/francis" className="hover:text-white transition">Demo Portfolio</Link>
            <Link to="/login" className="hover:text-white transition">Admin Panel</Link>
            <Link to="/register" className="hover:text-white transition">Register</Link>
          </div>

          <p>© {new Date().getFullYear()} Multi-Tenant Portfolio SaaS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
