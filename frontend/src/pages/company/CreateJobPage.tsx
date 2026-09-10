import React, { useState, useEffect, KeyboardEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client';
import type { JobPosting, EmploymentType, WorkplaceType } from '../../types';
import {
  Briefcase, ChevronDown, RefreshCw, X, Plus, AlertCircle, Check,
  ArrowLeft, Lightbulb
} from 'lucide-react';

const EMPLOYMENT_OPTIONS: { value: EmploymentType; label: string }[] = [
  { value: 'FULL_TIME', label: 'Full-time' },
  { value: 'PART_TIME', label: 'Part-time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'INTERNSHIP', label: 'Internship' },
];

const WORKPLACE_OPTIONS: { value: WorkplaceType; label: string; desc: string }[] = [
  { value: 'REMOTE', label: 'Remote', desc: 'Work from anywhere' },
  { value: 'HYBRID', label: 'Hybrid', desc: 'Mix of office & remote' },
  { value: 'ONSITE', label: 'On-site', desc: 'Office-based' },
];

const EXPERIENCE_LEVELS = ['Entry Level', 'Mid-Level', 'Senior', 'Lead', 'Principal', 'Manager', 'Director'];

const SKILL_SUGGESTIONS = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'Go', 'Rust',
  'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure',
  'GraphQL', 'REST API', 'Vue.js', 'Angular', 'Next.js', 'FastAPI', 'Spring Boot',
  'Machine Learning', 'Data Analysis', 'SQL', 'Git', 'CI/CD', 'Agile',
];

interface FormState {
  title: string;
  department: string;
  employmentType: EmploymentType;
  workplaceType: WorkplaceType;
  location: string;
  experienceLevel: string;
  salaryRange: string;
  description: string;
  requirements: string;
  skills: string[];
}

const DEFAULT_FORM: FormState = {
  title: '',
  department: '',
  employmentType: 'FULL_TIME',
  workplaceType: 'REMOTE',
  location: '',
  experienceLevel: '',
  salaryRange: '',
  description: '',
  requirements: '',
  skills: [],
};

export function CreateJobPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;

  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [loadingJob, setLoadingJob] = useState(isEdit);
  const [error, setError] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const res: any = await api.get(`/companies/jobs/${id}`);
        const job: JobPosting = res.data?.data || res.data;
        setForm({
          title: job.title,
          department: job.department || '',
          employmentType: job.employmentType,
          workplaceType: job.workplaceType,
          location: job.location || '',
          experienceLevel: job.experienceLevel || '',
          salaryRange: job.salaryRange || '',
          description: job.description,
          requirements: job.requirements || '',
          skills: job.skills || [],
        });
      } catch {
        setError('Failed to load job details.');
      } finally {
        setLoadingJob(false);
      }
    })();
  }, [id, isEdit]);

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed || form.skills.includes(trimmed)) return;
    setForm(p => ({ ...p, skills: [...p.skills, trimmed] }));
    setSkillInput('');
    setShowSuggestions(false);
  };

  const removeSkill = (skill: string) => {
    setForm(p => ({ ...p, skills: p.skills.filter(s => s !== skill) }));
  };

  const handleSkillKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill(skillInput);
    }
  };

  const filteredSuggestions = SKILL_SUGGESTIONS.filter(
    s => !form.skills.includes(s) && s.toLowerCase().includes(skillInput.toLowerCase())
  ).slice(0, 8);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...form,
        department: form.department || undefined,
        location: form.location || undefined,
        experienceLevel: form.experienceLevel || undefined,
        salaryRange: form.salaryRange || undefined,
        requirements: form.requirements || undefined,
      };
      if (isEdit) {
        await api.patch(`/companies/jobs/${id}`, payload);
      } else {
        await api.post('/companies/jobs', payload);
      }
      setSuccess(true);
      setTimeout(() => navigate('/company/jobs'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save job posting.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingJob) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <RefreshCw className="w-7 h-7 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-white font-bold text-2xl mb-2">{isEdit ? 'Job Updated!' : 'Job Posted!'}</h2>
          <p className="text-slate-400">Redirecting to your jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-3xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/company/jobs')} className="p-1.5 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 rounded-lg transition" title="Back to jobs">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{isEdit ? 'Edit Job Posting' : 'Post a New Job'}</h1>
          <p className="text-slate-400 text-xs">Fill in the details to attract the best candidates</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-2.5 text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Info */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3">
          <h2 className="text-sm sm:text-base font-semibold text-white flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-indigo-400" />
            Job Details
          </h2>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Job Title <span className="text-red-400">*</span></label>
            <input
              required
              type="text"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Senior Full-Stack Engineer"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Department</label>
              <input
                type="text"
                value={form.department}
                onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                placeholder="e.g. Engineering"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Experience Level</label>
              <div className="relative">
                <select
                  value={form.experienceLevel}
                  onChange={e => setForm(p => ({ ...p, experienceLevel: e.target.value }))}
                  className="w-full appearance-none bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 pr-8 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                >
                  <option value="">Any level</option>
                  {EXPERIENCE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Employment Type */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3">
          <h2 className="text-sm sm:text-base font-semibold text-white">Employment & Location</h2>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Employment Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {EMPLOYMENT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, employmentType: opt.value }))}
                  className={`px-3 py-2 rounded-lg border text-xs font-medium transition ${form.employmentType === opt.value ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-600 hover:text-white'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Workplace Type</label>
            <div className="grid grid-cols-3 gap-2">
              {WORKPLACE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, workplaceType: opt.value }))}
                  className={`px-2.5 py-2 rounded-lg border text-xs font-medium transition flex flex-col items-center gap-0.5 ${form.workplaceType === opt.value ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-600 hover:text-white'}`}
                >
                  <span className="font-semibold">{opt.label}</span>
                  <span className="text-[10px] opacity-75">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Location</label>
              <input
                type="text"
                value={form.location}
                onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                placeholder="e.g. Nairobi, Kenya"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Salary Range</label>
              <input
                type="text"
                value={form.salaryRange}
                onChange={e => setForm(p => ({ ...p, salaryRange: e.target.value }))}
                placeholder="e.g. $80k - $120k"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3">
          <h2 className="text-sm sm:text-base font-semibold text-white">Required Skills</h2>
          <div className="relative">
            <input
              type="text"
              value={skillInput}
              onChange={e => { setSkillInput(e.target.value); setShowSuggestions(true); }}
              onKeyDown={handleSkillKeyDown}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Type a skill and press Enter..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 pr-9 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
            {skillInput && (
              <button type="button" onClick={() => addSkill(skillInput)} className="absolute right-2.5 top-2 text-indigo-400 hover:text-indigo-300 transition">
                <Plus className="w-4 h-4" />
              </button>
            )}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 overflow-hidden">
                {filteredSuggestions.map(s => (
                  <button
                    key={s}
                    type="button"
                    onMouseDown={() => addSkill(s)}
                    className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          {form.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {form.skills.map(skill => (
                <span key={skill} className="inline-flex items-center gap-1 bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 rounded-md text-xs font-medium">
                  {skill}
                  <button type="button" onClick={() => removeSkill(skill)} className="hover:text-red-400 transition">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex items-start gap-2 p-2.5 bg-indigo-500/5 border border-indigo-500/15 rounded-lg">
            <Lightbulb className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-indigo-300/80 text-[11px] leading-relaxed">
              Skills are used by the AI matching engine to rank candidates. The more specific your skills, the more accurate the matches.
            </p>
          </div>
        </div>

        {/* Description & Requirements */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3">
          <h2 className="text-sm sm:text-base font-semibold text-white">Job Description</h2>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Description <span className="text-red-400">*</span></label>
            <textarea
              required
              rows={5}
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Describe the role, responsibilities, team culture, and what makes this position exciting..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition resize-none text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Requirements <span className="text-slate-500">(optional)</span></label>
            <textarea
              rows={4}
              value={form.requirements}
              onChange={e => setForm(p => ({ ...p, requirements: e.target.value }))}
              placeholder="List the experience, qualifications, or certifications required for this role..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition resize-none text-xs"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-2.5 pt-2">
          <button type="button" onClick={() => navigate('/company/jobs')} className="flex-1 py-2 rounded-lg border border-slate-700 text-slate-300 hover:border-slate-600 hover:text-white transition font-medium text-xs">
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/20"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            {loading ? 'Saving...' : (isEdit ? 'Update Job' : 'Post Job')}
          </button>
        </div>
      </form>
    </div>
  );
}
