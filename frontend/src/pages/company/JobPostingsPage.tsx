import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import type { JobPosting, JobStatus } from '../../types';
import {
  Briefcase, Plus, RefreshCw, AlertCircle, MapPin, Users, Edit2,
  Trash2, Pause, Play, ChevronDown, Eye, ExternalLink, Search
} from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  PAUSED: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  CLOSED: 'text-slate-400 bg-slate-500/10 border-slate-500/30',
};

const EMPLOYMENT_LABELS: Record<string, string> = {
  FULL_TIME: 'Full-time', PART_TIME: 'Part-time', CONTRACT: 'Contract', INTERNSHIP: 'Internship',
};

const WORKPLACE_ICONS: Record<string, string> = {
  REMOTE: '🌐', HYBRID: '🏢', ONSITE: '📍',
};

export function JobPostingsPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      const res: any = await api.get('/companies/jobs', { params });
      const data = res.data || res;
      setJobs(Array.isArray(data.jobs) ? data.jobs : []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load job postings.');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const handleStatusChange = async (job: JobPosting, newStatus: JobStatus) => {
    setActionLoading(job.id);
    try {
      await api.patch(`/companies/jobs/${job.id}`, { status: newStatus });
      fetchJobs();
    } catch {
      /* ignore */
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (job: JobPosting) => {
    if (!confirm(`Delete "${job.title}"? This cannot be undone.`)) return;
    setActionLoading(job.id);
    try {
      await api.delete(`/companies/jobs/${job.id}`);
      fetchJobs();
    } catch {
      /* ignore */
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Job Postings
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">{total} position{total !== 1 ? 's' : ''} posted</p>
          </div>
        </div>
        <Link
          to="/company/jobs/new"
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-semibold rounded-lg hover:opacity-90 transition shadow-md shadow-indigo-500/20 shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Post New Job
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="appearance-none bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:border-indigo-500 transition"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
            <option value="CLOSED">Closed</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
        </div>
        <button onClick={fetchJobs} className="p-1.5 text-slate-400 hover:text-white rounded-lg border border-slate-700 hover:border-slate-600 transition" title="Refresh">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-2.5 text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
          <button onClick={fetchJobs} className="ml-auto text-xs underline hover:text-red-300">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-xl">
          <Briefcase className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <h3 className="text-white font-semibold text-base mb-1">No job postings yet</h3>
          <p className="text-slate-500 text-xs mb-4 max-w-xs mx-auto">
            Post your first open position and our AI will instantly match you with the best candidates
          </p>
          <Link to="/company/jobs/new" className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-500 transition">
            <Plus className="w-3.5 h-3.5" /> Post a Job
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => (
            <div key={job.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-4 hover:border-slate-700 transition">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <h3 className="text-white font-semibold text-sm sm:text-base">{job.title}</h3>
                    <span className={`text-[11px] px-2 py-0.5 rounded-md border font-medium ${STATUS_STYLES[job.status]}`}>
                      {job.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-400 mb-2">
                    <span>{EMPLOYMENT_LABELS[job.employmentType]}</span>
                    <span>·</span>
                    <span>{WORKPLACE_ICONS[job.workplaceType]} {job.workplaceType.charAt(0) + job.workplaceType.slice(1).toLowerCase()}</span>
                    {job.location && <><span>·</span><span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span></>}
                    {job.experienceLevel && <><span>·</span><span>{job.experienceLevel}</span></>}
                    {job.salaryRange && <><span>·</span><span className="text-emerald-400">{job.salaryRange}</span></>}
                  </div>
                  {job.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {job.skills.slice(0, 6).map(skill => (
                        <span key={skill} className="text-[11px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded">
                          {skill}
                        </span>
                      ))}
                      {job.skills.length > 6 && (
                        <span className="text-[11px] text-slate-500">+{job.skills.length - 6} more</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Link
                    to={`/company/jobs/${job.id}/matches`}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-medium rounded-lg hover:bg-indigo-500/20 transition"
                  >
                    <Users className="w-3.5 h-3.5" />
                    Matches
                  </Link>
                  <Link
                    to={`/company/jobs/${job.id}/edit`}
                    className="p-1.5 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 rounded-lg transition"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Link>
                  {job.status === 'ACTIVE' ? (
                    <button
                      onClick={() => handleStatusChange(job, 'PAUSED')}
                      disabled={actionLoading === job.id}
                      title="Pause"
                      className="p-1.5 text-slate-400 hover:text-amber-400 border border-slate-700 hover:border-amber-500/30 rounded-lg transition disabled:opacity-50"
                    >
                      {actionLoading === job.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Pause className="w-3.5 h-3.5" />}
                    </button>
                  ) : job.status === 'PAUSED' ? (
                    <button
                      onClick={() => handleStatusChange(job, 'ACTIVE')}
                      disabled={actionLoading === job.id}
                      title="Activate"
                      className="p-1.5 text-slate-400 hover:text-emerald-400 border border-slate-700 hover:border-emerald-500/30 rounded-lg transition disabled:opacity-50"
                    >
                      {actionLoading === job.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                  ) : null}
                  <button
                    onClick={() => handleDelete(job)}
                    disabled={actionLoading === job.id}
                    title="Delete"
                    className="p-1.5 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/30 rounded-lg transition disabled:opacity-50"
                  >
                    {actionLoading === job.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <p className="text-slate-500 text-[11px] mt-2.5">Posted {new Date(job.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
