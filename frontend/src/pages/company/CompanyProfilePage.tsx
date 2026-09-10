import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/client';
import {
  Building2, Globe, MapPin, Users, FileText, Mail, Phone,
  Briefcase, Save, RefreshCw, AlertCircle, CheckCircle2,
  ArrowLeft, Edit3, ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface CompanyProfile {
  id: string;
  name: string;
  website?: string;
  industry?: string;
  companySize?: string;
  location?: string;
  description?: string;
  contactPerson?: string;
  contactEmail?: string;
  email?: string;
}

const INDUSTRY_OPTIONS = [
  'Technology', 'Software & SaaS', 'Finance & Banking', 'Healthcare',
  'E-commerce & Retail', 'Media & Entertainment', 'Education', 'Consulting',
  'Manufacturing', 'Logistics & Transport', 'Legal', 'Real Estate',
  'Energy & Utilities', 'Government', 'Non-profit', 'Other',
];

const COMPANY_SIZE_OPTIONS = [
  '1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+',
];

function InputField({
  label, id, icon: Icon, value, onChange, placeholder, type = 'text', hint,
}: {
  label: string; id: string; icon: React.FC<any>; value: string;
  onChange: (v: string) => void; placeholder?: string; type?: string; hint?: string;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
          <Icon className="w-3.5 h-3.5" />
        </div>
        <input
          id={id}
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-white placeholder-slate-600 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition"
        />
      </div>
      {hint && <p className="text-[10px] text-slate-600">{hint}</p>}
    </div>
  );
}

function SelectField({
  label, id, icon: Icon, value, onChange, options, placeholder,
}: {
  label: string; id: string; icon: React.FC<any>; value: string;
  onChange: (v: string) => void; options: string[]; placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
          <Icon className="w-3.5 h-3.5" />
        </div>
        <select
          id={id}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full appearance-none bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition"
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function CompanyProfilePage() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [form, setForm] = useState({
    name: '',
    website: '',
    industry: '',
    companySize: '',
    location: '',
    description: '',
    contactPerson: '',
    contactEmail: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res: any = await api.get('/companies/profile');
      const data: CompanyProfile = res.data?.data || res.data;
      setProfile(data);
      setForm({
        name: data.name || '',
        website: data.website || '',
        industry: data.industry || '',
        companySize: data.companySize || '',
        location: data.location || '',
        description: data.description || '',
        contactPerson: data.contactPerson || '',
        contactEmail: data.contactEmail || '',
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load company profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.patch('/companies/profile', form);
      setSuccess('Company profile updated successfully!');
      setTimeout(() => setSuccess(''), 4000);
      await fetchProfile();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const set = (field: keyof typeof form) => (val: string) =>
    setForm(prev => ({ ...prev, [field]: val }));

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/company/dashboard"
          className="p-1.5 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 rounded-lg transition"
          title="Back to dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              <Building2 className="w-2.5 h-2.5" />
              Company Settings
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Company Profile
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Update your organisation's public-facing information and contact details.
          </p>
        </div>
        {profile?.website && (
          <a
            href={profile.website}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-indigo-400 border border-indigo-500/30 hover:border-indigo-500 rounded-lg transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Visit Website
          </a>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-2.5 text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
          <button onClick={() => setError('')} className="ml-auto text-xs underline hover:text-red-300">
            Dismiss
          </button>
        </div>
      )}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center gap-2.5 text-emerald-400 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {success}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
        </div>
      ) : (
        <form onSubmit={handleSave}>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* Left column: Company identity card */}
            <div className="xl:col-span-1 space-y-4">
              {/* Profile avatar / identity */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-5 text-center relative overflow-hidden shadow-lg">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
                <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-xl mx-auto shadow-md shadow-indigo-500/30 mb-2.5">
                  {form.name ? form.name.charAt(0).toUpperCase() : 'C'}
                </div>
                <h2 className="text-base font-bold text-white">{form.name || 'Your Company'}</h2>
                {form.industry && (
                  <p className="text-slate-400 text-xs mt-0.5">{form.industry}</p>
                )}
                {form.location && (
                  <p className="text-slate-500 text-xs mt-1 flex items-center justify-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {form.location}
                  </p>
                )}
                <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-center gap-1">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    Verified Partner
                  </span>
                </div>
              </div>

              {/* Quick stats */}
              {profile && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg space-y-2.5">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Account Details
                  </h3>
                  <div className="flex items-center gap-2 text-xs">
                    <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="text-slate-300 truncate">{profile.email}</span>
                  </div>
                  {form.website && (
                    <div className="flex items-center gap-2 text-xs">
                      <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <a
                        href={form.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 truncate transition"
                      >
                        {form.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                  {form.companySize && (
                    <div className="flex items-center gap-2 text-xs">
                      <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="text-slate-300">{form.companySize} employees</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right column: edit form */}
            <div className="xl:col-span-2 space-y-4">
              {/* Basic Info */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg">
                <div className="flex items-center gap-2 mb-3.5 pb-3 border-b border-slate-800/70">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center">
                    <Edit3 className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-xs sm:text-sm">Basic Information</h3>
                    <p className="text-slate-500 text-[11px]">Public-facing company details</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <InputField
                      id="name"
                      label="Company Name"
                      icon={Building2}
                      value={form.name}
                      onChange={set('name')}
                      placeholder="Acme Technologies Ltd."
                    />
                  </div>
                  <SelectField
                    id="industry"
                    label="Industry"
                    icon={Briefcase}
                    value={form.industry}
                    onChange={set('industry')}
                    options={INDUSTRY_OPTIONS}
                    placeholder="Select industry…"
                  />
                  <SelectField
                    id="companySize"
                    label="Company Size"
                    icon={Users}
                    value={form.companySize}
                    onChange={set('companySize')}
                    options={COMPANY_SIZE_OPTIONS}
                    placeholder="Select size…"
                  />
                  <InputField
                    id="location"
                    label="Headquarters Location"
                    icon={MapPin}
                    value={form.location}
                    onChange={set('location')}
                    placeholder="Nairobi, Kenya"
                  />
                  <InputField
                    id="website"
                    label="Website"
                    icon={Globe}
                    value={form.website}
                    onChange={set('website')}
                    placeholder="https://company.com"
                    type="url"
                    hint="Include https://"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg">
                <div className="flex items-center gap-2 mb-3.5 pb-3 border-b border-slate-800/70">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center">
                    <FileText className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-xs sm:text-sm">Company Description</h3>
                    <p className="text-slate-500 text-[11px]">Shown to candidates viewing your jobs</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="description"
                    className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider"
                  >
                    About Your Company
                  </label>
                  <textarea
                    id="description"
                    value={form.description}
                    onChange={e => set('description')(e.target.value)}
                    rows={4}
                    placeholder="Describe what your company does, your mission, culture, and what makes you a great place to work…"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-600 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition resize-none leading-relaxed"
                  />
                  <p className="text-[10px] text-slate-600">
                    {form.description.length} / 1000 characters recommended
                  </p>
                </div>
              </div>

              {/* Contact Details */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg">
                <div className="flex items-center gap-2 mb-3.5 pb-3 border-b border-slate-800/70">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center">
                    <Phone className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-xs sm:text-sm">Contact Details</h3>
                    <p className="text-slate-500 text-[11px]">Primary point of contact for this account</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InputField
                    id="contactPerson"
                    label="Contact Person"
                    icon={Users}
                    value={form.contactPerson}
                    onChange={set('contactPerson')}
                    placeholder="Jane Smith (HR Lead)"
                  />
                  <InputField
                    id="contactEmail"
                    label="Contact Email"
                    icon={Mail}
                    value={form.contactEmail}
                    onChange={set('contactEmail')}
                    placeholder="hr@company.com"
                    type="email"
                    hint="Used for platform correspondence"
                  />
                </div>
              </div>

              {/* Save */}
              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={fetchProfile}
                  disabled={saving}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 text-xs font-semibold transition"
                >
                  Discard Changes
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 disabled:opacity-60 text-white font-bold text-xs rounded-lg transition shadow-md shadow-indigo-500/20"
                >
                  {saving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  {saving ? 'Saving…' : 'Save Profile'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
