import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SubdomainUrlBadge } from '../admin/SubdomainUrlBadge';
import { ShieldCheck, Bell, Menu, User, ExternalLink, LogOut, ChevronDown, Settings } from 'lucide-react';

interface NavbarProps {
  subdomain?: string;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ subdomain = 'francis', onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userSubdomain = user?.subdomain || subdomain;

  return (
    <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-30 select-none">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-200 hover:text-white transition"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <SubdomainUrlBadge subdomain={userSubdomain} />
      </div>

      <div className="flex items-center gap-2.5 sm:gap-4">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Tenant Isolated</span>
        </div>

        <button
          className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition relative"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-500" />
        </button>

        {/* Top-Right Interactive User Avatar Dropdown Menu */}
        <div className="relative border-l border-slate-800 pl-3 sm:pl-4" ref={userMenuRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-800/60 transition group cursor-pointer"
            title="User Profile & Settings"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500 p-0.5 shadow-md group-hover:scale-105 transition">
              <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-white font-bold text-xs">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
            </div>
            <div className="text-left hidden md:block">
              <p className="text-xs font-bold text-white group-hover:text-indigo-400 transition leading-tight">
                {user?.fullName}
              </p>
              <p className="text-[10px] text-slate-400 leading-tight font-mono">
                {userSubdomain}
              </p>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition transform ${
                isUserMenuOpen ? 'rotate-180 text-white' : ''
              }`}
            />
          </button>

          {/* Avatar Dropdown Drawer */}
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
                  href={`/p/${userSubdomain}`}
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
