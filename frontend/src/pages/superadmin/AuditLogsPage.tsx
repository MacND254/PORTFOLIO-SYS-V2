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
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Security & Governance Audit Logs</h1>
          <p className="text-slate-400 text-sm">Full audit trail of administrative actions, user logins, and profile modifications.</p>
        </div>
        <button
          onClick={fetchLogs}
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold hover:text-white hover:border-slate-700 transition flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Logs
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-4 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by action, user, email, or target IP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Logs Table */}
      {isLoading ? (
        <div className="p-8 flex justify-center"><Spinner size="lg" /></div>
      ) : (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/50 text-xs text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-4">Action</th>
                <th className="p-4">User</th>
                <th className="p-4">Target Details</th>
                <th className="p-4">IP Address</th>
                <th className="p-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No security audit logs found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition">
                    <td className="p-4 font-bold text-white flex items-center gap-2">
                      <Shield className="w-4 h-4 text-indigo-400" />
                      {log.action}
                    </td>
                    <td className="p-4">
                      {log.user ? (
                        <div>
                          <p className="font-semibold text-white">{log.user.fullName}</p>
                          <p className="text-xs text-slate-400">{log.user.email}</p>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs font-mono">System Automated</span>
                      )}
                    </td>
                    <td className="p-4 text-xs font-mono text-slate-400 max-w-xs truncate">
                      {log.target || '—'}
                    </td>
                    <td className="p-4 text-xs font-mono text-slate-400">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                    <td className="p-4 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
