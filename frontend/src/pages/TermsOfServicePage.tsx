import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft, ShieldAlert, Globe, Server, UserCheck, AlertTriangle, Mail } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const TermsOfServicePage: React.FC = () => {
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
            <FileText className="w-4 h-4" />
            <span>Legal Agreement</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Terms of Service</h1>
          <p className="text-slate-400 text-sm max-w-2xl">
            Please read these Terms of Service carefully before accessing or using our multi-tenant portfolio platform and subdomain hosting services.
          </p>
          <p className="text-xs text-slate-500">Last updated: {lastUpdated}</p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8 text-slate-300 text-sm leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3 bg-slate-900/40 p-6 rounded-2xl border border-slate-800/80">
            <div className="flex items-center gap-3 text-indigo-400 font-bold text-lg">
              <UserCheck className="w-5 h-5 shrink-0" />
              <h2>1. Acceptance of Terms</h2>
            </div>
            <p>
              By accessing, registering an account, or creating a portfolio subdomain on Portfolio SaaS, you agree to be bound by these Terms of Service and our <Link to="/privacy" className="text-indigo-400 hover:underline">Privacy Policy</Link>. If you do not agree to all terms, you may not use our platform.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3 bg-slate-900/40 p-6 rounded-2xl border border-slate-800/80">
            <div className="flex items-center gap-3 text-indigo-400 font-bold text-lg">
              <Globe className="w-5 h-5 shrink-0" />
              <h2>2. Tenant Accounts &amp; Subdomains</h2>
            </div>
            <p>
              When creating an account or registering a subdomain:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 pl-2">
              <li>You are responsible for maintaining the confidentiality of your account login credentials.</li>
              <li>Subdomain slugs (e.g., <code className="text-indigo-300 bg-slate-800 px-1 py-0.5 rounded font-mono">username.myportfolio.com</code>) are assigned on a first-come, first-served basis.</li>
              <li>We reserve the right to reclaim, suspend, or rename subdomains that infringe upon registered trademarks, contain offensive language, or impersonate other individuals.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3 bg-slate-900/40 p-6 rounded-2xl border border-slate-800/80">
            <div className="flex items-center gap-3 text-indigo-400 font-bold text-lg">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <h2>3. Acceptable Use &amp; Content Guidelines</h2>
            </div>
            <p>
              You retain full ownership of the portfolio content, projects, text, and images you publish on your portfolio page. However, you agree not to upload or publish content that:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 pl-2">
              <li>Is unlawful, defamatory, abusive, harassing, or hate speech.</li>
              <li>Infringes on copyrights, patents, trademarks, or trade secrets of third parties.</li>
              <li>Contains malware, phishing links, or destructive code.</li>
              <li>Attempts unauthorized access to other tenants&apos; data or system infrastructure.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3 bg-slate-900/40 p-6 rounded-2xl border border-slate-800/80">
            <div className="flex items-center gap-3 text-indigo-400 font-bold text-lg">
              <Server className="w-5 h-5 shrink-0" />
              <h2>4. Platform Service &amp; Modifications</h2>
            </div>
            <p>
              We strive to maintain high system availability. However:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 pl-2">
              <li>We reserve the right to modify, suspend, or discontinue any feature of the platform with or without prior notice.</li>
              <li>Scheduled maintenance windows will be communicated via the system dashboard when possible.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3 bg-slate-900/40 p-6 rounded-2xl border border-slate-800/80">
            <div className="flex items-center gap-3 text-indigo-400 font-bold text-lg">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h2>5. Limitation of Liability</h2>
            </div>
            <p>
              To the maximum extent permitted by law, Portfolio SaaS shall not be liable for any indirect, incidental, or consequential damages resulting from your use or inability to use the platform or unauthorized access to your tenant data.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3 bg-slate-900/40 p-6 rounded-2xl border border-slate-800/80">
            <div className="flex items-center gap-3 text-indigo-400 font-bold text-lg">
              <Mail className="w-5 h-5 shrink-0" />
              <h2>6. Contact &amp; Legal Inquiries</h2>
            </div>
            <p>
              If you have questions about these Terms of Service or need to report a violation, please contact us at:
            </p>
            <p className="font-mono text-indigo-400 font-semibold pt-1">
              legal@myportfolio.com
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
