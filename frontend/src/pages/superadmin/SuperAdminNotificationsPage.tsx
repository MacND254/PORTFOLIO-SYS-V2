import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/client';
import { NotificationItem, NotificationType, NotificationTargetAudience } from '../../types';
import {
  Bell,
  CheckCheck,
  Trash2,
  RefreshCw,
  Search,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  Clock,
  Send,
  Radio,
  Users,
  Building2,
  User,
  Activity,
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Eye,
  ShieldAlert,
  MessageSquare,
  Star,
  ThumbsUp,
  ThumbsDown,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const TYPE_CONFIG: Record<
  string,
  { icon: React.FC<any>; label: string; color: string; bg: string; border: string }
> = {
  SUCCESS: {
    icon: CheckCircle2,
    label: 'Success',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  INFO: {
    icon: Info,
    label: 'Info',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
  },
  WARNING: {
    icon: AlertTriangle,
    label: 'Warning',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  ALERT: {
    icon: XCircle,
    label: 'Alert',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
  },
  ERROR: {
    icon: XCircle,
    label: 'Error',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
  },
};

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`w-3.5 h-3.5 ${n <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`}
        />
      ))}
    </div>
  );
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  APPROVED: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  REJECTED: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  FEATURED: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
};

export const SuperAdminNotificationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stream' | 'testimonials' | 'broadcast'>('stream');

  // ── Activity Stream State ──────────────────────────────────────
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [actionLoading, setActionLoading] = useState(false);

  // ── Platform Stats ─────────────────────────────────────────────
  const [stats, setStats] = useState<{
    totalNotifications: number;
    unreadSuperAdmin: number;
    totalTenants: number;
    totalCompanies: number;
  }>({ totalNotifications: 0, unreadSuperAdmin: 0, totalTenants: 0, totalCompanies: 0 });

  // ── Testimonials State ─────────────────────────────────────────
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [testimonialsLoading, setTestimonialsLoading] = useState(false);
  const [testimonialsPage, setTestimonialsPage] = useState(1);
  const [testimonialsTotalPages, setTestimonialsTotalPages] = useState(1);
  const [testimonialsTotal, setTestimonialsTotal] = useState(0);
  const [testimonialStatusFilter, setTestimonialStatusFilter] = useState('ALL');
  const [testimonialSearch, setTestimonialSearch] = useState('');
  const [pendingTestimonialsCount, setPendingTestimonialsCount] = useState(0);
  const [moderatingId, setModeratingId] = useState<string | null>(null);

  // ── Broadcast Form State ───────────────────────────────────────
  const [broadcastAudience, setBroadcastAudience] = useState<NotificationTargetAudience>('ALL');
  const [broadcastTargetUserId, setBroadcastTargetUserId] = useState('');
  const [broadcastType, setBroadcastType] = useState<NotificationType>('INFO');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastLink, setBroadcastLink] = useState('');
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState<string | null>(null);
  const [broadcastError, setBroadcastError] = useState<string | null>(null);

  // ── Data Fetchers ──────────────────────────────────────────────

  const fetchStats = useCallback(async () => {
    try {
      const res: any = await api.get('/notifications/superadmin/stats');
      if (res.data) setStats(res.data);
    } catch { /* silent */ }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/notifications', {
        params: {
          page,
          limit: 15,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          category: 'SYSTEM',
          type: typeFilter !== 'ALL' ? typeFilter : undefined,
          search: search.trim() || undefined,
        },
      });
      if (res.data) {
        setNotifications(res.data.notifications || []);
        setTotal(res.data.pagination?.total ?? res.data.total ?? 0);
        setTotalPages(res.data.pagination?.totalPages ?? res.data.totalPages ?? 1);
        setUnreadCount(res.data.unreadCount ?? 0);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [page, statusFilter, typeFilter, search]);

  const fetchTestimonials = useCallback(async () => {
    setTestimonialsLoading(true);
    try {
      const res: any = await api.get('/testimonials/manage', {
        params: {
          page: testimonialsPage,
          limit: 10,
          status: testimonialStatusFilter !== 'ALL' ? testimonialStatusFilter : undefined,
          search: testimonialSearch.trim() || undefined,
        },
      });
      if (res.data) {
        setTestimonials(res.data.testimonials || []);
        setTestimonialsTotal(res.data.pagination?.total ?? 0);
        setTestimonialsTotalPages(res.data.pagination?.totalPages ?? 1);
        setPendingTestimonialsCount(res.data.pendingCount ?? 0);
      }
    } catch { /* silent */ } finally {
      setTestimonialsLoading(false);
    }
  }, [testimonialsPage, testimonialStatusFilter, testimonialSearch]);

  useEffect(() => {
    fetchStats();
    fetchNotifications();
  }, [fetchStats, fetchNotifications]);

  useEffect(() => {
    if (activeTab === 'testimonials') fetchTestimonials();
  }, [activeTab, fetchTestimonials]);

  // ── Notification Actions ──────────────────────────────────────

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      window.dispatchEvent(new CustomEvent('notifications-updated'));
    } catch { /* silent */ }
  };

  const handleMarkAllRead = async () => {
    setActionLoading(true);
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
      setUnreadCount(0);
      window.dispatchEvent(new CustomEvent('notifications-updated'));
      // Re-fetch from server to get accurate server-side unreadCount
      await fetchNotifications();
    } catch { /* silent */ } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setTotal((t) => Math.max(0, t - 1));
      window.dispatchEvent(new CustomEvent('notifications-updated'));
    } catch { /* silent */ }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Clear all system activity notifications?')) return;
    setActionLoading(true);
    try {
      await api.delete('/notifications/clear/all');
      setNotifications([]);
      setTotal(0);
      setUnreadCount(0);
      window.dispatchEvent(new CustomEvent('notifications-updated'));
    } catch { /* silent */ } finally {
      setActionLoading(false);
    }
  };

  // ── Testimonial Actions ───────────────────────────────────────

  const handleModerate = async (id: string, action: 'APPROVE' | 'REJECT' | 'FEATURE' | 'DELETE') => {
    setModeratingId(id);
    try {
      if (action === 'DELETE') {
        if (!window.confirm('Delete this testimonial? This cannot be undone.')) return;
        await api.delete(`/testimonials/${id}`);
      } else {
        await api.patch(`/testimonials/${id}`, { action });
      }
      fetchTestimonials();
      fetchStats();
    } catch (e: any) {
      console.error('Moderation failed:', e.message);
    } finally {
      setModeratingId(null);
    }
  };

  // ── Broadcast ─────────────────────────────────────────────────

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      setBroadcastError('Title and message body are required.');
      return;
    }
    if (broadcastAudience === 'SPECIFIC' && !broadcastTargetUserId.trim()) {
      setBroadcastError('Please provide a target User ID.');
      return;
    }
    setBroadcastSending(true);
    setBroadcastError(null);
    setBroadcastSuccess(null);
    try {
      const res: any = await api.post('/notifications/broadcast', {
        targetAudience: broadcastAudience,
        targetUserId: broadcastAudience === 'SPECIFIC' ? broadcastTargetUserId.trim() : undefined,
        type: broadcastType,
        title: broadcastTitle.trim(),
        message: broadcastMessage.trim(),
        link: broadcastLink.trim() || undefined,
      });
      setBroadcastSuccess(`Broadcast sent to ${res.data?.count || 0} recipient(s).`);
      setBroadcastTitle('');
      setBroadcastMessage('');
      setBroadcastLink('');
      setBroadcastTargetUserId('');
      fetchStats();
    } catch (err: any) {
      setBroadcastError(err.message || 'Failed to send broadcast');
    } finally {
      setBroadcastSending(false);
    }
  };

  const previewConfig = TYPE_CONFIG[broadcastType] || TYPE_CONFIG.INFO;
  const PreviewIcon = previewConfig.icon;

  return (
    <div className="space-y-4 animate-fade-in text-white pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-indigo-300">
              Platform Command Center
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Monitor system events, review platform testimonials, and broadcast announcements.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-900/60 p-1.5 rounded-xl border border-white/10 self-start md:self-auto backdrop-blur-md">
          {[
            { id: 'stream', label: 'System Stream', icon: Activity, badge: unreadCount },
            { id: 'testimonials', label: 'Testimonials', icon: MessageSquare, badge: pendingTestimonialsCount },
            { id: 'broadcast', label: 'Broadcast', icon: Send, badge: 0 },
          ].map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
              {badge > 0 && (
                <span className="px-1.5 py-0.5 text-[9px] font-extrabold rounded-full bg-rose-500 text-white">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Unread System Alerts', value: stats.unreadSuperAdmin, icon: Bell, color: 'rose', sub: 'Awaiting review' },
          { label: 'Registered Tenants', value: stats.totalTenants, icon: Users, color: 'indigo', sub: 'Active portfolio creators' },
          { label: 'Company Partners', value: stats.totalCompanies, icon: Building2, color: 'purple', sub: 'Hiring reps onboarded' },
          { label: 'Pending Testimonials', value: pendingTestimonialsCount, icon: Star, color: 'amber', sub: 'Awaiting your approval' },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className={`bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-xl p-3.5 hover:border-${color}-500/30 transition-all`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</span>
              <div className={`p-1.5 rounded-lg bg-${color}-500/10 text-${color}-400 border border-${color}-500/20`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl font-bold mt-1.5 text-white">{value}</div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">{sub}</span>
          </div>
        ))}
      </div>

      {/* ── SYSTEM STREAM TAB ───────────────────────────────────────── */}
      {activeTab === 'stream' && (
        <div className="space-y-5">
          {/* Controls */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative flex-1 min-w-[220px] max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search system events..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800/60 border border-white/10 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500/60 transition-colors"
                />
              </div>
              <div className="flex items-center bg-slate-800/60 border border-white/10 rounded-xl p-1 text-xs">
                {(['all', 'unread', 'read'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => { setStatusFilter(mode); setPage(1); }}
                    className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-all ${statusFilter === mode ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              <select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                className="bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Types</option>
                <option value="INFO">Info</option>
                <option value="SUCCESS">Success</option>
                <option value="WARNING">Warning</option>
                <option value="ALERT">Alert</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={fetchNotifications} title="Refresh" className="p-2 bg-slate-800/60 hover:bg-slate-700/60 border border-white/10 rounded-xl text-slate-300 hover:text-white transition-colors">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} disabled={actionLoading} className="flex items-center gap-2 px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-xl text-xs font-medium text-indigo-300 transition-colors">
                  <CheckCheck className="w-4 h-4" /> Mark All Read
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={handleClearAll} disabled={actionLoading} className="flex items-center gap-2 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl text-xs font-medium text-rose-400 transition-colors">
                  <Trash2 className="w-4 h-4" /> Clear
                </button>
              )}
            </div>
          </div>

          {/* Stream List */}
          <div className="space-y-3">
            {loading ? (
              <div className="p-12 text-center bg-slate-900/40 border border-white/5 rounded-2xl">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-400 mb-3" />
                <p className="text-sm text-slate-400">Loading system events...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/40 border border-white/5 rounded-2xl">
                <ShieldAlert className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                <h3 className="text-lg font-semibold text-slate-300">No system events found</h3>
                <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                  {search || statusFilter !== 'all' || typeFilter !== 'ALL'
                    ? 'No events match your current filters.'
                    : 'Platform is running smoothly. Registration alerts, portfolio publications, company sign-ups and testimonial submissions will appear here.'}
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const conf = TYPE_CONFIG[n.type] || TYPE_CONFIG.INFO;
                const Icon = conf.icon;
                return (
                  <div key={n.id} className={`group relative overflow-hidden rounded-2xl border transition-all duration-200 p-5 ${n.isRead ? 'bg-slate-900/30 border-white/5 hover:border-white/10' : 'bg-slate-900/70 border-indigo-500/30 shadow-lg shadow-indigo-950/20'}`}>
                    {!n.isRead && <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-600" />}
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl border shrink-0 ${conf.bg} ${conf.border} ${conf.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${conf.bg} ${conf.border} ${conf.color}`}>{conf.label}</span>
                          {!n.isRead && (
                            <span className="flex items-center gap-1 text-[11px] font-medium text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />New
                            </span>
                          )}
                          <span className="text-xs text-slate-400 flex items-center gap-1 ml-auto">
                            <Clock className="w-3.5 h-3.5" />{formatTimeAgo(n.createdAt)}
                          </span>
                        </div>
                        <h4 className={`text-base font-semibold leading-snug ${n.isRead ? 'text-slate-300' : 'text-white'}`}>{n.title}</h4>
                        <p className="text-sm text-slate-400 mt-1 leading-relaxed">{n.message}</p>
                        {n.link && (
                          <Link to={n.link} className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-lg transition-colors">
                            View Resource <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!n.isRead && (
                          <button onClick={() => handleMarkAsRead(n.id)} title="Mark read" className="p-2 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all">
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => handleDelete(n.id)} title="Delete" className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <span className="text-xs text-slate-400">Showing {notifications.length} of {total} events</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-xl bg-slate-800/60 border border-white/10 text-slate-300 hover:text-white disabled:opacity-40 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-slate-300 px-2">Page {page} of {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-xl bg-slate-800/60 border border-white/10 text-slate-300 hover:text-white disabled:opacity-40 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TESTIMONIALS TAB ───────────────────────────────────────── */}
      {activeTab === 'testimonials' && (
        <div className="space-y-5">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search testimonials..."
                  value={testimonialSearch}
                  onChange={(e) => { setTestimonialSearch(e.target.value); setTestimonialsPage(1); }}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800/60 border border-white/10 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500/60"
                />
              </div>
              <div className="flex items-center bg-slate-800/60 border border-white/10 rounded-xl p-1 text-xs">
                {['ALL', 'PENDING', 'APPROVED', 'FEATURED', 'REJECTED'].map((s) => (
                  <button
                    key={s}
                    onClick={() => { setTestimonialStatusFilter(s); setTestimonialsPage(1); }}
                    className={`px-2.5 py-1.5 rounded-lg capitalize font-medium transition-all ${testimonialStatusFilter === s ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    {s.charAt(0) + s.slice(1).toLowerCase()}
                    {s === 'PENDING' && pendingTestimonialsCount > 0 && (
                      <span className="ml-1 px-1 text-[8px] rounded-full bg-rose-500 text-white">{pendingTestimonialsCount}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={fetchTestimonials} className="p-2 bg-slate-800/60 border border-white/10 rounded-xl text-slate-300 hover:text-white">
              <RefreshCw className={`w-4 h-4 ${testimonialsLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="space-y-4">
            {testimonialsLoading ? (
              <div className="p-12 text-center bg-slate-900/40 border border-white/5 rounded-2xl">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-400 mb-3" />
                <p className="text-sm text-slate-400">Loading testimonials...</p>
              </div>
            ) : testimonials.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/40 border border-white/5 rounded-2xl">
                <Star className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                <h3 className="text-lg font-semibold text-slate-300">No testimonials yet</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Platform testimonials submitted via the landing page will appear here for review.
                </p>
              </div>
            ) : (
              testimonials.map((t) => (
                <div key={t.id} className="bg-slate-900/50 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                      {t.submitterPhotoUrl ? (
                        <img src={t.submitterPhotoUrl} alt="" className="w-full h-full rounded-xl object-cover" />
                      ) : (
                        t.submitterName.charAt(0)
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-white">{t.submitterName}</span>
                        {t.submitterRole && <span className="text-xs text-slate-400">{t.submitterRole}</span>}
                        {t.submitterCompany && (
                          <span className="text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
                            {t.submitterCompany}
                          </span>
                        )}
                        <span className={`ml-auto text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md border ${STATUS_COLOR[t.status] || ''}`}>
                          {t.status}
                        </span>
                      </div>
                      <StarRating rating={t.rating} />
                      <p className="text-sm text-slate-300 mt-2 leading-relaxed">{t.content}</p>
                      <p className="text-[10px] text-slate-500 mt-2">{formatTimeAgo(t.createdAt)}</p>
                    </div>
                  </div>

                  {/* Moderation Actions */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
                    {t.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleModerate(t.id, 'APPROVE')}
                          disabled={moderatingId === t.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleModerate(t.id, 'REJECT')}
                          disabled={moderatingId === t.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-colors"
                        >
                          <ThumbsDown className="w-3.5 h-3.5" /> Reject
                        </button>
                      </>
                    )}
                    {(t.status === 'APPROVED' || t.status === 'REJECTED') && (
                      <button
                        onClick={() => handleModerate(t.id, 'FEATURE')}
                        disabled={moderatingId === t.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 transition-colors"
                      >
                        <Zap className="w-3.5 h-3.5" /> Feature
                      </button>
                    )}
                    <button
                      onClick={() => handleModerate(t.id, 'DELETE')}
                      disabled={moderatingId === t.id}
                      className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/60 border border-white/10 text-slate-400 hover:text-rose-400 hover:border-rose-500/20 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {testimonialsTotalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <span className="text-xs text-slate-400">Showing {testimonials.length} of {testimonialsTotal}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setTestimonialsPage((p) => Math.max(1, p - 1))} disabled={testimonialsPage === 1} className="p-2 rounded-xl bg-slate-800/60 border border-white/10 text-slate-300 disabled:opacity-40">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-slate-300 px-2">Page {testimonialsPage} of {testimonialsTotalPages}</span>
                <button onClick={() => setTestimonialsPage((p) => Math.min(testimonialsTotalPages, p + 1))} disabled={testimonialsPage === testimonialsTotalPages} className="p-2 rounded-xl bg-slate-800/60 border border-white/10 text-slate-300 disabled:opacity-40">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── BROADCAST TAB ─────────────────────────────────────────── */}
      {activeTab === 'broadcast' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                Compose Platform Broadcast
              </h2>
              <p className="text-sm text-slate-400 mt-1">Send official announcements to users platform-wide.</p>
            </div>

            {broadcastSuccess && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0" />{broadcastSuccess}
              </div>
            )}
            {broadcastError && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-3">
                <XCircle className="w-5 h-5 shrink-0" />{broadcastError}
              </div>
            )}

            <form onSubmit={handleSendBroadcast} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">Target Audience</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'ALL', label: 'All Users', icon: Layers, desc: 'Everyone' },
                    { id: 'TENANTS', label: 'Tenants', icon: Users, desc: 'Portfolio creators' },
                    { id: 'COMPANIES', label: 'Companies', icon: Building2, desc: 'Hiring partners' },
                    { id: 'SPECIFIC', label: 'Specific', icon: User, desc: 'Single user' },
                  ].map((aud) => {
                    const AudIcon = aud.icon;
                    const isSelected = broadcastAudience === aud.id;
                    return (
                      <button type="button" key={aud.id} onClick={() => setBroadcastAudience(aud.id as NotificationTargetAudience)}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${isSelected ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-slate-800/40 border-white/5 text-slate-400 hover:border-white/10'}`}>
                        <AudIcon className={`w-4 h-4 mb-2 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                        <div>
                          <div className="text-xs font-semibold text-white">{aud.label}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{aud.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {broadcastAudience === 'SPECIFIC' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Target User ID or Email</label>
                  <input type="text" required placeholder="User UUID or email address"
                    value={broadcastTargetUserId} onChange={(e) => setBroadcastTargetUserId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-800/60 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60" />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">Notification Type</label>
                <div className="flex flex-wrap gap-2">
                  {(['INFO', 'SUCCESS', 'WARNING', 'ALERT'] as const).map((type) => {
                    const conf = TYPE_CONFIG[type];
                    const isSelected = broadcastType === type;
                    return (
                      <button type="button" key={type} onClick={() => setBroadcastType(type)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-medium border flex items-center gap-2 transition-all ${isSelected ? `${conf.bg} ${conf.border} ${conf.color} ring-1 ring-white/20` : 'bg-slate-800/40 border-white/5 text-slate-400 hover:border-white/10'}`}>
                        <span className={`w-2 h-2 rounded-full ${type === 'INFO' ? 'bg-indigo-400' : type === 'SUCCESS' ? 'bg-emerald-400' : type === 'WARNING' ? 'bg-amber-400' : 'bg-rose-400'}`} />
                        {conf.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Title</label>
                <input type="text" required placeholder="Announcement title..." value={broadcastTitle} onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800/60 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60" />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Message</label>
                <textarea required rows={4} placeholder="Message content..." value={broadcastMessage} onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800/60 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60" />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Action Link <span className="text-slate-500 normal-case">(optional)</span></label>
                <input type="text" placeholder="/admin/notifications or /showcase" value={broadcastLink} onChange={(e) => setBroadcastLink(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800/60 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60" />
              </div>

              <button type="submit" disabled={broadcastSending || !broadcastTitle.trim() || !broadcastMessage.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50">
                {broadcastSending ? <><RefreshCw className="w-5 h-5 animate-spin" /> Dispatching...</> : <><Send className="w-5 h-5" /> Dispatch Broadcast</>}
              </button>
            </form>
          </div>

          {/* Live Preview */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2 mb-4">
                <Eye className="w-4 h-4 text-indigo-400" /> Live Preview
              </h3>
              <div className="bg-slate-950/80 border border-indigo-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-600" />
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl border shrink-0 ${previewConfig.bg} ${previewConfig.border} ${previewConfig.color}`}>
                    <PreviewIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white">{broadcastTitle.trim() || 'Announcement Title'}</h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{broadcastMessage.trim() || 'Your message content appears here.'}</p>
                    {broadcastLink && <span className="mt-2 inline-flex items-center gap-1 text-xs text-indigo-400">{broadcastLink} <ExternalLink className="w-3 h-3" /></span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
