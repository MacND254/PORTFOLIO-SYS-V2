import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/client';
import {
  Bell, RefreshCw, AlertCircle, CheckCheck, Info, CheckCircle2,
  AlertTriangle, XCircle, ChevronRight, ArrowLeft, Clock,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'SUCCESS' | 'INFO' | 'WARNING' | 'ERROR';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

const TYPE_CONFIG: Record<string, { icon: React.FC<any>; color: string; bg: string; border: string }> = {
  SUCCESS: {
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  INFO: {
    icon: Info,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
  },
  WARNING: {
    icon: AlertTriangle,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  ERROR: {
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
  },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function CompanyNotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res: any = await api.get('/notifications');
      const data = res.data?.data || res.data;
      setNotifications(Array.isArray(data?.notifications) ? data.notifications : []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
      window.dispatchEvent(new CustomEvent('notifications-updated'));
    } catch {
      // silent
    }
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      window.dispatchEvent(new CustomEvent('notifications-updated'));
    } catch {
      // silent
    } finally {
      setMarkingAll(false);
    }
  };

  const handleNotificationClick = async (n: Notification) => {
    if (!n.isRead) await markAsRead(n.id);
    if (n.link) navigate(n.link);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/company/dashboard"
          className="p-1.5 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 rounded-lg transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              <Bell className="w-3 h-3" />
              Notifications
            </span>
            {unreadCount > 0 && (
              <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                {unreadCount} unread
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Notification Centre
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Activity updates, alerts, and platform messages.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchNotifications}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 rounded-lg transition"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              disabled={markingAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-300 border border-indigo-500/30 hover:border-indigo-500/60 hover:text-indigo-200 rounded-lg transition"
            >
              {markingAll ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <CheckCheck className="w-3 h-3" />
              )}
              Mark all read
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-2.5 text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
          <button onClick={fetchNotifications} className="ml-auto text-xs underline hover:text-red-300">
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="w-12 h-12 rounded-xl bg-slate-800/80 flex items-center justify-center mx-auto mb-3">
            <Bell className="w-6 h-6 text-slate-600" />
          </div>
          <h3 className="text-white font-bold text-sm">All caught up!</h3>
          <p className="text-slate-500 text-xs mt-0.5 max-w-xs mx-auto">
            No notifications yet. Activity related to your account will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => {
            const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.INFO;
            const IconComp = cfg.icon;
            return (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`relative flex items-start gap-3 p-3 sm:p-3.5 rounded-xl border transition cursor-pointer group ${
                  n.isRead
                    ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-900 border-slate-700 hover:border-indigo-500/40 shadow-md'
                }`}
              >
                {/* Unread indicator */}
                {!n.isRead && (
                  <span className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50" />
                )}

                {/* Type icon */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg} border ${cfg.border}`}>
                  <IconComp className={`w-4 h-4 ${cfg.color}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-xs font-bold ${n.isRead ? 'text-slate-300' : 'text-white'}`}>
                      {n.title}
                    </p>
                    <span className="flex items-center gap-1 text-[10px] text-slate-500 shrink-0">
                      <Clock className="w-3 h-3" />
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs mt-0.5 leading-relaxed line-clamp-2">
                    {n.message}
                  </p>
                  {n.link && (
                    <div className="mt-1.5 flex items-center gap-1 text-[11px] text-indigo-400 group-hover:text-indigo-300 transition">
                      <span>View details</span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <p className="text-center text-xs text-slate-600 pt-2">
            Showing last {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
