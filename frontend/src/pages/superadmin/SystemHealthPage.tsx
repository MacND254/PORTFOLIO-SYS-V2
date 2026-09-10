import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { Spinner } from '../../components/ui/Spinner';
import {
  Activity, Database, Server, RefreshCw, ShieldAlert, Cpu,
  HardDrive, CheckCircle, MemoryStick, Globe, Zap,
} from 'lucide-react';

function LatencyBadge({ ms }: { ms: number | null }) {
  if (ms === null || ms < 0) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-700/60 text-slate-400 border border-slate-700">—</span>;
  const color = ms < 20 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    : ms < 100 ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    : 'text-red-400 bg-red-500/10 border-red-500/30';
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${color}`}>{ms}ms</span>;
}

function StatusBadge({ status }: { status: string }) {
  const color = status === 'UP' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    : status === 'OFFLINE_FALLBACK' ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    : status === 'READ_ONLY' ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    : status === 'UNCONFIGURED' ? 'text-slate-400 bg-slate-700/50 border-slate-700'
    : 'text-red-400 bg-red-500/10 border-red-500/30';
  return <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${color}`}>{status}</span>;
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const barColor = pct > 85 ? 'bg-red-500' : pct > 65 ? 'bg-amber-500' : color;
  return (
    <div className="h-2 bg-slate-800 rounded-full overflow-hidden mt-1.5">
      <div className={`h-full ${barColor} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export const SystemHealthPage: React.FC = () => {
  const [health, setHealth] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  useEffect(() => { fetchHealth(); }, []);

  const fetchHealth = async () => {
    setIsLoading(true);
    try {
      const res: any = await api.get('/admin/system-health');
      setHealth(res.data?.data || res.data);
      setLastRefreshed(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    return `${h}h ${m}m ${s}s`;
  };

  if (isLoading) {
    return <div className="p-8 flex justify-center items-center min-h-[60vh]"><Spinner size="lg" /></div>;
  }

  const sv = health?.services || {};
  const mem = health?.memory || {};
  const cpu = health?.cpu || {};
  const isHealthy = health?.status === 'HEALTHY';

  return (
    <div className="p-3 sm:p-5 md:p-6 space-y-4 sm:space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            System Health & Diagnostics
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Real-time infrastructure probes, database latency, memory, CPU, and storage status.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {lastRefreshed && (
            <span className="text-[10px] text-slate-500 font-mono">
              Updated {lastRefreshed.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchHealth}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 transition text-xs font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Primary Status Banner */}
      <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
        isHealthy ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${isHealthy ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
            {isHealthy
              ? <CheckCircle className="w-5 h-5 text-emerald-400" />
              : <ShieldAlert className="w-5 h-5 text-red-400" />
            }
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              System Status: <span className={isHealthy ? 'text-emerald-400' : 'text-red-400'}>{health?.status || 'HEALTHY'}</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              All core microservices and infrastructure nodes operational.
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Server Uptime</p>
          <p className="text-base font-mono font-bold text-white">{formatUptime(health?.uptimeSeconds || 0)}</p>
        </div>
      </div>

      {/* Service Status Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* API Server */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Backend API Server</h4>
                <p className="text-[10px] text-slate-500">Express REST gateway</p>
              </div>
            </div>
            <StatusBadge status={sv.api?.status || 'UP'} />
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Node.js multi-tenant API processing all portfolio, analytics, and admin requests.
          </p>
          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">
            <span>Platform: {cpu.platform || 'linux'} / {cpu.arch || 'x64'}</span>
            <span className="font-mono text-slate-400">{cpu.cores || 1} CPU cores</span>
          </div>
        </div>

        {/* PostgreSQL */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">PostgreSQL Database</h4>
                <p className="text-[10px] text-slate-500">Multi-tenant relational DB</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LatencyBadge ms={sv.database?.latencyMs ?? null} />
              <StatusBadge status={sv.database?.status || 'UP'} />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Primary data store for all tenant profiles, analytics events, and platform records.
          </p>
          <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800/80">
            <span className="text-slate-500">Roundtrip Latency</span>
            <span className={`font-mono font-bold ${(sv.database?.latencyMs || 999) < 20 ? 'text-emerald-400' : (sv.database?.latencyMs || 999) < 100 ? 'text-amber-400' : 'text-red-400'}`}>
              {sv.database?.latencyMs != null ? `${sv.database.latencyMs}ms` : 'N/A'}
            </span>
          </div>
        </div>

        {/* Redis */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Redis Cache</h4>
                <p className="text-[10px] text-slate-500">Rate limiting & session cache</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LatencyBadge ms={sv.redis?.latencyMs ?? null} />
              <StatusBadge status={sv.redis?.status || 'OFFLINE_FALLBACK'} />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            In-memory cache for rate limiting, session management, and analytics buffering.
          </p>
          <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800/80">
            <span className="text-slate-500">Ping Latency</span>
            <span className={`font-mono font-bold ${sv.redis?.status === 'UP' ? 'text-emerald-400' : 'text-amber-400'}`}>
              {sv.redis?.latencyMs != null ? `${sv.redis.latencyMs}ms` : 'Fallback Mode'}
            </span>
          </div>
        </div>

        {/* Storage */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <HardDrive className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">File Storage</h4>
                <p className="text-[10px] text-slate-500">CV & media upload directory</p>
              </div>
            </div>
            <StatusBadge status={sv.storage?.status || 'UP'} />
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Local filesystem bucket for CV documents, profile images, and verified certificates.
          </p>
          <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800/80">
            <span className="text-slate-500 font-mono truncate max-w-[180px]">{sv.storage?.path || '/uploads'}</span>
            <span className={`font-semibold ${sv.storage?.isWritable ? 'text-emerald-400' : 'text-red-400'}`}>
              {sv.storage?.isWritable ? 'Writable ✓' : 'Read-Only ✗'}
            </span>
          </div>
        </div>

        {/* CV Engine */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">AI / CV Engine</h4>
                <p className="text-[10px] text-slate-500">OCR & structured extraction</p>
              </div>
            </div>
            <StatusBadge status={sv.cvEngine?.status || 'UNCONFIGURED'} />
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            AI-powered resume parsing for intelligent CV-to-profile extraction.
          </p>
          <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800/80">
            <span className="text-slate-500">Provider</span>
            <span className={`font-semibold ${sv.cvEngine?.status === 'UP' ? 'text-emerald-400' : 'text-slate-400'}`}>
              {sv.cvEngine?.provider || 'None Configured'}
            </span>
          </div>
        </div>

        {/* Placeholder for grid symmetry on lg */}
        <div className="hidden lg:block" />
      </div>

      {/* Memory & CPU Telemetry */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Process Memory */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <MemoryStick className="w-4 h-4 text-violet-400" />
            Memory Usage
          </h3>

          {/* System RAM */}
          <div>
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-[11px] text-slate-400 font-semibold">System RAM</span>
              <span className="text-[11px] text-slate-300 font-mono">
                {mem.systemUsedMb || 0} / {mem.systemTotalMb || 0} MB ({mem.systemUsagePercent || 0}%)
              </span>
            </div>
            <ProgressBar value={mem.systemUsedMb || 0} max={mem.systemTotalMb || 1} color="bg-violet-500" />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>Free: {mem.systemFreeMb || 0} MB</span>
              <span className={mem.systemUsagePercent > 85 ? 'text-red-400' : mem.systemUsagePercent > 65 ? 'text-amber-400' : 'text-emerald-400'}>
                {mem.systemUsagePercent || 0}% used
              </span>
            </div>
          </div>

          {/* Node.js Heap */}
          <div>
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-[11px] text-slate-400 font-semibold">Node.js Heap</span>
              <span className="text-[11px] text-slate-300 font-mono">
                {mem.heapUsedMb || 0} / {mem.heapTotalMb || 0} MB
              </span>
            </div>
            <ProgressBar value={mem.heapUsedMb || 0} max={mem.heapTotalMb || 1} color="bg-indigo-500" />
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] pt-2 border-t border-slate-800/80">
            <div className="bg-slate-950/60 rounded-lg px-3 py-2">
              <p className="text-slate-500">RSS Memory</p>
              <p className="text-white font-mono font-bold">{mem.rssMb || 0} MB</p>
            </div>
            <div className="bg-slate-950/60 rounded-lg px-3 py-2">
              <p className="text-slate-500">External</p>
              <p className="text-white font-mono font-bold">{mem.externalMb || 0} MB</p>
            </div>
          </div>
        </div>

        {/* CPU */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-amber-400" />
            CPU & System Load
          </h3>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: '1m Load', value: cpu.loadAvg1m },
              { label: '5m Load', value: cpu.loadAvg5m },
              { label: '15m Load', value: cpu.loadAvg15m },
            ].map(({ label, value }) => {
              const pct = cpu.cores > 0 ? Math.min(100, Math.round((value / cpu.cores) * 100)) : 0;
              const color = pct > 80 ? 'text-red-400' : pct > 50 ? 'text-amber-400' : 'text-emerald-400';
              return (
                <div key={label} className="bg-slate-950/60 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-slate-500 mb-1">{label}</p>
                  <p className={`text-lg font-black font-mono ${color}`}>{value?.toFixed(2) || '0.00'}</p>
                  <p className={`text-[10px] ${color}`}>{pct}% capacity</p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] pt-2 border-t border-slate-800/80">
            <div className="bg-slate-950/60 rounded-lg px-3 py-2">
              <p className="text-slate-500">CPU Cores</p>
              <p className="text-white font-mono font-bold">{cpu.cores || 1} vCPUs</p>
            </div>
            <div className="bg-slate-950/60 rounded-lg px-3 py-2">
              <p className="text-slate-500">Platform</p>
              <p className="text-white font-mono font-bold capitalize">{cpu.platform || 'linux'} / {cpu.arch || 'x64'}</p>
            </div>
          </div>

          <div className="text-[10px] pt-2 border-t border-slate-800/80">
            <p className="text-slate-500 mb-1 font-semibold">Load Interpretation</p>
            <p className="text-slate-400 leading-relaxed">
              Load average = number of processes waiting for CPU time. Values below <span className="text-emerald-400 font-mono">{cpu.cores || 1}.00</span> indicate healthy utilization. Sustained values above CPU core count signal overload.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
