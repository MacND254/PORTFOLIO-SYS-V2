import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { SubdomainUrlBadge } from '../admin/SubdomainUrlBadge';
import { ShieldCheck, Bell, Menu } from 'lucide-react';

interface NavbarProps {
  subdomain?: string;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ subdomain = 'francis', onToggleSidebar }) => {
  const { user } = useAuth();

  return (
    <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-30">
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
        <SubdomainUrlBadge subdomain={subdomain} />
      </div>

      <div className="flex items-center gap-2.5 sm:gap-4">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Tenant Isolated</span>
        </div>

        <button className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-500" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-xs">
            {user?.fullName?.charAt(0)}
          </div>
        </div>
      </div>
    </header>
  );
};
