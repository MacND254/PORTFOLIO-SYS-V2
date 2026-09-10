import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { Spinner } from '../../components/ui/Spinner';
import {
  Sparkles,
  Users,
  Activity,
  ShieldAlert,
  CheckCircle2,
  Globe,
  Download,
  Building2,
  Briefcase,
  Palette,
  Sliders,
  ShieldCheck,
  ArrowRight,
  Clock,
  Database,
  Server,
  RefreshCw,
  Eye,
  FileText,
  Mail,
  TrendingUp,
} from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchSuperAdminOverview();
  }, []);

  const fetchSuperAdminOverview = async () => {
    setIsRefreshing(true);
    try {
      const [analyticsRes, healthRes, companiesRes]: any = await Promise.allSettled([
        api.get('/admin/analytics'),
        api.get('/admin/system-health'),
        api.get('/companies/all'),
      ]);

      if (analyticsRes.status === 'fulfilled') {
        setAnalytics(analyticsRes.value.data?.data || analyticsRes.value.data);
      }
      if (healthRes.status === 'fulfilled') {
        setHealth(healthRes.value.data?.data || healthRes.value.data);
      }
      if (companiesRes.status === 'fulfilled') {
        const rawComp = companiesRes.value;
        const compList = rawComp?.companies || rawComp?.data?.companies || rawComp?.data || (Array.isArray(rawComp) ? rawComp : []);
        setCompanies(Array.isArray(compList) ? compList : []);
      }
    } catch (e) {
      console.error('Failed to load superadmin overview:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center space-y-3 min-h-[60vh]">
        <Spinner size="lg" />
        <p className="text-slate-400 text-sm animate-pulse">Loading Platform Intelligence &amp; Super Admin Telemetry...</p>
      </div>
    );
  }

  const { overview, popularProfessions = [], recentRegistrations = [] } = analytics || {};
  const totalUsers = overview?.totalUsers || 0;
  const activeUsers = overview?.activeUsers || 0;
  const suspendedUsers = overview?.suspendedUsers || 0;
  const publishedPortfolios = overview?.publishedPortfolios || 0;
  const totalPortfolios = overview?.totalPortfolios || 0;
  const totalViews = overview?.totalViews || 0;
  const totalDownloads = overview?.totalDownloads || 0;
  const totalCVsUploaded = overview?.totalCVsUploaded || 0;
  const totalCompanies = overview?.totalCompanies ?? companies.length;
  const verifiedCompanies = overview?.verifiedCompanies ?? companies.filter((c: any) => c.user?.emailVerified === true).length;
  const totalCompanyJobs = overview?.totalCompanyJobs ?? companies.reduce((acc: number, c: any) => acc + (c._count?.jobs || c.jobs?.length || 0), 0);

  const publishRate = totalPortfolios > 0 ? Math.round((publishedPortfolios / totalPortfolios) * 100) : 0;
  const isHealthy = health?.status === 'HEALTHY';

  const formatUptime = (sec?: number) => {
    if (!sec) return 'Active';
    const hours = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    if (hours > 24) {
      return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    }
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="p-3 sm:p-5 md:p-6 space-y-4 sm:space-y-5 max-w-7xl mx-auto">
      {/* Top Welcome Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 border border-purple-800/40 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[11px] font-semibold">
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>Platform Super Admin Command Tower</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
              Platform Executive Overview
            </h1>
            <p className="text-slate-300 text-xs max-w-2xl leading-relaxed">
              Global governance, real-time tenant telemetry, verified corporate hiring partners, and infrastructure health metrics.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={fetchSuperAdminOverview}
              disabled={isRefreshing}
              className="px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-purple-400' : 'text-slate-400'}`} />
              <span>Sync Metrics</span>
            </button>
            <Link
              to="/superadmin/settings"
              className="px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-purple-600/25"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>System Settings</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Real-Time Infrastructure Health Status Bar */}
      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/90 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isHealthy ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isHealthy ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          </span>
          <div>
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Platform Status:</span>
              <span className={isHealthy ? 'text-emerald-400' : 'text-amber-400'}>
                {health?.status || 'OPERATIONAL'}
              </span>
            </span>
            <p className="text-[10px] text-slate-400">
              Core cluster running smoothly • Uptime: {formatUptime(health?.uptimeSeconds)}
            </p>
          </div>
        </div>

        {/* Micro Service Status Badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-300 flex items-center gap-1">
            <Database className="w-3 h-3 text-indigo-400" />
            <span>DB:</span>
            <span className="text-emerald-400 font-bold">
              {health?.services?.database?.status || (typeof health?.services?.database === 'string' ? health.services.database : 'UP')}
            </span>
            {health?.services?.database?.latencyMs != null && (
              <span className="text-slate-500 text-[9px]">({health.services.database.latencyMs}ms)</span>
            )}
          </div>
          <div className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-300 flex items-center gap-1">
            <Server className="w-3 h-3 text-purple-400" />
            <span>Redis:</span>
            <span className="text-emerald-400 font-bold">
              {health?.services?.redis?.status || (typeof health?.services?.redis === 'string' ? health.services.redis : 'UP')}
            </span>
            {health?.services?.redis?.latencyMs != null && (
              <span className="text-slate-500 text-[9px]">({health.services.redis.latencyMs}ms)</span>
            )}
          </div>
          <div className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-300 flex items-center gap-1">
            <FileText className="w-3 h-3 text-sky-400" />
            <span>CV Engine:</span>
            <span className="text-emerald-400 font-bold">
              {health?.services?.cvEngine?.status || (typeof health?.services?.cvEngine === 'string' ? health.services.cvEngine : 'UP')}
            </span>
          </div>
          <Link
            to="/superadmin/system-health"
            className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-2 ml-1"
          >
            Diagnostics
          </Link>
        </div>
      </div>

      {/* Advanced Executive Platform KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Registered Tenants */}
        <Link
          to="/superadmin/users"
          className="bg-slate-900/90 border border-slate-800 hover:border-purple-500/40 rounded-xl p-3.5 sm:p-4 transition-all duration-200 group relative overflow-hidden backdrop-blur-sm shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-md shadow-purple-500/25">
              <Users className="w-4 h-4 text-white" />
            </div>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
              {activeUsers} Active
            </span>
          </div>
          <p className="text-2xl font-black text-white group-hover:text-purple-300 transition-colors">
            {totalUsers}
          </p>
          <p className="text-slate-300 text-[11px] font-semibold mt-0.5">Total Registered Tenants</p>
          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-1.5 border-t border-slate-800/80">
            <span>{suspendedUsers} Suspended</span>
            <span className="text-purple-400 font-medium group-hover:translate-x-0.5 transition-transform">
              Manage
            </span>
          </div>
        </Link>

        {/* Card 2: Published Portfolios */}
        <Link
          to="/superadmin/users"
          className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 rounded-xl p-3.5 sm:p-4 transition-all duration-200 group relative overflow-hidden backdrop-blur-sm shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/25">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              {publishRate}% Published
            </span>
          </div>
          <p className="text-2xl font-black text-white group-hover:text-emerald-300 transition-colors">
            {publishedPortfolios}
          </p>
          <p className="text-slate-300 text-[11px] font-semibold mt-0.5">Live Published Portfolios</p>
          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-1.5 border-t border-slate-800/80">
            <span>{totalPortfolios} Total Created</span>
            <span className="text-emerald-400 font-medium group-hover:translate-x-0.5 transition-transform">
              Inspect
            </span>
          </div>
        </Link>

        {/* Card 3: Platform Traffic & Views */}
        <Link
          to="/superadmin/analytics"
          className="bg-slate-900/90 border border-slate-800 hover:border-sky-500/40 rounded-xl p-3.5 sm:p-4 transition-all duration-200 group relative overflow-hidden backdrop-blur-sm shadow-lg block"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-sky-600 to-blue-600 flex items-center justify-center shadow-md shadow-sky-500/25">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30 flex items-center gap-1">
              <TrendingUp className="w-2.5 h-2.5" />
              Live Hits
            </span>
          </div>
          <p className="text-2xl font-black text-white group-hover:text-sky-300 transition-colors">
            {totalViews}
          </p>
          <p className="text-slate-300 text-[11px] font-semibold mt-0.5">Total Platform Traffic</p>
          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-1.5 border-t border-slate-800/80">
            <span>{totalDownloads} Downloads</span>
            <span className="text-sky-400 font-medium group-hover:translate-x-0.5 transition-transform">
              Analytics
            </span>
          </div>
        </Link>

        {/* Card 4: Corporate Hiring Partners */}
        <Link
          to="/superadmin/companies"
          className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 rounded-xl p-3.5 sm:p-4 transition-all duration-200 group relative overflow-hidden backdrop-blur-sm shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-amber-600 to-orange-600 flex items-center justify-center shadow-md shadow-amber-500/25">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
              {totalCompanyJobs} Jobs Open
            </span>
          </div>
          <p className="text-2xl font-black text-white group-hover:text-amber-300 transition-colors">
            {verifiedCompanies}
          </p>
          <p className="text-slate-300 text-[11px] font-semibold mt-0.5">Verified Company Partners</p>
          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-1.5 border-t border-slate-800/80">
            <span>{totalCompanies} Total Registered</span>
            <span className="text-amber-400 font-medium group-hover:translate-x-0.5 transition-transform">
              Partners
            </span>
          </div>
        </Link>
      </div>

      {/* Platform Operations Launchpad Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Platform Operations &amp; Management Suites</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Direct access to all platform super admin capabilities and governance modules.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <Link
            to="/superadmin/users"
            className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-purple-500/50 transition-all duration-200 group flex items-start gap-3 shadow-md hover:shadow-purple-500/10"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                  Tenant Management
                </h3>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Filter and audit tenant accounts, grant admin privileges, or suspend users.
              </p>
            </div>
          </Link>

          <Link
            to="/superadmin/companies"
            className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 transition-all duration-200 group flex items-start gap-3 shadow-md hover:shadow-amber-500/10"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                  Company Partners &amp; Hiring
                </h3>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Dispatch invites, manage accounts, and monitor candidate job matches.
              </p>
            </div>
          </Link>

          <Link
            to="/superadmin/themes"
            className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 transition-all duration-200 group flex items-start gap-3 shadow-md hover:shadow-indigo-500/10"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 group-hover:scale-105 transition-transform">
              <Palette className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                  Theme Studio
                </h3>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Curate 20 themes, configure default palettes, and manage publication.
              </p>
            </div>
          </Link>

          <Link
            to="/superadmin/system-health"
            className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 transition-all duration-200 group flex items-start gap-3 shadow-md hover:shadow-emerald-500/10"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
              <Activity className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                  System Health &amp; Telemetry
                </h3>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Monitor database latency, cache hit ratios, AI parsing engine, and RAM.
              </p>
            </div>
          </Link>

          <Link
            to="/superadmin/audit-logs"
            className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-rose-500/50 transition-all duration-200 group flex items-start gap-3 shadow-md hover:shadow-rose-500/10"
          >
            <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white group-hover:text-rose-300 transition-colors">
                  Security Audit Logs
                </h3>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-rose-400 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Inspect administrative actions, credential resets, and audit trails.
              </p>
            </div>
          </Link>

          <Link
            to="/superadmin/settings"
            className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-sky-500/50 transition-all duration-200 group flex items-start gap-3 shadow-md hover:shadow-sky-500/10"
          >
            <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0 group-hover:scale-105 transition-transform">
              <Sliders className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white group-hover:text-sky-300 transition-colors">
                  Global System Settings
                </h3>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Maintenance mode, dual SMTP mail gateways, PWA, and analytics IDs.
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Two-Column Telemetry: Recent Tenant Onboarding & Popular Professions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Recent Tenant Registrations (7 cols) */}
        <div className="lg:col-span-7 p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs sm:text-sm font-bold text-white">Recent Tenant Registrations</h3>
            </div>
            <Link
              to="/superadmin/users"
              className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              View All ({totalUsers})
            </Link>
          </div>

          {recentRegistrations.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-6 text-center">No tenant registrations logged yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                    <th className="pb-2">Tenant</th>
                    <th className="pb-2">Profession</th>
                    <th className="pb-2 text-right">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recentRegistrations.slice(0, 7).map((u: any) => (
                    <tr key={u.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-2">
                        <p className="font-semibold text-white truncate max-w-[180px]">{u.fullName}</p>
                        <p className="text-[10px] text-slate-400 font-mono truncate max-w-[180px]">{u.email}</p>
                      </td>
                      <td className="py-2">
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          {u.desiredProfession || 'Software Engineer'}
                        </span>
                      </td>
                      <td className="py-2 text-right text-slate-400 font-mono text-[10px]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Profession Breakdown & Quick Metrics (5 cols) */}
        <div className="lg:col-span-5 p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-purple-400" />
                <span>Tenant Niche Breakdown</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-500">{popularProfessions.length} Professions</span>
            </div>
            <p className="text-[11px] text-slate-400">Distribution of desired career paths across tenants</p>
          </div>

          <div className="space-y-2.5 my-auto py-1">
            {popularProfessions.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-6 text-center">No profession data recorded yet.</p>
            ) : (
              popularProfessions.slice(0, 5).map((p: any) => {
                const pct = totalUsers > 0 ? Math.round((p.count / totalUsers) * 100) : 0;
                return (
                  <div key={p.profession} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold">
                      <span className="text-slate-300 truncate max-w-[190px]">{p.profession}</span>
                      <span className="text-white font-mono text-[10px]">{p.count} ({pct}%)</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
                        style={{ width: `${Math.max(6, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* CV & Conversion Footer Snippet */}
          <div className="pt-2.5 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-center">
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
              <span className="text-[9px] text-slate-400 uppercase font-semibold block">CVs Extracted</span>
              <span className="text-sm font-bold text-indigo-400 font-mono">{totalCVsUploaded}</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
              <span className="text-[9px] text-slate-400 uppercase font-semibold block">Publish Ratio</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">{publishRate}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
