import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Bell, CheckCheck, Info, CheckCircle2, AlertTriangle, ExternalLink, User, Settings, LogOut, ChevronDown, Shield } from 'lucide-react';

export const NavbarHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res: any = await api.get('/notifications');
      if (res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (e) {
      console.error('Failed to fetch notifications', e);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-indigo-400 shrink-0" />;
    }
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-30 select-none">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-bold text-white tracking-tight">
          Portfolio Control Center
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Notification Bell Center */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition relative"
            title="Notification Center"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center shadow-lg shadow-rose-500/30 animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Drawer */}
          {isOpen && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-[11px] font-semibold text-slate-400 hover:text-indigo-400 transition flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                      className={`p-4 transition cursor-pointer flex items-start gap-3 ${
                        !n.isRead ? 'bg-indigo-950/20 hover:bg-indigo-900/30' : 'hover:bg-slate-800/40'
                      }`}
                    >
                      {getTypeIcon(n.type)}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className={`text-xs font-bold ${!n.isRead ? 'text-white' : 'text-slate-300'}`}>
                            {n.title}
                          </p>
                          <span className="text-[9px] text-slate-500 font-mono">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{n.message}</p>
                        {n.link && (
                          <Link
                            to={n.link}
                            onClick={() => setIsOpen(false)}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-400 hover:underline pt-1"
                          >
                            <span>Open details</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar Dropdown Menu */}
        <div className="relative border-l border-slate-800 pl-4" ref={userMenuRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-800/60 transition group"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500 p-0.5 shadow-md group-hover:scale-105 transition">
              <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-white font-bold text-xs">
                {user?.fullName?.[0] || 'U'}
              </div>
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-white group-hover:text-indigo-400 transition leading-tight">
                {user?.fullName}
              </p>
              <p className="text-[10px] text-slate-400 leading-tight font-mono">
                {user?.subdomain || 'admin'}
              </p>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition transform ${isUserMenuOpen ? 'rotate-180 text-white' : ''}`} />
          </button>

          {/* User Profile Dropdown Menu Drawer */}
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-3 w-64 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-4 border-b border-slate-800/80 bg-slate-950/60">
                <p className="text-xs font-bold text-white truncate">{user?.fullName}</p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{user?.email}</p>
                <span className="inline-block mt-2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
                  {user?.role || 'Admin'}
                </span>
              </div>

              <div className="p-2 space-y-1">
                <Link
                  to="/admin/account"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-indigo-600/10 hover:border-indigo-500/20 transition group"
                >
                  <User className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition" />
                  <div className="flex-1">
                    <p className="font-bold">User Account & Security</p>
                    <p className="text-[10px] text-slate-400 font-normal">Name, Password, 2FA, Email</p>
                  </div>
                </Link>

                <a
                  href={`/p/${user?.subdomain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800/60 transition group"
                >
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition" />
                  <span>View Public Portfolio</span>
                </a>
              </div>

              <div className="p-2 border-t border-slate-800/80">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition"
                >
                  <LogOut className="w-4 h-4" />
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
