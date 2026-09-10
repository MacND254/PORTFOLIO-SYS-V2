import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { Spinner } from '../../components/ui/Spinner';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { InterviewSchedule, InterviewStatus } from '../../types';
import {
  Calendar,
  Clock,
  Video,
  User,
  Building,
  Mail,
  CheckCircle2,
  XCircle,
  RotateCcw,
  CalendarCheck,
  Search,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Phone,
  Layers,
  Briefcase,
  AlertCircle,
  Trash2,
  Globe,
  CalendarPlus,
  Send,
} from 'lucide-react';

export const InterviewManagerPage: React.FC = () => {
  const [interviews, setInterviews] = useState<InterviewSchedule[]>([]);
  const [stats, setStats] = useState({
    pending: 0,
    accepted: 0,
    rescheduled: 0,
    declined: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | InterviewStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // ── Accept Modal State ──────────────────────────────────────────
  const [acceptModalItem, setAcceptModalItem] = useState<InterviewSchedule | null>(null);
  const [meetingLink, setMeetingLink] = useState('');
  const [acceptNotes, setAcceptNotes] = useState('');
  const [isSubmittingAccept, setIsSubmittingAccept] = useState(false);

  // ── Reschedule Modal State ──────────────────────────────────────
  const [rescheduleModalItem, setRescheduleModalItem] = useState<InterviewSchedule | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('14:00');
  const [rescheduleNotes, setRescheduleNotes] = useState('');
  const [isSubmittingReschedule, setIsSubmittingReschedule] = useState(false);

  // ── Decline Modal State ─────────────────────────────────────────
  const [declineModalItem, setDeclineModalItem] = useState<InterviewSchedule | null>(null);
  const [declineNotes, setDeclineNotes] = useState('');
  const [isSubmittingDecline, setIsSubmittingDecline] = useState(false);

  // ── Feedback Alerts ─────────────────────────────────────────────
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab, searchQuery]);

  const fetchData = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const [interviewsRes, statsRes]: any = await Promise.all([
        api.get('/interviews', {
          params: {
            status: activeTab,
            search: searchQuery || undefined,
          },
        }),
        api.get('/interviews/stats'),
      ]);

      // Robust payload extraction supporting both unwrapped and wrapped api clients
      const interviewList = Array.isArray(interviewsRes?.data)
        ? interviewsRes.data
        : Array.isArray(interviewsRes?.data?.data)
        ? interviewsRes.data.data
        : Array.isArray(interviewsRes)
        ? interviewsRes
        : [];
      setInterviews(interviewList);

      const statsData = statsRes?.data?.pending !== undefined
        ? statsRes.data
        : statsRes?.data?.data?.pending !== undefined
        ? statsRes.data.data
        : statsRes?.pending !== undefined
        ? statsRes
        : null;

      if (statsData) {
        setStats(statsData);
      }
    } catch (err: any) {
      console.error('Failed to load interviews:', err);
      setFetchError(err?.response?.data?.message || err?.message || 'Failed to load interviews.');
    } finally {
      setIsLoading(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessBanner(msg);
    setTimeout(() => setSuccessBanner(null), 4000);
  };

  // ── Handlers ───────────────────────────────────────────────────
  const handleOpenAccept = (item: InterviewSchedule) => {
    setAcceptModalItem(item);
    // Pre-populate with Google Meet placeholder or previous link
    setMeetingLink(item.meetingLink || 'https://meet.google.com/new');
    setAcceptNotes(
      item.tenantNotes ||
        `Looking forward to speaking with you regarding opportunities at ${item.company}!`
    );
  };

  const handleConfirmAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptModalItem) return;
    setIsSubmittingAccept(true);

    try {
      await api.patch(`/interviews/${acceptModalItem.id}/accept`, {
        meetingLink,
        notes: acceptNotes,
      });

      setAcceptModalItem(null);
      showSuccess(
        `Interview with ${acceptModalItem.recruiterName} accepted! Calendar invite & confirmation email sent to ${acceptModalItem.recruiterEmail}.`
      );
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to accept interview.');
    } finally {
      setIsSubmittingAccept(false);
    }
  };

  const handleOpenReschedule = (item: InterviewSchedule) => {
    setRescheduleModalItem(item);
    const currDate = new Date(item.preferredDate).toISOString().split('T')[0];
    setRescheduleDate(currDate);
    setRescheduleTime(item.preferredTime || '14:00');
    setRescheduleNotes(
      'Thank you for reaching out! I have a scheduling conflict at the requested slot, but would be delighted to meet at this alternative time.'
    );
  };

  const handleConfirmReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleModalItem) return;
    setIsSubmittingReschedule(true);

    try {
      await api.patch(`/interviews/${rescheduleModalItem.id}/reschedule`, {
        newDate: rescheduleDate,
        newTime: rescheduleTime,
        notes: rescheduleNotes,
      });

      setRescheduleModalItem(null);
      showSuccess(`Reschedule proposal emailed to ${rescheduleModalItem.recruiterEmail}.`);
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to reschedule interview.');
    } finally {
      setIsSubmittingReschedule(false);
    }
  };

  const handleOpenDecline = (item: InterviewSchedule) => {
    setDeclineModalItem(item);
    setDeclineNotes(
      `Thank you for reaching out regarding ${item.company}. Unfortunately, I am unable to take on interviews for this role at this time.`
    );
  };

  const handleConfirmDecline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!declineModalItem) return;
    setIsSubmittingDecline(true);

    try {
      await api.patch(`/interviews/${declineModalItem.id}/decline`, {
        notes: declineNotes,
      });

      setDeclineModalItem(null);
      showSuccess(`Meeting request declined. Recruiter notified.`);
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to decline interview.');
    } finally {
      setIsSubmittingDecline(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this interview record?')) return;
    try {
      await api.delete(`/interviews/${id}`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const formatSlotDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: InterviewStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 animate-pulse">
            <Clock className="w-3 h-3" />
            <span>Action Required</span>
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3" />
            <span>Confirmed</span>
          </span>
        );
      case 'RESCHEDULED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30 flex items-center gap-1.5">
            <RotateCcw className="w-3 h-3" />
            <span>Rescheduled</span>
          </span>
        );
      case 'DECLINED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
            <XCircle className="w-3 h-3" />
            <span>Declined</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-7xl mx-auto pb-10">
      {/* ── Success Toast Banner ─────────────────────────────────── */}
      {successBanner && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2.5 shadow-xl shadow-emerald-950/20 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* ── Error Banner ─────────────────────────────────────────── */}
      {fetchError && (
        <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center justify-between gap-2.5 shadow-xl shadow-rose-950/20 animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{fetchError}</span>
          </div>
          <button
            onClick={fetchData}
            className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-white text-xs font-bold transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Calendar className="w-4 h-4" />
              </div>
              Interviews &amp; Meeting Requests
            </h1>
            {stats.pending > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                {stats.pending} Pending Review
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Accept recruiter screening calls with automated Google Meet links &amp; calendar invites, propose alternative times, or decline gracefully.
          </p>
        </div>
      </div>

      {/* ── KPI Metric Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-amber-400 mb-1.5">
            <Clock className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Needs Response</span>
          </div>
          <div className="text-xl font-bold text-white">{stats.pending}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Pending requests</div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-emerald-400 mb-1.5">
            <CalendarCheck className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Confirmed</span>
          </div>
          <div className="text-xl font-bold text-white">{stats.accepted}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Interviews scheduled</div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-sky-400 mb-1.5">
            <RotateCcw className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Proposed</span>
          </div>
          <div className="text-xl font-bold text-white">{stats.rescheduled}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Rescheduled times</div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-indigo-400 mb-1.5">
            <Calendar className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Volume</span>
          </div>
          <div className="text-xl font-bold text-white">{stats.total}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Lifetime inquiries</div>
        </div>
      </div>

      {/* ── Filters & Search ─────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-900 border border-slate-800 overflow-x-auto">
          {[
            { id: 'ALL', label: 'All', count: stats.total },
            { id: 'PENDING', label: 'Pending', count: stats.pending },
            { id: 'ACCEPTED', label: 'Confirmed', count: stats.accepted },
            { id: 'RESCHEDULED', label: 'Rescheduled', count: stats.rescheduled },
            { id: 'DECLINED', label: 'Declined', count: stats.declined },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === tab.id ? 'bg-indigo-800 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search company or recruiter..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* ── Main Interview List ──────────────────────────────────── */}
      {isLoading ? (
        <div className="p-12 flex justify-center">
          <Spinner size="lg" />
        </div>
      ) : interviews.length === 0 ? (
        <div className="p-10 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
            <Calendar className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No Interview Requests Found</h3>
            <p className="text-slate-400 text-xs max-w-sm mx-auto">
              {activeTab !== 'ALL'
                ? `No requests currently match the "${activeTab}" filter.`
                : 'Recruiter meeting requests submitted through your public portfolio will appear here.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {interviews.map((item) => {
            const isPending = item.status === 'PENDING';
            const isAccepted = item.status === 'ACCEPTED';
            const isRescheduled = item.status === 'RESCHEDULED';

            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition space-y-3.5 ${
                  isPending
                    ? 'bg-slate-900/90 border-amber-500/30 shadow-lg shadow-amber-950/10'
                    : isAccepted
                    ? 'bg-slate-900/80 border-emerald-500/20'
                    : 'bg-slate-900/70 border-slate-800'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-800/80">
                  <div className="flex items-start sm:items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0">
                      {item.recruiterName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="text-sm font-bold text-white">
                          {item.recruiterName}
                        </h3>
                        {item.recruiterTitle && (
                          <span className="text-[11px] text-slate-400 font-medium">
                            • {item.recruiterTitle}
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 font-semibold text-[11px] border border-slate-700 flex items-center gap-1">
                          <Building className="w-3 h-3 text-slate-400" />
                          {item.company}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                        <a
                          href={`mailto:${item.recruiterEmail}`}
                          className="hover:text-indigo-300 transition flex items-center gap-1"
                        >
                          <Mail className="w-3 h-3" />
                          <span>{item.recruiterEmail}</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(item.status)}
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                      title="Delete Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {/* Slot Details */}
                  <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Proposed Meeting Slot
                    </div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>{formatSlotDate(item.preferredDate)}</span>
                    </div>
                    <div className="text-slate-300 font-medium text-[11px] flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>
                        {item.preferredTime} ({item.timezone}) • {item.durationMinutes}m
                      </span>
                    </div>
                    {item.alternateDate && (
                      <div className="pt-1 border-t border-slate-800 text-[10px] text-amber-400">
                        Backup: {formatSlotDate(item.alternateDate)} at {item.alternateTime}
                      </div>
                    )}
                  </div>

                  {/* Meeting Format */}
                  <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Format &amp; Platform
                    </div>
                    <div className="text-xs font-bold text-indigo-300">
                      {item.interviewType.replace(/_/g, ' ')}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-300 text-[11px]">
                      <Video className="w-3 h-3 text-sky-400" />
                      <span>{item.platformPreference.replace(/_/g, ' ')}</span>
                    </div>
                  </div>

                  {/* Candidate Actions / Confirmed Links */}
                  <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Meeting Link &amp; Status
                    </div>
                    {item.meetingLink ? (
                      <div className="space-y-0.5">
                        <a
                          href={item.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1 truncate"
                        >
                          <Video className="w-3 h-3 shrink-0" />
                          <span className="truncate">{item.meetingLink}</span>
                          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                        </a>
                        <div className="text-[10px] text-slate-400">
                          Recruiter has received calendar invite
                        </div>
                      </div>
                    ) : isRescheduled ? (
                      <div className="text-sky-300 text-xs">
                        Proposed: {item.rescheduledDate && formatSlotDate(item.rescheduledDate)} at{' '}
                        {item.rescheduledTime}
                      </div>
                    ) : (
                      <div className="text-slate-400 text-xs">No meeting URL assigned yet.</div>
                    )}
                  </div>
                </div>

                {/* Recruiter Notes / Agenda */}
                {item.notes && (
                  <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800 text-xs text-slate-300 space-y-0.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Recruiter Opportunity Notes:
                    </div>
                    <p className="italic leading-relaxed text-[11px]">"{item.notes}"</p>
                  </div>
                )}

                {/* Tenant Response Message if any */}
                {item.tenantNotes && !isPending && (
                  <div className="p-2.5 rounded-lg bg-indigo-950/20 border border-indigo-900/30 text-xs text-indigo-300 space-y-0.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                      Your response to Recruiter:
                    </div>
                    <p className="italic text-[11px]">"{item.tenantNotes}"</p>
                  </div>
                )}

                {/* ── Action Buttons Footer ──────────────────────────── */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/60">
                  <div className="text-[10px] text-slate-500">
                    Received on {new Date(item.createdAt).toLocaleString()}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {isPending ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleOpenAccept(item)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1 text-xs px-2.5 py-1 shadow-md shadow-emerald-950/30"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Accept &amp; Send Invite</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleOpenReschedule(item)}
                          className="gap-1 text-amber-300 border-amber-500/30 hover:bg-amber-500/10 text-xs px-2.5 py-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Propose New Time</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenDecline(item)}
                          className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 text-xs px-2.5 py-1"
                        >
                          <span>Decline</span>
                        </Button>
                      </>
                    ) : isAccepted ? (
                      <>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleOpenAccept(item)}
                          className="gap-1 text-xs text-slate-300 px-2.5 py-1"
                        >
                          <Video className="w-3 h-3 text-emerald-400" />
                          <span>Update Link / Note</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenReschedule(item)}
                          className="gap-1 text-xs text-slate-400 px-2.5 py-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reschedule</span>
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleOpenAccept(item)}
                        className="gap-1 text-xs px-2.5 py-1"
                      >
                        <span>Change to Accepted</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── ACCEPT INTERVIEW MODAL ───────────────────────────────── */}
      <Modal
        isOpen={!!acceptModalItem}
        onClose={() => setAcceptModalItem(null)}
        title="Confirm & Accept Interview"
        maxWidth="md"
      >
        {acceptModalItem && (
          <form onSubmit={handleConfirmAccept} className="space-y-5 pt-2">
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 space-y-1">
              <div className="font-bold text-white flex items-center gap-1.5">
                <CalendarCheck className="w-4 h-4 text-emerald-400" />
                <span>
                  {acceptModalItem.interviewType.replace(/_/g, ' ')} with {acceptModalItem.recruiterName} ({acceptModalItem.company})
                </span>
              </div>
              <div>
                📅 {formatSlotDate(acceptModalItem.preferredDate)} at {acceptModalItem.preferredTime} ({acceptModalItem.timezone}) • {acceptModalItem.durationMinutes}m
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Video Meeting URL / Link
                </label>
                <a
                  href="https://meet.google.com/new"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Generate Google Meet</span>
                </a>
              </div>
              <div className="relative">
                <Video className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="url"
                  placeholder="https://meet.google.com/abc-defg-hij or Zoom URL"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                This link will be embedded into the recruiter's email and calendar invitation.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Personal Note / Instructions (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Looking forward to connecting! Please prepare..."
                value={acceptNotes}
                onChange={(e) => setAcceptNotes(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
              <CalendarPlus className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                System will automatically attach an interactive <strong>.ics calendar invite</strong> for Google Calendar &amp; Outlook sync.
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setAcceptModalItem(null)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmittingAccept} className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2">
                <Send className="w-3.5 h-3.5" />
                <span>Confirm &amp; Send Email</span>
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── RESCHEDULE MODAL ─────────────────────────────────────── */}
      <Modal
        isOpen={!!rescheduleModalItem}
        onClose={() => setRescheduleModalItem(null)}
        title="Propose Alternative Interview Slot"
        maxWidth="md"
      >
        {rescheduleModalItem && (
          <form onSubmit={handleConfirmReschedule} className="space-y-5 pt-2">
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 space-y-1">
              <div className="font-bold text-white">
                Originally Requested: {formatSlotDate(rescheduleModalItem.preferredDate)} at{' '}
                {rescheduleModalItem.preferredTime} ({rescheduleModalItem.timezone})
              </div>
              <div className="text-slate-400">
                Recruiter: {rescheduleModalItem.recruiterName} ({rescheduleModalItem.company})
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Proposed New Date
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Proposed Time
                </label>
                <input
                  type="time"
                  required
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Reason / Note to Recruiter
              </label>
              <textarea
                rows={3}
                required
                placeholder="Explain your availability or proposed slot..."
                value={rescheduleNotes}
                onChange={(e) => setRescheduleNotes(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setRescheduleModalItem(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={isSubmittingReschedule}
                className="bg-amber-600 hover:bg-amber-500 text-white gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Send Reschedule Proposal</span>
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── DECLINE MODAL ────────────────────────────────────────── */}
      <Modal
        isOpen={!!declineModalItem}
        onClose={() => setDeclineModalItem(null)}
        title="Decline Interview Request"
        maxWidth="md"
      >
        {declineModalItem && (
          <form onSubmit={handleConfirmDecline} className="space-y-5 pt-2">
            <p className="text-sm text-slate-300 leading-relaxed">
              Are you sure you want to decline the meeting request from{' '}
              <strong className="text-white">{declineModalItem.recruiterName}</strong> ({declineModalItem.company})?
            </p>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Courteous Decline Reason (Included in recruiter email)
              </label>
              <textarea
                rows={3}
                placeholder="Thank you for reaching out, but I am currently not pursuing..."
                value={declineNotes}
                onChange={(e) => setDeclineNotes(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-rose-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setDeclineModalItem(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={isSubmittingDecline}
                className="bg-rose-600 hover:bg-rose-500 text-white gap-2"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Confirm &amp; Notify Recruiter</span>
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
