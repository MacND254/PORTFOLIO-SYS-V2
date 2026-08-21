import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Globe, Briefcase, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { AVAILABLE_PROFESSIONS } from '../types';

/**
 * /register/oauth
 * Second step of real OAuth signup.
 *
 * The backend redirected here with ?state=<pendingToken> after Google/GitHub OAuth.
 * The pending token encodes the verified OAuth identity (email, name, avatar).
 * This page asks for:
 *   - Desired subdomain slug
 *   - Primary profession
 *
 * On submit it calls POST /api/auth/social-login/complete which validates the
 * pending token and creates the full tenant account, then redirects to /admin/dashboard.
 */
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
      // Decode the JWT payload (no need to verify — backend does that)
      const payload = JSON.parse(atob(state.split('.')[1]));
      setOauthHint({ fullName: payload.fullName, email: payload.email, provider: payload.provider });
      // Pre-fill subdomain from name
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

      // API interceptor returns response.data, which contains data: { token, user }
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white text-2xl shadow-xl shadow-indigo-500/25 mx-auto">
            P
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Almost there!</h1>
          <p className="text-slate-400 text-sm">
            One last step — choose your unique portfolio slug and profession.
          </p>
        </div>

        <div className="p-8 rounded-2xl bg-slate-900 border border-indigo-500/40 space-y-5 shadow-2xl">
          {/* OAuth identity card */}
          {oauthHint && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="w-9 h-9 rounded-full bg-indigo-600/30 flex items-center justify-center text-indigo-300 font-bold text-sm shrink-0">
                {oauthHint.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{oauthHint.fullName}</p>
                <p className="text-[11px] text-slate-400 truncate">{oauthHint.email}</p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold uppercase shrink-0">
                {oauthHint.provider === 'google' ? 'Google' : 'GitHub'} Verified
              </span>
            </div>
          )}

          {error && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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
                  minLength={3}
                  maxLength={30}
                  className="w-full pl-10 pr-36 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-mono focus:border-indigo-500 focus:outline-none"
                />
                <span className="absolute right-3 top-3 text-xs text-slate-500 font-mono">.myportfolio.com</span>
              </div>
              <p className="text-[11px] text-slate-500">Only lowercase letters, numbers and hyphens (min 3 chars).</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Primary Profession *</label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <select
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none appearance-none cursor-pointer"
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
              size="lg"
              isLoading={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Creating your portfolio…
                </span>
              ) : 'Launch My Portfolio'}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => navigate('/register')}
            className="w-full text-center text-xs text-slate-400 hover:text-white transition pt-1"
          >
            ← Start over with a different account
          </button>
        </div>
      </div>
    </div>
  );
};
