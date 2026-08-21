import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { Spinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';
import {
  Users,
  Search,
  Filter,
  Shield,
  ShieldAlert,
  UserCheck,
  UserX,
  KeyRound,
  Eye,
  X,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  FileText,
  MessageSquare,
  Star,
  Activity,
  Globe,
  Calendar,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';

export const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Selected User Detail Modal State
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<any | null>(null);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  // Password Reset Modal State
  const [resetModalUserId, setResetModalUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetResult, setResetResult] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Action status notification banner
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [page, search, statusFilter, roleFilter]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (search) params.search = search;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (roleFilter !== 'ALL') params.role = roleFilter;

      const res: any = await api.get('/admin/users', { params });
      const data = res.data;
      setUsers(data.users || []);
      setTotalPages(data.totalPages || 1);
      setTotalUsers(data.total || 0);
    } catch (e: any) {
      showToast('error', e.message || 'Failed to fetch users.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (userId: string, newStatus: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED') => {
    try {
      await api.put(`/admin/users/${userId}/status`, { status: newStatus });
      showToast('success', `User status updated to ${newStatus}.`);

      // Refresh list & current open modal if matches
      fetchUsers();
      if (selectedUserId === userId) {
        fetchUserDetails(userId);
      }
    } catch (e: any) {
      showToast('error', e.message || 'Failed to update user status.');
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'ADMIN' | 'SUPER_ADMIN') => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      showToast('success', `User role updated to ${newRole}.`);
      fetchUsers();
      if (selectedUserId === userId) {
        fetchUserDetails(userId);
      }
    } catch (e: any) {
      showToast('error', e.message || 'Failed to update user role.');
    }
  };

  const fetchUserDetails = async (userId: string) => {
    setSelectedUserId(userId);
    setIsFetchingDetails(true);
    try {
      const res: any = await api.get(`/admin/users/${userId}`);
      setUserDetails(res.data);
    } catch (e: any) {
      showToast('error', e.message || 'Failed to fetch user details.');
      setSelectedUserId(null);
    } finally {
      setIsFetchingDetails(false);
    }
  };

  const handleForceResetPassword = async () => {
    if (!resetModalUserId) return;
    setIsResetting(true);
    try {
      const res: any = await api.post(`/admin/users/${resetModalUserId}/reset-password`, {
        newPassword: newPassword.trim() || undefined,
      });
      setResetResult(res.data?.newPassword || newPassword || 'ChangeMe@12345');
      showToast('success', 'Password reset successfully.');
    } catch (e: any) {
      showToast('error', e.message || 'Failed to reset password.');
    } finally {
      setIsResetting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto selection:bg-indigo-500 selection:text-white">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 text-xs font-semibold ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/90 border-rose-500/40 text-rose-300'
          }`}
        >
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-indigo-400" />
            <span>Tenant Account Management</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Monitor, inspect, suspend, activate, and manage platform tenant accounts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4" />
            <span>{totalUsers} Registered Tenants</span>
          </div>
          <button
            onClick={fetchUsers}
            className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition"
            title="Refresh List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search name, email, or subdomain…"
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="py-1.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-200 focus:border-indigo-500 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
              <option value="DEACTIVATED">DEACTIVATED</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-400">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="py-1.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-200 focus:border-indigo-500 focus:outline-none"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">ADMIN</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Spinner size="lg" />
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <UserX className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-slate-400 text-sm font-semibold">No tenant accounts found.</p>
            <p className="text-xs text-slate-500">Try adjusting your search query or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Tenant User</th>
                  <th className="p-4">Subdomain Slug</th>
                  <th className="p-4">Profession</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {users.map((u) => {
                  const isSuperAdmin = u.role === 'SUPER_ADMIN';
                  const isActive = u.status === 'ACTIVE';
                  const isSuspended = u.status === 'SUSPENDED';

                  return (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 p-0.5 shrink-0 shadow-md">
                            <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center font-bold text-white text-xs">
                              {u.fullName?.charAt(0) || 'U'}
                            </div>
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-white group-hover:text-indigo-400 transition truncate">
                              {u.fullName}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate font-mono">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 font-mono text-indigo-400">
                        {u.subdomain ? (
                          <a
                            href={`/p/${u.subdomain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline flex items-center gap-1.5"
                          >
                            <span>{u.subdomain}</span>
                            <ExternalLink className="w-3 h-3 text-slate-500" />
                          </a>
                        ) : (
                          <span className="text-slate-600 font-normal italic">None</span>
                        )}
                      </td>

                      <td className="p-4 text-slate-300">
                        {u.desiredProfession || u.profile?.title || 'General'}
                      </td>

                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                            isSuperAdmin
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                              : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20'
                          }`}
                        >
                          {isSuperAdmin && <Shield className="w-3 h-3" />}
                          {u.role}
                        </span>
                      </td>

                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isActive
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                              : isSuspended
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => fetchUserDetails(u.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600/20 text-slate-300 hover:text-indigo-400 border border-slate-700 hover:border-indigo-500/30 transition"
                            title="View Tenant Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setResetModalUserId(u.id);
                              setNewPassword('');
                              setResetResult(null);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-600/20 text-slate-300 hover:text-amber-400 border border-slate-700 hover:border-amber-500/30 transition"
                            title="Force Reset Password"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {!isSuperAdmin && (
                            <>
                              {isActive ? (
                                <button
                                  onClick={() => handleUpdateStatus(u.id, 'SUSPENDED')}
                                  className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition text-xs font-semibold flex items-center gap-1"
                                  title="Suspend Tenant Account"
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                  <span>Suspend</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUpdateStatus(u.id, 'ACTIVE')}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition text-xs font-semibold flex items-center gap-1"
                                  title="Activate Tenant Account"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  <span>Activate</span>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
            <span>
              Page <strong className="text-white">{page}</strong> of <strong className="text-white">{totalPages}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:text-white disabled:opacity-40 transition flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:text-white disabled:opacity-40 transition flex items-center gap-1"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* USER DETAILS SLIDE-OVER MODAL */}
      {selectedUserId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 p-0.5">
                  <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-white font-bold text-sm">
                    {userDetails?.fullName?.charAt(0) || 'U'}
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{userDetails?.fullName}</h3>
                  <p className="text-xs text-slate-400 font-mono">{userDetails?.email}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedUserId(null);
                  setUserDetails(null);
                }}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isFetchingDetails || !userDetails ? (
              <div className="p-12 flex justify-center">
                <Spinner size="lg" />
              </div>
            ) : (
              <div className="space-y-6 text-xs">
                {/* Account Status Card */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Account Status &amp; Role</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          userDetails.status === 'ACTIVE'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {userDetails.status}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
                        {userDetails.role}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {userDetails.role !== 'SUPER_ADMIN' && (
                      <>
                        {userDetails.status === 'ACTIVE' ? (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleUpdateStatus(userDetails.id, 'SUSPENDED')}
                          >
                            Suspend Account
                          </Button>
                        ) : (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleUpdateStatus(userDetails.id, 'ACTIVE')}
                          >
                            Activate Account
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Subdomains & Portfolio Link */}
                <div className="space-y-2">
                  <h4 className="font-bold text-white uppercase text-[11px] tracking-wider text-slate-400">Subdomains &amp; Public Site</h4>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    {userDetails.subdomains?.map((sub: any) => (
                      <div key={sub.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-mono text-indigo-400">
                          <Globe className="w-4 h-4" />
                          <span>{sub.slug}.myportfolio.com</span>
                          {sub.isPrimary && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold">Primary</span>
                          )}
                        </div>
                        <a
                          href={`/p/${sub.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition flex items-center gap-1"
                        >
                          <span>Visit Site</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Activity & Metrics Grid */}
                <div className="space-y-2">
                  <h4 className="font-bold text-white uppercase text-[11px] tracking-wider text-slate-400">Tenant Platform Usage</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-1">
                      <MessageSquare className="w-4 h-4 text-indigo-400 mx-auto" />
                      <p className="text-lg font-extrabold text-white">{userDetails.profile?._count?.contactMessages || 0}</p>
                      <p className="text-[10px] text-slate-400">Messages</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-1">
                      <Star className="w-4 h-4 text-amber-400 mx-auto" />
                      <p className="text-lg font-extrabold text-white">{userDetails.profile?._count?.reviews || 0}</p>
                      <p className="text-[10px] text-slate-400">Reviews</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-1">
                      <Activity className="w-4 h-4 text-emerald-400 mx-auto" />
                      <p className="text-lg font-extrabold text-white">{userDetails.profile?._count?.analyticsEvents || 0}</p>
                      <p className="text-[10px] text-slate-400">Analytics Events</p>
                    </div>
                  </div>
                </div>

                {/* Profile Overview */}
                <div className="space-y-2">
                  <h4 className="font-bold text-white uppercase text-[11px] tracking-wider text-slate-400">Profile &amp; Theme Details</h4>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Primary Profession:</span>
                      <span className="font-bold text-white">{userDetails.desiredProfession || userDetails.profile?.title || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Profile Completeness:</span>
                      <span className="font-bold text-emerald-400">{userDetails.profile?.completenessScore || 0}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Active Theme:</span>
                      <span className="font-mono text-indigo-400">{userDetails.profile?.customization?.themeId || 'software-engineer'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Published Status:</span>
                      <span className="font-bold text-slate-200">
                        {userDetails.profile?.portfolioStatus?.isPublished ? 'PUBLISHED' : 'DRAFT'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Account Registered:</span>
                      <span className="text-slate-300 font-mono">
                        {new Date(userDetails.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Super Admin Quick Actions */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <h4 className="font-bold text-white uppercase text-[11px] tracking-wider text-slate-400">Administrative Governance</h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        const targetRole = userDetails.role === 'SUPER_ADMIN' ? 'ADMIN' : 'SUPER_ADMIN';
                        handleUpdateRole(userDetails.id, targetRole);
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white transition text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Shield className="w-3.5 h-3.5 text-amber-400" />
                      <span>{userDetails.role === 'SUPER_ADMIN' ? 'Demote to Admin' : 'Promote to Super Admin'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setResetModalUserId(userDetails.id);
                        setNewPassword('');
                        setResetResult(null);
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white transition text-xs font-semibold flex items-center gap-1.5"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Force Reset Password</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FORCE RESET PASSWORD MODAL */}
      {resetModalUserId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <span>Force Reset Password</span>
              </h3>
              <button
                onClick={() => setResetModalUserId(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {resetResult ? (
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Password Reset Successfully!</span>
                </div>
                <p className="text-xs text-slate-300">
                  The user's new temporary password is:
                </p>
                <div className="p-3 rounded-lg bg-slate-950 font-mono text-indigo-300 text-sm font-bold flex items-center justify-between border border-slate-800">
                  <span>{resetResult}</span>
                  <button
                    onClick={() => copyToClipboard(resetResult)}
                    className="p-1 text-slate-400 hover:text-white transition"
                    title="Copy Password"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => setResetModalUserId(null)}
                >
                  Done
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-400">
                  Enter a new password for this tenant account, or leave blank to automatically set default password <code className="text-indigo-300 bg-slate-950 px-1.5 py-0.5 rounded font-mono">ChangeMe@12345</code>.
                </p>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">New Password (Optional)</label>
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Leave blank for default ChangeMe@12345"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="primary"
                    className="w-full"
                    isLoading={isResetting}
                    onClick={handleForceResetPassword}
                  >
                    Reset Password
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setResetModalUserId(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
