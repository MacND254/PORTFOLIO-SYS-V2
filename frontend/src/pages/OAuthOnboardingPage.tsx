import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Globe, Briefcase, AlertTriangle, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { AVAILABLE_PROFESSIONS } from '../types';

export const OAuthOnboardingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setSession, refreshUser } = useAuth();

  const state = searchParams.get('state') || '';

  const [desiredSubdomain, setDesiredSubdomain] = useState('');
  const [profession, setProfession] = useState('Software Engineer');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Decode the name hint from the pending state token for display
  const [oauthHint, setOauthHint] = useState<{ fullName: string; email: string; provider: string } | null>(null);

  useEffect(() => {
    if (!state) {
      navigate('/register', { replace: true });
      return;
    }
    try {
      const payload = JSON.parse(atob(state.split('.')[1]));
      setOauthHint({ fullName: payload.fullName, email: payload.email, provider: payload.provider });
      const slug = (payload.fullName || payload.email.split('@')[0])
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 20);
      setDesiredSubdomain(slug);
    } catch {
      navigate('/register?error=invalid_oauth_state', { replace: true });
    }
  }, [state, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res: any = await api.post('/auth/social-login/complete', {
        state,
        desiredSubdomain,
        desiredProfession: profession,
      });

      const token = res.data?.token || res.token;
      const userData = res.data?.user || res.user;
      if (token) {
        await setSession(token, userData);
        navigate('/admin/dashboard', { replace: true });
      } else {
        await refreshUser();
        navigate('/admin/dashboard', { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to complete registration. Please try again.');
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

      <div className="relative w-full max-w-md my-auto bg-slate-900/85 backdrop-blur-2xl border border-indigo-500/40 p-6 sm:p-7 rounded-3xl shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center space-y-1.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white text-xl shadow-xl shadow-indigo-500/25 mx-auto">
            P
          </div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">Almost there!</h1>
          <p className="text-slate-400 text-xs">
            Choose your portfolio subdomain slug and profession to launch.
          </p>
        </div>

        {/* OAuth identity card */}
        {oauthHint && (
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center text-indigo-300 font-bold text-xs shrink-0">
              {oauthHint.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{oauthHint.fullName}</p>
              <p className="text-[10px] text-slate-400 truncate">{oauthHint.email}</p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold uppercase shrink-0">
              {oauthHint.provider === 'google' ? 'Google' : 'GitHub'} Verified
            </span>
          </div>
        )}

        {error && (
          <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
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
                minLength={3}
                maxLength={30}
                className="w-full h-10 pl-9 pr-24 rounded-xl bg-slate-950/90 border border-slate-800 text-white text-xs font-mono focus:border-indigo-500 focus:outline-none transition-all"
              />
              <span className="absolute right-2.5 top-3 text-[10px] text-slate-500 font-mono">.myportfolio.com</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Primary Profession *</label>
            <div className="relative">
              <Briefcase className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
              <select
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-950/90 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none appearance-none cursor-pointer transition-all"
              >
                {AVAILABLE_PROFESSIONS.map((prof) => (
                  <option key={prof} value={prof}>
                    {prof}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            className="w-full h-10 font-semibold shadow-lg shadow-indigo-600/20 gap-2"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Launching…
              </span>
            ) : (
              <>
                <span>Launch My Portfolio</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>

        <div className="text-center pt-1 border-t border-slate-800/60">
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="text-xs text-slate-400 hover:text-white transition"
          >
            ← Start over with a different account
          </button>
        </div>
      </div>
    </div>
  );
};

