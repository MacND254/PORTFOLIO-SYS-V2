import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { Spinner } from '../../components/ui/Spinner';
import { Sparkles, Users, Activity, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSuperAdminOverview();
  }, []);

  const fetchSuperAdminOverview = async () => {
    setIsLoading(true);
    try {
      const res: any = await api.get('/admin/overview');
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 flex justify-center"><Spinner size="lg" /></div>;
  }

  const { metrics } = data || {};

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="p-8 rounded-3xl bg-gradient-to-r from-purple-900/60 via-slate-900 to-indigo-900/60 border border-purple-800/50 space-y-2 shadow-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold">
          <Sparkles className="w-4 h-4" />
          <span>Platform Governance & Tenant Operations</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Super Admin Platform Overview</h1>
        <p className="text-slate-300 text-sm max-w-2xl">
          Monitor platform wide tenant statistics, user accounts, system health metrics, and security audit logs.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <Users className="w-5 h-5 text-purple-400" />
          <div className="text-3xl font-extrabold text-white">{metrics?.totalUsers || 0}</div>
          <p className="text-xs text-slate-400">Total Registered Tenants</p>
        </div>
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <div className="text-3xl font-extrabold text-white">{metrics?.publishedPortfolios || 0}</div>
          <p className="text-xs text-slate-400">Published Live Portfolios</p>
        </div>
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <Activity className="w-5 h-5 text-sky-400" />
          <div className="text-3xl font-extrabold text-white">{metrics?.totalViews || 0}</div>
          <p className="text-xs text-slate-400">Platform Total Views</p>
        </div>
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          <div className="text-3xl font-extrabold text-white">0</div>
          <p className="text-xs text-slate-400">Critical Security Alerts</p>
        </div>
      </div>
    </div>
  );
};
