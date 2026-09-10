import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { Spinner } from '../../components/ui/Spinner';
import {
  BarChart3, TrendingUp, Download, MessageSquare, RefreshCw,
  Monitor, Smartphone, Tablet, Globe, ArrowLeft, ChevronDown,
  Eye, Users, Percent, ExternalLink, CheckCircle2, AlertCircle,
} from 'lucide-react';

type TimeRange = '7d' | '30d' | '90d' | 'all';

const RANGE_LABELS: Record<TimeRange, string> = {
  '7d': 'Last 7 Days',
  '30d': 'Last 30 Days',
  '90d': 'Last 90 Days',
  'all': 'All Time (6mo)',
};

const DEVICE_ICONS: Record<string, React.ReactNode> = {
  Desktop: <Monitor className="w-4 h-4" />,
  Mobile: <Smartphone className="w-4 h-4" />,
  Tablet: <Tablet className="w-4 h-4" />,
};

const DEVICE_COLORS: Record<string, string> = {
  Desktop: 'from-indigo-500 to-purple-500',
  Mobile: 'from-emerald-500 to-teal-500',
  Tablet: 'from-amber-500 to-orange-500',
};

const BROWSER_COLORS = [
  'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-sky-500', 'bg-purple-500', 'bg-rose-500',
];

export const SuperAdminAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [showRangeMenu, setShowRangeMenu] = useState(false);

  const fetchData = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const res: any = await api.get('/admin/platform-traffic', { params: { timeRange } });
      setData(res.data?.data || res.data);
    } catch (e) {
      console.error('Failed to fetch platform traffic:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [timeRange]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const overview = data?.overview || {};
  const trafficChart: any[] = data?.trafficChart || [];
  const deviceBreakdown: any[] = data?.deviceBreakdown || [];
  const browserBreakdown: any[] = data?.browserBreakdown || [];
  const topPortfolios: any[] = data?.topPortfolios || [];

  // Simple SVG bar chart
  const maxViews = Math.max(...trafficChart.map((d: any) => d.views), 1);
  const chartData = trafficChart.slice(-60); // cap at 60 data points for readability

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-5 md:p-6 space-y-4 sm:space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/superadmin/dashboard"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-sky-400" />
              Platform Traffic Analytics
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">
              Aggregate cross-tenant traffic, top portfolios, and engagement metrics.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Time Range Selector */}
          <div className="relative">
            <button
              onClick={() => setShowRangeMenu(v => !v)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-semibold hover:border-sky-500/50 transition"
            >
              <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
              <span>{RANGE_LABELS[timeRange]}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
            {showRangeMenu && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden">
                {(Object.entries(RANGE_LABELS) as [TimeRange, string][]).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => { setTimeRange(val); setShowRangeMenu(false); }}
                    className={`w-full text-left px-3.5 py-2.5 text-xs font-medium transition-colors ${timeRange === val ? 'text-sky-400 bg-sky-500/10' : 'text-slate-300 hover:bg-slate-800'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 transition"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-sky-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Views', value: overview.totalViews || 0, icon: Eye, color: 'from-indigo-600 to-purple-600', badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' },
          { label: 'Resume Downloads', value: overview.totalDownloads || 0, icon: Download, color: 'from-emerald-600 to-teal-600', badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
          { label: 'Contact Inquiries', value: overview.totalContactMessages || 0, icon: MessageSquare, color: 'from-sky-600 to-blue-600', badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
          { label: 'Unique Active Days', value: overview.uniqueVisitors || 0, icon: Users, color: 'from-violet-600 to-fuchsia-600', badge: 'bg-violet-500/15 text-violet-300 border-violet-500/30' },
          { label: 'Conversion Rate', value: `${overview.conversionRate || 0}%`, icon: Percent, color: 'from-amber-600 to-orange-600', badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
        ].map((card) => (
          <div key={card.label} className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-lg">
            <div className="flex items-center gap-2.5 mb-2">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${card.color} flex items-center justify-center shadow-md`}>
                <card.icon className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-white">{card.value.toLocaleString?.() ?? card.value}</p>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Traffic Chart */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sky-400" />
            Daily Traffic — {RANGE_LABELS[timeRange]}
          </h2>
          <div className="flex items-center gap-3 text-[10px] text-slate-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" /> Views</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Downloads</span>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-slate-500 text-sm">No traffic data for this period.</div>
        ) : (
          <div className="relative h-40 flex items-end gap-0.5 overflow-hidden">
            {chartData.map((d: any, i: number) => {
              const viewH = maxViews > 0 ? (d.views / maxViews) * 100 : 0;
              const dlH = maxViews > 0 ? (d.downloads / maxViews) * 100 : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end gap-0.5 group relative" title={`${d.date}: ${d.views} views, ${d.downloads} downloads`}>
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-10 shadow-xl">
                    <p className="font-bold text-sky-300">{d.date}</p>
                    <p className="text-indigo-300">{d.views} views</p>
                    <p className="text-emerald-300">{d.downloads} DLs</p>
                  </div>
                  <div className="w-full bg-emerald-500/70 rounded-t-sm" style={{ height: `${dlH}%`, minHeight: dlH > 0 ? 2 : 0 }} />
                  <div className="w-full bg-indigo-500/80 rounded-t-sm" style={{ height: `${Math.max(0, viewH - dlH)}%`, minHeight: viewH > 0 ? 2 : 0 }} />
                </div>
              );
            })}
          </div>
        )}
        <div className="flex justify-between text-[10px] text-slate-500 mt-1 pt-1 border-t border-slate-800/50">
          <span>{chartData[0]?.date || ''}</span>
          <span>{chartData[chartData.length - 1]?.date || ''}</span>
        </div>
      </div>

      {/* Device & Browser Breakdown */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Device */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg">
          <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Monitor className="w-4 h-4 text-indigo-400" />
            Device Breakdown
          </h2>
          <div className="space-y-2.5">
            {deviceBreakdown.map((d: any) => (
              <div key={d.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                    <span className={`p-1.5 rounded-lg bg-gradient-to-tr ${DEVICE_COLORS[d.name] || 'from-slate-600 to-slate-500'} text-white`}>
                      {DEVICE_ICONS[d.name] || <Globe className="w-3.5 h-3.5" />}
                    </span>
                    {d.name}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{d.count.toLocaleString()} <span className="text-slate-500">({d.percentage}%)</span></span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${DEVICE_COLORS[d.name] || 'from-slate-500 to-slate-400'} rounded-full transition-all duration-700`}
                    style={{ width: `${d.percentage}%` }}
                  />
                </div>
              </div>
            ))}
            {deviceBreakdown.length === 0 && <p className="text-slate-500 text-xs py-4 text-center">No device data available.</p>}
          </div>
        </div>

        {/* Browser */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg">
          <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            Browser Breakdown
          </h2>
          <div className="space-y-2.5">
            {browserBreakdown.map((b: any, idx: number) => (
              <div key={b.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                    <span className={`w-2.5 h-2.5 rounded-full ${BROWSER_COLORS[idx] || 'bg-slate-500'}`} />
                    {b.name}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{b.count.toLocaleString()} <span className="text-slate-500">({b.percentage}%)</span></span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${BROWSER_COLORS[idx] || 'bg-slate-500'} rounded-full transition-all duration-700`}
                    style={{ width: `${b.percentage}%` }}
                  />
                </div>
              </div>
            ))}
            {browserBreakdown.length === 0 && <p className="text-slate-500 text-xs py-4 text-center">No browser data available.</p>}
          </div>
        </div>
      </div>

      {/* Top Portfolios Leaderboard */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            Top Portfolios by Views
          </h2>
          <span className="text-[10px] text-slate-500 font-mono">{RANGE_LABELS[timeRange]}</span>
        </div>
        {topPortfolios.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No portfolio traffic data for this period.</div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {topPortfolios.map((p: any, idx: number) => (
              <div key={p.profileId} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800/40 transition">
                <span className={`text-xs font-black w-5 text-center ${idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-slate-400' : idx === 2 ? 'text-orange-600' : 'text-slate-600'}`}>
                  #{idx + 1}
                </span>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-md">
                  {p.fullName?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{p.fullName}</p>
                  <p className="text-[10px] text-slate-400 truncate">{p.title} · <span className="font-mono text-indigo-400">{p.subdomain}</span></p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${p.isPublished ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-slate-700/40 text-slate-400 border-slate-700'}`}>
                    {p.isPublished ? <CheckCircle2 className="w-2.5 h-2.5" /> : <AlertCircle className="w-2.5 h-2.5" />}
                    {p.isPublished ? 'Live' : 'Draft'}
                  </span>
                  <span className="text-xs font-black text-white tabular-nums">
                    {p.views.toLocaleString()}
                    <span className="text-slate-500 font-normal text-[10px] ml-1">views</span>
                  </span>
                  <a
                    href={`/p/${p.subdomain}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 rounded-lg text-slate-500 hover:text-indigo-400 transition"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
