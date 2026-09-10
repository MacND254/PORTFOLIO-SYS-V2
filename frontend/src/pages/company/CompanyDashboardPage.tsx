import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import type { Company, JobPosting } from '../../types';
import {
  Building2, Briefcase, Users, Plus, ArrowRight, RefreshCw,
  MapPin, Globe, Sparkles, Zap, AlertCircle, Edit, CheckCircle2,
  ChevronRight, Search, ShieldCheck
} from 'lucide-react';

const EMPLOYMENT_LABELS: Record<string, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
};

const WORKPLACE_LABELS: Record<string, string> = {
  REMOTE: 'Remote',
  HYBRID: 'Hybrid',
  ONSITE: 'On-site',
};

const JOB_STATUS_BADGES: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: 'Active', className: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  PAUSED: { label: 'Paused', className: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  CLOSED: { label: 'Closed', className: 'text-slate-400 bg-slate-500/10 border-slate-500/30' },
};

export function CompanyDashboardPage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [companyRes, jobsRes]: any[] = await Promise.all([
        api.get('/companies/profile'),
        api.get('/companies/jobs', { params: { limit: 6 } }),
      ]);
      const companyData = companyRes.data?.data || companyRes.data;
      const jobsData = jobsRes.data?.jobs || jobsRes.jobs || jobsRes.data?.data?.jobs || [];
      setCompany(companyData);
      setJobs(Array.isArray(jobsData) ? jobsData : []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load company dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeJobs = jobs.filter(j => j.status === 'ACTIVE').length;
  const totalJobs = company?._count?.jobs ?? jobs.length;

  return (
    <div className="min-h-screen bg-slate-950 p-3 sm:p-5 md:p-6 space-y-4 sm:space-y-5">
      {/* Top Welcome & Action Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              <ShieldCheck className="w-3 h-3" />
              Corporate Partner Portal
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            {loading ? 'Partner Dashboard' : `Welcome back, ${company?.name || 'Hiring Partner'}`}
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Manage your open positions, track candidate portfolios, and run AI fit matching.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/company/jobs"
            className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition text-xs font-semibold flex items-center gap-1.5"
          >
            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
            <span>All Jobs</span>
          </Link>
          <Link
            to="/company/jobs/new"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-xs rounded-lg hover:opacity-90 transition shadow-md shadow-indigo-500/25"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Post New Job</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center justify-between gap-3 text-red-400 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={fetchData} className="underline text-red-300 hover:text-white shrink-0 text-xs">
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
        </div>
      ) : (
        <>
          {/* Modern Company Showcase Card */}
          {company && (
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/20 rounded-xl p-4 sm:p-4.5 shadow-lg backdrop-blur-sm">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row items-start gap-3.5 relative z-10">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-lg shrink-0 shadow-md shadow-indigo-500/25">
                  {company.name ? company.name.charAt(0).toUpperCase() : 'C'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      {company.name}
                    </h2>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                      Verified Employer Partner
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-3 mt-1.5 text-[11px] text-slate-400">
                    {company.industry && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3 h-3 text-slate-500" />
                        {company.industry}
                      </span>
                    )}
                    {company.companySize && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-500" />
                        {company.companySize} employees
                      </span>
                    )}
                    {company.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        {company.location}
                      </span>
                    )}
                    {company.website && (
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
                      >
                        <Globe className="w-3 h-3" />
                        Website
                      </a>
                    )}
                  </div>

                  {company.description && (
                    <p className="text-slate-400 text-xs mt-2 line-clamp-2 leading-relaxed">
                      {company.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Metric Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Link
              to="/company/jobs"
              className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 rounded-xl p-3.5 sm:p-4 transition-all duration-200 group relative overflow-hidden backdrop-blur-sm shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/25">
                    <Briefcase className="w-4 h-4 text-white" />
                  </div>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                    Positions
                  </span>
                </div>
                <p className="text-2xl font-black text-white group-hover:text-indigo-300 transition-colors">
                  {totalJobs}
                </p>
                <p className="text-slate-300 text-[11px] font-semibold mt-0.5">Total Job Postings</p>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-1.5 border-t border-slate-800/80">
                <span>All listings created</span>
                <span className="text-indigo-400 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                  Manage &rarr;
                </span>
              </div>
            </Link>

            <Link
              to="/company/jobs?status=ACTIVE"
              className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 rounded-xl p-3.5 sm:p-4 transition-all duration-200 group relative overflow-hidden backdrop-blur-sm shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/25">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    Live Hiring
                  </span>
                </div>
                <p className="text-2xl font-black text-white group-hover:text-emerald-300 transition-colors">
                  {activeJobs}
                </p>
                <p className="text-slate-300 text-[11px] font-semibold mt-0.5">Active Positions</p>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-1.5 border-t border-slate-800/80">
                <span>Accepting applicants</span>
                <span className="text-emerald-400 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                  Active &rarr;
                </span>
              </div>
            </Link>

            <Link
              to="/company/jobs"
              className="bg-slate-900/90 border border-slate-800 hover:border-purple-500/40 rounded-xl p-3.5 sm:p-4 transition-all duration-200 group relative overflow-hidden backdrop-blur-sm shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center shadow-md shadow-purple-500/25">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                    AI Sourcing
                  </span>
                </div>
                <p className="text-2xl font-black text-white group-hover:text-purple-300 transition-colors">
                  AI Fit
                </p>
                <p className="text-slate-300 text-[11px] font-semibold mt-0.5">Portfolio Candidate Matcher</p>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-1.5 border-t border-slate-800/80">
                <span>Rank candidates by fit</span>
                <span className="text-purple-400 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                  Score &rarr;
                </span>
              </div>
            </Link>

            <div className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 rounded-xl p-3.5 sm:p-4 transition-all duration-200 group relative overflow-hidden backdrop-blur-sm shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-amber-600 to-orange-600 flex items-center justify-center shadow-md shadow-amber-500/25">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    Pre-Vetted
                  </span>
                </div>
                <p className="text-2xl font-black text-white group-hover:text-amber-300 transition-colors">
                  100%
                </p>
                <p className="text-slate-300 text-[11px] font-semibold mt-0.5">Verified Portfolios</p>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-1.5 border-t border-slate-800/80">
                <span>Zero unvetted submissions</span>
                <span className="text-amber-400 font-medium">Guaranteed</span>
              </div>
            </div>
          </div>

          {/* Main Content Grid: Recent Job Openings & AI Matching Spotlight */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Open Positions List (2 cols) */}
            <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
              <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-slate-800 bg-slate-950/40">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                  <h3 className="text-white font-bold text-xs sm:text-sm">Recent Job Postings</h3>
                </div>
                <Link
                  to="/company/jobs"
                  className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
                >
                  <span>View all jobs</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              {jobs.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-800/80 flex items-center justify-center mx-auto mb-2.5 text-slate-600">
                    <Briefcase className="w-5 h-5 text-slate-500" />
                  </div>
                  <h4 className="text-white font-bold text-xs">No job postings created yet</h4>
                  <p className="text-slate-400 text-[11px] mt-1 max-w-sm mx-auto">
                    Publish your first position to let our AI candidate engine match the top portfolio talents for your stack.
                  </p>
                  <Link
                    to="/company/jobs/new"
                    className="inline-flex items-center gap-1 px-3 py-1.5 mt-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition shadow-md shadow-indigo-500/20"
                  >
                    <Plus className="w-3 h-3" />
                    Post Your First Job
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-800/60">
                  {jobs.map(job => {
                    const badge = JOB_STATUS_BADGES[job.status] || JOB_STATUS_BADGES.ACTIVE;
                    return (
                      <div
                        key={job.id}
                        className="p-3 sm:p-3.5 hover:bg-slate-800/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-white font-bold text-xs sm:text-sm group-hover:text-indigo-300 transition">
                              {job.title}
                            </h4>
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${badge.className}`}>
                              {badge.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400 flex-wrap">
                            {job.department && (
                              <span className="text-slate-300 font-medium">{job.department}</span>
                            )}
                            {job.department && <span>•</span>}
                            <span>{WORKPLACE_LABELS[job.workplaceType]}</span>
                            <span>•</span>
                            <span>{EMPLOYMENT_LABELS[job.employmentType]}</span>
                            {job.location && (
                              <>
                                <span>•</span>
                                <span>{job.location}</span>
                              </>
                            )}
                            {job.salaryRange && (
                              <>
                                <span>•</span>
                                <span className="text-emerald-400 font-medium">{job.salaryRange}</span>
                              </>
                            )}
                          </div>

                          {/* Skill Tags */}
                          {job.skills && job.skills.length > 0 && (
                            <div className="flex items-center gap-1 mt-2 flex-wrap">
                              {job.skills.slice(0, 4).map(skill => (
                                <span
                                  key={skill}
                                  className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60"
                                >
                                  {skill}
                                </span>
                              ))}
                              {job.skills.length > 4 && (
                                <span className="text-[9px] text-slate-500 font-mono">
                                  +{job.skills.length - 4} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                          <Link
                            to={`/company/jobs/${job.id}/matches`}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600/90 to-purple-600/90 hover:from-indigo-600 hover:to-purple-600 text-white text-[11px] font-semibold transition shadow-sm"
                          >
                            <Sparkles className="w-3 h-3 text-amber-300" />
                            <span>Candidate Matches</span>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* AI Candidate Matching Spotlight (1 col) */}
            <div className="space-y-3">
              <div className="bg-gradient-to-br from-indigo-950/60 via-slate-900 to-purple-950/40 border border-indigo-500/30 rounded-xl p-4 shadow-lg relative overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white mb-2.5 shadow-sm shadow-indigo-500/25">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </div>
                <h4 className="text-white font-bold text-xs sm:text-sm">
                  Portfolio Fit Engine Active
                </h4>
                <p className="text-slate-300 text-[11px] mt-1 leading-relaxed">
                  Every position you publish is automatically scored against live candidate portfolios, verified tech stacks, and architectures.
                </p>

                <div className="space-y-1.5 mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span>Skills & Tech Stack Match (40%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                    <span>Role & Experience Depth (25%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                    <span>Direct Live Portfolio Links</span>
                  </div>
                </div>

                <Link
                  to="/company/jobs/new"
                  className="mt-3 w-full py-1.5 px-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition flex items-center justify-center gap-1 border border-white/10"
                >
                  <Plus className="w-3 h-3" />
                  <span>Create Position to Match</span>
                </Link>
              </div>

              {/* Direct Partner Perks Card */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
                <h5 className="text-white font-semibold text-[10px] uppercase tracking-wider mb-2 text-slate-400">
                  Partner Privileges
                </h5>
                <ul className="space-y-1.5 text-[11px] text-slate-400">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>Zero recruitment placement fees</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>Direct schedule interview requests</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>Full project repositories & code</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
