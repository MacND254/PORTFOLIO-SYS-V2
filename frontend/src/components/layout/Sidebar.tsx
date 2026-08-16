import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { user, logout } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const tenantLinks = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/cv-import', label: 'CV Upload & AI', icon: FileUp },
    { to: '/admin/customizer', label: 'Theme Builder', icon: Palette },
    { to: '/admin/profile', label: 'Edit Profile', icon: UserCheck },
    { to: '/admin/reviews', label: 'Testimonials', icon: Star },
    { to: '/admin/messages', label: 'Messages', icon: MessageSquare },
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const superAdminLinks = [
    { to: '/superadmin/dashboard', label: 'Platform Overview', icon: Sparkles },
    { to: '/superadmin/themes', label: 'Theme Studio', icon: Palette },
    { to: '/superadmin/users', label: 'Tenant Management', icon: Users },
    { to: '/superadmin/system-health', label: 'System Health', icon: Activity },
    { to: '/superadmin/audit-logs', label: 'Audit Logs', icon: ShieldAlert },
    { to: '/superadmin/settings', label: 'System Settings', icon: Sliders },
  ];

  const content = (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full select-none overflow-hidden">
      {/* App Logo — fixed at top */}
      <div className="flex items-center justify-between px-4 py-4 shrink-0 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-base shadow-lg shadow-indigo-500/25">
            P
          </div>
          <div>
            <span className="font-extrabold text-sm text-white tracking-tight block">Portfolio SaaS</span>
            <span className="text-[10px] text-indigo-400 uppercase font-semibold tracking-wider block">
              {isSuperAdmin ? 'Super Admin' : 'Tenant Admin'}
            </span>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Scrollable Navigation Links */}
      <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-1 scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700">
        <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          {isSuperAdmin ? 'Tenant Management' : 'Portfolio Management'}
        </div>
        {tenantLinks.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => onClose?.()}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`
            }
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}

        {isSuperAdmin && (
          <>
            <div className="px-3 py-1 pt-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Platform Super Admin
            </div>
            {superAdminLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => onClose?.()}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User Footer Card */}
      <div className="p-3 border-t border-slate-800 shrink-0">
        <div className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
          <div className="min-w-0 pr-2">
            <p className="text-xs font-bold text-white truncate">{user?.fullName}</p>
            <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition shrink-0"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
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
          <div className="relative z-10 w-64 max-w-[80vw] h-full shadow-2xl animate-fade-in">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
