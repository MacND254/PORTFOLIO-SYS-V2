import React from 'react';
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
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export const LandingPage: React.FC = () => {
  const themesPreview = [
    { name: 'Software Engineer', tag: 'Developer', color: 'from-indigo-600 to-blue-600', icon: Code2 },
    { name: 'Data Scientist', tag: 'AI & Analytics', color: 'from-sky-600 to-blue-600', icon: Zap },
    { name: 'Cybersecurity', tag: 'Security HUD', color: 'from-emerald-600 to-teal-600', icon: ShieldCheck },
    { name: 'UI/UX Designer', tag: 'Visual Case Study', color: 'from-rose-600 to-pink-600', icon: Palette },
    { name: 'Lawyer / Legal', tag: 'Formal Serif', color: 'from-amber-700 to-yellow-600', icon: FileText },
    { name: 'Medical Professional', tag: 'Clinical Clean', color: 'from-teal-600 to-cyan-600', icon: Star },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-indigo-500/25">
              P
            </div>
            <span className="font-extrabold text-xl text-white tracking-tight">Portfolio SaaS</span>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-semibold text-slate-300 hover:text-white transition">
              Sign In
            </Link>
            <Link to="/register">
              <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Create Portfolio
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 py-24 md:py-32 overflow-hidden text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/30 via-slate-950 to-slate-950" />
        <div className="relative max-w-4xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <Sparkles className="w-4 h-4" />
            <span>AI CV Extraction & Multi-Tenant Subdomains</span>
          </div>

          <h1 className="text-4xl md:text-7xl font-extrabold text-white tracking-tight leading-tight">
            Turn Your CV Into a <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Stunning SaaS Portfolio</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Upload your resume, let our AI extract your work experience, choose from 20 profession-tailored themes, and publish under your personal subdomain in seconds.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link to="/register">
              <Button size="lg" variant="primary" className="px-8 shadow-xl shadow-indigo-600/30">
                Build My Portfolio Now
              </Button>
            </Link>
            <Link to="/p/francis" target="_blank">
              <Button size="lg" variant="outline" leftIcon={<Globe className="w-4 h-4 text-indigo-400" />}>
                View Live Demo (francis.myportfolio.com)
              </Button>
            </Link>
          </div>

          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-16 border-t border-slate-800/80">
            <div>
              <div className="text-3xl font-extrabold text-white">20+</div>
              <div className="text-xs text-slate-400 font-medium pt-1">Profession Themes</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-indigo-400">100%</div>
              <div className="text-xs text-slate-400 font-medium pt-1">Tenant Isolation</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-emerald-400">AI</div>
              <div className="text-xs text-slate-400 font-medium pt-1">Automated CV Parsing</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-purple-400">PDF + QR</div>
              <div className="text-xs text-slate-400 font-medium pt-1">Resume Generation</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="px-6 py-20 bg-slate-900/60 border-y border-slate-800/80">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold text-white tracking-tight">Built For Professionals & Executives</h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">Everything you need to showcase your career achievements and generate inbound client leads.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 hover:border-indigo-500/50 transition">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">AI CV Parsing Engine</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Upload PDF or DOCX resumes. Our background engine automatically extracts work experience, education, skills, and projects with human-in-the-loop verification.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 hover:border-purple-500/50 transition">
              <div className="w-12 h-12 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Personalized Subdomains</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Publish your portfolio at <code className="text-indigo-400">yourname.myportfolio.com</code> with instant DNS routing and audit logging.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 hover:border-emerald-500/50 transition">
              <div className="w-12 h-12 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold">
                <Star className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Client Testimonial Moderation</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Share unique review request links with clients. Moderate, feature, or display verified 5-star ratings on your public portfolio.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 20 Themes Showcase Grid */}
      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold text-white tracking-tight">20 Profession-Tailored Themes</h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">Select a design optimized specifically for your industry aesthetic.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {themesPreview.map((item, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 group hover:border-slate-700 transition">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${item.color} flex items-center justify-center text-white font-bold shadow-lg`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition">{item.name}</h3>
                  <span className="text-xs text-slate-400">{item.tag}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto px-6 py-8 border-t border-slate-800 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Multi-Tenant Portfolio SaaS Platform. All rights reserved.</p>
      </footer>
    </div>
  );
};
