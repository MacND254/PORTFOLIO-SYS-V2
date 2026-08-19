import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Globe, User, Mail, Lock, Briefcase, AlertTriangle, Github } from 'lucide-react';
import api from '../api/client';
import { PasswordStrengthIndicator } from '../components/auth/PasswordStrengthIndicator';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [desiredSubdomain, setDesiredSubdomain] = useState('');
  const [profession, setProfession] = useState('Software Engineer');

  // Social Auth Override State
  const [socialProvider, setSocialProvider] = useState<'google' | 'github' | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isRegistrationAllowed, setIsRegistrationAllowed] = useState(true);
  const [error, setError] = useState('');

  const { register, socialLogin } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    api.get('/public-settings')
      .then((res: any) => {
        if (res.data && typeof res.data.allowRegistration === 'boolean') {
          setIsRegistrationAllowed(res.data.allowRegistration);
        }
      })
      .catch(() => {});
  }, []);

  const handleStartSocialSignup = (provider: 'google' | 'github') => {
    const raw = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';
    const backendBase = (raw.startsWith('http://') || raw.startsWith('https://'))
      ? raw.replace(/\/api\/?$/, '')
      : '';
    window.location.href = `${backendBase}/api/auth/${provider}`;
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white text-2xl shadow-xl shadow-indigo-500/25 mx-auto">
            P
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            {socialProvider ? `Complete ${socialProvider === 'google' ? 'Google' : 'GitHub'} Registration` : 'Create Tenant Account'}
          </h1>
          <p className="text-slate-400 text-sm">
            {socialProvider
              ? 'Customize your unique portfolio subdomain slug and primary profession to launch your site.'
              : 'Get your personalized subdomain and AI-powered portfolio platform.'}
          </p>
        </div>

        {/* SOCIAL SIGNUP OVERRIDE STEP */}
        {socialProvider ? (
          <form onSubmit={handleCompleteSocialSignup} className="p-8 rounded-2xl bg-slate-900 border border-indigo-500/40 space-y-5 shadow-2xl relative">
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              {socialProvider === 'google' ? (
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"/>
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"/>
                  <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12s.7 2.3 1.9 4.7l3.7-2.9z"/>
                  <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"/>
                </svg>
              ) : (
                <Github className="w-5 h-5 text-white shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{fullName || `${socialProvider} User`}</p>
                <p className="text-[11px] text-slate-400 truncate">{email || `${socialProvider}@example.com`}</p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold uppercase shrink-0">
                Verified OAuth
              </span>
            </div>

            {error && <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">{error}</div>}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Desired Subdomain Slug *</label>
              <div className="relative">
                <Globe className="w-4 h-4 text-indigo-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={desiredSubdomain}
                  onChange={(e) => setDesiredSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="your-name"
                  className="w-full pl-10 pr-32 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-mono focus:border-indigo-500 focus:outline-none"
                />
                <span className="absolute right-3 top-3 text-xs text-slate-500 font-mono">.myportfolio.com</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Primary Profession *</label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <select
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none appearance-none"
                >
                  <option value="Software Engineer">Software Engineer</option>
                  <option value="Data Scientist">Data Scientist</option>
                  <option value="Cybersecurity">Cybersecurity Professional</option>
                  <option value="UI/UX Designer">UI/UX Designer</option>
                  <option value="Architect">Architect</option>
                  <option value="Medical Professional">Medical Professional</option>
                  <option value="Legal Professional">Lawyer / Legal</option>
                  <option value="Finance Professional">Finance & Accounting</option>
                  <option value="Marketing Professional">Marketing Professional</option>
                  <option value="Freelancer">Freelancer / Consultant</option>
                </select>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full"
              >
                Complete Social Registration
              </Button>
              <button
                type="button"
                onClick={() => setSocialProvider(null)}
                className="w-full text-center text-xs text-slate-400 hover:text-white transition py-1"
              >
                ← Switch to standard email & password signup
              </button>
            </div>
          </form>
        ) : (
          /* STANDARD REGISTRATION FORM */
          <>
            {/* One-Click Social Registration Buttons */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block text-center">One-Click Social Registration</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleStartSocialSignup('google')}
                  type="button"
                  className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-slate-700 text-white text-xs font-semibold transition flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"/>
                    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"/>
                    <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12s.7 2.3 1.9 4.7l3.7-2.9z"/>
                    <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"/>
                  </svg>
                  <span>Google</span>
                </button>

                <button
                  onClick={() => handleStartSocialSignup('github')}
                  type="button"
                  className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold transition flex items-center justify-center gap-2"
                >
                  <Github className="w-4 h-4 text-white" />
                  <span>GitHub</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-5 shadow-2xl">
              {!isRegistrationAllowed && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>New user registration is currently disabled by system administration.</span>
                </div>
              )}

              {error && <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">{error}</div>}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
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
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="francis@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Desired Subdomain Slug *</label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-indigo-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={desiredSubdomain}
                    onChange={(e) => setDesiredSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="francis"
                    className="w-full pl-10 pr-32 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-mono focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-3 text-xs text-slate-500 font-mono">.myportfolio.com</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Primary Profession</label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <select
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none appearance-none"
                  >
                    <option value="Software Engineer">Software Engineer</option>
                    <option value="Data Scientist">Data Scientist</option>
                    <option value="Cybersecurity">Cybersecurity Professional</option>
                    <option value="UI/UX Designer">UI/UX Designer</option>
                    <option value="Architect">Architect</option>
                    <option value="Medical Professional">Medical Professional</option>
                    <option value="Legal Professional">Lawyer / Legal</option>
                    <option value="Finance Professional">Finance & Accounting</option>
                    <option value="Marketing Professional">Marketing Professional</option>
                    <option value="Freelancer">Freelancer / Consultant</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <PasswordStrengthIndicator password={password} />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                disabled={!isRegistrationAllowed}
                className="w-full"
              >
                Create Account & Subdomain
              </Button>

              <p className="text-center text-xs text-slate-400">
                Already have an account?{' '}
                <Link to="/login" className="text-indigo-400 hover:underline font-semibold">
                  Sign In
                </Link>
              </p>
            </form>
          </>
        )}

        <p className="text-center text-xs text-slate-500">
          By continuing, you agree to our{' '}
          <Link to="/terms" className="text-slate-400 hover:text-white underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="text-slate-400 hover:text-white underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
};

