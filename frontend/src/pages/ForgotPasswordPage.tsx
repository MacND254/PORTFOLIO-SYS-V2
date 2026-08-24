import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { Button } from '../components/ui/Button';
import { Mail, ArrowLeft, CheckCircle, AlertTriangle, KeyRound, ArrowRight } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res: any = await api.post('/auth/forgot-password', { email });
      setMessage(res.message || 'If an account exists with that email, a reset link has been sent.');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to request password reset. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen h-[100dvh] max-h-[100dvh] w-full flex items-center justify-center p-4 bg-slate-950 text-slate-100 overflow-hidden relative selection:bg-indigo-500 selection:text-white">
      {/* Background glow */}
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-indigo-600/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-purple-600/15 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />

      <div className="relative w-full max-w-md my-auto bg-slate-900/85 backdrop-blur-2xl border border-slate-800/90 p-6 sm:p-7 rounded-3xl shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center space-y-2">
          <div className="inline-flex p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Forgot Password?</h1>
          <p className="text-xs text-slate-400">
            Enter your registered email address and we'll dispatch a secure reset link.
          </p>
        </div>

        {message && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            <div>
              <span className="font-bold block">Reset Request Submitted</span>
              <p className="mt-0.5 text-[11px] opacity-90">{message}</p>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Your Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full h-10 pl-10 pr-3.5 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-slate-700 text-white text-sm focus:border-indigo-500 focus:outline-none transition-all"
              />
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            className="w-full h-10 font-semibold shadow-lg shadow-indigo-600/20 gap-2"
          >
            <span>Send Reset Link</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <div className="text-center pt-1 border-t border-slate-800/60">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

