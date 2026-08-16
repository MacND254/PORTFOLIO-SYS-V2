import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { Modal } from '../../components/ui/Modal';
import {
  Sliders, Save, Check, RefreshCw, ShieldAlert, UserPlus, Key, Mail, Send, AlertTriangle, CheckCircle, Lock,
} from 'lucide-react';

export const SystemSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // SMTP Test State
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [activeTestGateway, setActiveTestGateway] = useState<'portfolio' | 'reset'>('portfolio');
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res: any = await api.get('/admin/settings');
      if (res.data?.map) {
        setSettings(res.data.map);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (key: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: prev[key] === 'true' ? 'false' : 'true',
    }));
  };

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await api.put('/admin/settings', settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunSmtpTest = async () => {
    if (!testEmailAddress) return;
    setIsTestingSmtp(true);
    setTestResult(null);
    try {
      // First save current settings to ensure backend tests latest input
      await api.put('/admin/settings', settings);
      
      const res: any = await api.post('/admin/settings/test-email', {
        recipientEmail: testEmailAddress,
        gatewayType: activeTestGateway,
      });
      setTestResult({
        success: true,
        message: res.message || `${activeTestGateway === 'reset' ? 'Password Reset' : 'Portfolio'} SMTP test email sent successfully!`,
      });
    } catch (e: any) {
      setTestResult({
        success: false,
        message: e?.response?.data?.message || e.message || 'SMTP connection failed. Check your host credentials.',
      });
    } finally {
      setIsTestingSmtp(false);
    }
  };

  const openTestModal = (gateway: 'portfolio' | 'reset') => {
    setActiveTestGateway(gateway);
    setTestResult(null);
    setIsTestModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center gap-4">
        <Spinner size="lg" />
        <p className="text-slate-400 text-sm animate-pulse">Loading Platform System Settings...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Sliders className="w-7 h-7 text-indigo-400" />
            Global System Settings
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Configure platform maintenance mode, user registration policies, AI keys, and dual SMTP mail gateways.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={fetchSettings}>
            Refresh
          </Button>

          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={isSaving}
            leftIcon={saveSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
          >
            {saveSuccess ? 'Settings Saved!' : 'Save System Settings'}
          </Button>
        </div>
      </div>

      {/* ── 1. Platform Operations ── */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-indigo-400" />
          <span>Platform Access & Maintenance Control</span>
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Maintenance Mode */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-sm font-bold text-white block">Maintenance Mode</span>
              <p className="text-xs text-slate-400">Block public access to non-admin accounts during maintenance updates.</p>
            </div>
            <button
              onClick={() => handleToggle('MAINTENANCE_MODE')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                settings.MAINTENANCE_MODE === 'true'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              }`}
            >
              {settings.MAINTENANCE_MODE === 'true' ? '● Maintenance Enabled' : '○ Platform Online'}
            </button>
          </div>

          {/* Registration Toggle */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-400" />
                Allow New User Registrations
              </span>
              <p className="text-xs text-slate-400">Enable or disable public signup form for new tenant accounts.</p>
            </div>
            <button
              onClick={() => handleToggle('ALLOW_REGISTRATION')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                settings.ALLOW_REGISTRATION === 'true'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              }`}
            >
              {settings.ALLOW_REGISTRATION === 'true' ? '● Signup Open' : '○ Registration Closed'}
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. AI Integration & Storage Caps ── */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Key className="w-4 h-4 text-indigo-400" />
          <span>AI Engine & Storage Thresholds</span>
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">OpenAI API Key (AI CV Parser)</label>
            <input
              type="password"
              value={settings.OPENAI_API_KEY || ''}
              onChange={(e) => handleChange('OPENAI_API_KEY', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-indigo-500 focus:outline-none"
              placeholder="sk-proj-..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Max CV File Upload Size (MB)</label>
            <input
              type="number"
              value={settings.MAX_CV_UPLOAD_MB || '10'}
              onChange={(e) => handleChange('MAX_CV_UPLOAD_MB', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* ── 3. Mail Gateway 1: Portfolio Message Forwarder ── */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-400" />
              <span>Gateway 1: Portfolio Message Forwarder (Gmail / Custom SMTP)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Dispatches visitor contact form inquiries from public portfolios to tenant recipient emails.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<Send className="w-4 h-4 text-indigo-400" />}
            onClick={() => openTestModal('portfolio')}
          >
            Test Portfolio Gateway
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">SMTP Host / Server</label>
            <input
              type="text"
              value={settings.SMTP_HOST || 'smtp.gmail.com'}
              onChange={(e) => handleChange('SMTP_HOST', e.target.value)}
              placeholder="smtp.gmail.com"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">SMTP Port</label>
            <input
              type="text"
              value={settings.SMTP_PORT || '587'}
              onChange={(e) => handleChange('SMTP_PORT', e.target.value)}
              placeholder="587"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">SSL Connection (Secure)</label>
            <select
              value={settings.SMTP_SECURE || 'false'}
              onChange={(e) => handleChange('SMTP_SECURE', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="false">False (Port 587 / STARTTLS)</option>
              <option value="true">True (Port 465 / SSL)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">SMTP Username / Email</label>
            <input
              type="text"
              value={settings.SMTP_USER || ''}
              onChange={(e) => handleChange('SMTP_USER', e.target.value)}
              placeholder="portfolio.app@gmail.com"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">SMTP Password / App Password</label>
            <input
              type="password"
              value={settings.SMTP_PASS || ''}
              onChange={(e) => handleChange('SMTP_PASS', e.target.value)}
              placeholder="••••••••••••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Sender "From" Email</label>
            <input
              type="email"
              value={settings.SMTP_FROM_EMAIL || 'noreply@myportfolio.com'}
              onChange={(e) => handleChange('SMTP_FROM_EMAIL', e.target.value)}
              placeholder="noreply@myportfolio.com"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* ── 4. Mail Gateway 2: Password Reset & Security Mailer ── */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-400" />
              <span>Gateway 2: Dedicated Security & Password Reset Gateway</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Isolated SMTP mail server configuration used exclusively for password resets, email verification, and authentication security alerts.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="border-rose-500/30 text-rose-300 hover:bg-rose-500/10"
            leftIcon={<Send className="w-4 h-4 text-rose-400" />}
            onClick={() => openTestModal('reset')}
          >
            Test Reset Gateway
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Reset SMTP Host</label>
            <input
              type="text"
              value={settings.SMTP_RESET_HOST || ''}
              onChange={(e) => handleChange('SMTP_RESET_HOST', e.target.value)}
              placeholder="smtp.gmail.com (leave blank to mirror Gateway 1)"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Reset SMTP Port</label>
            <input
              type="text"
              value={settings.SMTP_RESET_PORT || '587'}
              onChange={(e) => handleChange('SMTP_RESET_PORT', e.target.value)}
              placeholder="587"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Reset SSL Connection</label>
            <select
              value={settings.SMTP_RESET_SECURE || 'false'}
              onChange={(e) => handleChange('SMTP_RESET_SECURE', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-rose-500 focus:outline-none"
            >
              <option value="false">False (Port 587 / STARTTLS)</option>
              <option value="true">True (Port 465 / SSL)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Reset SMTP Username</label>
            <input
              type="text"
              value={settings.SMTP_RESET_USER || ''}
              onChange={(e) => handleChange('SMTP_RESET_USER', e.target.value)}
              placeholder="security.app@gmail.com"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Reset SMTP Password</label>
            <input
              type="password"
              value={settings.SMTP_RESET_PASS || ''}
              onChange={(e) => handleChange('SMTP_RESET_PASS', e.target.value)}
              placeholder="••••••••••••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Sender "From" Security Email</label>
            <input
              type="email"
              value={settings.SMTP_RESET_FROM_EMAIL || 'security@myportfolio.com'}
              onChange={(e) => handleChange('SMTP_RESET_FROM_EMAIL', e.target.value)}
              placeholder="security@myportfolio.com"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-rose-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* SMTP Test Connection Modal */}
      <Modal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        title={`Test ${activeTestGateway === 'reset' ? 'Password Reset Security' : 'Portfolio Forwarding'} Mail Gateway`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Send a test email using the <strong>{activeTestGateway === 'reset' ? 'Password Reset Security' : 'Portfolio Forwarding'}</strong> Gateway credentials.
          </p>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Destination Recipient Email Address</label>
            <input
              type="email"
              required
              value={testEmailAddress}
              onChange={(e) => setTestEmailAddress(e.target.value)}
              placeholder="your.email@domain.com"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {testResult && (
            <div
              className={`p-4 rounded-xl text-xs flex items-start gap-3 border ${
                testResult.success
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}
            >
              {testResult.success ? (
                <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
              )}
              <div>
                <span className="font-bold block">{testResult.success ? 'SMTP Test Passed' : 'SMTP Test Failed'}</span>
                <p className="mt-0.5 opacity-90">{testResult.message}</p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setIsTestModalOpen(false)}>
              Close
            </Button>
            <Button
              variant="primary"
              onClick={handleRunSmtpTest}
              isLoading={isTestingSmtp}
              disabled={!testEmailAddress}
              leftIcon={<Send className="w-4 h-4" />}
            >
              Send Test Email
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
