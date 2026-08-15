import React from 'react';
import { Wrench, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';

export const MaintenancePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-lg text-center space-y-8 p-10 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500/20 to-indigo-500/20 border border-amber-500/30 flex items-center justify-center mx-auto shadow-xl">
            <Wrench className="w-10 h-10 text-amber-400 animate-bounce" />
          </div>
        </div>

        <div className="space-y-3 relative">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Platform Maintenance Active</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">System Under Scheduled Maintenance</h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-md mx-auto">
            We are performing essential system updates and performance enhancements to improve your experience. Please check back shortly.
          </p>
        </div>

        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-center gap-3 relative">
          <button
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Status</span>
          </button>
          <a
            href="/login"
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            Super Admin Login
          </a>
        </div>
      </div>
    </div>
  );
};
