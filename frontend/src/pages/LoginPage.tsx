import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Lock, Mail, ShieldCheck, UserCheck, Sparkles } from 'lucide-react';
import { AuthContainer } from '../components/auth/AuthContainer';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { isAuthenticated, isLoading: authLoading, login, user } = useAuth();
  const navigate = useNavigate();

  const getHomeRoute = (role?: string) => {
    if (role === 'SUPER_ADMIN') return '/superadmin/dashboard';
    if (role === 'COMPANY') return '/company/dashboard';
    return '/admin/dashboard';
  };

  React.useEffect(() => {
    if (isAuthenticated && !authLoading && user) {
      navigate(getHomeRoute(user.role), { replace: true });
    }
  }, [isAuthenticated, authLoading, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const loggedUser = await login(email, password);
      navigate(getHomeRoute(loggedUser?.role), { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillTestAdmin = () => {
    setEmail('francis@example.com');
    setPassword('ChangeMe@12345');
    setError('');
  };

  const fillSuperAdmin = () => {
    setEmail('superadmin@myportfolio.com');
    setPassword('ChangeMe@12345');
    setError('');
  };

  const handleGoogleLogin = () => {
    const raw = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';
    const base = (raw.startsWith('http://') || raw.startsWith('https://')) ? raw.replace(/\/api\/?$/, '') : '';
    window.location.href = `${base}/api/auth/google`;
  };

  return (
    <AuthContainer
      title="Welcome Back"
      subtitle="Sign in to manage your portfolio, CV extractions, and analytics."
      activeTab="login"
    >
      <div className="space-y-4">
        {/* Social OAuth Button */}
        <button
          onClick={handleGoogleLogin}
          type="button"
          className="w-full h-10 px-4 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-white text-xs font-semibold transition flex items-center justify-center gap-2.5 shadow-sm group"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"/>
            <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"/>
            <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12s.7 2.3 1.9 4.7l3.7-2.9z"/>
            <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"/>
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-800 w-full" />
          <span className="bg-slate-900 px-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider shrink-0">
            or sign in with email
          </span>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {error && (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Email Input */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full h-10 pl-10 pr-3.5 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-slate-700 text-white text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              <Link to="/forgot-password" className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium transition">
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
                className="w-full h-10 pl-10 pr-3.5 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-slate-700 text-white text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Demo Quick-Fill Bar */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/50 border border-slate-800/60 text-[11px]">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" /> Demo:
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={fillTestAdmin}
                type="button"
                className="px-2 py-0.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 text-[10px] font-medium transition"
              >
                Francis (Admin)
              </button>
              <button
                onClick={fillSuperAdmin}
                type="button"
                className="px-2 py-0.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 text-[10px] font-medium transition"
              >
                Super Admin
              </button>
            </div>
          </div>

          {/* CTA Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            className="w-full h-10 font-semibold shadow-lg shadow-indigo-600/20"
          >
            Sign In to Dashboard
          </Button>

          {/* Link to Register */}
          <div className="text-center pt-1">
            <span className="text-xs text-slate-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-indigo-400 hover:text-indigo-300 hover:underline font-semibold">
                Create a Tenant Account
              </Link>
            </span>
          </div>
        </form>
      </div>
    </AuthContainer>
  );
};

