import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Globe, User, Mail, Lock, Briefcase, AlertTriangle } from 'lucide-react';
import api from '../api/client';
import { PasswordStrengthIndicator } from '../components/auth/PasswordStrengthIndicator';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [desiredSubdomain, setDesiredSubdomain] = useState('');
  const [profession, setProfession] = useState('Software Engineer');

  const [isLoading, setIsLoading] = useState(false);
  const [isRegistrationAllowed, setIsRegistrationAllowed] = useState(true);
  const [error, setError] = useState('');

  const { register } = useAuth();
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
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Create Tenant Account</h1>
          <p className="text-slate-400 text-sm">Get your personalized subdomain and AI-powered portfolio platform.</p>
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
      </div>
    </div>
  );
};
