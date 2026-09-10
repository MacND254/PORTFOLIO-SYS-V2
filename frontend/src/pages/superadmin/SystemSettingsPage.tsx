import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { Modal } from '../../components/ui/Modal';
import {
  Sliders, Save, Check, RefreshCw, ShieldAlert, UserPlus, Key, Mail, Send,
  AlertTriangle, CheckCircle, Lock, Smartphone, BarChart2, Bookmark, Globe, Info
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
      setTimeout(() => setSaveSuccess(false), 3000);
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
      <div className="p-8 flex flex-col items-center justify-center gap-3 min-h-[60vh]">
        <Spinner size="lg" />
        <p className="text-slate-400 text-xs animate-pulse">Loading Platform System Settings...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-5xl mx-auto pb-10">
      {/* Header - Compact */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sliders className="w-4 h-4" />
            </div>
            <span>Global System Settings</span>
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Configure platform maintenance, registrations, storage caps, SMTP mailers, PWA branding, and analytics telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className="w-3.5 h-3.5" />} onClick={fetchSettings}>
            Refresh
          </Button>
          <div className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Settings Live</span>
          </div>
        </div>
      </div>

      {/* ── 1. Platform Operations ── */}
      <div className="p-4 sm:p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3.5 shadow-md">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 text-indigo-400">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Platform Access &amp; Maintenance Control</span>
        </h3>

        <div className="grid md:grid-cols-2 gap-3">
          {/* Maintenance Mode */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-3">
            <div className="space-y-0.5 min-w-0">
              <span className="text-xs font-semibold text-white block">Maintenance Mode</span>
              <p className="text-[11px] text-slate-400 truncate">Block public access to non-admin accounts during maintenance.</p>
            </div>
            <button
              onClick={() => handleToggle('MAINTENANCE_MODE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer ${
                settings.MAINTENANCE_MODE === 'true'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              }`}
            >
              {settings.MAINTENANCE_MODE === 'true' ? '● Maintenance Active' : '○ Platform Online'}
            </button>
          </div>

          {/* Registration Toggle */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-3">
            <div className="space-y-0.5 min-w-0">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5 text-indigo-400" />
                Allow New User Registrations
              </span>
              <p className="text-[11px] text-slate-400 truncate">Enable or disable public signup form for new tenant accounts.</p>
            </div>
            <button
              onClick={() => handleToggle('ALLOW_REGISTRATION')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer ${
                settings.ALLOW_REGISTRATION === 'true'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              }`}
            >
              {settings.ALLOW_REGISTRATION === 'true' ? '● Signup Open' : '○ Signups Closed'}
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Storage Caps ── */}
      <div className="p-4 sm:p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3.5 shadow-md">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 text-indigo-400">
          <Key className="w-3.5 h-3.5" />
          <span>Storage &amp; Upload Thresholds</span>
        </h3>

        <div className="grid md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Max CV File Upload Size (MB)</label>
            <input
              type="number"
              value={settings.MAX_CV_UPLOAD_MB || '10'}
              onChange={(e) => handleChange('MAX_CV_UPLOAD_MB', e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500">Applies to PDF and DOCX uploads processed by the CV parser.</p>
          </div>
        </div>
      </div>

      {/* ── 3. Global Favicon & Web Manifest (PWA) ── */}
      <div className="p-4 sm:p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3.5 shadow-md">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 text-indigo-400">
            <Bookmark className="w-3.5 h-3.5" />
            <span>Favicon, Web Manifest (PWA) &amp; Branding</span>
          </h3>
          <p className="text-[11px] text-slate-500 hidden sm:block">Default browser favicon &amp; installable mobile splash configuration</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Favicon URL */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-300">Default Browser Favicon URL</label>
              {settings.DEFAULT_FAVICON_URL && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400">Preview:</span>
                  <img src={settings.DEFAULT_FAVICON_URL} alt="Favicon" className="w-3 h-3 object-contain rounded" />
                </div>
              )}
            </div>
            <input
              type="url"
              value={settings.DEFAULT_FAVICON_URL || ''}
              onChange={(e) => handleChange('DEFAULT_FAVICON_URL', e.target.value)}
              placeholder="https://yourdomain.com/favicon.png"
              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none font-mono"
            />
            <p className="text-[11px] text-slate-500">1:1 square image (.ico, .png, .svg) shown in browser tabs.</p>
          </div>

          {/* PWA App Name */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">PWA Application Title</label>
            <input
              type="text"
              value={settings.PWA_APP_NAME || 'Portfolio SaaS Enterprise'}
              onChange={(e) => handleChange('PWA_APP_NAME', e.target.value)}
              placeholder="Portfolio SaaS Enterprise"
              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500">Displayed on mobile home screen installations.</p>
          </div>

          {/* PWA Short Name */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">PWA Short Name</label>
            <input
              type="text"
              value={settings.PWA_SHORT_NAME || 'Portfolio'}
              onChange={(e) => handleChange('PWA_SHORT_NAME', e.target.value)}
              placeholder="Portfolio"
              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500">Compact label beneath app icon on device launchers.</p>
          </div>

          {/* PWA Colors */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Theme Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.PWA_THEME_COLOR || '#4f46e5'}
                  onChange={(e) => handleChange('PWA_THEME_COLOR', e.target.value)}
                  className="w-7 h-7 rounded-lg border border-slate-700 bg-transparent cursor-pointer p-0 shrink-0"
                />
                <input
                  type="text"
                  value={settings.PWA_THEME_COLOR || '#4f46e5'}
                  onChange={(e) => handleChange('PWA_THEME_COLOR', e.target.value)}
                  className="w-full px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Background Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.PWA_BACKGROUND_COLOR || '#0f172a'}
                  onChange={(e) => handleChange('PWA_BACKGROUND_COLOR', e.target.value)}
                  className="w-7 h-7 rounded-lg border border-slate-700 bg-transparent cursor-pointer p-0 shrink-0"
                />
                <input
                  type="text"
                  value={settings.PWA_BACKGROUND_COLOR || '#0f172a'}
                  onChange={(e) => handleChange('PWA_BACKGROUND_COLOR', e.target.value)}
                  className="w-full px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Global External Analytics Measurement IDs ── */}
      <div className="p-4 sm:p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3.5 shadow-md">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 text-indigo-400">
          <BarChart2 className="w-3.5 h-3.5" />
          <span>Global External Analytics Measurement IDs</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">
              Google Analytics 4 (GA4 ID)
            </label>
            <input
              type="text"
              value={settings.GA4_MEASUREMENT_ID || ''}
              onChange={(e) => handleChange('GA4_MEASUREMENT_ID', e.target.value)}
              placeholder="G-XXXXXXXXXX"
              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none font-mono"
            />
            <p className="text-[11px] text-slate-500">Embeds Google Analytics gtag.js on public pages.</p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">
              Plausible Analytics Tracking Domain
            </label>
            <input
              type="text"
              value={settings.PLAUSIBLE_DOMAIN || ''}
              onChange={(e) => handleChange('PLAUSIBLE_DOMAIN', e.target.value)}
              placeholder="e.g. yourdomain.com"
              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none font-mono"
            />
            <p className="text-[11px] text-slate-500">Privacy-friendly, cookie-free lightweight script via Plausible.</p>
          </div>
        </div>
      </div>

      {/* ── 5. Mail Gateway 1: Portfolio Message Forwarder ── */}
      <div className="p-4 sm:p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3.5 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 text-indigo-400">
              <Mail className="w-3.5 h-3.5" />
              <span>Gateway 1: Portfolio Forwarder (Gmail / Custom SMTP)</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Dispatches visitor contact messages from public portfolios to tenant emails.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="text-xs py-1 px-2.5 h-auto shrink-0"
            leftIcon={<Send className="w-3 h-3 text-indigo-400" />}
            onClick={() => openTestModal('portfolio')}
          >
            Test Forwarder
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">SMTP Host</label>
            <input
              type="text"
              value={settings.SMTP_HOST || 'smtp.gmail.com'}
              onChange={(e) => handleChange('SMTP_HOST', e.target.value)}
              placeholder="smtp.gmail.com"
              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">SMTP Port</label>
            <input
              type="text"
              value={settings.SMTP_PORT || '587'}
              onChange={(e) => handleChange('SMTP_PORT', e.target.value)}
              placeholder="587"
              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">SSL Connection</label>
            <select
              value={settings.SMTP_SECURE || 'false'}
              onChange={(e) => handleChange('SMTP_SECURE', e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
            >
              <option value="false">False (Port 587 / STARTTLS)</option>
              <option value="true">True (Port 465 / SSL)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">SMTP Username / Email</label>
            <input
              type="text"
              value={settings.SMTP_USER || ''}
              onChange={(e) => handleChange('SMTP_USER', e.target.value)}
              placeholder="portfolio.app@gmail.com"
              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">SMTP Password / App Password</label>
            <input
              type="password"
              value={settings.SMTP_PASS || ''}
              onChange={(e) => handleChange('SMTP_PASS', e.target.value)}
              placeholder="••••••••••••••••"
              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Sender "From" Email</label>
            <input
              type="email"
              value={settings.SMTP_FROM_EMAIL || 'noreply@myportfolio.com'}
              onChange={(e) => handleChange('SMTP_FROM_EMAIL', e.target.value)}
              placeholder="noreply@myportfolio.com"
              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* ── 6. Mail Gateway 2: Security & Password Reset ── */}
      <div className="p-4 sm:p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3.5 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
          <div>
            <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-rose-400" />
              <span>Gateway 2: Dedicated Security &amp; Password Reset Gateway</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Isolated SMTP server used exclusively for password resets and security notices.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="border-rose-500/30 text-rose-300 hover:bg-rose-500/10 text-xs py-1 px-2.5 h-auto shrink-0"
            leftIcon={<Send className="w-3 h-3 text-rose-400" />}
            onClick={() => openTestModal('reset')}
          >
            Test Security Gateway
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Reset SMTP Host</label>
            <input
              type="text"
              value={settings.SMTP_RESET_HOST || ''}
              onChange={(e) => handleChange('SMTP_RESET_HOST', e.target.value)}
              placeholder="smtp.gmail.com (blank to mirror Gateway 1)"
              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Reset SMTP Port</label>
            <input
              type="text"
              value={settings.SMTP_RESET_PORT || '587'}
              onChange={(e) => handleChange('SMTP_RESET_PORT', e.target.value)}
              placeholder="587"
              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Reset SSL Connection</label>
            <select
              value={settings.SMTP_RESET_SECURE || 'false'}
              onChange={(e) => handleChange('SMTP_RESET_SECURE', e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:border-rose-500 focus:outline-none"
            >
              <option value="false">False (Port 587 / STARTTLS)</option>
              <option value="true">True (Port 465 / SSL)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Reset SMTP Username</label>
            <input
              type="text"
              value={settings.SMTP_RESET_USER || ''}
              onChange={(e) => handleChange('SMTP_RESET_USER', e.target.value)}
              placeholder="security.app@gmail.com"
              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Reset SMTP Password</label>
            <input
              type="password"
              value={settings.SMTP_RESET_PASS || ''}
              onChange={(e) => handleChange('SMTP_RESET_PASS', e.target.value)}
              placeholder="••••••••••••••••"
              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Sender "From" Email</label>
            <input
              type="email"
              value={settings.SMTP_RESET_FROM_EMAIL || 'security@myportfolio.com'}
              onChange={(e) => handleChange('SMTP_RESET_FROM_EMAIL', e.target.value)}
              placeholder="security@myportfolio.com"
              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:border-rose-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* ── BOTTOM SAVE BAR ── */}
      <div className="pt-6 mt-6 border-t border-slate-800/80">
        <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900 border border-slate-700/80 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-slate-300 w-full sm:w-auto">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Info className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="font-semibold text-white">Save Changes to System Configuration</p>
              <p className="text-[11px] text-slate-400">Settings will be immediately applied across all platform services and tenants.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSettings}
              disabled={isSaving}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Discard Changes
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              isLoading={isSaving}
              leftIcon={saveSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
              className="text-xs px-5 py-2 font-bold shadow-lg shadow-indigo-500/20"
            >
              {saveSuccess ? 'Settings Saved Successfully!' : 'Save System Settings'}
            </Button>
          </div>
        </div>
      </div>

      {/* SMTP Test Connection Modal */}
      <Modal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        title={`Test ${activeTestGateway === 'reset' ? 'Password Reset Security' : 'Portfolio Forwarding'} Mail Gateway`}
      >
        <div className="space-y-3.5">
          <p className="text-xs text-slate-400">
            Send a test email using the <strong>{activeTestGateway === 'reset' ? 'Password Reset Security' : 'Portfolio Forwarding'}</strong> Gateway credentials.
          </p>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Destination Recipient Email Address</label>
            <input
              type="email"
              required
              value={testEmailAddress}
              onChange={(e) => setTestEmailAddress(e.target.value)}
              placeholder="your.email@domain.com"
              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-lg text-xs flex items-start gap-2.5 border ${
                testResult.success
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}
            >
              {testResult.success ? (
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              )}
              <div>
                <span className="font-bold block">{testResult.success ? 'SMTP Test Passed' : 'SMTP Test Failed'}</span>
                <p className="mt-0.5 text-[11px] opacity-90">{testResult.message}</p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button variant="ghost" size="sm" onClick={() => setIsTestModalOpen(false)} className="text-xs">
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleRunSmtpTest}
              isLoading={isTestingSmtp}
              disabled={!testEmailAddress}
              leftIcon={<Send className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Send Test Email
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
