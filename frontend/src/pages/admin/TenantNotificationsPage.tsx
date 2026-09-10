import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/client';
import { NotificationItem, NotificationType } from '../../types';
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
  Filter,
  Inbox,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Eye,
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
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export const TenantNotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/notifications', {
        params: {
          page,
          limit: 15,
          status: activeFilter !== 'all' ? activeFilter : undefined,
          type: typeFilter !== 'ALL' ? typeFilter : undefined,
          category: 'PORTFOLIO',
          search: search.trim() || undefined,
        },
      });

      const data = res.data?.data || res.data;
      const list: NotificationItem[] = Array.isArray(data?.notifications)
        ? data.notifications
        : [];
      setNotifications(list);
      setTotal(data?.pagination?.total ?? data?.total ?? list.length);
      setUnreadCount(data?.unreadCount ?? 0);
      setTotalPages(data?.pagination?.totalPages ?? data?.totalPages ?? 1);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [page, activeFilter, typeFilter, search]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      window.dispatchEvent(new CustomEvent('notifications-updated'));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    setActionLoading(true);
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      window.dispatchEvent(new CustomEvent('notifications-updated'));
      // Re-sync from server for accurate count
      await fetchNotifications();
    } catch (err) {
      console.error('Failed to mark all read:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
      window.dispatchEvent(new CustomEvent('notifications-updated'));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const handleClearRead = async () => {
    if (!window.confirm('Clear all read notifications?')) return;
    setActionLoading(true);
    try {
      await api.delete('/notifications/clear/all?onlyRead=true');
      window.dispatchEvent(new CustomEvent('notifications-updated'));
      fetchNotifications();
    } catch (err) {
      console.error('Failed to clear read notifications:', err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-6xl mx-auto pb-10">
      {/* Header Banner */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-purple-950/60 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-semibold">
            <Bell className="w-3 h-3" />
            <span>Activity Center</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Tenant Notifications &amp; Alerts
          </h1>
          <p className="text-slate-300 text-xs max-w-2xl leading-relaxed">
            Stay updated with interview schedules, client endorsements, recruiter messages, and system announcements.
          </p>
        </div>

        {/* Quick Summary Cards */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-center shadow-md">
            <p className="text-lg font-bold text-white">{unreadCount}</p>
            <p className="text-[9px] uppercase font-bold tracking-wider text-indigo-400">Unread</p>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-center shadow-md">
            <p className="text-lg font-bold text-slate-300">{total}</p>
            <p className="text-[9px] uppercase font-bold tracking-wider text-slate-500">Total</p>
          </div>
        </div>
      </div>

      {/* Action Controls & Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl shadow-lg">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchNotifications()}
            placeholder="Search notifications..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => { setActiveFilter('all'); setPage(1); }}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
              activeFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => { setActiveFilter('unread'); setPage(1); }}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === 'unread'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            <span>Unread</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-rose-500 text-white font-bold">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => { setActiveFilter('read'); setPage(1); }}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
              activeFilter === 'read'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            Read
          </button>

          {/* Type dropdown */}
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-indigo-500 transition"
          >
            <option value="ALL">All Types</option>
            <option value="SUCCESS">Success</option>
            <option value="INFO">Info</option>
            <option value="WARNING">Warnings</option>
            <option value="ALERT">Alerts</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={actionLoading}
              className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 font-semibold text-xs transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
          )}

          <button
            onClick={handleClearRead}
            disabled={actionLoading}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition"
            title="Clear read notifications"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={fetchNotifications}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            title="Refresh notifications"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-2.5">
        {loading ? (
          <div className="p-10 text-center bg-slate-900/60 border border-slate-800 rounded-xl space-y-2.5">
            <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading your notification feed...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-xl space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto shadow-inner">
              <Inbox className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-bold text-white">No notifications found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {search || activeFilter !== 'all' || typeFilter !== 'ALL'
                ? 'No notifications match your current filter criteria. Try resetting filters.'
                : "You're all caught up! When you receive interview requests, client reviews, or system updates, they'll appear here."}
            </p>
          </div>
        ) : (
          notifications.map((n) => {
            const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.INFO;
            const Icon = config.icon;

            return (
              <div
                key={n.id}
                className={`p-3 sm:p-3.5 rounded-xl border transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group ${
                  !n.isRead
                    ? 'bg-slate-900 border-indigo-500/30 shadow-md shadow-indigo-500/5'
                    : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  {/* Icon */}
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${config.bg} ${config.border} ${config.color} shadow-sm`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>

                  {/* Content */}
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4
                        className={`text-xs font-bold tracking-tight ${
                          !n.isRead ? 'text-white' : 'text-slate-300'
                        }`}
                      >
                        {n.title}
                      </h4>
                      {!n.isRead && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse shrink-0" />
                      )}
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider border ${config.bg} ${config.border} ${config.color}`}
                      >
                        {config.label}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
                      {n.message}
                    </p>

                    <div className="flex items-center gap-3 pt-0.5 text-[10px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(n.createdAt)}
                      </span>

                      {n.link && (
                        <Link
                          to={n.link}
                          onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                          className="inline-flex items-center gap-1 font-semibold text-indigo-400 hover:text-indigo-300 transition"
                        >
                          <span>Open related item</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  {!n.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(n.id)}
                      className="px-2 py-1 text-xs rounded-lg font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1"
                      title="Mark as read"
                    >
                      <Eye className="w-3 h-3 text-indigo-400" />
                      <span>Mark Read</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(n.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    title="Delete notification"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
          <span className="text-xs text-slate-400">
            Page <strong className="text-white">{page}</strong> of <strong className="text-white">{totalPages}</strong>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
