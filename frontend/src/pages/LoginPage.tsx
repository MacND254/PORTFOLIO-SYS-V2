import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Lock, Mail, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { isAuthenticated, isLoading: authLoading, login } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
      navigate('/admin/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillTestAdmin = () => {
    setEmail('francis@example.com');
    setPassword('ChangeMe@12345');
  };

  const fillSuperAdmin = () => {
    setEmail('superadmin@myportfolio.com');
    setPassword('ChangeMe@12345');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white text-2xl shadow-xl shadow-indigo-500/25 mx-auto">
            P
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Admin Authentication</h1>
          <p className="text-slate-400 text-sm">Sign in to manage your portfolio, CV extractions, and testimonials.</p>
        </div>

        {/* Social OAuth */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block text-center">One-Click Social OAuth Login</span>
          <button
            onClick={() => {
              const raw = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';
              const base = (raw.startsWith('http://') || raw.startsWith('https://')) ? raw.replace(/\/api\/?$/, '') : '';
              window.location.href = `${base}/api/auth/google`;
            }}
            type="button"
            className="w-full px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-slate-700 text-white text-sm font-semibold transition flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"/>
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"/>
              <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12s.7 2.3 1.9 4.7l3.7-2.9z"/>
              <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">Demo Accounts:</span>
            <div className="flex gap-2">
              <button onClick={fillTestAdmin} type="button" className="text-[10px] text-indigo-400 hover:underline">Francis (Admin)</button>
              <span className="text-slate-600">•</span>
              <button onClick={fillSuperAdmin} type="button" className="text-[10px] text-purple-400 hover:underline">Super Admin</button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 shadow-2xl">
          {error && <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">{error}</div>}

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              <Link to="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full">
            Sign In To Dashboard
          </Button>

          <p className="text-center text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-400 hover:underline font-semibold">
              Create a Tenant Account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};
