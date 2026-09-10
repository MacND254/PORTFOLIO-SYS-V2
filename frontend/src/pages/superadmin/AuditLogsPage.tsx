import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { Spinner } from '../../components/ui/Spinner';
import { Shield, Search, RefreshCw, Filter } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res: any = await api.get('/admin/audit-logs');
      setLogs(res.data?.logs || res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = logs.filter(
    (log) =>
      log.action?.toLowerCase().includes(search.toLowerCase()) ||
      log.target?.toLowerCase().includes(search.toLowerCase()) ||
      log.user?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      log.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-6xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Shield className="w-4 h-4" />
            </div>
            <span>Security &amp; Governance Audit Logs</span>
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Full audit trail of administrative actions, user logins, and profile modifications.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold hover:text-white hover:border-slate-700 transition flex items-center gap-1.5 shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by action, user, email, or target IP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none transition"
          />
        </div>
      </div>

      {/* Logs Table */}
      {isLoading ? (
        <div className="p-8 flex justify-center"><Spinner size="lg" /></div>
      ) : (
        <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead className="bg-slate-950/60 text-[11px] text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Target Details</th>
                  <th className="py-2.5 px-3">IP Address</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                      No security audit logs found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-2 px-3 font-semibold text-white flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>{log.action}</span>
                      </td>
                      <td className="py-2 px-3">
                        {log.user ? (
                          <div>
                            <p className="font-semibold text-white leading-tight">{log.user.fullName}</p>
                            <p className="text-[11px] text-slate-400 leading-tight">{log.user.email}</p>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px] font-mono">System Automated</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-[11px] font-mono text-slate-400 max-w-xs truncate">
                        {log.target || '—'}
                      </td>
                      <td className="py-2 px-3 text-[11px] font-mono text-slate-400">
                        {log.ipAddress || '127.0.0.1'}
                      </td>
                      <td className="py-2 px-3 text-[11px] text-slate-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
