import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { SubdomainUrlBadge } from '../admin/SubdomainUrlBadge';
import { ShieldCheck, Bell } from 'lucide-react';

interface NavbarProps {
  subdomain?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ subdomain = 'francis' }) => {
  const { user } = useAuth();

  return (
    <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <SubdomainUrlBadge subdomain={subdomain} />
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
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
