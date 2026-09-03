import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import {
  FileUp,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  GraduationCap,
  Award,
  Zap,
  ArrowRight,
  Code,
  Phone,
  Mail,
  MapPin,
  Globe,
  ExternalLink,
  ShieldCheck,
  User,
  Users,
  Check,
  Edit2,
  RotateCcw,
  Info,
  Languages,
  AlertTriangle,
  Trash2,
  Plus,
} from 'lucide-react';

export const CvImportPage: React.FC = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [extraction, setExtraction] = useState<any>(null);
  const [isLoadingExtraction, setIsLoadingExtraction] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState<
    'general' | 'contacts' | 'experience' | 'education' | 'skills' | 'certifications' | 'languages' | 'references'
  >('general');
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [selectedSections, setSelectedSections] = useState<Record<string, boolean>>({
    general: true,
    contacts: true,
    experience: true,
    education: true,
    skills: true,
    certifications: true,
    languages: true,
    references: true,
  });

  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    fetchLatestExtraction();
  }, []);

  const fetchLatestExtraction = async () => {
    setIsLoadingExtraction(true);
    try {
      const res: any = await api.get('/cv/extraction');
      setExtraction(res.data);
    } catch {
      setExtraction(null);
    } finally {
      setIsLoadingExtraction(false);
    }
  };

  const handleResetScanner = async () => {
    setIsResetting(true);
    setMessage('');
    setErrorMessage('');
    try {
      await api.delete('/cv/extraction');
    } catch {
      // Silently ignore if no extraction exists to delete
    } finally {
      setExtraction(null);
      setFile(null);
      setIsResetting(false);
      setMessage('');
      setErrorMessage('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadCV = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setIsUploading(true);
    setMessage('');
    setErrorMessage('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res: any = await api.post('/cv/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res?.data?.extraction) {
        setExtraction(res.data.extraction);
      } else {
        await fetchLatestExtraction();
      }
      setMessage('CV uploaded and parsed with precision! Review, edit, and verify fields below before applying to your profile.');
    } catch (err: any) {
      setErrorMessage(err.message || 'CV processing failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleImportToProfile = async (redirectToProfile = false) => {
    if (!extraction || !extraction.extractedData) return;
    setIsImporting(true);
    setMessage('');
    setErrorMessage('');

    try {
      const activeSections = Object.keys(selectedSections).filter((k) => selectedSections[k]);
      await api.post('/cv/import', {
        extractedData: extraction.extractedData,
        options: {
          importMode,
          selectedSections: activeSections,
        },
      });

      setMessage('All selected CV details verified and imported into your live portfolio successfully!');

      if (redirectToProfile) {
        setTimeout(() => {
          navigate('/admin/profile');
        }, 800);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Import failed. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  const extracted = extraction?.extractedData;
  const diffAnalysis = extracted?.diffAnalysis;

  // Helper to update extractedData in place
  const updateExtracted = (updater: (prevData: any) => any) => {
    setExtraction((prev: any) => {
      if (!prev || !prev.extractedData) return prev;
      return {
        ...prev,
        extractedData: updater({ ...prev.extractedData }),
      };
    });
  };

  // Experience handlers
  const handleAddExperience = () => {
    updateExtracted((data) => ({
      ...data,
      experiences: [
        ...(data.experiences || []),
        {
          position: '',
          company: '',
          location: '',
          startDate: '',
          endDate: '',
          isCurrent: false,
          description: '',
        },
      ],
    }));
  };

  const handleUpdateExperience = (index: number, field: string, value: any) => {
    updateExtracted((data) => {
      const list = [...(data.experiences || [])];
      list[index] = { ...list[index], [field]: value };
      return { ...data, experiences: list };
    });
  };

  const handleDeleteExperience = (index: number) => {
    updateExtracted((data) => {
      const list = [...(data.experiences || [])];
      list.splice(index, 1);
      return { ...data, experiences: list };
    });
  };

  // Education handlers
  const handleAddEducation = () => {
    updateExtracted((data) => ({
      ...data,
      education: [
        ...(data.education || []),
        {
          qualification: '',
          institution: '',
          field: '',
          startDate: '',
          endDate: '',
          grade: '',
        },
      ],
    }));
  };

  const handleUpdateEducation = (index: number, field: string, value: any) => {
    updateExtracted((data) => {
      const list = [...(data.education || [])];
      list[index] = { ...list[index], [field]: value };
      return { ...data, education: list };
    });
  };

  const handleDeleteEducation = (index: number) => {
    updateExtracted((data) => {
      const list = [...(data.education || [])];
      list.splice(index, 1);
      return { ...data, education: list };
    });
  };

  // Skills handlers
  const handleAddSkill = (category: 'Technical' | 'Soft' = 'Technical') => {
    updateExtracted((data) => ({
      ...data,
      skills: [
        ...(data.skills || []),
        {
          name: '',
          category,
        },
      ],
    }));
  };

  const handleUpdateSkill = (index: number, field: string, value: any) => {
    updateExtracted((data) => {
      const list = [...(data.skills || [])];
      const item =
        typeof list[index] === 'string'
          ? { name: list[index], category: 'Technical' }
          : { ...list[index] };
      item[field] = value;
      list[index] = item;
      return { ...data, skills: list };
    });
  };

  const handleDeleteSkill = (index: number) => {
    updateExtracted((data) => {
      const list = [...(data.skills || [])];
      list.splice(index, 1);
      return { ...data, skills: list };
    });
  };

  // Certification handlers
  const handleAddCertification = () => {
    updateExtracted((data) => ({
      ...data,
      certifications: [
        ...(data.certifications || []),
        {
          name: '',
          issuingOrganization: '',
          issueDate: '',
          credentialId: '',
          credentialUrl: '',
        },
      ],
    }));
  };

  const handleUpdateCertification = (index: number, field: string, value: any) => {
    updateExtracted((data) => {
      const list = [...(data.certifications || [])];
      list[index] = { ...list[index], [field]: value };
      return { ...data, certifications: list };
    });
  };

  const handleDeleteCertification = (index: number) => {
    updateExtracted((data) => {
      const list = [...(data.certifications || [])];
      list.splice(index, 1);
      return { ...data, certifications: list };
    });
  };

  // Language handlers
  const handleAddLanguage = () => {
    updateExtracted((data) => ({
      ...data,
      languages: [
        ...(data.languages || []),
        {
          language: '',
          proficiency: 'Professional',
        },
      ],
    }));
  };

  const handleUpdateLanguage = (index: number, field: string, value: any) => {
    updateExtracted((data) => {
      const list = [...(data.languages || [])];
      list[index] = { ...list[index], [field]: value };
      return { ...data, languages: list };
    });
  };

  const handleDeleteLanguage = (index: number) => {
    updateExtracted((data) => {
      const list = [...(data.languages || [])];
      list.splice(index, 1);
      return { ...data, languages: list };
    });
  };

  // Reference handlers
  const handleAddReference = () => {
    updateExtracted((data) => ({
      ...data,
      references: [
        ...(data.references || []),
        {
          name: '',
          position: '',
          organization: '',
          email: '',
          phone: '',
          relationship: '',
        },
      ],
    }));
  };

  const handleUpdateReference = (index: number, field: string, value: any) => {
    updateExtracted((data) => {
      const list = [...(data.references || [])];
      list[index] = { ...list[index], [field]: value };
      return { ...data, references: list };
    });
  };

  const handleDeleteReference = (index: number) => {
    updateExtracted((data) => {
      const list = [...(data.references || [])];
      list.splice(index, 1);
      return { ...data, references: list };
    });
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">NEW FIELD</span>;
      case 'UPDATED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">UPDATED VALUE</span>;
      case 'UNCHANGED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">IDENTICAL</span>;
      default:
        return null;
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Sparkles className="w-7 h-7 text-indigo-400" />
            <span>CV Scanner &amp; Profile Mapping</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            Upload your resume (PDF, Word DOCX, TXT) to accurately extract and edit information before mapping it into your Edit Profile fields.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {extraction && (
            <Button
              type="button"
              variant="secondary"
              onClick={handleResetScanner}
              isLoading={isResetting}
              leftIcon={<Trash2 className="w-4 h-4 text-red-400" />}
              className="border-red-500/30 hover:border-red-500/60 text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              Reset Scanner
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/admin/profile')}
            leftIcon={<ArrowRight className="w-4 h-4" />}
          >
            Open Profile Editor
          </Button>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Upload Zone */}
      <form onSubmit={handleUploadCV} className="p-6 sm:p-10 rounded-2xl sm:rounded-3xl bg-slate-900 border-2 border-dashed border-slate-800 hover:border-indigo-500/50 transition text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto">
          <FileUp className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white">Drag &amp; drop your resume file here</h3>
          <p className="text-xs text-slate-400">Supports standard &amp; 2-column PDFs, Word (.docx/.doc), or TXT (up to 10MB)</p>
        </div>

        <div className="flex justify-center items-center gap-3">
          <input
            type="file"
            id="cv-upload"
            onChange={handleFileChange}
            accept=".pdf,.docx,.doc,.txt"
            className="hidden"
          />
          <label
            htmlFor="cv-upload"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition border border-slate-700"
          >
            {file ? file.name : 'Choose Resume File'}
          </label>

          <Button type="submit" variant="primary" size="sm" isLoading={isUploading} disabled={!file}>
            {isUploading ? 'Scanning Document...' : 'Scan & Extract'}
          </Button>
        </div>
      </form>

      {/* Extraction Review Section */}
      {isLoadingExtraction ? (
        <div className="py-12 flex justify-center"><Spinner /></div>
      ) : extracted ? (
        <div className="space-y-6">

          {/* Accuracy Disclaimer */}
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/8 border border-amber-500/25 text-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-amber-300 uppercase tracking-wider">AI Extraction — All Fields Are Editable Below</p>
              <p className="text-xs text-amber-200/80 leading-relaxed">
                The CV scanner interprets your resume using smart parsing and may occasionally misread or format details.
                <strong className="text-amber-300"> All fields below are fully editable.</strong> Feel free to modify, add, or delete items in any tab before applying to your profile. (Projects can be added manually under the Edit Profile module.)
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-400" />
                <span>Extracted Profile Data (Fully Editable)</span>
              </h2>
                <p className="text-xs text-slate-400">Review and refine your extracted facts below. Changes made here will be applied directly to your profile.</p>
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  {(extraction?.confidenceScores?.engineUsed === 'gemini' || extracted?.structuredResume?.meta?.engineUsed === 'gemini') ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Extraction Engine: <strong>Google Gemini Flash (AI Active)</strong></span>
                      {extracted?.structuredResume?.meta?.durationMs && (
                        <span className="text-slate-400 text-[11px] font-mono">({extracted.structuredResume.meta.durationMs}ms)</span>
                      )}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      <Info className="w-3.5 h-3.5 text-amber-400" />
                      <span>Extraction Engine: <strong>Heuristic Rule Engine (Fallback)</strong></span>
                    </span>
                  )}
                  {extraction?.confidenceScores?.qualityScore?.overall !== undefined && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                      Quality Score: {extraction.confidenceScores.qualityScore.overall}/100
                    </span>
                  )}
                </div>
              </div>
            <div className="flex items-center gap-2.5">
              <Button
                variant="secondary"
                onClick={() => handleImportToProfile(false)}
                isLoading={isImporting}
              >
                Apply to Profile
              </Button>
              <Button
                variant="primary"
                onClick={() => handleImportToProfile(true)}
                isLoading={isImporting}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold"
                leftIcon={<Sparkles className="w-4 h-4 text-amber-300" />}
              >
                Apply &amp; Open Profile Editor →
              </Button>
            </div>
          </div>

          {/* Section Selection and Import Mode */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Select Sections to Auto-Fill:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSections({
                    general: true,
                    contacts: true,
                    experience: true,
                    education: true,
                    skills: true,
                    certifications: true,
                    languages: true,
                    references: true,
                  })}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  Select All
                </button>
                <span className="text-slate-600">|</span>
                <button
                  type="button"
                  onClick={() => setSelectedSections({
                    general: false,
                    contacts: false,
                    experience: false,
                    education: false,
                    skills: false,
                    certifications: false,
                    languages: false,
                    references: false,
                  })}
                  className="text-xs text-slate-400 hover:text-slate-300 font-semibold"
                >
                  Deselect All
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: 'general', label: 'General Bio & Headline' },
                { key: 'contacts', label: 'Contact & Socials' },
                { key: 'experience', label: `Experience (${extracted.experiences?.length || 0})` },
                { key: 'education', label: `Education (${extracted.education?.length || 0})` },
                { key: 'skills', label: `Skills (${extracted.skills?.length || 0})` },
                { key: 'certifications', label: `Certifications (${extracted.certifications?.length || 0})` },
                { key: 'languages', label: `Languages (${extracted.languages?.length || 0})` },
                { key: 'references', label: `Referees (${extracted.references?.length || 0})` },
              ].map((sec) => (
                <label
                  key={sec.key}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition select-none ${
                    selectedSections[sec.key]
                      ? 'bg-indigo-600/15 border-indigo-500/50 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(selectedSections[sec.key])}
                    onChange={(e) =>
                      setSelectedSections({
                        ...selectedSections,
                        [sec.key]: e.target.checked,
                      })
                    }
                    className="w-3.5 h-3.5 rounded bg-slate-900 border-slate-700 text-indigo-600"
                  />
                  <span className="font-semibold truncate">{sec.label}</span>
                </label>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Import Strategy:</span>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                  <input
                    type="radio"
                    name="pageImportMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="text-indigo-600"
                  />
                  <span><strong>Clean Replace</strong> — Overwrite selected profile tabs with CV data</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                  <input
                    type="radio"
                    name="pageImportMode"
                    value="append"
                    checked={importMode === 'append'}
                    onChange={() => setImportMode('append')}
                    className="text-indigo-600"
                  />
                  <span><strong>Append Mode</strong> — Merge scanned items alongside existing items</span>
                </label>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-slate-800 gap-4 text-xs sm:text-sm font-semibold text-slate-400 overflow-x-auto no-scrollbar">
            <button onClick={() => setActiveTab('general')} className={`pb-3 border-b-2 transition whitespace-nowrap ${activeTab === 'general' ? 'border-indigo-500 text-white' : 'border-transparent hover:text-white'}`}>General Bio</button>
            <button onClick={() => setActiveTab('contacts')} className={`pb-3 border-b-2 transition whitespace-nowrap ${activeTab === 'contacts' ? 'border-indigo-500 text-white' : 'border-transparent hover:text-white'}`}>Contact &amp; Social</button>
            <button onClick={() => setActiveTab('experience')} className={`pb-3 border-b-2 transition whitespace-nowrap ${activeTab === 'experience' ? 'border-indigo-500 text-white' : 'border-transparent hover:text-white'}`}>Work Experience ({extracted.experiences?.length || 0})</button>
            <button onClick={() => setActiveTab('education')} className={`pb-3 border-b-2 transition whitespace-nowrap ${activeTab === 'education' ? 'border-indigo-500 text-white' : 'border-transparent hover:text-white'}`}>Education ({extracted.education?.length || 0})</button>
            <button onClick={() => setActiveTab('skills')} className={`pb-3 border-b-2 transition whitespace-nowrap ${activeTab === 'skills' ? 'border-indigo-500 text-white' : 'border-transparent hover:text-white'}`}>Skills ({extracted.skills?.length || 0})</button>
            <button onClick={() => setActiveTab('certifications')} className={`pb-3 border-b-2 transition whitespace-nowrap ${activeTab === 'certifications' ? 'border-indigo-500 text-white' : 'border-transparent hover:text-white'}`}>Certifications ({extracted.certifications?.length || 0})</button>
            <button onClick={() => setActiveTab('languages')} className={`pb-3 border-b-2 transition whitespace-nowrap ${activeTab === 'languages' ? 'border-indigo-500 text-white' : 'border-transparent hover:text-white'}`}>Languages ({extracted.languages?.length || 0})</button>
            <button onClick={() => setActiveTab('references')} className={`pb-3 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'references' ? 'border-indigo-500 text-white' : 'border-transparent hover:text-white'}`}>
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              Referees ({extracted.references?.length || 0})
            </button>
          </div>

          {/* Tab 1: General Bio */}
          {activeTab === 'general' && (
            <div className="space-y-4 p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-slate-400 font-semibold">Full Name (User.fullName)</label>
                    {diffAnalysis?.general?.find((d: any) => d.field === 'fullName') && renderStatusBadge(diffAnalysis.general.find((d: any) => d.field === 'fullName').status)}
                  </div>
                  <input
                    type="text"
                    value={extracted.personalInfo?.fullName || ''}
                    onChange={(e) => updateExtracted((data) => ({
                      ...data,
                      personalInfo: { ...data.personalInfo, fullName: e.target.value },
                    }))}
                    className="w-full p-3 rounded-xl bg-slate-950 text-white font-bold text-sm border border-slate-800 focus:border-indigo-500 focus:outline-none"
                    placeholder="Candidate Name"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-slate-400 font-semibold">Professional Title (Profile.title)</label>
                    {diffAnalysis?.general?.find((d: any) => d.field === 'title') && renderStatusBadge(diffAnalysis.general.find((d: any) => d.field === 'title').status)}
                  </div>
                  <input
                    type="text"
                    value={extracted.personalInfo?.title || ''}
                    onChange={(e) => updateExtracted((data) => ({
                      ...data,
                      personalInfo: { ...data.personalInfo, title: e.target.value },
                    }))}
                    className="w-full p-3 rounded-xl bg-slate-950 text-white font-bold text-sm border border-slate-800 focus:border-indigo-500 focus:outline-none"
                    placeholder="e.g. Senior Software Architect"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs text-slate-400 font-semibold">Tagline / Headline (Profile.headline)</label>
                  {diffAnalysis?.general?.find((d: any) => d.field === 'headline') && renderStatusBadge(diffAnalysis.general.find((d: any) => d.field === 'headline').status)}
                </div>
                <input
                  type="text"
                  value={extracted.headline || ''}
                  onChange={(e) => updateExtracted((data) => ({
                    ...data,
                    headline: e.target.value,
                  }))}
                  className="w-full p-3 rounded-xl bg-slate-950 text-slate-200 text-sm border border-slate-800 focus:border-indigo-500 focus:outline-none"
                  placeholder="e.g. Building scalable cloud solutions"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-400 font-semibold">Professional Summary (Profile.summary)</label>
                    {diffAnalysis?.general?.find((d: any) => d.field === 'summary') && renderStatusBadge(diffAnalysis.general.find((d: any) => d.field === 'summary').status)}
                  </div>
                </div>

                <textarea
                  rows={4}
                  value={extracted.summary || ''}
                  onChange={(e) => updateExtracted((data) => ({
                    ...data,
                    summary: e.target.value,
                  }))}
                  className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Tab 2: Contacts */}
          {activeTab === 'contacts' && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-slate-400 font-semibold flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-indigo-400" /> Contact Email (Profile.contactEmail)</label>
                    {diffAnalysis?.contacts?.find((d: any) => d.field === 'contactEmail') && renderStatusBadge(diffAnalysis.contacts.find((d: any) => d.field === 'contactEmail').status)}
                  </div>
                  <input
                    type="email"
                    value={extracted.personalInfo?.email || ''}
                    onChange={(e) => updateExtracted((data) => ({
                      ...data,
                      personalInfo: { ...data.personalInfo, email: e.target.value },
                    }))}
                    className="w-full p-3 rounded-xl bg-slate-950 text-white text-sm border border-slate-800 focus:border-indigo-500 focus:outline-none"
                    placeholder="email@example.com"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-slate-400 font-semibold flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-emerald-400" /> Phone Number (Profile.phone)</label>
                    {diffAnalysis?.contacts?.find((d: any) => d.field === 'phone') && renderStatusBadge(diffAnalysis.contacts.find((d: any) => d.field === 'phone').status)}
                  </div>
                  <input
                    type="text"
                    value={extracted.personalInfo?.phone || ''}
                    onChange={(e) => updateExtracted((data) => ({
                      ...data,
                      personalInfo: { ...data.personalInfo, phone: e.target.value },
                    }))}
                    className="w-full p-3 rounded-xl bg-slate-950 text-white text-sm border border-slate-800 focus:border-indigo-500 focus:outline-none"
                    placeholder="+254 712 345 678"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-slate-400 font-semibold flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-amber-400" /> Location (Profile.location)</label>
                    {diffAnalysis?.general?.find((d: any) => d.field === 'location') && renderStatusBadge(diffAnalysis.general.find((d: any) => d.field === 'location').status)}
                  </div>
                  <input
                    type="text"
                    value={extracted.personalInfo?.location || ''}
                    onChange={(e) => updateExtracted((data) => ({
                      ...data,
                      personalInfo: { ...data.personalInfo, location: e.target.value },
                    }))}
                    className="w-full p-3 rounded-xl bg-slate-950 text-white text-sm border border-slate-800 focus:border-indigo-500 focus:outline-none"
                    placeholder="City, Country"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-slate-400 font-semibold flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-purple-400" /> Website (Profile.website)</label>
                    {diffAnalysis?.contacts?.find((d: any) => d.field === 'website') && renderStatusBadge(diffAnalysis.contacts.find((d: any) => d.field === 'website').status)}
                  </div>
                  <input
                    type="url"
                    value={extracted.personalInfo?.website || ''}
                    onChange={(e) => updateExtracted((data) => ({
                      ...data,
                      personalInfo: { ...data.personalInfo, website: e.target.value },
                    }))}
                    className="w-full p-3 rounded-xl bg-slate-950 text-indigo-400 text-sm border border-slate-800 focus:border-indigo-500 focus:outline-none font-mono"
                    placeholder="https://mywebsite.com"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-slate-400 font-semibold">LinkedIn Profile (Profile.linkedin)</label>
                    {diffAnalysis?.contacts?.find((d: any) => d.field === 'linkedin') && renderStatusBadge(diffAnalysis.contacts.find((d: any) => d.field === 'linkedin').status)}
                  </div>
                  <input
                    type="text"
                    value={extracted.personalInfo?.linkedin || ''}
                    onChange={(e) => updateExtracted((data) => ({
                      ...data,
                      personalInfo: { ...data.personalInfo, linkedin: e.target.value },
                    }))}
                    className="w-full p-3 rounded-xl bg-slate-950 text-indigo-400 text-sm border border-slate-800 focus:border-indigo-500 focus:outline-none font-mono"
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-slate-400 font-semibold">GitHub Profile (Profile.github)</label>
                    {diffAnalysis?.contacts?.find((d: any) => d.field === 'github') && renderStatusBadge(diffAnalysis.contacts.find((d: any) => d.field === 'github').status)}
                  </div>
                  <input
                    type="text"
                    value={extracted.personalInfo?.github || ''}
                    onChange={(e) => updateExtracted((data) => ({
                      ...data,
                      personalInfo: { ...data.personalInfo, github: e.target.value },
                    }))}
                    className="w-full p-3 rounded-xl bg-slate-950 text-indigo-400 text-sm border border-slate-800 focus:border-indigo-500 focus:outline-none font-mono"
                    placeholder="https://github.com/username"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Work Experience (EDITABLE) */}
          {activeTab === 'experience' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-indigo-400" />
                    <span>Work Experience Positions ({extracted.experiences?.length || 0})</span>
                  </h3>
                  <p className="text-xs text-slate-400">Modify any field directly below or add new past roles.</p>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleAddExperience}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Add Experience
                </Button>
              </div>

              {(!extracted.experiences || extracted.experiences.length === 0) && (
                <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-dashed border-slate-800 space-y-3">
                  <p className="text-xs text-slate-400">No work experiences detected in this resume.</p>
                  <Button type="button" variant="secondary" size="sm" onClick={handleAddExperience} leftIcon={<Plus className="w-4 h-4" />}>
                    Add Position Manually
                  </Button>
                </div>
              )}

              {extracted.experiences?.map((exp: any, idx: number) => (
                <div key={idx} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 hover:border-slate-700 transition">
                  <div className="flex justify-between items-center border-b border-slate-800/80 pb-2.5">
                    <span className="text-xs font-bold text-indigo-400 font-mono">Role #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteExperience(idx)}
                      className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition text-xs flex items-center gap-1"
                      title="Delete this role"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-400">Job Title / Position *</label>
                      <input
                        type="text"
                        value={exp.position || ''}
                        onChange={(e) => handleUpdateExperience(idx, 'position', e.target.value)}
                        placeholder="e.g. Senior Software Engineer"
                        className="w-full p-2.5 rounded-xl bg-slate-950 text-white font-semibold text-xs border border-slate-800 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-400">Company / Organization *</label>
                      <input
                        type="text"
                        value={exp.company || ''}
                        onChange={(e) => handleUpdateExperience(idx, 'company', e.target.value)}
                        placeholder="e.g. Tech Innovators Ltd"
                        className="w-full p-2.5 rounded-xl bg-slate-950 text-white text-xs border border-slate-800 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-400">Location</label>
                      <input
                        type="text"
                        value={exp.location || ''}
                        onChange={(e) => handleUpdateExperience(idx, 'location', e.target.value)}
                        placeholder="e.g. Nairobi, Kenya or Remote"
                        className="w-full p-2.5 rounded-xl bg-slate-950 text-slate-300 text-xs border border-slate-800 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3 items-center">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-400">Start Date</label>
                      <input
                        type="text"
                        value={exp.startDate || ''}
                        onChange={(e) => handleUpdateExperience(idx, 'startDate', e.target.value)}
                        placeholder="e.g. Jan 2021"
                        className="w-full p-2.5 rounded-xl bg-slate-950 text-slate-200 text-xs border border-slate-800 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-400">End Date</label>
                      <input
                        type="text"
                        value={exp.endDate || ''}
                        disabled={Boolean(exp.isCurrent)}
                        onChange={(e) => handleUpdateExperience(idx, 'endDate', e.target.value)}
                        placeholder={exp.isCurrent ? 'Present' : 'e.g. Dec 2023'}
                        className={`w-full p-2.5 rounded-xl bg-slate-950 text-slate-200 text-xs border border-slate-800 focus:border-indigo-500 focus:outline-none ${
                          exp.isCurrent ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-4">
                      <input
                        type="checkbox"
                        id={`expCurrent-${idx}`}
                        checked={Boolean(exp.isCurrent)}
                        onChange={(e) => handleUpdateExperience(idx, 'isCurrent', e.target.checked)}
                        className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor={`expCurrent-${idx}`} className="text-xs text-slate-300 font-medium cursor-pointer">
                        Currently working in this role
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400">Description &amp; Key Responsibilities</label>
                    <textarea
                      rows={3}
                      value={exp.description || ''}
                      onChange={(e) => handleUpdateExperience(idx, 'description', e.target.value)}
                      placeholder="Summary of responsibilities, achievements, and technologies used..."
                      className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs leading-relaxed focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 4: Education (EDITABLE) */}
          {activeTab === 'education' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-indigo-400" />
                    <span>Education Records ({extracted.education?.length || 0})</span>
                  </h3>
                  <p className="text-xs text-slate-400">Edit qualifications, institutions, and completion years.</p>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleAddEducation}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Add Education
                </Button>
              </div>

              {(!extracted.education || extracted.education.length === 0) && (
                <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-dashed border-slate-800 space-y-3">
                  <p className="text-xs text-slate-400">No education entries detected in this resume.</p>
                  <Button type="button" variant="secondary" size="sm" onClick={handleAddEducation} leftIcon={<Plus className="w-4 h-4" />}>
                    Add Education Manually
                  </Button>
                </div>
              )}

              {extracted.education?.map((edu: any, idx: number) => (
                <div key={idx} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 hover:border-slate-700 transition">
                  <div className="flex justify-between items-center border-b border-slate-800/80 pb-2.5">
                    <span className="text-xs font-bold text-indigo-400 font-mono">Degree / Certificate #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteEducation(idx)}
                      className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition text-xs flex items-center gap-1"
                      title="Delete this education"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-400">Qualification / Degree *</label>
                      <input
                        type="text"
                        value={edu.qualification || ''}
                        onChange={(e) => handleUpdateEducation(idx, 'qualification', e.target.value)}
                        placeholder="e.g. B.Sc. Computer Science"
                        className="w-full p-2.5 rounded-xl bg-slate-950 text-white font-semibold text-xs border border-slate-800 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-400">Institution / University *</label>
                      <input
                        type="text"
                        value={edu.institution || ''}
                        onChange={(e) => handleUpdateEducation(idx, 'institution', e.target.value)}
                        placeholder="e.g. University of Nairobi"
                        className="w-full p-2.5 rounded-xl bg-slate-950 text-white text-xs border border-slate-800 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-400">Field of Study</label>
                      <input
                        type="text"
                        value={edu.field || ''}
                        onChange={(e) => handleUpdateEducation(idx, 'field', e.target.value)}
                        placeholder="e.g. Software Engineering"
                        className="w-full p-2.5 rounded-xl bg-slate-950 text-slate-300 text-xs border border-slate-800 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-400">Start Date / Year</label>
                      <input
                        type="text"
                        value={edu.startDate || ''}
                        onChange={(e) => handleUpdateEducation(idx, 'startDate', e.target.value)}
                        placeholder="e.g. 2018"
                        className="w-full p-2.5 rounded-xl bg-slate-950 text-slate-200 text-xs border border-slate-800 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-400">End Date / Year</label>
                      <input
                        type="text"
                        value={edu.endDate || ''}
                        onChange={(e) => handleUpdateEducation(idx, 'endDate', e.target.value)}
                        placeholder="e.g. 2022"
                        className="w-full p-2.5 rounded-xl bg-slate-950 text-slate-200 text-xs border border-slate-800 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-400">Grade / Honours / GPA</label>
                      <input
                        type="text"
                        value={edu.grade || ''}
                        onChange={(e) => handleUpdateEducation(idx, 'grade', e.target.value)}
                        placeholder="e.g. First Class Honours"
                        className="w-full p-2.5 rounded-xl bg-slate-950 text-slate-200 text-xs border border-slate-800 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 5: Skills (EDITABLE) */}
          {activeTab === 'skills' && (() => {
            const allSkills = extracted.skills || [];
            const technicalSkills = allSkills
              .map((s: any, idx: number) => ({ s, idx }))
              .filter(({ s }: any) => {
                const cat = typeof s === 'string' ? 'Technical' : (s.category || 'Technical');
                return cat !== 'Soft';
              });
            const softSkills = allSkills
              .map((s: any, idx: number) => ({ s, idx }))
              .filter(({ s }: any) => {
                const cat = typeof s === 'string' ? 'Technical' : (s.category || 'Technical');
                return cat === 'Soft';
              });

            const renderSkillCard = ({ s, idx }: { s: any; idx: number }) => {
              const skillName = typeof s === 'string' ? s : s.name || '';
              const category = typeof s === 'object' && s.category ? s.category : 'Technical';
              return (
                <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 hover:border-slate-700 transition">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={skillName}
                      onChange={(e) => handleUpdateSkill(idx, 'name', e.target.value)}
                      placeholder="Skill name..."
                      className="w-full p-2 rounded-lg bg-slate-900 text-white font-semibold text-xs border border-slate-800 focus:border-indigo-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteSkill(idx)}
                      className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition shrink-0"
                      title="Remove skill"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <select
                    value={category}
                    onChange={(e) => handleUpdateSkill(idx, 'category', e.target.value)}
                    className="w-full p-1.5 rounded-lg bg-slate-900 text-slate-300 text-xs border border-slate-800 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="Technical">Technical / Tool</option>
                    <option value="Soft">Soft Skill</option>
                    <option value="Industry">Industry Knowledge</option>
                  </select>
                </div>
              );
            };

            return (
              <div className="space-y-6">
                <div className="flex flex-wrap gap-2 items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Skills &amp; Competencies</h3>
                    <p className="text-xs text-slate-400">Review extracted skills and assign categories. No proficiency needed.</p>
                  </div>
                </div>

                {allSkills.length === 0 && (
                  <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-dashed border-slate-800 space-y-3">
                    <p className="text-xs text-slate-400">No skills detected in this resume.</p>
                    <div className="flex items-center justify-center gap-2">
                      <Button type="button" variant="secondary" size="sm" onClick={() => handleAddSkill('Technical')} leftIcon={<Plus className="w-4 h-4" />}>
                        Add Technical Skill
                      </Button>
                      <Button type="button" variant="primary" size="sm" onClick={() => handleAddSkill('Soft')} leftIcon={<Plus className="w-4 h-4" />}>
                        Add Soft Skill
                      </Button>
                    </div>
                  </div>
                )}

                {/* Technical Skills Panel */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-400">
                        <Code className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-white">Technical Skills &amp; Stack</span>
                        <span className="ml-2 text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">{technicalSkills.length}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddSkill('Technical')}
                      className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 transition text-xs flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                  {technicalSkills.length === 0 ? (
                    <p className="text-xs text-slate-500 italic text-center py-3 bg-slate-900/40 rounded-xl border border-dashed border-slate-800">No technical skills yet — click Add above.</p>
                  ) : (
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {technicalSkills.map(renderSkillCard)}
                    </div>
                  )}
                </div>

                {/* Soft Skills Panel */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400">
                        <Users className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-white">Soft Skills &amp; Interpersonal</span>
                        <span className="ml-2 text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">{softSkills.length}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddSkill('Soft')}
                      className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition text-xs flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                  {softSkills.length === 0 ? (
                    <p className="text-xs text-slate-500 italic text-center py-3 bg-slate-900/40 rounded-xl border border-dashed border-slate-800">No soft skills yet — click Add above.</p>
                  ) : (
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {softSkills.map(renderSkillCard)}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Tab 6: Certifications (EDITABLE) */}
          {activeTab === 'certifications' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-indigo-400" />
                    <span>Certifications, Certificates &amp; Credentials ({extracted.certifications?.length || 0})</span>
                  </h3>
                  <p className="text-xs text-slate-400">Review, correct, and add verified credentials or professional certificates.</p>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleAddCertification}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Add Certification
                </Button>
              </div>

              {(!extracted.certifications || extracted.certifications.length === 0) && (
                <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-dashed border-slate-800 space-y-3">
                  <p className="text-xs text-slate-400">No certifications detected in this resume.</p>
                  <Button type="button" variant="secondary" size="sm" onClick={handleAddCertification} leftIcon={<Plus className="w-4 h-4" />}>
                    Add Certification Manually
                  </Button>
                </div>
              )}

              {extracted.certifications?.map((c: any, idx: number) => (
                <div key={idx} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 hover:border-slate-700 transition">
                  <div className="flex justify-between items-center border-b border-slate-800/80 pb-2.5">
                    <span className="text-xs font-bold text-indigo-400 font-mono">Certification #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteCertification(idx)}
                      className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition text-xs flex items-center gap-1"
                      title="Delete this certification"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[11px] font-semibold text-slate-400">Certificate / Credential Title *</label>
                      <input
                        type="text"
                        value={c.name || ''}
                        onChange={(e) => handleUpdateCertification(idx, 'name', e.target.value)}
                        placeholder="e.g. AWS Certified Solutions Architect"
                        className="w-full p-2.5 rounded-xl bg-slate-950 text-white font-semibold text-xs border border-slate-800 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-400">Issuing Organization *</label>
                      <input
                        type="text"
                        value={c.issuingOrganization || ''}
                        onChange={(e) => handleUpdateCertification(idx, 'issuingOrganization', e.target.value)}
                        placeholder="e.g. Amazon Web Services"
                        className="w-full p-2.5 rounded-xl bg-slate-950 text-white text-xs border border-slate-800 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-400">Issue Date</label>
                      <input
                        type="text"
                        value={c.issueDate || ''}
                        onChange={(e) => handleUpdateCertification(idx, 'issueDate', e.target.value)}
                        placeholder="e.g. Oct 2023"
                        className="w-full p-2.5 rounded-xl bg-slate-950 text-slate-200 text-xs border border-slate-800 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-400">Credential ID / License #</label>
                      <input
                        type="text"
                        value={c.credentialId || ''}
                        onChange={(e) => handleUpdateCertification(idx, 'credentialId', e.target.value)}
                        placeholder="e.g. AWS-PSA-12345"
                        className="w-full p-2.5 rounded-xl bg-slate-950 text-slate-200 text-xs border border-slate-800 focus:border-indigo-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-400">Verification URL</label>
                      <input
                        type="url"
                        value={c.credentialUrl || ''}
                        onChange={(e) => handleUpdateCertification(idx, 'credentialUrl', e.target.value)}
                        placeholder="https://..."
                        className="w-full p-2.5 rounded-xl bg-slate-950 text-indigo-400 text-xs border border-slate-800 focus:border-indigo-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 7: Languages (EDITABLE) */}
          {activeTab === 'languages' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Languages className="w-4 h-4 text-indigo-400" />
                    <span>Spoken &amp; Written Languages ({extracted.languages?.length || 0})</span>
                  </h3>
                  <p className="text-xs text-slate-400">Edit extracted languages and their fluency levels.</p>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleAddLanguage}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Add Language
                </Button>
              </div>

              {(!extracted.languages || extracted.languages.length === 0) && (
                <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-dashed border-slate-800 space-y-3">
                  <p className="text-xs text-slate-400">No languages detected in this resume.</p>
                  <Button type="button" variant="secondary" size="sm" onClick={handleAddLanguage} leftIcon={<Plus className="w-4 h-4" />}>
                    Add Language Manually
                  </Button>
                </div>
              )}

              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                {extracted.languages?.map((l: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5 hover:border-slate-700 transition">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={l.language || ''}
                        onChange={(e) => handleUpdateLanguage(idx, 'language', e.target.value)}
                        placeholder="e.g. English"
                        className="w-full p-2 rounded-lg bg-slate-950 text-white font-bold text-xs border border-slate-800 focus:border-indigo-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteLanguage(idx)}
                        className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition shrink-0"
                        title="Remove language"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Proficiency Level</label>
                      <select
                        value={l.proficiency || 'Professional'}
                        onChange={(e) => handleUpdateLanguage(idx, 'proficiency', e.target.value)}
                        className="w-full p-2 rounded-lg bg-slate-950 text-slate-200 text-xs border border-slate-800 focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="Native">Native</option>
                        <option value="Fluent">Fluent</option>
                        <option value="Professional">Professional</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Basic">Basic</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 8: Referees (EDITABLE) */}
          {activeTab === 'references' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-400" />
                    <span>Referees &amp; Professional References ({extracted.references?.length || 0})</span>
                  </h3>
                  <p className="text-xs text-slate-400">Edit referee contact information, current organizations, and positions.</p>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleAddReference}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Add Referee
                </Button>
              </div>

              {(!extracted.references || extracted.references.length === 0) && (
                <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-dashed border-slate-800 space-y-3">
                  <p className="text-xs text-slate-400">No referees detected in this resume.</p>
                  <Button type="button" variant="secondary" size="sm" onClick={handleAddReference} leftIcon={<Plus className="w-4 h-4" />}>
                    Add Referee Manually
                  </Button>
                </div>
              )}

              {extracted.references?.map((r: any, idx: number) => (
                <div key={idx} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 hover:border-slate-700 transition">
                  <div className="flex justify-between items-center border-b border-slate-800/80 pb-2.5">
                    <span className="text-xs font-bold text-indigo-400 font-mono">Referee #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteReference(idx)}
                      className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition text-xs flex items-center gap-1"
                      title="Delete this referee"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-400">Full Name *</label>
                      <input
                        type="text"
                        value={r.name || ''}
                        onChange={(e) => handleUpdateReference(idx, 'name', e.target.value)}
                        placeholder="e.g. Dr. Peter Kamau"
                        className="w-full p-2.5 rounded-xl bg-slate-950 text-white font-semibold text-xs border border-slate-800 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-400">Job Title / Position</label>
                      <input
                        type="text"
                        value={r.position || ''}
                        onChange={(e) => handleUpdateReference(idx, 'position', e.target.value)}
                        placeholder="e.g. Department Head"
                        className="w-full p-2.5 rounded-xl bg-slate-950 text-white text-xs border border-slate-800 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-400">Organization / Company</label>
                      <input
                        type="text"
                        value={r.organization || ''}
                        onChange={(e) => handleUpdateReference(idx, 'organization', e.target.value)}
                        placeholder="e.g. Safaricom PLC"
                        className="w-full p-2.5 rounded-xl bg-slate-950 text-slate-300 text-xs border border-slate-800 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-400">Email Address</label>
                      <input
                        type="email"
                        value={r.email || ''}
                        onChange={(e) => handleUpdateReference(idx, 'email', e.target.value)}
                        placeholder="referee@example.com"
                        className="w-full p-2.5 rounded-xl bg-slate-950 text-slate-200 text-xs border border-slate-800 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-400">Phone Number</label>
                      <input
                        type="text"
                        value={r.phone || ''}
                        onChange={(e) => handleUpdateReference(idx, 'phone', e.target.value)}
                        placeholder="+254 712 345 678"
                        className="w-full p-2.5 rounded-xl bg-slate-950 text-slate-200 text-xs border border-slate-800 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-400">Relationship</label>
                      <input
                        type="text"
                        value={r.relationship || ''}
                        onChange={(e) => handleUpdateReference(idx, 'relationship', e.target.value)}
                        placeholder="e.g. Former Supervisor"
                        className="w-full p-2.5 rounded-xl bg-slate-950 text-slate-200 text-xs border border-slate-800 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-slate-800 space-y-2">
          <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-slate-400 text-sm">No CV extraction history found. Upload a resume above to begin.</p>
        </div>
      )}
    </div>
  );
};
