import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SubdomainUrlBadge } from '../admin/SubdomainUrlBadge';
import api from '../../api/client';
import {
  ShieldCheck, Bell, Menu, User, ExternalLink, LogOut, ChevronDown,
  Building2, Briefcase, CheckCheck, Info, CheckCircle2, AlertTriangle,
  XCircle, ArrowRight, Settings, UserCog,
} from 'lucide-react';

interface NavbarProps {
  subdomain?: string;
  onToggleSidebar?: () => void;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

const NOTIF_ICONS: Record<string, React.FC<any>> = {
  SUCCESS: CheckCircle2,
  INFO: Info,
  WARNING: AlertTriangle,
  ERROR: XCircle,
};
const NOTIF_COLORS: Record<string, string> = {
  SUCCESS: 'text-emerald-400',
  INFO: 'text-indigo-400',
  WARNING: 'text-amber-400',
  ERROR: 'text-red-400',
};

export const Navbar: React.FC<NavbarProps> = ({ subdomain = 'francis', onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [markingAll, setMarkingAll] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const isCompany = user?.role === 'COMPANY';

  const fetchNotifications = useCallback(async () => {
    try {
      const res: any = await api.get('/notifications');
      const data = res.data?.data || res.data;
      const list: Notification[] = Array.isArray(data?.notifications) ? data.notifications : [];
      setNotifications(list.slice(0, 6));
      if (typeof data?.unreadCount === 'number') {
        setUnreadCount(data.unreadCount);
      } else {
        setUnreadCount(list.filter(n => !n.isRead).length);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    if (user) fetchNotifications();
    const interval = setInterval(() => { if (user) fetchNotifications(); }, 15000);
    const handleNotifUpdated = () => { if (user) fetchNotifications(); };
    window.addEventListener('notifications-updated', handleNotifUpdated);
    return () => {
      clearInterval(interval);
      window.removeEventListener('notifications-updated', handleNotifUpdated);
    };
  }, [user, fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      window.dispatchEvent(new CustomEvent('notifications-updated'));
    } catch {
      // silent
    } finally {
      setMarkingAll(false);
    }
  };

  const handleNotifClick = async (n: Notification) => {
    if (!n.isRead) {
      try {
        await api.put(`/notifications/${n.id}/read`);
        setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true } : x));
        setUnreadCount(prev => Math.max(0, prev - 1));
        window.dispatchEvent(new CustomEvent('notifications-updated'));
      } catch { /* silent */ }
    }
    setIsNotifOpen(false);
    if (n.link) navigate(n.link);
  };

  const userSubdomain = user?.subdomain || subdomain;

  return (
    <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-3 sm:px-5 py-2 flex items-center justify-between sticky top-0 z-30 select-none">
      <div className="flex items-center gap-2.5">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-200 hover:text-white transition"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}
        {isCompany ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-700/60 text-[11px] text-slate-200">
            <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="font-semibold text-white">Employer Portal</span>
          </div>
        ) : (
          <SubdomainUrlBadge subdomain={userSubdomain} />
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
          isCompany
            ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
        }`}>
          <ShieldCheck className="w-3 h-3" />
          <span>{isCompany ? 'Verified Partner' : 'Tenant Isolated'}</span>
        </div>

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setIsNotifOpen(!isNotifOpen); setIsUserMenuOpen(false); }}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-3.5 rounded-full bg-rose-500 text-white text-[8px] font-black flex items-center justify-center px-1 shadow-sm">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2.5 w-80 sm:w-88 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Header */}
              <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-800 bg-slate-950/60">
                <div className="flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-xs font-bold text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/20">
                      {unreadCount}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    disabled={markingAll}
                    className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 transition"
                  >
                    <CheckCheck className="w-3 h-3" />
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notifications list */}
              <div className="divide-y divide-slate-800/60 max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs">
                    <Bell className="w-5 h-5 mx-auto mb-1.5 text-slate-700" />
                    No notifications yet
                  </div>
                ) : (
                  notifications.map(n => {
                    const Icon = NOTIF_ICONS[n.type] || Info;
                    const color = NOTIF_COLORS[n.type] || 'text-indigo-400';
                    return (
                      <div
                        key={n.id}
                        onClick={() => handleNotifClick(n)}
                        className={`flex items-start gap-2.5 px-3.5 py-2.5 cursor-pointer hover:bg-slate-800/50 transition ${
                          !n.isRead ? 'bg-slate-800/30' : ''
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${color}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-[11px] font-semibold truncate ${n.isRead ? 'text-slate-300' : 'text-white'}`}>
                            {n.title}
                          </p>
                          <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{n.message}</p>
                        </div>
                        {!n.isRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-slate-800 bg-slate-950/60">
                <Link
                  to={
                    isCompany
                      ? '/company/notifications'
                      : user?.role === 'SUPER_ADMIN'
                      ? '/superadmin/notifications'
                      : '/admin/notifications'
                  }
                  onClick={() => setIsNotifOpen(false)}
                  className="flex items-center justify-center gap-1.5 py-2.5 text-xs text-indigo-400 hover:text-indigo-300 transition font-semibold"
                >
                  View all notifications
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Top-Right Interactive User Avatar Dropdown Menu */}
        <div className="relative border-l border-slate-800 pl-2.5 sm:pl-3" ref={userMenuRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-800/60 transition group cursor-pointer"
            title="User Profile & Settings"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500 p-0.5 shadow-md group-hover:scale-105 transition">
              <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-white font-bold text-[11px]">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
            </div>
            <div className="text-left hidden md:block">
              <p className="text-[11px] font-bold text-white group-hover:text-indigo-400 transition leading-tight">
                {user?.fullName}
              </p>
              <p className="text-[9px] text-slate-400 leading-tight font-mono">
                {isCompany ? 'Corporate Partner' : userSubdomain}
              </p>
            </div>
            <ChevronDown
              className={`w-3 h-3 text-slate-400 transition transform ${
                isUserMenuOpen ? 'rotate-180 text-white' : ''
              }`}
            />
          </button>

          {/* Avatar Dropdown Drawer */}
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2.5 w-60 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-3 border-b border-slate-800/80 bg-slate-950/60">
                <p className="text-xs font-bold text-white truncate">{user?.fullName}</p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">{user?.email}</p>
                <span className="inline-block mt-1.5 text-[8px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
                  {user?.role === 'COMPANY' ? 'Company Partner' : user?.role || 'Admin'}
                </span>
              </div>

              <div className="p-1.5 space-y-0.5">
                {isCompany ? (
                  <>
                    <Link
                      to="/company/dashboard"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:text-white hover:bg-indigo-600/10 transition group"
                    >
                      <Building2 className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-105 transition" />
                      <div className="flex-1">
                        <p className="font-bold text-[11px]">Partner Dashboard</p>
                        <p className="text-[9px] text-slate-400 font-normal">Hiring overview &amp; stats</p>
                      </div>
                    </Link>
                    <Link
                      to="/company/jobs"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:text-white hover:bg-indigo-600/10 transition group"
                    >
                      <Briefcase className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-105 transition" />
                      <div className="flex-1">
                        <p className="font-bold text-[11px]">Job Postings</p>
                        <p className="text-[9px] text-slate-400 font-normal">Manage openings</p>
                      </div>
                    </Link>
                    <Link
                      to="/company/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:text-white hover:bg-indigo-600/10 transition group"
                    >
                      <UserCog className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-105 transition" />
                      <div className="flex-1">
                        <p className="font-bold text-[11px]">Company Profile</p>
                        <p className="text-[9px] text-slate-400 font-normal">Organisation details</p>
                      </div>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/admin/account"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:text-white hover:bg-indigo-600/10 transition group"
                    >
                      <User className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-105 transition" />
                      <div className="flex-1">
                        <p className="font-bold text-[11px]">User Account & Security</p>
                        <p className="text-[9px] text-slate-400 font-normal">Name, Password, 2FA</p>
                      </div>
                    </Link>

                    <a
                      href={`/p/${userSubdomain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800/60 transition group"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-400 transition" />
                      <span className="text-[11px]">View Public Portfolio</span>
                    </a>
                  </>
                )}
              </div>

              <div className="p-1.5 border-t border-slate-800/80">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
