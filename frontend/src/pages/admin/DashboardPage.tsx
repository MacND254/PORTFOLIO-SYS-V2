import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { CompletenessBar } from '../../components/admin/CompletenessBar';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import {
  FileUp,
  Palette,
  Eye,
  Download,
  Star,
  MessageSquare,
  Globe,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  History,
  QrCode,
} from 'lucide-react';
import { PortfolioRevisionsModal } from '../../components/portfolio/PortfolioRevisionsModal';
import { QrModal } from '../../components/portfolio/QrModal';
import { EmploymentStatusQuickEditor } from '../../components/admin/EmploymentStatusQuickEditor';
import { getPublicPortfolioUrl } from '../../utils/url';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [profileRes, analyticsRes]: [any, any] = await Promise.all([
        api.get('/profile'),
        api.get('/analytics/tenant'),
      ]);
      setProfile(profileRes.data);
      setAnalytics(analyticsRes.data);
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!profile) return;
    setIsPublishing(true);
    const currentStatus = profile.portfolioStatus?.isPublished ?? false;
    try {
      const res: any = await api.post('/portfolio/publish', { isPublished: !currentStatus });
      setProfile((prev: any) => ({
        ...prev,
        portfolioStatus: res.data,
      }));
    } catch (e) {
      console.error('Publish error:', e);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDownloadPdf = async (template = 'modern') => {
    setIsDownloadingPdf(true);
    try {
      const response: any = await api.get(`/portfolio/pdf?subdomain=${subdomain}&template=${template}`, {
        responseType: 'blob',
      });
      const blob = response instanceof Blob ? response : new Blob([response], { type: 'application/pdf' });
      if (blob.size === 0) throw new Error('The generated resume PDF was empty.');
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const ownerName = user?.fullName || 'Resume';
      link.setAttribute('download', `${ownerName.replace(/[^a-z0-9]+/gi, '_')}_Resume.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('Failed to download resume PDF:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  const isPublished = profile?.portfolioStatus?.isPublished ?? false;
  const score = profile?.completenessScore || 0;
  const subdomain = profile?.user?.subdomains?.[0]?.slug || 'francis';

  return (
    <div className="p-3 sm:p-5 md:p-6 space-y-4 sm:space-y-5 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-900/60 via-slate-900 to-purple-900/60 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-semibold">
              <span>Welcome back, {user?.fullName}</span>
            </div>
            <EmploymentStatusQuickEditor
              initialStatus={profile?.employmentStatus}
              initialCustomText={profile?.employmentStatusCustom}
              initialShowBadge={profile?.showEmploymentBadge}
              onStatusUpdated={(updated) => {
                setProfile((prev: any) => ({ ...prev, ...updated }));
              }}
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Portfolio Admin Control Panel</h1>
          <p className="text-slate-300 text-xs max-w-2xl leading-relaxed">
            Manage your CV extractions, customize profession themes, monitor client testimonials, and publish your portfolio.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleTogglePublish}
            disabled={isPublishing}
            className={`px-3.5 py-2 rounded-lg font-bold text-xs shadow-md transition flex items-center gap-1.5 ${
              isPublished
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
            }`}
          >
            {isPublished ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            <span>{isPublished ? 'PUBLISHED ONLINE' : 'PRIVATE (UNPUBLISHED)'}</span>
          </button>

          <a
            href={getPublicPortfolioUrl(subdomain)}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-xs transition flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5 text-indigo-400" />
            <span>View Public Site</span>
          </a>
        </div>
      </div>

      {/* Completeness Bar & Analytics Row */}
      <div className="grid md:grid-cols-12 gap-4 sm:gap-6">
        <div className="md:col-span-4 space-y-4">
          <CompletenessBar score={score} />

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-3">
            <h3 className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              <span>Quick Management Actions</span>
            </h3>
            <div className="space-y-2">
              <Link
                to="/admin/cv-import"
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/80 hover:bg-slate-800 border border-slate-800/80 hover:border-indigo-500/30 text-xs font-medium text-slate-200 transition-all duration-200 group shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 group-hover:scale-105 transition-transform">
                    <FileUp className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-semibold">Upload &amp; Extract CV</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
              </Link>

              <Link
                to="/admin/customizer"
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/80 hover:bg-slate-800 border border-slate-800/80 hover:border-purple-500/30 text-xs font-medium text-slate-200 transition-all duration-200 group shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 group-hover:scale-105 transition-transform">
                    <Palette className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-semibold">Theme Studio (20 Themes)</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
              </Link>

              <button
                onClick={() => setIsRevisionModalOpen(true)}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-950/80 hover:bg-slate-800 border border-slate-800/80 hover:border-emerald-500/30 text-xs font-medium text-slate-200 transition-all duration-200 group text-left shadow-sm cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
                    <History className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-semibold">Revision History &amp; Backups</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
              </button>

              <button
                onClick={() => setIsQrModalOpen(true)}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-950/80 hover:bg-slate-800 border border-slate-800/80 hover:border-sky-500/30 text-xs font-medium text-slate-200 transition-all duration-200 group text-left shadow-sm cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0 group-hover:scale-105 transition-transform">
                    <QrCode className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-semibold">Portfolio QR Code &amp; Share</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-1 transition-all" />
              </button>

              <button
                onClick={() => handleDownloadPdf('modern')}
                disabled={isDownloadingPdf}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 text-xs font-medium text-indigo-300 transition-all duration-200 group shadow-sm text-left cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 group-hover:scale-105 transition-transform">
                    {isDownloadingPdf ? <Spinner size="sm" /> : <Download className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-xs font-bold">
                    {isDownloadingPdf ? 'Generating PDF...' : 'Download Resume as PDF'}
                  </span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-indigo-400 group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          </div>
        </div>

        {/* Modernized Metrics Grid */}
        <div className="md:col-span-8 grid sm:grid-cols-2 gap-3 sm:gap-4">
          {/* Views Card */}
          <Link
            to="/admin/analytics"
            className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 rounded-xl p-3.5 sm:p-4 transition-all duration-200 group relative overflow-hidden backdrop-blur-sm shadow-lg flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/25">
                  <Eye className="w-4 h-4 text-white" />
                </div>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  Live Traffic
                </span>
              </div>
              <p className="text-2xl font-black text-white group-hover:text-indigo-300 transition-colors">
                {analytics?.overview?.totalViews || 0}
              </p>
              <p className="text-slate-300 text-[11px] font-semibold mt-0.5">Total Portfolio Views</p>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-1.5 border-t border-slate-800/80">
              <span>Visitor analytics stream</span>
              <span className="text-indigo-400 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                Analytics &rarr;
              </span>
            </div>
          </Link>

          {/* Downloads Card */}
          <div className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 rounded-xl p-3.5 sm:p-4 transition-all duration-200 group relative overflow-hidden backdrop-blur-sm shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/25">
                  <Download className="w-4 h-4 text-white" />
                </div>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Resume PDFs
                </span>
              </div>
              <p className="text-2xl font-black text-white group-hover:text-emerald-300 transition-colors">
                {analytics?.overview?.totalDownloads || 0}
              </p>
              <p className="text-slate-300 text-[11px] font-semibold mt-0.5">Resume PDF Downloads</p>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-1.5 border-t border-slate-800/80">
              <span>Recruiter saved copies</span>
              <span className="text-emerald-400 font-medium">Export Ready</span>
            </div>
          </div>

          {/* Contact Inquiries Card */}
          <Link
            to="/admin/messages"
            className="bg-slate-900/90 border border-slate-800 hover:border-sky-500/40 rounded-xl p-3.5 sm:p-4 transition-all duration-200 group relative overflow-hidden backdrop-blur-sm shadow-lg flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-sky-600 to-blue-600 flex items-center justify-center shadow-md shadow-sky-500/25">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                  Inbox
                </span>
              </div>
              <p className="text-2xl font-black text-white group-hover:text-sky-300 transition-colors">
                {analytics?.overview?.totalContacts || 0}
              </p>
              <p className="text-slate-300 text-[11px] font-semibold mt-0.5">Contact Inquiries</p>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-1.5 border-t border-slate-800/80">
              <span>Direct recruiter messages</span>
              <span className="text-sky-400 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                Messages &rarr;
              </span>
            </div>
          </Link>

          {/* Reviews Card */}
          <Link
            to="/admin/reviews"
            className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 rounded-xl p-3.5 sm:p-4 transition-all duration-200 group relative overflow-hidden backdrop-blur-sm shadow-lg flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-amber-600 to-orange-600 flex items-center justify-center shadow-md shadow-amber-500/25">
                  <Star className="w-4 h-4 text-white" />
                </div>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Endorsements
                </span>
              </div>
              <p className="text-2xl font-black text-white group-hover:text-amber-300 transition-colors">
                {analytics?.overview?.totalReviews || 0}
              </p>
              <p className="text-slate-300 text-[11px] font-semibold mt-0.5">Client Testimonials</p>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-1.5 border-t border-slate-800/80">
              <span>Verified client feedback</span>
              <span className="text-amber-400 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                Reviews &rarr;
              </span>
            </div>
          </Link>
        </div>
      </div>

      <PortfolioRevisionsModal
        isOpen={isRevisionModalOpen}
        onClose={() => setIsRevisionModalOpen(false)}
        onRestored={fetchDashboardData}
      />

      <QrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        portfolioUrl={getPublicPortfolioUrl(subdomain)}
        fullName={user?.fullName || 'Your Portfolio'}
      />
    </div>
  );
};
