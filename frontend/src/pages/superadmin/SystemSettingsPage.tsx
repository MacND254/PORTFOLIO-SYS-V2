import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import {
  Sliders, Save, Check, RefreshCw, ShieldAlert, UserPlus, HardDrive, Key, Mail, Building,
} from 'lucide-react';

export const SystemSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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

  if (isLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center gap-4">
        <Spinner size="lg" />
        <p className="text-slate-400 text-sm animate-pulse">Loading Platform System Settings...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Sliders className="w-7 h-7 text-indigo-400" />
            Global System Settings
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Configure platform maintenance mode, user registration policies, AI integrations, file upload limits, and SMTP servers.
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

      {/* ── 3. Email & SMTP Gateway ── */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Mail className="w-4 h-4 text-indigo-400" />
          <span>Platform SMTP Email Delivery Service</span>
        </h3>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">SMTP Host</label>
            <input
              type="text"
              value={settings.SMTP_HOST || ''}
              onChange={(e) => handleChange('SMTP_HOST', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">SMTP Port</label>
            <input
              type="text"
              value={settings.SMTP_PORT || '2525'}
              onChange={(e) => handleChange('SMTP_PORT', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">SMTP User</label>
            <input
              type="text"
              value={settings.SMTP_USER || ''}
              onChange={(e) => handleChange('SMTP_USER', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
