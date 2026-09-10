import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { Spinner } from '../../components/ui/Spinner';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  Eye, Download, MessageSquare, Star, Users, TrendingUp,
  Monitor, Smartphone, Tablet, Globe, RefreshCw, Calendar,
  ArrowUpRight, Compass, Shield, Clock, ExternalLink, BarChart2,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const AnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    fetchAnalytics(timeRange);
  }, [timeRange]);

  const fetchAnalytics = async (range: '7d' | '30d' | '90d' | 'all') => {
    setIsRefreshing(true);
    try {
      const res: any = await api.get(`/analytics/tenant?range=${range}`);
      setAnalytics(res.data);
    } catch (e) {
      console.error('Failed to load analytics:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center space-y-3">
        <Spinner size="lg" />
        <p className="text-slate-400 text-sm animate-pulse">Loading Analytics &amp; Visitor Metrics...</p>
      </div>
    );
  }

  const {
    overview,
    viewsChartData = [],
    deviceBreakdown = [],
    browserBreakdown = [],
    referrerBreakdown = [],
    recentEvents = [],
  } = analytics || {};

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'VIEW':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">Profile View</span>;
      case 'DOWNLOAD_RESUME':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Resume Download</span>;
      case 'CONTACT_SUBMIT':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">Contact Message</span>;
      case 'REVIEW_SUBMIT':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">Review Submitted</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">{type}</span>;
    }
  };

  const getDeviceIcon = (dev: string) => {
    if (dev === 'Mobile') return <Smartphone className="w-3.5 h-3.5 text-indigo-400" />;
    if (dev === 'Tablet') return <Tablet className="w-3.5 h-3.5 text-purple-400" />;
    return <Monitor className="w-3.5 h-3.5 text-slate-400" />;
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
      if (diffSec < 60) return `${diffSec}s ago`;
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      return `${Math.floor(diffSec / 86400)}d ago`;
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-7xl mx-auto pb-10">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <BarChart2 className="w-4 h-4" />
            </div>
            Portfolio Analytics &amp; Visitor Intelligence
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time traffic metrics, device distribution, recruiter referral sources, and conversion analytics.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          {/* Time range selector */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold">
            {[
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: '90d', label: '90 Days' },
              { id: 'all', label: 'All Time' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTimeRange(tab.id as any)}
                className={`px-2.5 py-1 rounded-md transition ${
                  timeRange === tab.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchAnalytics(timeRange)}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Top 5 Key Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Total Views */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 relative overflow-hidden group hover:border-indigo-500/30 transition">
          <div className="flex items-center justify-between">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Eye className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Impressions</span>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-white">{overview?.totalViews || 0}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Total Page Views</p>
          </div>
        </div>

        {/* Unique Visitors */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 relative overflow-hidden group hover:border-purple-500/30 transition">
          <div className="flex items-center justify-between">
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
              <Users className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Audience</span>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-white">{overview?.uniqueVisitors || 0}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Unique Visitors</p>
          </div>
        </div>

        {/* Resume Downloads */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 relative overflow-hidden group hover:border-emerald-500/30 transition">
          <div className="flex items-center justify-between">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Download className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">PDF Exports</span>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-white">{overview?.totalDownloads || 0}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Resume Downloads</p>
          </div>
        </div>

        {/* Inquiries / Contacts */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 relative overflow-hidden group hover:border-sky-500/30 transition">
          <div className="flex items-center justify-between">
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
              <MessageSquare className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Leads</span>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-white">{overview?.totalContacts || 0}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Inquiries Received</p>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 relative overflow-hidden group hover:border-amber-500/30 transition col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Engagement</span>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-white">{overview?.conversionRate || 0}%</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Visitor Action Rate</p>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Views & Downloads Over Time (2 Cols) */}
        <div className="lg:col-span-2 p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Traffic &amp; Engagement Activity</span>
              </h3>
              <p className="text-[11px] text-slate-400">Daily page impressions and resume downloads</p>
            </div>
            <div className="flex items-center gap-2.5 text-xs">
              <span className="flex items-center gap-1.5 text-indigo-400 font-medium text-[11px]">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                Views
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Downloads
              </span>
            </div>
          </div>

          <div className="h-60 w-full pt-1">
            {viewsChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 italic">
                No view data recorded in this period yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={viewsChartData}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorDownloads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                    tickFormatter={(val) => {
                      const parts = val.split('-');
                      return `${parts[1]}/${parts[2]}`;
                    }}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#090d16',
                      borderColor: '#1e293b',
                      borderRadius: '10px',
                      fontSize: '11px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorViews)"
                    name="Views"
                  />
                  <Area
                    type="monotone"
                    dataKey="downloads"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorDownloads)"
                    name="Downloads"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Device Distribution (1 Col) */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Monitor className="w-3.5 h-3.5 text-indigo-400" />
              <span>Device Distribution</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Breakdown by visitor screen factor</p>
          </div>

          <div className="space-y-3 my-auto py-1">
            {deviceBreakdown.map((dev: any) => (
              <div key={dev.name} className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    {getDeviceIcon(dev.name)}
                    <span>{dev.name}</span>
                  </span>
                  <span className="text-white font-mono">{dev.percentage}% ({dev.count})</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      dev.name === 'Mobile'
                        ? 'bg-indigo-500'
                        : dev.name === 'Tablet'
                        ? 'bg-purple-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.max(4, dev.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Browser summary pills */}
          <div className="pt-2.5 border-t border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 block mb-1.5">Top Browsers:</span>
            <div className="flex flex-wrap gap-1">
              {browserBreakdown.map((b: any) => (
                <span
                  key={b.name}
                  className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-300 flex items-center gap-1"
                >
                  <span>{b.name}</span>
                  <span className="text-indigo-400 font-bold">{b.percentage}%</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Referrers & Live Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top Referral Origins (1 Col) */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              <span>Top Referral Channels</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Where your recruiters &amp; viewers arrive from</p>
          </div>

          {referrerBreakdown.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-4 text-center">No referrer data logged yet.</p>
          ) : (
            <div className="space-y-2 pt-0.5">
              {referrerBreakdown.map((ref: any, idx: number) => (
                <div key={ref.source} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-slate-900 text-slate-400 font-mono text-[9px] flex items-center justify-center font-bold">
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-white">{ref.source}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-indigo-400">{ref.count}</span>
                    <span className="text-[10px] text-slate-500 ml-1">({ref.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Visitor Activity Stream (2 Cols) */}
        <div className="lg:col-span-2 p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Live Activity Stream</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Latest actions across your published portfolio</p>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Last 25 events</span>
          </div>

          {recentEvents.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-6 text-center">No live events recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold text-[11px]">
                    <th className="pb-2">Event</th>
                    <th className="pb-2">Device</th>
                    <th className="pb-2">Browser</th>
                    <th className="pb-2">Referrer</th>
                    <th className="pb-2 text-right">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recentEvents.map((ev: any) => (
                    <tr key={ev.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-2 font-medium">{getEventBadge(ev.eventType)}</td>
                      <td className="py-2 text-slate-300 flex items-center gap-1.5">
                        {getDeviceIcon(ev.deviceType)}
                        <span className="text-xs">{ev.deviceType}</span>
                      </td>
                      <td className="py-2 text-slate-300 font-mono text-[11px]">{ev.browser}</td>
                      <td className="py-2 text-slate-400 truncate max-w-[140px] text-xs">{ev.referrer}</td>
                      <td className="py-2 text-slate-500 text-right font-mono text-[10px]">
                        {formatRelativeTime(ev.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
