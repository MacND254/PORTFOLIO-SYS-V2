import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/client';
import type { CandidateMatch, JobPosting } from '../../types';
import { EmploymentStatusBadge } from '../../components/ui/EmploymentStatusBadge';
import {
  Users, ArrowLeft, RefreshCw, AlertCircle, Search, ExternalLink,
  Calendar, Shield, Star, TrendingUp, ChevronRight, Filter, Info
} from 'lucide-react';

function ScoreBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs text-slate-500">{label}</span>
        <span className="text-xs font-semibold text-slate-300">{value}/{max}</span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function MatchScoreRing({ score }: { score: number }) {
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#6366f1';
  const strokeWidth = 4.5;
  const r = 18;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-12 h-12 shrink-0">
      <svg viewBox="0 0 44 44" className="w-12 h-12 -rotate-90">
        <circle cx="22" cy="22" r={r} fill="none" stroke="#1e293b" strokeWidth={strokeWidth} />
        <circle
          cx="22" cy="22" r={r} fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-white">{score}%</span>
      </div>
    </div>
  );
}

export function JobMatchesPage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<JobPosting | null>(null);
  const [matches, setMatches] = useState<CandidateMatch[]>([]);
  const [totalEvaluated, setTotalEvaluated] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [minScore, setMinScore] = useState(20);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchMatches = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const res: any = await api.get(`/companies/jobs/${id}/matches`, {
        params: { minScore, search: search || undefined, limit: 50 },
      });
      const data = res.data?.data || res.data;
      const result = data?.job ? data : (res.data);
      setJob(result?.job || null);
      const matchList = result?.matches || data?.matches || [];
      setMatches(Array.isArray(matchList) ? matchList : []);
      setTotalEvaluated(result?.totalCandidatesEvaluated || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to run candidate match analysis.');
    } finally {
      setLoading(false);
    }
  }, [id, minScore, search]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const getMatchLabel = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'text-emerald-400' };
    if (score >= 60) return { label: 'Strong', color: 'text-blue-400' };
    if (score >= 40) return { label: 'Good', color: 'text-indigo-400' };
    return { label: 'Partial', color: 'text-amber-400' };
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/company/jobs" className="p-1.5 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 rounded-lg transition" title="Back to jobs">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            Candidate Matches
          </h1>
          {job && (
            <p className="text-slate-400 text-xs truncate">
              for <span className="text-white font-medium">{(job as any).title}</span>
              {(job as any).companyName && <span className="text-slate-500"> · {(job as any).companyName}</span>}
            </p>
          )}
        </div>
      </div>

      {/* Summary Bar */}
      {!loading && !error && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 flex items-center gap-4 flex-wrap text-xs">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400">Analyzed <strong className="text-white">{totalEvaluated}</strong> candidates</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400"><strong className="text-white">{matches.length}</strong> matches above {minScore}%</span>
          </div>
          {job && (job as any).skills?.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-500 text-[11px]">Matching on:</span>
              {(job as any).skills?.slice(0, 4).map((s: string) => (
                <span key={s} className="text-[11px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded">{s}</span>
              ))}
              {(job as any).skills?.length > 4 && <span className="text-[11px] text-slate-500">+{(job as any).skills.length - 4}</span>}
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-44 max-w-xs">
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchMatches()}
            placeholder="Search by name or skill..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition"
          />
        </div>
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-400 text-xs">Min score:</span>
          <select
            value={minScore}
            onChange={e => setMinScore(parseInt(e.target.value))}
            className="bg-transparent text-white text-xs focus:outline-none"
          >
            {[10, 20, 30, 40, 50, 60, 70].map(v => (
              <option key={v} value={v} className="bg-slate-900 text-white">{v}%</option>
            ))}
          </select>
        </div>
        <button onClick={fetchMatches} className="p-1.5 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 rounded-lg transition" title="Refresh">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-2.5 text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
          <button onClick={fetchMatches} className="ml-auto text-xs underline hover:text-red-300">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20">
          <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-400 font-medium text-xs">Analyzing candidate portfolios...</p>
          <p className="text-slate-600 text-[11px] mt-0.5">This may take a moment for large talent pools</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-xl">
          <Users className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <h3 className="text-white font-semibold text-base mb-1">No matches found</h3>
          <p className="text-slate-500 text-xs max-w-sm mx-auto">
            Try lowering the minimum score threshold or broadening your job requirements
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((candidate, idx) => {
            const { label, color } = getMatchLabel(candidate.matchScore);
            const isExpanded = expandedId === candidate.profileId;
            const portfolioUrl = candidate.portfolioUrl || (candidate.subdomain ? `${window.location.protocol}//${candidate.subdomain}.${window.location.hostname.replace('www.', '')}` : null);

            return (
              <div key={candidate.profileId} className={`bg-slate-900 border rounded-xl overflow-hidden transition ${isExpanded ? 'border-indigo-500/40' : 'border-slate-800 hover:border-slate-700'}`}>
                {/* Main Row */}
                <div
                  className="flex items-center gap-3 p-3.5 sm:p-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : candidate.profileId)}
                >
                  {/* Rank */}
                  <div className="text-slate-700 font-bold text-xs w-4 shrink-0">#{idx + 1}</div>

                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0 overflow-hidden">
                    {candidate.avatarUrl ? (
                      <img src={candidate.avatarUrl} alt={candidate.fullName} className="w-full h-full object-cover" />
                    ) : candidate.fullName[0].toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-white font-semibold text-xs sm:text-sm">{candidate.fullName}</h3>
                      {candidate.showEmploymentBadge !== false && candidate.employmentStatus && (
                        <EmploymentStatusBadge
                          status={candidate.employmentStatus}
                          customText={candidate.employmentStatusCustom}
                          size="xs"
                        />
                      )}
                      {candidate.hasVerifiedDocs && (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                          <Shield className="w-2.5 h-2.5" /> Verified
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-xs">{candidate.title}</p>
                    {candidate.location && <p className="text-slate-500 text-[11px] mt-0.5">📍 {candidate.location}</p>}
                  </div>

                  {/* Score Ring */}
                  <div className="shrink-0 text-center">
                    <MatchScoreRing score={candidate.matchScore} />
                    <p className={`text-[10px] font-semibold mt-0.5 ${color}`}>{label}</p>
                  </div>

                  <ChevronRight className={`w-4 h-4 text-slate-600 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </div>

                {/* Matched Skills Preview */}
                {!isExpanded && candidate.matchedSkills.length > 0 && (
                  <div className="px-3.5 pb-3 flex flex-wrap gap-1">
                    {candidate.matchedSkills.slice(0, 5).map(s => (
                      <span key={s} className="text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">✓ {s}</span>
                    ))}
                    {candidate.missingSkills.slice(0, 3).map(s => (
                      <span key={s} className="text-[11px] bg-slate-800 text-slate-500 border border-slate-700 px-1.5 py-0.5 rounded">✗ {s}</span>
                    ))}
                  </div>
                )}

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="px-3.5 pb-3.5 border-t border-slate-800 pt-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Score Breakdown */}
                      <div>
                        <h4 className="text-white font-medium text-xs mb-2 flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                          Score Breakdown
                        </h4>
                        <div className="space-y-2">
                          <ScoreBar label="Skills Match" value={candidate.scoreBreakdown.skillsScore} max={40} color="bg-emerald-500" />
                          <ScoreBar label="Role & Title Fit" value={candidate.scoreBreakdown.roleTitleScore} max={25} color="bg-blue-500" />
                          <ScoreBar label="Experience & Projects" value={candidate.scoreBreakdown.experienceScore} max={25} color="bg-indigo-500" />
                          <ScoreBar label="Verification & Completeness" value={candidate.scoreBreakdown.verificationScore} max={10} color="bg-purple-500" />
                        </div>
                      </div>

                      {/* Skills Detail */}
                      <div>
                        <h4 className="text-white font-medium text-xs mb-2">Skills</h4>
                        {candidate.matchedSkills.length > 0 && (
                          <div className="mb-2">
                            <p className="text-[11px] text-slate-500 mb-1">Matched</p>
                            <div className="flex flex-wrap gap-1">
                              {candidate.matchedSkills.map(s => (
                                <span key={s} className="text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md font-medium">✓ {s}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {candidate.missingSkills.length > 0 && (
                          <div>
                            <p className="text-[11px] text-slate-500 mb-1">Missing</p>
                            <div className="flex flex-wrap gap-1">
                              {candidate.missingSkills.map(s => (
                                <span key={s} className="text-[11px] bg-slate-800 text-slate-500 border border-slate-700 px-2 py-0.5 rounded-md">✗ {s}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {candidate.experienceHighlights.length > 0 && (
                          <div className="mt-2">
                            <p className="text-[11px] text-slate-500 mb-1">Relevant Experience</p>
                            {candidate.experienceHighlights.map(h => (
                              <p key={h} className="text-[11px] text-slate-400 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                                {h}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-800">
                      {portfolioUrl ? (
                        <a
                          href={portfolioUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 border border-slate-700 text-white text-xs font-medium rounded-lg hover:border-indigo-500/50 hover:text-indigo-300 transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          View Portfolio
                        </a>
                      ) : (
                        <span className="text-slate-600 text-xs">Portfolio not public</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
