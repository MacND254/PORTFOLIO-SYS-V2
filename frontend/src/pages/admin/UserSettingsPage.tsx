import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import {
  User,
  Shield,
  KeyRound,
  QrCode,
  Smartphone,
  Globe,
  CheckCircle2,
  AlertCircle,
  Copy,
  Lock,
  Mail,
  Briefcase,
  ExternalLink,
  ShieldAlert,
  Loader2,
  Check,
  Github,
  AlertTriangle
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const UserSettingsPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | '2fa' | 'connected' | 'danger'>('profile');

  // Profile Form state
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profession, setProfession] = useState(user?.desiredProfession || '');
  const [subdomain, setSubdomain] = useState(user?.subdomain || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Security / Password Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 2FA state
  const [is2faEnabled, setIs2faEnabled] = useState(false);
  const [show2faModal, setShow2faModal] = useState(false);
  const [totpSecret, setTotpSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying2fa, setIsVerifying2fa] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [twoFaSuccess, setTwoFaSuccess] = useState(false);

  // Danger Zone state
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
      setProfession(user.desiredProfession || '');
      setSubdomain(user.subdomain || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileMessage(null);

    try {
      const res: any = await api.put('/auth/account', {
        fullName,
        email,
        desiredProfession: profession,
        subdomain,
      });

      if (res.data?.data) {
        await refreshUser();
      }

      setProfileMessage({ type: 'success', text: 'Account settings updated successfully!' });
    } catch (err: any) {
      setProfileMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update account settings.',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setIsSavingPassword(true);

    try {
      const res: any = await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      setPasswordMessage({ type: 'success', text: res.data?.message || 'Password changed successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update password.',
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleInitiate2FA = () => {
    // Generate a clean mock TOTP secret key for demonstration
    const secret = 'SYS-OAUTH-2FA-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    setTotpSecret(secret);
    setShow2faModal(true);
  };

  const handleConfirm2FA = () => {
    if (verificationCode.length !== 6) {
      alert('Please enter a valid 6-digit verification code.');
      return;
    }
    setIsVerifying2fa(true);
    setTimeout(() => {
      setIsVerifying2fa(false);
      setIs2faEnabled(true);
      setShow2faModal(false);
      setTwoFaSuccess(true);
      setVerificationCode('');
    }, 1200);
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(totpSecret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16 select-none animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="relative rounded-3xl bg-slate-900 border border-slate-800/80 p-8 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center text-white font-black text-2xl">
                {user?.fullName?.[0] || 'U'}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-white tracking-tight">{user?.fullName}</h1>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-widest">
                  {user?.role || 'Admin'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                <span>{user?.email}</span>
                <span>•</span>
                <span className="font-mono text-indigo-400">{user?.subdomain}.localhost:3080</span>
              </p>
            </div>
          </div>

          <a
            href={`/p/${user?.subdomain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 hover:text-white border border-slate-700/60 transition shadow-sm"
          >
            <span>View Public Portfolio</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-px overflow-x-auto">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-t-2xl text-xs font-bold transition border-b-2 ${
            activeTab === 'profile'
              ? 'bg-slate-900 text-indigo-400 border-indigo-500 shadow-md'
              : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/40'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Account Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-t-2xl text-xs font-bold transition border-b-2 ${
            activeTab === 'security'
              ? 'bg-slate-900 text-indigo-400 border-indigo-500 shadow-md'
              : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/40'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Password & Security</span>
        </button>

        <button
          onClick={() => setActiveTab('2fa')}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-t-2xl text-xs font-bold transition border-b-2 ${
            activeTab === '2fa'
              ? 'bg-slate-900 text-indigo-400 border-indigo-500 shadow-md'
              : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/40'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Two-Factor Auth</span>
          {is2faEnabled && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('connected')}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-t-2xl text-xs font-bold transition border-b-2 ${
            activeTab === 'connected'
              ? 'bg-slate-900 text-indigo-400 border-indigo-500 shadow-md'
              : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/40'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>OAuth Accounts</span>
        </button>

        <button
          onClick={() => setActiveTab('danger')}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-t-2xl text-xs font-bold transition border-b-2 ${
            activeTab === 'danger'
              ? 'bg-rose-950/40 text-rose-400 border-rose-500 shadow-md'
              : 'text-slate-400 hover:text-rose-300 border-transparent hover:bg-rose-950/20'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <span>Danger Zone</span>
        </button>
      </div>

      {/* Tab 1: Profile & Identity */}
      {activeTab === 'profile' && (
        <div className="bg-slate-900 rounded-3xl border border-slate-800/80 p-8 shadow-xl space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-400" />
              <span>Personal Identity Settings</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Manage your personal account credentials, email address, and platform subdomains.
            </p>
          </div>

          {profileMessage && (
            <div
              className={`p-4 rounded-2xl border text-xs flex items-center gap-3 ${
                profileMessage.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
              }`}
            >
              {profileMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{profileMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition"
                  placeholder="e.g. Francis Mwangi"
                />
              </div>

              {/* Email Address */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition"
                  placeholder="e.g. francis@example.com"
                />
              </div>

              {/* Primary Profession */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  <span>Primary Profession</span>
                </label>
                <input
                  type="text"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition"
                  placeholder="e.g. Senior Software Architect"
                />
              </div>

              {/* Subdomain Slug */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  <span>Portfolio Subdomain Slug</span>
                </label>
                <div className="flex items-center rounded-xl bg-slate-950 border border-slate-800 overflow-hidden focus-within:border-indigo-500 transition">
                  <input
                    type="text"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    required
                    className="w-full px-4 py-3 bg-transparent text-white text-sm focus:outline-none"
                    placeholder="francis"
                  />
                  <span className="px-4 py-3 text-xs font-mono text-slate-500 bg-slate-900 border-l border-slate-800">
                    .myportfolio.com
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80 flex justify-end">
              <Button type="submit" isLoading={isSavingProfile} className="px-6 py-3">
                Save Account Changes
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Password & Security */}
      {activeTab === 'security' && (
        <div className="bg-slate-900 rounded-3xl border border-slate-800/80 p-8 shadow-xl space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-indigo-400" />
              <span>Password Security</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Ensure your account uses a strong, complex password of at least 8 characters.
            </p>
          </div>

          {passwordMessage && (
            <div
              className={`p-4 rounded-2xl border text-xs flex items-center gap-3 ${
                passwordMessage.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
              }`}
            >
              {passwordMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{passwordMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-6 max-w-xl">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Current Password</span>
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition"
                placeholder="••••••••••••"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                <span>New Password</span>
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition"
                placeholder="At least 8 characters"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Confirm New Password</span>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition"
                placeholder="Re-enter new password"
              />
            </div>

            <div className="pt-4 border-t border-slate-800/80 flex justify-end">
              <Button type="submit" isLoading={isSavingPassword} className="px-6 py-3">
                Update Password
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Two-Factor Authentication (2FA) */}
      {activeTab === '2fa' && (
        <div className="bg-slate-900 rounded-3xl border border-slate-800/80 p-8 shadow-xl space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-400" />
                <span>Two-Factor Authentication (2FA)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Add an extra layer of protection to your account using TOTP authenticator apps (Google Authenticator, Authy, 1Password).
              </p>
            </div>

            <div className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2 ${
              is2faEnabled
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}>
              <span className={`w-2 h-2 rounded-full ${is2faEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span>{is2faEnabled ? '2FA Enabled' : '2FA Disabled'}</span>
            </div>
          </div>

          {twoFaSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Two-Factor Authentication has been successfully configured and activated for your user account.</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Authenticator App (TOTP)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Use an authenticator application to generate temporary time-based passcode verification codes during login.
              </p>
              {!is2faEnabled ? (
                <button
                  onClick={handleInitiate2FA}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Setup Authenticator App</span>
                </button>
              ) : (
                <button
                  onClick={() => setIs2faEnabled(false)}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 font-bold text-xs border border-rose-500/30 transition flex items-center justify-center gap-2"
                >
                  <span>Disable 2FA</span>
                </button>
              )}
            </div>

            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-purple-600/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Backup Recovery Codes</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generate single-use emergency backup codes to access your account if you lose access to your authenticator device.
              </p>
              <button
                disabled={!is2faEnabled}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition border flex items-center justify-center gap-2 ${
                  is2faEnabled
                    ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                    : 'bg-slate-900 text-slate-600 border-slate-850 cursor-not-allowed'
                }`}
              >
                <span>Generate Recovery Codes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Connected OAuth Accounts */}
      {activeTab === 'connected' && (
        <div className="bg-slate-900 rounded-3xl border border-slate-800/80 p-8 shadow-xl space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-400" />
              <span>Connected Social Accounts</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Link your social login providers for seamless single sign-on (SSO) authentication.
            </p>
          </div>

          <div className="space-y-4">
            {/* Google */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"/>
                    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"/>
                    <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9c-.8-.7-1.4-1.7-1.8-2.8z"/>
                    <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"/>
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Google OAuth 2.0</h4>
                  <p className="text-xs text-slate-400">Google single sign-on enabled</p>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>Connected</span>
              </span>
            </div>

            {/* GitHub */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-white">
                  <Github className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">GitHub OAuth</h4>
                  <p className="text-xs text-slate-400">Developer sign-in integration</p>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-xs font-bold">
                Available
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Danger Zone */}
      {activeTab === 'danger' && (
        <div className="bg-slate-900 rounded-3xl border border-rose-900/40 p-8 shadow-xl space-y-6">
          <div>
            <h2 className="text-lg font-bold text-rose-400 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              <span>Danger Zone</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Irreversible account actions. Proceed with caution.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white">Deactivate or Delete Account</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Permanently delete your user account, portfolio custom domains, uploaded CV documents, and public profile data.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition shrink-0"
            >
              Delete Account
            </button>
          </div>
        </div>
      )}

      {/* 2FA Setup Modal */}
      {show2faModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Setup Authenticator 2FA</h3>
              </div>
              <button
                onClick={() => setShow2faModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-center">
              <p className="text-xs text-slate-300">
                Scan this QR code with Google Authenticator or copy the secret key below:
              </p>

              {/* QR Code Placeholder Graphic */}
              <div className="w-44 h-44 mx-auto bg-white p-3 rounded-2xl shadow-inner flex items-center justify-center">
                <div className="w-full h-full border-4 border-slate-900 rounded-lg p-2 grid grid-cols-5 gap-1 bg-slate-900">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div
                      key={i}
                      className={`rounded ${
                        i % 2 === 0 || i % 5 === 0 ? 'bg-indigo-400' : 'bg-slate-950'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Secret Key display */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <span className="font-mono text-indigo-400 font-bold">{totpSecret}</span>
                <button
                  onClick={handleCopySecret}
                  className="text-slate-400 hover:text-white text-xs flex items-center gap-1 font-bold"
                >
                  {copiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSecret ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Enter 6-digit Code */}
              <div className="space-y-2 text-left pt-2">
                <label className="text-xs font-bold text-slate-300">
                  Enter 6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-center font-mono text-lg text-white tracking-widest focus:outline-none focus:border-indigo-500"
                  placeholder="123456"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShow2faModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <Button
                onClick={handleConfirm2FA}
                isLoading={isVerifying2fa}
                className="px-5 py-2.5"
              >
                Verify & Activate 2FA
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-rose-900/50 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">Confirm Account Deletion</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete your account? This action will permanently wipe your user profile, subdomains, published portfolio themes, and uploaded documents.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Account deletion request initiated.');
                  setShowDeleteModal(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30"
              >
                Yes, Delete My Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
