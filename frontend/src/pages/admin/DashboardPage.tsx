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
} from 'lucide-react';
import { PortfolioRevisionsModal } from '../../components/portfolio/PortfolioRevisionsModal';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);

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
    <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-indigo-900/60 via-slate-900 to-purple-900/60 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6 shadow-2xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <span>Welcome back, {user?.fullName}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Portfolio Admin Control Panel</h1>
          <p className="text-slate-300 text-sm max-w-2xl">
            Manage your CV extractions, customize profession themes, monitor client testimonials, and publish your portfolio.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleTogglePublish}
            disabled={isPublishing}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition flex items-center gap-2 ${
              isPublished
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
            }`}
          >
            {isPublished ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{isPublished ? 'PUBLISHED ONLINE' : 'PRIVATE (UNPUBLISHED)'}</span>
          </button>

          <a
            href={`/p/${subdomain}`}
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-xs transition flex items-center gap-2"
          >
            <Eye className="w-4 h-4 text-indigo-400" />
            <span>View Public Site</span>
          </a>
        </div>
      </div>

      {/* Completeness Bar & Analytics Row */}
      <div className="grid md:grid-cols-12 gap-8">
        <div className="md:col-span-4 space-y-6">
          <CompletenessBar score={score} />

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                to="/admin/cv-import"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-sm font-medium text-slate-200 transition group"
              >
                <div className="flex items-center gap-2.5">
                  <FileUp className="w-4 h-4 text-indigo-400" />
                  <span>Upload & Extract CV</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition" />
              </Link>

              <Link
                to="/admin/customizer"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-sm font-medium text-slate-200 transition group"
              >
                <div className="flex items-center gap-2.5">
                  <Palette className="w-4 h-4 text-purple-400" />
                  <span>Customize Theme (20 Themes)</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition" />
              </Link>

              <button
                onClick={() => setIsRevisionModalOpen(true)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-sm font-medium text-slate-200 transition group text-left"
              >
                <div className="flex items-center gap-2.5">
                  <History className="w-4 h-4 text-emerald-400" />
                  <span>Revision History & Backups</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition" />
              </button>

              <a
                href={`/api/portfolio/pdf?subdomain=${subdomain}`}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-between p-3 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 text-sm font-medium text-indigo-300 transition group"
              >
                <div className="flex items-center gap-2.5">
                  <Download className="w-4 h-4 text-indigo-400" />
                  <span>Download Resume as PDF</span>
                </div>
                <ArrowRight className="w-4 h-4 text-indigo-500 group-hover:translate-x-1 transition" />
              </a>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="md:col-span-8 grid sm:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase">Total Portfolio Views</span>
              <Eye className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="text-3xl font-extrabold text-white">{analytics?.overview?.totalViews || 0}</div>
            <p className="text-xs text-slate-500">Live analytics tracked from visitors</p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase">Resume PDF Downloads</span>
              <Download className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold text-white">{analytics?.overview?.totalDownloads || 0}</div>
            <p className="text-xs text-slate-500">Downloaded generated resumes</p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase">Contact Inquiries</span>
              <MessageSquare className="w-5 h-5 text-sky-400" />
            </div>
            <div className="text-3xl font-extrabold text-white">{analytics?.overview?.totalContacts || 0}</div>
            <p className="text-xs text-slate-500">Direct visitor messages</p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase">Client Testimonials</span>
              <Star className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-3xl font-extrabold text-white">{analytics?.overview?.totalReviews || 0}</div>
            <p className="text-xs text-slate-500">Approved 5-star reviews</p>
          </div>
        </div>
      </div>

      <PortfolioRevisionsModal
        isOpen={isRevisionModalOpen}
        onClose={() => setIsRevisionModalOpen(false)}
        onRestored={fetchDashboardData}
      />
    </div>
  );
};
