import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/client';
import type { CompanyInvite, Company } from '../../types';
import {
  Building2, Plus, Copy, Mail, Check, X, RefreshCw, Clock, Users,
  Briefcase, Link as LinkIcon, Shield, ChevronDown, AlertCircle, Search,
  Trash2, ShieldCheck, ShieldAlert, Power, RotateCcw, Info, CheckCircle2,
  AlertTriangle, ExternalLink
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  ACCEPTED: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  EXPIRED: 'bg-slate-500/15 text-slate-400 border border-slate-500/30',
  REVOKED: 'bg-red-500/15 text-red-400 border border-red-500/30',
};

export function getInviteActualStatus(invite: CompanyInvite): 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED' {
  if (invite.status === 'REVOKED') return 'REVOKED';
  const isExpired = new Date(invite.expiresAt) < new Date();
  if (isExpired) return 'EXPIRED';
  const registeredCount = invite.usageCount ?? invite.companies?.length ?? 0;
  if (registeredCount > 0 || invite.status === 'ACCEPTED') return 'ACCEPTED';
  return 'PENDING';
}

function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    PENDING: 'Pending',
    ACCEPTED: 'Accepted / Active',
    EXPIRED: 'Expired',
    REVOKED: 'Deactivated / Revoked',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[status] || STATUS_COLORS.PENDING}`}>
      {status === 'PENDING' && <Clock className="w-3 h-3" />}
      {status === 'ACCEPTED' && <Check className="w-3 h-3" />}
      {status === 'EXPIRED' && <AlertCircle className="w-3 h-3" />}
      {status === 'REVOKED' && <X className="w-3 h-3" />}
      {labels[status] || status}
    </span>
  );
}

function ConfirmModal({
  title,
  message,
  confirmText,
  variant = 'danger',
  isLoading,
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  confirmText: string;
  variant?: 'danger' | 'primary';
  isLoading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            variant === 'danger' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' : 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
          }`}>
            {variant === 'danger' ? <AlertTriangle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-white font-bold text-base">{title}</h3>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex gap-2.5 justify-end pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:text-white transition text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-xl text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-lg ${
              variant === 'danger'
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'
            } disabled:opacity-50`}
          >
            {isLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateInviteModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ companyName: '', email: '', expiresInDays: 30, sendEmail: true });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedLink, setCopiedLink] = useState('');
  const [sentCount, setSentCount] = useState(0);

  const parsedEmails = form.email
    .split(/[\s,;]+/)
    .map(e => e.trim())
    .filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
  const uniqueRecipientCount = Array.from(new Set(parsedEmails.map(e => e.toLowerCase()))).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uniqueRecipientCount === 0) {
      setError('Please provide at least one valid company email address.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res: any = await api.post('/companies/invites', form);
      const invite = res.data?.data || res.data;
      const frontendUrl = window.location.origin;
      const link = `${frontendUrl}/register/company?token=${invite.token}`;
      setCopiedLink(link);
      setSentCount(uniqueRecipientCount);
      onCreated();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create invitation.');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(copiedLink);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-md max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Compact Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/25 shrink-0">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-sm sm:text-base leading-tight">Create Partner Invitation</h2>
              <p className="text-slate-400 text-xs">Shared link & marketing email broadcast</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white p-1 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {!copiedLink ? (
          <form onSubmit={handleSubmit} className="p-4 space-y-3 overflow-y-auto flex-1 text-left">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-2.5 flex items-center gap-2 text-red-400 text-xs">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {error}
              </div>
            )}

            {/* Campaign & Validity 2-col Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Campaign Label <span className="text-slate-500 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.companyName}
                  onChange={e => setForm(p => ({ ...p, companyName: e.target.value }))}
                  placeholder="e.g. Q3 Tech Partners"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Link Validity</label>
                <select
                  value={form.expiresInDays}
                  onChange={e => setForm(p => ({ ...p, expiresInDays: parseInt(e.target.value) }))}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                >
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                  <option value={60}>60 days</option>
                  <option value={90}>90 days</option>
                </select>
              </div>
            </div>

            {/* Recipient Emails */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Recipient Company Emails <span className="text-red-400">*</span>
                </label>
                {uniqueRecipientCount > 0 && (
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold border border-emerald-500/20">
                    ✨ {uniqueRecipientCount} detected
                  </span>
                )}
              </div>
              <textarea
                required
                rows={3}
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="Separate with commas or lines:&#10;hiring@google.com, hr@meta.com&#10;talent@stripe.com"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition resize-none text-xs font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-0.5">
                Acts as CC: Multiple companies can independently register using this same shared link.
              </p>
            </div>

            {/* Send Marketing Email Checkbox */}
            <label className="flex items-start gap-2.5 cursor-pointer p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 hover:border-indigo-500/40 transition">
              <div className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center shrink-0 transition ${form.sendEmail ? 'bg-indigo-600 border-indigo-600' : 'border-slate-600 bg-slate-900'}`}>
                {form.sendEmail && <Check className="w-3 h-3 text-white" />}
              </div>
              <input type="checkbox" className="sr-only" checked={form.sendEmail} onChange={e => setForm(p => ({ ...p, sendEmail: e.target.checked }))} />
              <div>
                <p className="text-white text-xs font-medium">Auto-dispatch marketing email to all recipients</p>
                <p className="text-slate-400 text-[11px]">Sends high-converting email detailing pre-vetted portfolios and AI matching</p>
              </div>
            </label>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onClose} className="flex-1 px-3 py-2 rounded-xl border border-slate-700 text-slate-300 hover:text-white transition text-xs sm:text-sm font-medium">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="flex-1 px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-xs sm:text-sm hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/20">
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                {loading ? 'Creating...' : `Dispatch (${uniqueRecipientCount > 0 ? `${uniqueRecipientCount} Email${uniqueRecipientCount > 1 ? 's' : ''}` : 'Invite'})`}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-4 space-y-3 text-center overflow-y-auto flex-1">
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-base">Campaign Active!</h3>
              <p className="text-slate-400 text-xs mt-0.5">
                {form.sendEmail && sentCount > 0
                  ? `Branded invitation dispatched to ${sentCount} recipient company address${sentCount > 1 ? 'es' : ''}.`
                  : 'Shared invitation link is active.'}
              </p>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-left">
              <p className="text-[10px] text-slate-500 mb-1 font-bold uppercase tracking-wider">Shared Registration Link</p>
              <p className="text-indigo-400 text-xs break-all font-mono select-all">{copiedLink}</p>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={copyLink} className="flex-1 px-3 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs sm:text-sm hover:bg-indigo-500 transition flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/20">
                <Copy className="w-3.5 h-3.5" />
                Copy Link
              </button>
              <button onClick={onClose} className="flex-1 px-3 py-2 rounded-xl border border-slate-700 text-slate-300 hover:text-white transition text-xs sm:text-sm font-medium">
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function CompanyInvitesPage() {
  const [invites, setInvites] = useState<CompanyInvite[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'invites' | 'companies'>('invites');
  const [statusFilter, setStatusFilter] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [companiesTotal, setCompaniesTotal] = useState(0);

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState<{
    type: 'company' | 'invite';
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast feedback
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchInvites = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      const res: any = await api.get('/companies/invites', { params });
      const data = res.data || res;
      setInvites(Array.isArray(data.invites) ? data.invites : []);
      setTotal(data.total || 0);
    } catch {
      setInvites([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const fetchCompanies = useCallback(async () => {
    try {
      const res: any = await api.get('/companies/all');
      const data = res.data || res;
      setCompanies(Array.isArray(data.companies) ? data.companies : []);
      setCompaniesTotal(data.total || 0);
    } catch {
      setCompanies([]);
    }
  }, []);

  useEffect(() => {
    fetchInvites();
    fetchCompanies();
  }, [fetchInvites, fetchCompanies]);

  const handleCopyLink = (token: string, id: string) => {
    const link = `${window.location.origin}/register/company?token=${token}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResend = async (id: string) => {
    setResendingId(id);
    try {
      await api.post(`/companies/invites/${id}/resend`);
      showToast('success', 'Marketing invitation email resent successfully.');
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to resend invite email.');
    } finally {
      setResendingId(null);
    }
  };

  const handleDeactivate = async (id: string) => {
    setActionLoadingId(id);
    try {
      await api.patch(`/companies/invites/${id}/revoke`);
      showToast('success', 'Invitation link deactivated. It will no longer accept registrations.');
      fetchInvites();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to deactivate invitation.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReactivate = async (id: string) => {
    setActionLoadingId(id);
    try {
      await api.patch(`/companies/invites/${id}/reactivate`);
      showToast('success', 'Invitation link reactivated and ready for use.');
      fetchInvites();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to reactivate invitation.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleExecuteDelete = async () => {
    if (!deleteModal) return;
    setIsDeleting(true);
    try {
      if (deleteModal.type === 'invite') {
        await api.delete(`/companies/invites/${deleteModal.id}`);
        showToast('success', 'Invitation link deleted permanently.');
        fetchInvites();
      } else {
        await api.delete(`/companies/${deleteModal.id}`);
        showToast('success', `Company "${deleteModal.name}" and associated account deleted.`);
        fetchCompanies();
      }
      setDeleteModal(null);
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to complete deletion.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleVerify = async (companyId: string, currentVerified: boolean) => {
    setActionLoadingId(companyId);
    try {
      const res: any = await api.patch(`/companies/${companyId}/verify`, { isVerified: !currentVerified });
      showToast('success', res.data?.message || (!currentVerified ? 'Company verified as official partner.' : 'Company unverified.'));
      fetchCompanies();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to update company verification status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleCompanyStatus = async (companyId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setActionLoadingId(companyId);
    try {
      const res: any = await api.patch(`/companies/${companyId}/status`, { status: newStatus });
      showToast('success', res.data?.message || `Company status changed to ${newStatus}.`);
      fetchCompanies();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to update company status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredCompanies = companies.filter(c => {
    if (!companySearch.trim()) return true;
    const query = companySearch.toLowerCase();
    return (
      c.name.toLowerCase().includes(query) ||
      (c.industry && c.industry.toLowerCase().includes(query)) ||
      (c.user?.email && c.user.email.toLowerCase().includes(query)) ||
      (c.contactPerson && c.contactPerson.toLowerCase().includes(query))
    );
  });

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-7xl mx-auto pb-10">
      {/* Toast notification banner */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 text-xs font-semibold ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/90 border-rose-500/40 text-rose-300'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <ConfirmModal
          title={deleteModal.type === 'invite' ? 'Delete Invitation Link' : 'Delete Company Profile & Account'}
          message={
            deleteModal.type === 'invite'
              ? `Are you sure you want to delete this invitation (${deleteModal.name})? Any unregistered invite link will stop functioning. Registered companies previously onboarded through this link will remain intact.`
              : `Are you sure you want to permanently delete "${deleteModal.name}"? This action cannot be undone. All company job postings, profile information, and the associated employer login account will be removed.`
          }
          confirmText={deleteModal.type === 'invite' ? 'Delete Invitation' : 'Delete Company'}
          variant="danger"
          isLoading={isDeleting}
          onConfirm={handleExecuteDelete}
          onClose={() => setDeleteModal(null)}
        />
      )}

      {showCreateModal && (
        <CreateInviteModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchInvites();
            fetchCompanies();
          }}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Building2 className="w-4 h-4" />
            </div>
            Company Partner Portal
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage employer invitations, partner verification, and registered company accounts</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition shadow-md shadow-indigo-600/20 shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Create Invitation
        </button>
      </div>

      {/* Informational Guidance Banner */}
      <div className="bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-purple-950/40 border border-indigo-500/20 rounded-xl p-3 flex items-start gap-3 shadow-md">
        <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
          <Info className="w-3.5 h-3.5" />
        </div>
        <div className="text-[11px] space-y-1">
          <p className="text-indigo-200 font-bold text-xs">How Invitation Lifecycle & Verification Work</p>
          <p className="text-slate-300 leading-relaxed">
            • <strong className="text-white">Status Transition:</strong> Newly created invitations start as <span className="text-amber-400 font-semibold">Pending</span>. Once an employer completes registration through the private link, the invite automatically marks as <span className="text-emerald-400 font-semibold">Accepted / Active</span>.
          </p>
          <p className="text-slate-300 leading-relaxed">
            • <strong className="text-white">Partner Verification:</strong> Registered companies initially display as <span className="text-amber-400 font-semibold">Pending Verification</span>. Use the <strong className="text-emerald-400">Verify</strong> button on any company card to bestow official <span className="text-emerald-400 font-semibold">Verified Partner</span> status or suspend/delete company access as needed.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Invites', value: total, icon: Mail, color: 'from-blue-500 to-cyan-500' },
          { label: 'Pending Invites', value: invites.filter(i => getInviteActualStatus(i) === 'PENDING').length, icon: Clock, color: 'from-amber-500 to-orange-500' },
          { label: 'Accepted / In-Use', value: invites.filter(i => getInviteActualStatus(i) === 'ACCEPTED').length, icon: Check, color: 'from-emerald-500 to-teal-500' },
          { label: 'Partner Companies', value: companiesTotal, icon: Building2, color: 'from-indigo-500 to-purple-500' },
        ].map(stat => (
          <div key={stat.label} className="bg-slate-900 border border-slate-800 rounded-xl p-3">
            <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-2`}>
              <stat.icon className="w-3.5 h-3.5 text-white" />
            </div>
            <p className="text-xl font-bold text-white">{stat.value}</p>
            <p className="text-slate-400 text-[11px] mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 w-fit">
        {(['invites', 'companies'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition capitalize ${activeTab === tab ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-white'}`}
          >
            {tab === 'invites' ? `Invitations (${total})` : `Partner Companies (${companiesTotal})`}
          </button>
        ))}
      </div>

      {activeTab === 'invites' && (
        <>
          {/* Filter */}
          <div className="flex items-center gap-2 mb-3">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="appearance-none bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending (Awaiting)</option>
                <option value="ACCEPTED">Accepted / Active</option>
                <option value="EXPIRED">Expired</option>
                <option value="REVOKED">Deactivated / Revoked</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            </div>
            <button
              onClick={fetchInvites}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg border border-slate-700 hover:border-slate-600 transition"
              title="Refresh Invitations"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Invitations Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
              </div>
            ) : invites.length === 0 ? (
              <div className="text-center py-12">
                <Mail className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                <p className="text-slate-400 font-medium text-xs">No invitations found</p>
                <p className="text-slate-600 text-[11px] mt-0.5">Create your first company invitation above</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/40">
                      {['Campaign / Recipients', 'Status', 'Expires', 'Registered Companies', 'Actions'].map(h => (
                        <th key={h} className="text-left px-3 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {invites.map(invite => {
                      const emails = invite.email.split(/[\s,;]+/).filter(Boolean);
                      const actualStatus = getInviteActualStatus(invite);
                      const registeredCount = invite.usageCount ?? invite.companies?.length ?? 0;
                      const isRevoked = actualStatus === 'REVOKED';
                      const isExpired = actualStatus === 'EXPIRED';

                      return (
                        <tr key={invite.id} className="hover:bg-slate-800/30 transition">
                          <td className="px-3 py-2.5">
                            <p className="text-white font-medium text-xs">
                              {invite.companyName || 'Multi-Company Partner Campaign'}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className="text-[10px] font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 px-1.5 py-0.5 rounded">
                                {emails.length} recipient{emails.length > 1 ? 's' : ''}
                              </span>
                              <span className="text-slate-400 text-[11px] truncate max-w-xs" title={invite.email}>
                                {invite.email}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <StatusBadge status={actualStatus} />
                          </td>
                          <td className="px-3 py-2.5 text-slate-400 text-xs whitespace-nowrap">
                            {new Date(invite.expiresAt).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              registeredCount > 0
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}>
                              {registeredCount} {registeredCount === 1 ? 'company' : 'companies'} registered
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-1">
                              {/* Copy Link */}
                              {!isRevoked && !isExpired && (
                                <button
                                  onClick={() => handleCopyLink(invite.token, invite.id)}
                                  title="Copy registration link"
                                  className="p-1 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition"
                                >
                                  {copiedId === invite.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              )}

                              {/* Resend Email */}
                              {!isRevoked && !isExpired && (
                                <button
                                  onClick={() => handleResend(invite.id)}
                                  title="Resend marketing email to all recipients"
                                  disabled={resendingId === invite.id}
                                  className="p-1 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition disabled:opacity-50"
                                >
                                  {resendingId === invite.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                                </button>
                              )}

                              {/* Deactivate (Revoke) link */}
                              {!isRevoked && !isExpired && (
                                <button
                                  onClick={() => handleDeactivate(invite.id)}
                                  title="Deactivate / Revoke link"
                                  disabled={actionLoadingId === invite.id}
                                  className="p-1 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition disabled:opacity-50"
                                >
                                  {actionLoadingId === invite.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Power className="w-3.5 h-3.5" />}
                                </button>
                              )}

                              {/* Reactivate link */}
                              {isRevoked && (
                                <button
                                  onClick={() => handleReactivate(invite.id)}
                                  title="Reactivate invitation link"
                                  disabled={actionLoadingId === invite.id}
                                  className="p-1 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition disabled:opacity-50"
                                >
                                  {actionLoadingId === invite.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                                </button>
                              )}

                              {/* Delete Invitation Link */}
                              <button
                                onClick={() => setDeleteModal({
                                  type: 'invite',
                                  id: invite.id,
                                  name: invite.companyName || invite.email,
                                })}
                                title="Delete invitation link permanently"
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'companies' && (
        <>
          {/* Company Search & Quick Filter */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={companySearch}
                onChange={e => setCompanySearch(e.target.value)}
                placeholder="Search company, contact person, email..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-white text-xs placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition"
              />
            </div>
            <button
              onClick={fetchCompanies}
              className="px-3 py-1.5 text-slate-400 hover:text-white rounded-lg border border-slate-700 hover:border-slate-600 transition flex items-center gap-1.5 text-xs self-start sm:self-auto"
              title="Refresh Companies"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {filteredCompanies.length === 0 ? (
            <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-xl">
              <Building2 className="w-10 h-10 text-slate-700 mx-auto mb-2" />
              <p className="text-slate-400 font-medium text-xs">No partner companies found</p>
              <p className="text-slate-600 text-[11px] mt-0.5">Companies appear here after accepting an invitation and registering</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {filteredCompanies.map(company => {
                const isVerified = Boolean(company.user?.emailVerified);
                const isActive = company.user?.status === 'ACTIVE';
                const isBusy = actionLoadingId === company.id;

                return (
                  <div
                    key={company.id}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 hover:border-indigo-500/40 transition flex flex-col justify-between shadow-lg"
                  >
                    <div>
                      {/* Top Bar: Avatar, Name & Status Badges */}
                      <div className="flex items-start justify-between gap-2.5 mb-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md shadow-indigo-500/20">
                            {company.name[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-white font-bold text-xs truncate flex items-center gap-1.5">
                              <span>{company.name}</span>
                              {company.website && (
                                <a
                                  href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-slate-500 hover:text-indigo-400 transition"
                                  title="Visit Website"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </h3>
                            <p className="text-slate-400 text-[11px] truncate">{company.industry || 'Industry not specified'}</p>
                          </div>
                        </div>

                        {/* Delete Company Button */}
                        <button
                          onClick={() => setDeleteModal({ type: 'company', id: company.id, name: company.name })}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition shrink-0"
                          title="Delete Company Profile & Account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Status Badges Row */}
                      <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                        {/* Verification Badge */}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            isVerified
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {isVerified ? <ShieldCheck className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {isVerified ? 'Verified Partner' : 'Pending Verification'}
                        </span>

                        {/* Account Status Badge */}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            isActive
                              ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {isActive ? <Check className="w-2.5 h-2.5" /> : <Power className="w-2.5 h-2.5" />}
                          {company.user?.status || 'ACTIVE'}
                        </span>
                      </div>

                      {/* Details list */}
                      <div className="space-y-1.5 text-[11px] text-slate-300 mb-3 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80">
                        {company.contactPerson && (
                          <p className="flex items-center justify-between">
                            <span className="text-slate-500">Contact:</span>
                            <span className="text-white font-medium">{company.contactPerson}</span>
                          </p>
                        )}
                        <p className="flex items-center justify-between">
                          <span className="text-slate-500">Account Email:</span>
                          <span className="text-indigo-400 font-mono truncate max-w-[180px]" title={company.user?.email}>
                            {company.user?.email || 'N/A'}
                          </span>
                        </p>
                        {company.location && (
                          <p className="flex items-center justify-between">
                            <span className="text-slate-500">Location:</span>
                            <span className="text-slate-300">{company.location}</span>
                          </p>
                        )}
                        {company.companySize && (
                          <p className="flex items-center justify-between">
                            <span className="text-slate-500">Company Size:</span>
                            <span className="text-slate-300">{company.companySize} employees</span>
                          </p>
                        )}
                        <p className="flex items-center justify-between">
                          <span className="text-slate-500">Joined:</span>
                          <span className="text-slate-400">{new Date(company.createdAt).toLocaleDateString()}</span>
                        </p>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-500 font-medium">
                        {company._count?.jobs || 0} job{(company._count?.jobs || 0) !== 1 ? 's' : ''} active
                      </span>

                      <div className="flex items-center gap-1.5">
                        {/* Verify / Unverify Action */}
                        <button
                          onClick={() => handleToggleVerify(company.id, isVerified)}
                          disabled={isBusy}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition border ${
                            isVerified
                              ? 'bg-slate-800 text-slate-400 border-slate-700 hover:text-amber-400 hover:border-amber-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                          } disabled:opacity-50`}
                          title={isVerified ? 'Remove verification status' : 'Verify company as official trusted partner'}
                        >
                          {isBusy ? <RefreshCw className="w-3 h-3 animate-spin" /> : isVerified ? <ShieldAlert className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                          <span>{isVerified ? 'Unverify' : 'Verify Company'}</span>
                        </button>

                        {/* Suspend / Activate Account Action */}
                        <button
                          onClick={() => handleToggleCompanyStatus(company.id, company.user?.status || 'ACTIVE')}
                          disabled={isBusy}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition border ${
                            isActive
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                              : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/20'
                          } disabled:opacity-50`}
                          title={isActive ? 'Suspend company login access' : 'Activate company access'}
                        >
                          <Power className="w-3 h-3" />
                          <span>{isActive ? 'Suspend' : 'Activate'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
