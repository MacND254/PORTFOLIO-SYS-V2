import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import {
  Calendar,
  Clock,
  Video,
  User,
  Building,
  Mail,
  Briefcase,
  CheckCircle2,
  CalendarCheck,
  Globe,
  Sparkles,
  Phone,
  Layers,
  ChevronRight,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';
import api from '../../api/client';

interface ScheduleMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  subdomain: string;
  candidateName: string;
  candidateTitle?: string;
  mode?: 'all' | 'call';
}

const MEETING_TYPES = [
  {
    type: 'RECRUITER_SCREEN',
    title: 'Recruiter Screening',
    description: 'Initial 15-30m chat to discuss background and role fit',
    defaultDuration: 30,
    icon: User,
    badge: 'Popular',
  },
  {
    type: 'TECHNICAL_INTERVIEW',
    title: 'Technical / Architecture',
    description: 'In-depth code walkthrough or system design session',
    defaultDuration: 60,
    icon: Sparkles,
  },
  {
    type: 'HIRING_MANAGER',
    title: 'Hiring Manager 1:1',
    description: 'Leadership alignment, team dynamics, and vision discussion',
    defaultDuration: 45,
    icon: Briefcase,
  },
  {
    type: 'INTRO_CALL',
    title: 'Introductory Call',
    description: 'Informal networking or exploration of future opportunities',
    defaultDuration: 15,
    icon: Phone,
  },
  {
    type: 'PROJECT_DISCUSSION',
    title: 'Project / Contract Scope',
    description: 'Detailed discussion for consulting, freelance, or contract work',
    defaultDuration: 45,
    icon: Layers,
  },
];

const PLATFORMS = [
  { id: 'GOOGLE_MEET', label: 'Google Meet', icon: Video, badge: 'Recommended' },
  { id: 'ZOOM', label: 'Zoom Video', icon: Video },
  { id: 'TEAMS', label: 'Microsoft Teams', icon: Video },
  { id: 'PHONE', label: 'Phone Call', icon: Phone },
];

const POPULAR_SLOTS = [
  '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'
];

export const ScheduleMeetingModal: React.FC<ScheduleMeetingModalProps> = ({
  isOpen,
  onClose,
  subdomain,
  candidateName,
  candidateTitle,
  mode = 'all',
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Type, Duration & Platform
  const [selectedType, setSelectedType] = useState(mode === 'call' ? 'INTRO_CALL' : 'RECRUITER_SCREEN');
  const [duration, setDuration] = useState(mode === 'call' ? 15 : 30);
  const [platform, setPlatform] = useState(mode === 'call' ? 'PHONE' : 'GOOGLE_MEET');

  // Step 2: Date & Time
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];

  const [date, setDate] = useState(defaultDateStr);
  const [time, setTime] = useState('14:00');
  const [timezone, setTimezone] = useState('UTC');
  const [showAlternate, setShowAlternate] = useState(false);
  const [altDate, setAltDate] = useState('');
  const [altTime, setAltTime] = useState('10:00');

  // Step 3: Recruiter Details
  const [recruiterName, setRecruiterName] = useState('');
  const [recruiterEmail, setRecruiterEmail] = useState('');
  const [company, setCompany] = useState('');
  const [recruiterTitle, setRecruiterTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [honeypot, setHoneypot] = useState('');

  // Submission State
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected) setTimezone(detected);
    } catch {
      setTimezone('UTC');
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'call') {
        setSelectedType('INTRO_CALL');
        setDuration(15);
        setPlatform('PHONE');
      } else {
        setSelectedType('RECRUITER_SCREEN');
        setDuration(30);
        setPlatform('GOOGLE_MEET');
      }
    }
  }, [isOpen, mode]);

  const resetForm = () => {
    setStep(1);
    setSelectedType(mode === 'call' ? 'INTRO_CALL' : 'RECRUITER_SCREEN');
    setDuration(mode === 'call' ? 15 : 30);
    setPlatform(mode === 'call' ? 'PHONE' : 'GOOGLE_MEET');
    setDate(defaultDateStr);
    setTime('14:00');
    setRecruiterName('');
    setRecruiterEmail('');
    setCompany('');
    setRecruiterTitle('');
    setNotes('');
    setHoneypot('');
    setSubmitted(false);
    setError('');
    setShowAlternate(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSelectType = (typeObj: typeof MEETING_TYPES[0]) => {
    setSelectedType(typeObj.type);
    setDuration(typeObj.defaultDuration);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await api.post('/interviews/public', {
        subdomain,
        recruiterName,
        recruiterEmail,
        company,
        recruiterTitle,
        interviewType: selectedType,
        preferredDate: date,
        preferredTime: time,
        timezone,
        durationMinutes: duration,
        platformPreference: platform,
        notes,
        alternateDate: showAlternate && altDate ? altDate : undefined,
        alternateTime: showAlternate && altDate ? altTime : undefined,
        honeypot,
      });

      setSubmitted(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to submit schedule request.');
    } finally {
      setIsLoading(false);
    }
  };

  const formattedDatePreview = () => {
    try {
      const d = new Date(date);
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return date;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="" maxWidth="lg">
      <div className="p-1">
        {submitted ? (
          /* Confirmation State */
          <div className="py-8 px-4 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-950/40 animate-in zoom-in-50 duration-300">
              <CalendarCheck className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                Request Dispatched
              </span>
              <h2 className="text-2xl font-extrabold text-white">
                {mode === 'call' ? 'Call Request Sent!' : 'Interview Request Sent!'}
              </h2>
              <p className="text-slate-400 text-sm max-w-md mx-auto">
                <strong>{candidateName}</strong> has been notified of your requested {mode === 'call' ? 'call' : 'meeting'} slot. You'll receive an automatic email confirmation as soon as it's accepted.
              </p>
            </div>

            {/* Slot Summary Card */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left max-w-md mx-auto space-y-2.5 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-400">{mode === 'call' ? 'Call Format' : 'Meeting Format'}</span>
                <span className="font-bold text-indigo-400">
                  {mode === 'call' ? `Direct Call (${platform.replace(/_/g, ' ')})` : selectedType.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-400">Scheduled Time</span>
                <span className="font-bold text-white">
                  {formattedDatePreview()} at {time} ({timezone})
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-400">Duration</span>
                <span className="font-bold text-white">{duration} Minutes</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Confirmation Sent To</span>
                <span className="font-bold text-emerald-400">{recruiterEmail}</span>
              </div>
            </div>

            <Button onClick={handleClose} className="w-full max-w-md">
              Done
            </Button>
          </div>
        ) : (
          /* Multi-Step Booking Form */
          <div>
            {/* Header */}
            <div className="mb-6 border-b border-slate-800/80 pb-5">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
                {mode === 'call' ? <Phone className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                <span>{mode === 'call' ? 'Book a Call' : 'Schedule an Interview or Meeting'}</span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                {mode === 'call' ? `Book a Call with ${candidateName}` : `Connect with ${candidateName}`}
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">
                {mode === 'call' ? 'Schedule a direct phone or video call' : (candidateTitle || 'Choose an interview or meeting format')}
              </p>

              {/* Step indicator */}
              <div className="flex items-center gap-2 mt-4">
                <div
                  className={`h-1.5 flex-1 rounded-full transition-all ${
                    step >= 1 ? 'bg-indigo-600' : 'bg-slate-800'
                  }`}
                />
                <div
                  className={`h-1.5 flex-1 rounded-full transition-all ${
                    step >= 2 ? 'bg-indigo-600' : 'bg-slate-800'
                  }`}
                />
                <div
                  className={`h-1.5 flex-1 rounded-full transition-all ${
                    step >= 3 ? 'bg-indigo-600' : 'bg-slate-800'
                  }`}
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* ── STEP 1: Meeting Type & Duration ────────────────────── */}
            {step === 1 && (
              <div className="space-y-6">
                {mode === 'call' ? (
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Direct 1:1 Call</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Quick call discussion directly with {candidateName} (no technical screening or interview stages).</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                      Select Meeting Type
                    </label>
                    <div className="space-y-2">
                      {MEETING_TYPES.map((t) => {
                        const Icon = t.icon;
                        const isSelected = selectedType === t.type;
                        return (
                          <button
                            key={t.type}
                            type="button"
                            onClick={() => handleSelectType(t)}
                            className={`w-full p-3.5 rounded-xl border text-left transition flex items-start gap-3.5 ${
                              isSelected
                                ? 'bg-indigo-600/15 border-indigo-500/70 shadow-md shadow-indigo-950/30'
                                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                            }`}
                          >
                            <div
                              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                                isSelected
                                  ? 'bg-indigo-600 text-white shadow-sm'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span
                                  className={`text-sm font-bold ${
                                    isSelected ? 'text-white' : 'text-slate-200'
                                  }`}
                                >
                                  {t.title}
                                </span>
                                {t.badge && (
                                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
                                    {t.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-400 text-xs mt-0.5 leading-snug">
                                {t.description}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Duration Pills */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    {mode === 'call' ? 'Call Length' : 'Meeting Length'}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[15, 30, 45, 60].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setDuration(mins)}
                        className={`py-2 rounded-xl text-xs font-bold transition border ${
                          duration === mins
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        {mins} min
                      </button>
                    ))}
                  </div>
                </div>

                {/* Platform Preference */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Preferred Video / Call Platform
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {PLATFORMS.map((p) => {
                      const Icon = p.icon;
                      const isSel = platform === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setPlatform(p.id)}
                          className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2.5 ${
                            isSel
                              ? 'bg-indigo-600/15 border-indigo-500 text-white'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                          }`}
                        >
                          <Icon className="w-4 h-4 text-indigo-400 shrink-0" />
                          <div className="text-xs font-semibold">{p.label}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button onClick={() => setStep(2)} className="gap-2">
                    <span>Next: Date &amp; Time</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* ── STEP 2: Date & Time ───────────────────────────────── */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Select Date
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Preferred Time Slot
                  </label>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {POPULAR_SLOTS.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setTime(slot)}
                        className={`py-2 rounded-xl text-xs font-bold transition border ${
                          time === slot
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Custom time:</span>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Timezone Indicator */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Globe className="w-4 h-4 text-indigo-400" />
                    <span>Timezone:</span>
                    <strong className="text-white">{timezone}</strong>
                  </div>
                  <span className="text-[11px] text-slate-500">Auto-detected</span>
                </div>

                {/* Optional Alternate Slot */}
                <div className="pt-2">
                  {!showAlternate ? (
                    <button
                      type="button"
                      onClick={() => setShowAlternate(true)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition"
                    >
                      + Propose backup / alternate slot (optional)
                    </button>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-300">Alternate Slot (Optional)</span>
                        <button
                          type="button"
                          onClick={() => setShowAlternate(false)}
                          className="text-[11px] text-rose-400 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          min={new Date().toISOString().split('T')[0]}
                          value={altDate}
                          onChange={(e) => setAltDate(e.target.value)}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                        />
                        <input
                          type="time"
                          value={altTime}
                          onChange={(e) => setAltTime(e.target.value)}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-2">
                  <Button variant="ghost" onClick={() => setStep(1)} className="gap-1 text-slate-400">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </Button>
                  <Button onClick={() => setStep(3)} className="gap-2">
                    <span>Next: Your Details</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Recruiter Details ─────────────────────────── */}
            {step === 3 && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Anti-spam honeypot */}
                <input
                  type="text"
                  name="honeypot"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  className="hidden"
                  tabIndex={-1}
                  autoComplete="off"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Your Full Name *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Sarah Jenkins"
                        value={recruiterName}
                        onChange={(e) => setRecruiterName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Work Email *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                      <input
                        type="email"
                        required
                        placeholder="sarah@company.com"
                        value={recruiterEmail}
                        onChange={(e) => setRecruiterEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Company / Organization *
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Stripe, Google, or Stealth AI"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Your Role / Title
                    </label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                      <input
                        type="text"
                        placeholder="e.g. Lead Tech Recruiter"
                        value={recruiterTitle}
                        onChange={(e) => setRecruiterTitle(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    {mode === 'call' ? 'Call Topic / Notes (Optional)' : 'Role Overview / Agenda (Optional)'}
                  </label>
                  <textarea
                    rows={3}
                    placeholder={mode === 'call' ? 'What would you like to chat about? (e.g. intro, role fit, opportunity)...' : 'Provide context about the opportunity, salary range, or tech stack...'}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                {/* Mini Recap */}
                <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-900/50 text-xs text-indigo-300 flex items-center justify-between">
                  <span>
                    📅 <strong>{formattedDatePreview()}</strong> at <strong>{time}</strong> ({duration} min)
                  </span>
                  <span className="font-semibold text-slate-400">{platform.replace(/_/g, ' ')}</span>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep(2)}
                    className="gap-1 text-slate-400"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </Button>
                  <Button type="submit" isLoading={isLoading} className="gap-2">
                    <CalendarCheck className="w-4 h-4" />
                    <span>{mode === 'call' ? 'Confirm & Request Call' : 'Confirm & Request Interview'}</span>
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
