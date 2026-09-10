import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  AlertCircle, Building2, Check, Eye, EyeOff, RefreshCw, Shield,
  Mail, User, Lock, Globe, MapPin, Briefcase, ArrowLeft
} from 'lucide-react';

interface InviteInfo {
  valid: boolean;
  companyName?: string;
  expiresAt: string;
  usageCount?: number;
}

const INDUSTRY_OPTIONS = [
  'Technology', 'Finance & Banking', 'Healthcare', 'Education', 'E-commerce',
  'Manufacturing', 'Media & Entertainment', 'Consulting', 'Real Estate',
  'Telecommunications', 'Energy', 'Government', 'Non-Profit', 'Other'
];

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '500-1000', '1000+'];

export function CompanyRegisterPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const token = searchParams.get('token') || '';

  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [validating, setValidating] = useState(true);
  const [tokenError, setTokenError] = useState('');

  const [form, setForm] = useState({
    email: '',
    fullName: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    website: '',
    industry: '',
    companySize: '',
    location: '',
    description: '',
    contactPerson: '',
    contactEmail: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (!token) {
      setTokenError('No invitation token found. Please use the private link you received.');
      setValidating(false);
      return;
    }
    (async () => {
      try {
        const res: any = await api.get('/companies/invite/validate', { params: { token } });
        const data = res.data?.data || res.data;
        setInviteInfo(data);
        if (data.companyName) {
          setForm(p => ({ ...p, companyName: data.companyName }));
        }
      } catch (err: any) {
        setTokenError(err.response?.data?.message || 'Invalid or expired invitation link.');
      } finally {
        setValidating(false);
      }
    })();
  }, [token]);

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.email.includes('@')) {
      setError('Please provide a valid corporate work email.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName.trim()) {
      setError('Company name is required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload = {
        token,
        email: form.email.trim().toLowerCase(),
        fullName: form.fullName.trim(),
        password: form.password,
        companyName: form.companyName.trim(),
        website: form.website?.trim() || undefined,
        industry: form.industry || undefined,
        companySize: form.companySize || undefined,
        location: form.location?.trim() || undefined,
        description: form.description?.trim() || undefined,
        contactPerson: form.contactPerson?.trim() || form.fullName.trim(),
        contactEmail: form.contactEmail?.trim() || form.email.trim().toLowerCase(),
      };
      const res: any = await api.post('/companies/register', payload);
      const result = res.data?.data || res.data;

      // Update auth context session and localStorage
      localStorage.setItem('token', result.accessToken);
      if (setSession) {
        await setSession(result.accessToken, result.user);
      }
      navigate('/company/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Validating partner invitation token...</p>
        </div>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6 text-red-400" />
          </div>
          <h2 className="text-white font-bold text-lg mb-1.5">Invalid Invitation</h2>
          <p className="text-slate-400 text-xs mb-5 leading-relaxed">{tokenError}</p>
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-600/15 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[300px] bg-purple-600/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10 my-auto">
        {/* Top Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
            <Shield className="w-4 h-4 text-indigo-400" />
            <span>Employer Partner Network</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Partner Registration
          </h1>
          <p className="text-slate-400 text-sm mt-1.5 max-w-md mx-auto">
            {inviteInfo?.companyName
              ? `Exclusive access invitation for ${inviteInfo.companyName}`
              : 'Join our verified corporate employer network to discover and hire top pre-vetted engineers'}
          </p>
        </div>

        {/* Spacious Form Card */}
        <div className="bg-slate-900/90 backdrop-blur-2xl border border-slate-800/90 rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl shadow-black/80">
          {/* Step Indicator Pills */}
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800/80">
            <button
              type="button"
              onClick={() => step === 2 && setStep(1)}
              className={`flex-1 flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition ${
                step === 1
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${step > 1 ? 'bg-emerald-500 text-white' : 'bg-white/20'}`}>
                {step > 1 ? <Check className="w-3 h-3" /> : '1'}
              </span>
              <span>1. Admin Account</span>
            </button>
            <div
              className={`flex-1 flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition ${
                step === 2
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'bg-slate-800/40 text-slate-500'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                2
              </span>
              <span>2. Company Profile</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-3.5 flex items-center gap-2.5 text-red-400 text-xs sm:text-sm mb-5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 ? (
            /* STEP 1: Account Setup */
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Your Full Name <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      required
                      type="text"
                      value={form.fullName}
                      onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                      placeholder="Jane Doe"
                      className="w-full h-11 pl-11 pr-4 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-slate-700 text-white text-sm placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Corporate Work Email <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="jane@company.com"
                      className="w-full h-11 pl-11 pr-4 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-slate-700 text-white text-sm placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Password <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      required
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                      placeholder="Min 8 characters"
                      className="w-full h-11 pl-11 pr-11 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-slate-700 text-white text-sm placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Confirm Password <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      required
                      type="password"
                      value={form.confirmPassword}
                      onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
                      placeholder="Re-enter password"
                      className="w-full h-11 pl-11 pr-4 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-slate-700 text-white text-sm placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm hover:opacity-95 transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 cursor-pointer"
                >
                  <span>Continue to Company Details</span>
                </button>
              </div>
            </form>
          ) : (
            /* STEP 2: Company Details */
            <form onSubmit={handleFinalSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Company Name <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      required
                      type="text"
                      value={form.companyName}
                      onChange={e => setForm(p => ({ ...p, companyName: e.target.value }))}
                      placeholder="Acme Technologies"
                      className="w-full h-11 pl-11 pr-4 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-slate-700 text-white text-sm placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">Industry</label>
                  <select
                    value={form.industry}
                    onChange={e => setForm(p => ({ ...p, industry: e.target.value }))}
                    className="w-full h-11 px-4 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-slate-700 text-white text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none transition-all"
                  >
                    <option value="">Select industry</option>
                    {INDUSTRY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">Company Size</label>
                  <select
                    value={form.companySize}
                    onChange={e => setForm(p => ({ ...p, companySize: e.target.value }))}
                    className="w-full h-11 px-4 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-slate-700 text-white text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none transition-all"
                  >
                    <option value="">Select size bracket</option>
                    {COMPANY_SIZES.map(s => <option key={s} value={s}>{s} employees</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">Headquarters Location</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={form.location}
                      onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                      placeholder="Nairobi, Kenya"
                      className="w-full h-11 pl-11 pr-4 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-slate-700 text-white text-sm placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">Corporate Website</label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="url"
                      value={form.website}
                      onChange={e => setForm(p => ({ ...p, website: e.target.value }))}
                      placeholder="https://company.com"
                      className="w-full h-11 pl-11 pr-4 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-slate-700 text-white text-sm placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">Hiring Contact Person</label>
                  <input
                    type="text"
                    value={form.contactPerson}
                    onChange={e => setForm(p => ({ ...p, contactPerson: e.target.value }))}
                    placeholder={form.fullName || 'Talent Acquisition Lead'}
                    className="w-full h-11 px-4 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-slate-700 text-white text-sm placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">About Company</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Brief overview of engineering focus, tech stack, and company culture..."
                  className="w-full p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none transition-all resize-none text-sm leading-relaxed"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="h-11 px-5 rounded-xl border border-slate-700 hover:border-slate-600 bg-slate-800/60 hover:bg-slate-800 text-slate-200 transition text-sm font-semibold flex items-center gap-2 shrink-0 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 cursor-pointer"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{loading ? 'Activating Account...' : 'Activate Partner Account'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-slate-500 text-sm mt-5">
          Already registered?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition">
            Sign in to Employer Portal
          </Link>
        </p>
      </div>
    </div>
  );
}
