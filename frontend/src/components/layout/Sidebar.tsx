import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import {
  LayoutDashboard,
  FileUp,
  Palette,
  UserCheck,
  Star,
  MessageSquare,
  BarChart3,
  Users,
  Activity,
  ShieldAlert,
  LogOut,
  Sparkles,
  Sliders,
  X,
  Calendar,
  Building2,
  Briefcase,
  Bell,
  UserCog,
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { user, logout } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isCompany = user?.role === 'COMPANY';
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(0);
  const [unreadSystemNotifCount, setUnreadSystemNotifCount] = useState<number>(0);
  const [unreadPortfolioNotifCount, setUnreadPortfolioNotifCount] = useState<number>(0);
  const [pendingInterviewsCount, setPendingInterviewsCount] = useState<number>(0);

  useEffect(() => {
    if (user && !isCompany) {
      fetchCounts();
      const interval = setInterval(fetchCounts, 15000);
      return () => clearInterval(interval);
    }
    if (user && isCompany) {
      fetchCompanyNotifCount();
      const interval = setInterval(fetchCompanyNotifCount, 15000);
      return () => clearInterval(interval);
    }
  }, [user, isCompany]);

  useEffect(() => {
    const handleMessagesSeen = () => setUnreadCount(0);
    window.addEventListener('messages-seen', handleMessagesSeen);
    return () => window.removeEventListener('messages-seen', handleMessagesSeen);
  }, []);

  useEffect(() => {
    const handleNotifUpdated = () => {
      if (isCompany) fetchCompanyNotifCount();
      else fetchCounts();
    };
    window.addEventListener('notifications-updated', handleNotifUpdated);
    return () => window.removeEventListener('notifications-updated', handleNotifUpdated);
  }, [isCompany]);

  const fetchCompanyNotifCount = async () => {
    try {
      const res: any = await api.get('/notifications/unread-count');
      const data = res.data?.data || res.data;
      setUnreadNotifCount(data?.unreadCount || 0);
    } catch {
      // silent
    }
  };

  const fetchCounts = async () => {
    try {
      const reqs: any[] = [
        api.get('/messages/unread-count'),
        api.get('/interviews/stats'),
        api.get('/notifications/unread-count'),
      ];

      const results = await Promise.allSettled(reqs);
      const messagesRes = results[0];
      const interviewsRes = results[1];
      const notifRes = results[2];

      if (messagesRes.status === 'fulfilled') {
        const val = (messagesRes as any).value?.data;
        const count = val?.data?.count !== undefined
          ? val.data.count
          : val?.count !== undefined
          ? val.count
          : Array.isArray(val)
          ? val.filter((m: any) => !m.isRead || m.status === 'PENDING').length
          : 0;
        setUnreadCount(count);
      }

      if (interviewsRes.status === 'fulfilled') {
        const val = (interviewsRes as any).value;
        const pending =
          val?.data?.pending !== undefined
            ? val.data.pending
            : val?.data?.data?.pending !== undefined
            ? val.data.data.pending
            : val?.pending !== undefined
            ? val.pending
            : undefined;
        if (pending !== undefined) {
          setPendingInterviewsCount(pending);
        }
      }

      if (notifRes.status === 'fulfilled') {
        const notifData = (notifRes as any).value?.data?.data || (notifRes as any).value?.data;
        const total = typeof notifData?.unreadCount === 'number' ? notifData.unreadCount : 0;
        const portfolio = typeof notifData?.portfolioUnread === 'number' ? notifData.portfolioUnread : total;
        const system = typeof notifData?.systemUnread === 'number' ? notifData.systemUnread : 0;
        setUnreadNotifCount(total);
        setUnreadPortfolioNotifCount(portfolio);
        setUnreadSystemNotifCount(system);
      }
    } catch {
      // Ignore background fetch error
    }
  };

  const tenantLinks = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/notifications', label: 'Notifications', icon: Bell },
    { to: '/admin/cv-import', label: 'CV Scanner', icon: FileUp },
    { to: '/admin/customizer', label: 'Theme Builder', icon: Palette },
    { to: '/admin/profile', label: 'Edit Profile', icon: UserCheck },
    { to: '/admin/reviews', label: 'Testimonials', icon: Star },
    { to: '/admin/interviews', label: 'Interviews & Calls', icon: Calendar },
    { to: '/admin/messages', label: 'Messages', icon: MessageSquare },
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const superAdminLinks = [
    { to: '/superadmin/dashboard', label: 'Platform Overview', icon: Sparkles },
    { to: '/superadmin/notifications', label: 'Notifications & Broadcasts', icon: Bell },
    { to: '/superadmin/analytics', label: 'Platform Analytics', icon: BarChart3 },
    { to: '/superadmin/themes', label: 'Theme Studio', icon: Palette },
    { to: '/superadmin/users', label: 'Tenant Management', icon: Users },
    { to: '/superadmin/companies', label: 'Company Partners', icon: Building2 },
    { to: '/superadmin/system-health', label: 'System Health', icon: Activity },
    { to: '/superadmin/audit-logs', label: 'Audit Logs', icon: ShieldAlert },
    { to: '/superadmin/settings', label: 'System Settings', icon: Sliders },
  ];

  const companyLinks = [
    { to: '/company/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/company/jobs', label: 'Manage Jobs', icon: Briefcase },
    { to: '/company/jobs/new', label: 'Post a Job', icon: Building2 },
    { to: '/company/profile', label: 'Company Profile', icon: UserCog },
    { to: '/company/notifications', label: 'Notifications', icon: Bell },
  ];

  const content = (
    <aside className="w-56 bg-slate-900 border-r border-slate-800/80 flex flex-col h-full select-none overflow-hidden text-slate-300">
      {/* App Logo — fixed at top */}
      <div className="flex items-center justify-between px-3.5 py-3 shrink-0 border-b border-slate-800/60">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-xs shadow-md shadow-indigo-500/20">
            P
          </div>
          <div>
            <span className="font-extrabold text-xs text-white tracking-tight block">Portfolio SaaS</span>
            <span className="text-[9px] text-indigo-400 uppercase font-semibold tracking-wider block">
              {isCompany ? 'Company Partner' : isSuperAdmin ? 'Super Admin' : 'Tenant Admin'}
            </span>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Scrollable Navigation Links */}
      <nav className="flex-1 min-h-0 overflow-y-auto px-2 py-2 space-y-0.5 scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700">
        {isCompany && (
          <>
            <div className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-500">
              Employer Portal
            </div>
            {companyLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => onClose?.()}
                className={({ isActive }) =>
                  `flex items-center justify-between gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                    isActive
                      ? 'bg-emerald-600 text-white font-semibold shadow-sm shadow-emerald-600/25'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <item.icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.to === '/company/notifications' && unreadNotifCount > 0 && (
                  <span className="px-1.5 py-0.2 text-[9px] font-extrabold rounded-full bg-rose-500 text-white shadow-sm animate-pulse">
                    {unreadNotifCount}
                  </span>
                )}
              </NavLink>
            ))}
          </>
        )}

        {/* Superadmin Platform Links (Appears first for Super Admin) */}
        {isSuperAdmin && (
          <>
            <div className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-500">
              Platform Super Admin
            </div>
            {superAdminLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => onClose?.()}
                className={({ isActive }) =>
                  `flex items-center justify-between gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                    isActive
                      ? 'bg-purple-600 text-white font-semibold shadow-sm shadow-purple-600/25'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <item.icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.to === '/superadmin/notifications' && unreadSystemNotifCount > 0 && (
                  <span className="px-1.5 py-0.2 text-[9px] font-extrabold rounded-full bg-rose-500 text-white shadow-sm animate-pulse">
                    {unreadSystemNotifCount}
                  </span>
                )}
              </NavLink>
            ))}
          </>
        )}

        {/* Portfolio Management / My Portfolio Links (Comes after Platform Super Admin for superadmin, or sole section for tenant) */}
        {!isCompany && (
          <>
            <div className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-500 ${isSuperAdmin ? 'pt-3' : ''}`}>
              {isSuperAdmin ? 'My Portfolio' : 'Portfolio Management'}
            </div>
            {tenantLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => onClose?.()}
                className={({ isActive }) =>
                  `flex items-center justify-between gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                    isActive
                      ? 'bg-indigo-600 text-white font-semibold shadow-sm shadow-indigo-600/25'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <item.icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.to === '/admin/notifications' && unreadPortfolioNotifCount > 0 && (
                  <span className="px-1.5 py-0.2 text-[9px] font-extrabold rounded-full bg-indigo-500 text-white shadow-sm animate-pulse">
                    {unreadPortfolioNotifCount}
                  </span>
                )}
                {item.to === '/admin/messages' && unreadCount > 0 && (
                  <span className="px-1.5 py-0.2 text-[9px] font-extrabold rounded-full bg-rose-500 text-white shadow-sm animate-pulse">
                    {unreadCount}
                  </span>
                )}
                {item.to === '/admin/interviews' && pendingInterviewsCount > 0 && (
                  <span className="px-1.5 py-0.2 text-[9px] font-extrabold rounded-full bg-amber-500 text-slate-950 shadow-sm animate-pulse">
                    {pendingInterviewsCount}
                  </span>
                )}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User Footer Card */}
      <div className="p-2 border-t border-slate-800/60 shrink-0">
        <div className="flex items-center justify-between bg-slate-950/70 p-2 rounded-lg border border-slate-800/80">
          <div className="min-w-0 pr-1.5">
            <p className="text-[11px] font-bold text-white truncate">{user?.fullName}</p>
            <p className="text-[9px] text-slate-400 truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="p-1 rounded-md text-slate-400 hover:text-red-400 hover:bg-slate-800 transition shrink-0"
            title="Logout"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <div className="hidden lg:block h-screen sticky top-0 shrink-0">
        {content}
      </div>

      {/* Mobile Slide-Over Drawer Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop shadow */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />
          {/* Slide panel */}
          <div className="relative z-10 w-56 max-w-[80vw] h-full shadow-2xl animate-fade-in">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
