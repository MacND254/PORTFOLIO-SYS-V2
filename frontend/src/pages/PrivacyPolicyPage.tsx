import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Lock, Database, Globe, Eye, UserCheck, Mail } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const PrivacyPolicyPage: React.FC = () => {
  const lastUpdated = 'August 18, 2026';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white flex flex-col">
      {/* Header Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              P
            </div>
            <span className="font-bold text-white text-base tracking-tight">Portfolio SaaS</span>
          </Link>

          <Link to="/">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 space-y-10">
        {/* Hero Section */}
        <div className="space-y-4 text-center md:text-left border-b border-slate-800 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Legal & Privacy Compliance</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Privacy Policy</h1>
          <p className="text-slate-400 text-sm max-w-2xl">
            At Portfolio SaaS, we take your privacy seriously. This document outlines how we collect, use, and protect your personal information when using our multi-tenant portfolio platform.
          </p>
          <p className="text-xs text-slate-500">Last updated: {lastUpdated}</p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8 text-slate-300 text-sm leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3 bg-slate-900/40 p-6 rounded-2xl border border-slate-800/80">
            <div className="flex items-center gap-3 text-indigo-400 font-bold text-lg">
              <Database className="w-5 h-5 shrink-0" />
              <h2>1. Information We Collect</h2>
            </div>
            <p>
              When you register and build a professional portfolio using our platform, we collect information necessary to provide and customize our services:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 pl-2">
              <li><strong className="text-slate-200">Account Credentials:</strong> Full name, email address, password hashes, and primary profession.</li>
              <li><strong className="text-slate-200">Social Identity (OAuth):</strong> Email, full name, profile picture URL, and OAuth provider IDs when logging in via Google or GitHub.</li>
              <li><strong className="text-slate-200">Portfolio Data:</strong> Bio, experience history, education, skills, projects, certifications, and uploaded CV files.</li>
              <li><strong className="text-slate-200">Usage &amp; Analytics Data:</strong> Anonymized view counts, browser types, and referrer statistics for public portfolios.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3 bg-slate-900/40 p-6 rounded-2xl border border-slate-800/80">
            <div className="flex items-center gap-3 text-indigo-400 font-bold text-lg">
              <UserCheck className="w-5 h-5 shrink-0" />
              <h2>2. How We Use Social OAuth Data (Google &amp; GitHub)</h2>
            </div>
            <p>
              Our platform offers one-click registration and sign-in via Google and GitHub OAuth 2.0. When you authorize access:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 pl-2">
              <li>We only request read-only profile access (<code className="text-indigo-300 bg-slate-800 px-1 py-0.5 rounded">openid</code>, <code className="text-indigo-300 bg-slate-800 px-1 py-0.5 rounded">profile</code>, <code className="text-indigo-300 bg-slate-800 px-1 py-0.5 rounded">email</code>).</li>
              <li>We use your social email and name solely to authenticate your identity and initialize your portfolio account.</li>
              <li>We <strong>never</strong> post on your behalf or share your social profile data with third parties.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3 bg-slate-900/40 p-6 rounded-2xl border border-slate-800/80">
            <div className="flex items-center gap-3 text-indigo-400 font-bold text-lg">
              <Globe className="w-5 h-5 shrink-0" />
              <h2>3. Public Portfolio Visibility &amp; Subdomains</h2>
            </div>
            <p>
              Our platform is designed to publish professional web portfolios accessible via unique tenant subdomains (e.g., <code className="text-indigo-300 bg-slate-800 px-1.5 py-0.5 rounded font-mono">username.myportfolio.com</code>):
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 pl-2">
              <li>Any information you explicitly add to your public portfolio (Bio, Experience, Projects, Skills) becomes accessible on the public web.</li>
              <li>You can toggle portfolio visibility, password protection, or section displays at any time from your Admin Dashboard.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3 bg-slate-900/40 p-6 rounded-2xl border border-slate-800/80">
            <div className="flex items-center gap-3 text-indigo-400 font-bold text-lg">
              <Lock className="w-5 h-5 shrink-0" />
              <h2>4. Data Security &amp; Storage</h2>
            </div>
            <p>
              We implement industry-standard security measures to safeguard your information:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 pl-2">
              <li>Passwords are salted and hashed using bcrypt.</li>
              <li>Authentication tokens (JWT) are signed and stored securely in local browser storage or HTTP-only cookies.</li>
              <li>Uploaded CV documents and assets are stored in isolated tenant storage directories.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3 bg-slate-900/40 p-6 rounded-2xl border border-slate-800/80">
            <div className="flex items-center gap-3 text-indigo-400 font-bold text-lg">
              <Eye className="w-5 h-5 shrink-0" />
              <h2>5. Your Rights &amp; Control</h2>
            </div>
            <p>
              You have full control over your data stored on our platform:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 pl-2">
              <li><strong className="text-slate-200">Access &amp; Edit:</strong> You can edit or delete any portfolio section, project, or credential at any time.</li>
              <li><strong className="text-slate-200">Account Deletion:</strong> You can request full deletion of your tenant account and all associated portfolio data.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3 bg-slate-900/40 p-6 rounded-2xl border border-slate-800/80">
            <div className="flex items-center gap-3 text-indigo-400 font-bold text-lg">
              <Mail className="w-5 h-5 shrink-0" />
              <h2>6. Contact Us</h2>
            </div>
            <p>
              If you have any questions or privacy inquiries regarding this Privacy Policy, please contact our support team at:
            </p>
            <p className="font-mono text-indigo-400 font-semibold pt-1">
              privacy@myportfolio.com
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto px-6 py-8 border-t border-slate-800/80 bg-slate-950 text-slate-400 text-xs text-center space-y-2">
        <div className="flex items-center justify-center gap-4 text-slate-400">
          <Link to="/privacy" className="hover:text-white transition">Privacy Policy</Link>
          <span>•</span>
          <Link to="/terms" className="hover:text-white transition">Terms of Service</Link>
        </div>
        <p>© {new Date().getFullYear()} Multi-Tenant Portfolio SaaS. All rights reserved.</p>
      </footer>
    </div>
  );
};
