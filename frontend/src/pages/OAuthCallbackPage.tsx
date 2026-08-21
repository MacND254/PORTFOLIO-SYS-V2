import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

/**
 * /oauth/callback
 * This page is the frontend landing point after the backend OAuth redirect.
 *
 * Cases:
 *  ?token=xxx&status=login  → Returning user — store JWT, redirect to dashboard
 *  ?error=xxx               → Show error message
 */
export const OAuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const token = searchParams.get('token');
    const status = searchParams.get('status');
    const error = searchParams.get('error');

    if (error) {
      // Show error briefly then redirect to register
      setTimeout(() => navigate(`/register?error=${encodeURIComponent(error)}`, { replace: true }), 2500);
      return;
    }

    if (token && status === 'login') {
      setSession(token)
        .then(() => {
          navigate('/admin/dashboard', { replace: true });
        })
        .catch((err) => {
          console.error('[OAuthCallback] Failed to establish session:', err);
          navigate('/login?error=auth_failed', { replace: true });
        });
      return;
    }

    // Unexpected — redirect login
    setTimeout(() => navigate('/login', { replace: true }), 2000);
  }, [searchParams, navigate, setSession]);

  const error = searchParams.get('error');

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white text-2xl shadow-xl shadow-indigo-500/25 mx-auto">
          P
        </div>

        {error ? (
          <>
            <div className="flex justify-center">
              <XCircle className="w-12 h-12 text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Authentication Failed</h2>
              <p className="text-sm text-slate-400 mt-1 break-words">{decodeURIComponent(error)}</p>
              <p className="text-xs text-slate-500 mt-3">Redirecting you back to sign up…</p>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-center">
              <div className="relative">
                <Loader2 className="w-12 h-12 text-indigo-400 animate-spin" />
                <CheckCircle className="absolute inset-0 m-auto w-6 h-6 text-indigo-300 opacity-0 animate-pulse" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Signing you in…</h2>
              <p className="text-sm text-slate-400 mt-1">Verifying your identity and loading your dashboard.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
