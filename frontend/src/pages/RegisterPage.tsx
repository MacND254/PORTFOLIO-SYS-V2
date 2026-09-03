import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Globe, User, Mail, Lock, Briefcase, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';
import api from '../api/client';
import { PasswordStrengthIndicator } from '../components/auth/PasswordStrengthIndicator';
import { AVAILABLE_PROFESSIONS } from '../types';
import { AuthContainer } from '../components/auth/AuthContainer';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [desiredSubdomain, setDesiredSubdomain] = useState('');
  const [profession, setProfession] = useState('Software Engineer');

  // Social Auth Override State
  const [socialProvider, setSocialProvider] = useState<'google' | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isRegistrationAllowed, setIsRegistrationAllowed] = useState(true);
  const [error, setError] = useState('');

  const { isAuthenticated, isLoading: authLoading, register, socialLogin } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  React.useEffect(() => {
    api.get('/public-settings')
      .then((res: any) => {
        if (res.data && typeof res.data.allowRegistration === 'boolean') {
          setIsRegistrationAllowed(res.data.allowRegistration);
        }
      })
      .catch(() => {});
  }, []);

  const handleStartSocialSignup = (provider: 'google') => {
    // VITE_BACKEND_URL must be set to the full backend service URL (e.g. https://xxx.up.railway.app)
    // This ensures the OAuth flow starts and ends on the same backend domain, preserving session cookies.
    const backendUrl = import.meta.env.VITE_BACKEND_URL ||
      (import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '')) ||
      (import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/?$/, '')) ||
      '';
    window.location.href = `${backendUrl}/api/auth/${provider}`;
  };

  const handleCompleteSocialSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!socialProvider) return;
    setIsLoading(true);
    setError('');

    try {
      await socialLogin({
        provider: socialProvider,
        email: email || `${socialProvider}.user@example.com`,
        fullName: fullName || `${socialProvider} User`,
        avatarUrl: socialProvider === 'google'
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb'
          : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
        desiredSubdomain,
        desiredProfession: profession,
      });
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Social registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await register({
        fullName,
        email,
        password,
        desiredSubdomain,
        profession,
      });
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContainer
      title={socialProvider ? 'Complete Google Registration' : 'Create Tenant Account'}
      subtitle={
        socialProvider
          ? 'Customize your unique portfolio slug and profession to launch your site.'
          : 'Get your personalized subdomain and AI-powered portfolio platform.'
      }
      activeTab="register"
    >
      {socialProvider ? (
        /* SOCIAL SIGNUP COMPLETION */
        <form onSubmit={handleCompleteSocialSignup} className="space-y-3.5">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"/>
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"/>
              <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12s.7 2.3 1.9 4.7l3.7-2.9z"/>
              <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"/>
            </svg>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{fullName || `${socialProvider} User`}</p>
              <p className="text-[10px] text-slate-400 truncate">{email || `${socialProvider}@example.com`}</p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold uppercase shrink-0">
              Verified OAuth
            </span>
          </div>

          {error && (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Subdomain Slug *</label>
              <div className="relative">
                <Globe className="w-3.5 h-3.5 text-indigo-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={desiredSubdomain}
                  onChange={(e) => setDesiredSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="your-name"
                  className="w-full h-9 pl-9 pr-24 rounded-xl bg-slate-950/90 border border-slate-800 text-white text-xs font-mono focus:border-indigo-500 focus:outline-none"
                />
                <span className="absolute right-2.5 top-2.5 text-[10px] text-slate-500 font-mono">.myportfolio.com</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Primary Profession *</label>
              <div className="relative">
                <Briefcase className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <select
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-950/90 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none appearance-none"
                >
                  {AVAILABLE_PROFESSIONS.map((prof) => (
                    <option key={prof} value={prof}>
                      {prof}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            className="w-full h-10 font-semibold gap-2 shadow-lg shadow-indigo-600/20"
          >
            <span>Complete Registration & Launch</span>
            <ArrowRight className="w-4 h-4" />
          </Button>

          <button
            type="button"
            onClick={() => setSocialProvider(null)}
            className="w-full text-center text-xs text-slate-400 hover:text-white transition py-0.5"
          >
            ← Switch to standard email &amp; password signup
          </button>
        </form>
      ) : (
        /* STANDARD 2-COLUMN REGISTRATION */
        <div className="space-y-3.5">
          {/* Social OAuth */}
          <button
            onClick={() => handleStartSocialSignup('google')}
            type="button"
            className="w-full h-10 px-4 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-white text-xs font-semibold transition flex items-center justify-center gap-2.5 shadow-sm group"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"/>
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"/>
              <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12s.7 2.3 1.9 4.7l3.7-2.9z"/>
              <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"/>
            </svg>
            <span>Sign up with Google</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-900 px-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider shrink-0">
              or register with credentials
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {!isRegistrationAllowed && (
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>New user registration is currently disabled by system administration.</span>
              </div>
            )}

            {error && (
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* 2-Column Responsive Input Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Full Name *</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (!desiredSubdomain) {
                        setDesiredSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''));
                      }
                    }}
                    placeholder="Francis Mwangi"
                    className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-slate-700 text-white text-xs focus:border-indigo-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Email Address *</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="francis@example.com"
                    className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-slate-700 text-white text-xs focus:border-indigo-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Subdomain Slug */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Desired Subdomain *</label>
                <div className="relative">
                  <Globe className="w-3.5 h-3.5 text-indigo-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={desiredSubdomain}
                    onChange={(e) => setDesiredSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="francis"
                    className="w-full h-9 pl-9 pr-24 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-slate-700 text-white text-xs font-mono focus:border-indigo-500 focus:outline-none transition-all"
                  />
                  <span className="absolute right-2.5 top-2.5 text-[10px] text-slate-500 font-mono">.myportfolio.com</span>
                </div>
              </div>

              {/* Primary Profession */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Primary Profession *</label>
                <div className="relative">
                  <Briefcase className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                  <select
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-slate-700 text-white text-xs focus:border-indigo-500 focus:outline-none appearance-none transition-all"
                  >
                    {AVAILABLE_PROFESSIONS.map((prof) => (
                      <option key={prof} value={prof}>
                        {prof}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Password *</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-slate-700 text-white text-xs focus:border-indigo-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Compact Strength Indicator */}
              <div className="space-y-1 pt-0.5">
                <PasswordStrengthIndicator password={password} compact={true} />
              </div>
            </div>

            {/* CTA Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              disabled={!isRegistrationAllowed}
              className="w-full h-10 font-semibold shadow-lg shadow-indigo-600/20 mt-1"
            >
              <span>Create Account &amp; Subdomain</span>
            </Button>

            {/* Switch to Sign In */}
            <div className="text-center pt-0.5">
              <span className="text-xs text-slate-400">
                Already have an account?{' '}
                <Link to="/login" className="text-indigo-400 hover:text-indigo-300 hover:underline font-semibold">
                  Sign In
                </Link>
              </span>
            </div>
          </form>
        </div>
      )}
    </AuthContainer>
  );
};


