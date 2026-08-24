import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles, Globe2, Palette, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface AuthContainerProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  activeTab: 'login' | 'register';
}

export const AuthContainer: React.FC<AuthContainerProps> = ({
  title,
  subtitle,
  children,
  activeTab,
}) => {
  const location = useLocation();

  return (
    <div className="min-h-screen h-[100dvh] max-h-[100dvh] w-full flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950 text-slate-100 overflow-hidden relative selection:bg-indigo-500 selection:text-white">
      {/* Dynamic Background Glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-600/15 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-sky-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />

      {/* Main Glassmorphic Dual-Panel Card */}
      <div className="relative w-full max-w-5xl max-h-[96dvh] my-auto bg-slate-900/85 backdrop-blur-2xl border border-slate-800/90 rounded-3xl shadow-2xl shadow-black/80 grid grid-cols-1 lg:grid-cols-12 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* LEFT PANEL: Brand & Value Showcase (Visible on lg+) */}
        <div className="lg:col-span-5 hidden lg:flex flex-col justify-between p-7 xl:p-8 bg-gradient-to-br from-indigo-950/50 via-slate-900/70 to-slate-950/90 border-r border-slate-800/70 relative">
          {/* Subtle decorative grid lines */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          {/* Brand Header */}
          <div className="space-y-3">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform duration-200">
                P
              </div>
              <div>
                <span className="font-extrabold text-lg text-white tracking-tight flex items-center gap-1.5">
                  Portfolio<span className="text-indigo-400">SaaS</span>
                </span>
                <span className="text-[10px] text-slate-400 block -mt-0.5 tracking-wider uppercase font-semibold">
                  Multi-Tenant Platform
                </span>
              </div>
            </Link>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>AI-Powered CV to Live Web Portfolio</span>
            </div>
          </div>

          {/* Value Propositions & Visual Micro-Cards */}
          <div className="space-y-3.5 my-auto py-4">
            <h2 className="text-xl font-bold text-white tracking-tight leading-snug">
              Your Professional Identity,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">
                Instantly Live.
              </span>
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Launch an executive-grade portfolio website with a personalized subdomain slug in under two minutes.
            </p>

            <div className="space-y-2.5 pt-1">
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-indigo-500/30 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center text-indigo-400 shrink-0">
                  <Globe2 className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white">Instant Custom Subdomain</p>
                  <p className="text-[11px] text-slate-400 font-mono">yourname.myportfolio.com</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-purple-500/30 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center text-purple-400 shrink-0">
                  <Palette className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white">20+ Curated Profession Themes</p>
                  <p className="text-[11px] text-slate-400">Tailored typography, colors & layouts</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-emerald-500/30 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white">Verified Credentials & Reviews</p>
                  <p className="text-[11px] text-slate-400">Cryptographic tokens & client testimonials</p>
                </div>
              </div>
            </div>
          </div>

          {/* Social Proof Footer */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
              <span className="text-slate-300 font-medium">99.9% Uptime</span>
            </div>
            <span className="text-slate-500">10,000+ Profiles Active</span>
          </div>
        </div>

        {/* RIGHT PANEL: Authentication Form */}
        <div className="lg:col-span-7 flex flex-col justify-between p-5 sm:p-7 md:p-8 overflow-y-auto max-h-[96dvh]">
          {/* Top Segmented Tab Switcher */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              {/* Mobile Brand Logo */}
              <Link to="/" className="lg:hidden flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                  P
                </div>
                <span className="font-bold text-sm text-white">Portfolio<span className="text-indigo-400">SaaS</span></span>
              </Link>

              {/* Segmented Switcher */}
              <div className="flex p-1 rounded-xl bg-slate-950 border border-slate-800/90 ml-auto">
                <Link
                  to="/login"
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    activeTab === 'login'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    activeTab === 'register'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Create Account
                </Link>
              </div>
            </div>

            {/* Header Titles */}
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-2xl font-extrabold text-white tracking-tight">
                {title}
              </h1>
              <p className="text-slate-400 text-xs">
                {subtitle}
              </p>
            </div>
          </div>

          {/* Form Content Slot */}
          <div className="py-2.5 my-auto">
            {children}
          </div>

          {/* Footer Terms */}
          <div className="pt-2 border-t border-slate-800/60 text-center">
            <p className="text-[11px] text-slate-500">
              Protected by Enterprise Auth. By continuing, you agree to our{' '}
              <Link to="/terms" className="text-slate-400 hover:text-indigo-300 underline underline-offset-2">
                Terms
              </Link>{' '}
              &amp;{' '}
              <Link to="/privacy" className="text-slate-400 hover:text-indigo-300 underline underline-offset-2">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
