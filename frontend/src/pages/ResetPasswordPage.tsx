import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../api/client';
import { Button } from '../components/ui/Button';
import { PasswordStrengthIndicator } from '../components/auth/PasswordStrengthIndicator';
import { Lock, ArrowLeft, CheckCircle, AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isPasswordValid =
    newPassword.length >= 8 &&
    /[A-Z]/.test(newPassword) &&
    /[a-z]/.test(newPassword) &&
    /[0-9]/.test(newPassword) &&
    /[^A-Za-z0-9]/.test(newPassword);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Invalid or missing password reset token.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!isPasswordValid) {
      setError('Please satisfy all 5 strong password requirements.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res: any = await api.post('/auth/reset-password', {
        token,
        newPassword,
      });
      setSuccessMessage(res.message || 'Password updated successfully!');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Password reset failed. The token may be expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen h-[100dvh] max-h-[100dvh] w-full flex items-center justify-center p-4 bg-slate-950 text-slate-100 overflow-hidden relative selection:bg-indigo-500 selection:text-white">
      {/* Background glow */}
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-emerald-600/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-indigo-600/15 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />

      <div className="relative w-full max-w-md my-auto bg-slate-900/85 backdrop-blur-2xl border border-slate-800/90 p-6 sm:p-7 rounded-3xl shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center space-y-1.5">
          <div className="inline-flex p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Set New Password</h1>
          <p className="text-xs text-slate-400">
            Specify a new strong password for your portfolio account.
          </p>
        </div>

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            <div>
              <span className="font-bold block">Password Reset Successful!</span>
              <p className="mt-0.5 text-[11px] opacity-90">{successMessage}</p>
              <p className="mt-1 text-[10px] text-emerald-300">Redirecting to login page in a few seconds...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div>
              <span className="font-bold block">Error</span>
              <p className="mt-0.5 text-[11px] opacity-90">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">New Password</label>
            <div className="relative">
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-950/90 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none transition-all"
              />
              <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Compact Password Strength Indicator */}
          <PasswordStrengthIndicator password={newPassword} compact={true} />

          <div className="space-y-1 pt-1">
            <label className="text-xs font-semibold text-slate-300">Confirm New Password</label>
            <div className="relative">
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-950/90 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none transition-all"
              />
              <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-[10px] text-rose-400 mt-0.5">Passwords do not match</p>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            disabled={!isPasswordValid || newPassword !== confirmPassword}
            className="w-full h-10 font-semibold shadow-lg shadow-emerald-600/20 gap-2 mt-1"
          >
            <span>Update Password &amp; Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <div className="text-center pt-1 border-t border-slate-800/60">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition">
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};


