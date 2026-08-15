import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { Spinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';
import { Users, Lock, CheckCircle2, Shield, Trash2 } from 'lucide-react';

export const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res: any = await api.get('/admin/users');
      setUsers(res.data.users || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await api.put(`/admin/users/${id}/status`, { isActive: !currentStatus });
      fetchUsers();
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return <div className="p-8 flex justify-center"><Spinner size="lg" /></div>;
  }

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Tenant Account Management</h1>
        <p className="text-slate-400 text-sm">Manage platform tenant accounts, roles, and status.</p>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-600/20 text-purple-400 font-bold flex items-center justify-center">
                  {u.fullName.charAt(0)}
                </div>
                <div>
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    <span>{u.fullName}</span>
                    <span className="text-xs font-mono text-indigo-400">({u.subdomains?.[0]?.slug || 'no-subdomain'})</span>
                  </h4>
                  <p className="text-xs text-slate-400">{u.email} — Role: {u.role}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${u.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                  {u.isActive ? 'ACTIVE' : 'SUSPENDED'}
                </span>

                {u.role !== 'SUPER_ADMIN' && (
                  <Button
                    variant={u.isActive ? 'danger' : 'success'}
                    size="sm"
                    onClick={() => handleToggleStatus(u.id, u.isActive)}
                  >
                    {u.isActive ? 'Suspend' : 'Activate'}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
