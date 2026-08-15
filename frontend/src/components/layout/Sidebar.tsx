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
} from 'lucide-react';

export const Sidebar: React.FC = () => {
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
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0 shrink-0 select-none overflow-hidden">
      {/* App Logo — fixed at top */}
      <div className="flex items-center gap-3 px-4 py-4 shrink-0">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/25">
          P
        </div>
        <div>
          <span className="font-extrabold text-base text-white tracking-tight block">Portfolio SaaS</span>
          <span className="text-[10px] text-indigo-400 uppercase font-semibold tracking-wider">
            {isSuperAdmin ? 'Super Admin Mode' : 'Tenant Admin'}
          </span>
        </div>
      </div>

      {/* Scrollable Navigation Links */}
      <nav className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 space-y-1 scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700 hover:scrollbar-thumb-slate-600">
        <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {isSuperAdmin ? 'Tenant Management' : 'Portfolio Management'}
        </div>
        {tenantLinks.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`
            }
          >
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
          </NavLink>
        ))}

        {isSuperAdmin && (
          <>
            <div className="px-3 py-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Platform Super Admin
            </div>
            {superAdminLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User Footer Card */}
      <div className="p-4 border-t border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="truncate">
            <p className="text-xs font-bold text-white truncate">{user?.fullName}</p>
            <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
