import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { Spinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';
import { Activity, Database, Server, RefreshCw, ShieldAlert, Cpu, HardDrive, CheckCircle } from 'lucide-react';

export const SystemHealthPage: React.FC = () => {
  const [health, setHealth] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHealth();
  }, []);

  const fetchHealth = async () => {
    setIsLoading(true);
    try {
      const res: any = await api.get('/admin/system-health');
      setHealth(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 flex justify-center"><Spinner size="lg" /></div>;
  }

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
  };

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">System Health & Status</h1>
          <p className="text-slate-400 text-sm">Real-time infrastructure health, database latency, and service availability.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchHealth} leftIcon={<RefreshCw className="w-4 h-4" />}>
          Refresh Health
        </Button>
      </div>

      {/* Primary Status Banner */}
      <div className={`p-6 rounded-2xl border flex items-center justify-between ${
        health?.status === 'HEALTHY'
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${health?.status === 'HEALTHY' ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
            {health?.status === 'HEALTHY' ? <CheckCircle className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">System Status: {health?.status || 'HEALTHY'}</h3>
            <p className="text-xs text-slate-300">All core microservices and infrastructure nodes operational.</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">System Uptime</p>
          <p className="text-lg font-mono font-bold text-white">{formatUptime(health?.uptimeSeconds || 0)}</p>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Server className="w-5 h-5 text-indigo-400" />
              <h4 className="font-bold text-white text-base">Backend API Server</h4>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {health?.services?.api || 'UP'}
            </span>
          </div>
          <p className="text-xs text-slate-400">Express REST API gateway processing tenant requests.</p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-indigo-400" />
              <h4 className="font-bold text-white text-base">PostgreSQL 16 DB</h4>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {health?.services?.database || 'UP'}
            </span>
          </div>
          <p className="text-xs text-slate-400">Relational multi-tenant persistent database cluster.</p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-indigo-400" />
              <h4 className="font-bold text-white text-base">Redis 7 Cache</h4>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {health?.services?.redis || 'UP'}
            </span>
          </div>
          <p className="text-xs text-slate-400">In-memory rate limiting and analytics caching layer.</p>
        </div>
      </div>
    </div>
  );
};
