import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { Spinner } from '../../components/ui/Spinner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Eye, Download, MessageSquare, Star } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const res: any = await api.get('/analytics/tenant');
      setAnalytics(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 flex justify-center"><Spinner size="lg" /></div>;
  }

  const { overview, viewsChartData } = analytics || {};

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Portfolio Analytics & Insights</h1>
        <p className="text-slate-400 text-sm">Track visitor engagement, resume downloads, and traffic metrics over time.</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <Eye className="w-5 h-5 text-indigo-400" />
          <div className="text-2xl font-extrabold text-white">{overview?.totalViews || 0}</div>
          <p className="text-xs text-slate-400">Total Profile Views</p>
        </div>
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <Download className="w-5 h-5 text-emerald-400" />
          <div className="text-2xl font-extrabold text-white">{overview?.totalDownloads || 0}</div>
          <p className="text-xs text-slate-400">Resume PDF Downloads</p>
        </div>
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <MessageSquare className="w-5 h-5 text-sky-400" />
          <div className="text-2xl font-extrabold text-white">{overview?.totalContacts || 0}</div>
          <p className="text-xs text-slate-400">Contact Messages</p>
        </div>
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <Star className="w-5 h-5 text-amber-400" />
          <div className="text-2xl font-extrabold text-white">{overview?.totalReviews || 0}</div>
          <p className="text-xs text-slate-400">Verified Reviews</p>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white">Views Trend (Last 30 Days)</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={viewsChartData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
              <YAxis stroke="#64748b" fontSize={10} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
              <Bar dataKey="views" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
