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
  Layers,
  Phone,
  Mail,
  MapPin,
  Globe,
  ExternalLink,
  ShieldCheck,
  User,
  Check,
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
  const [aiLoading, setAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'contacts' | 'experience' | 'education' | 'skills' | 'projects' | 'certifications'>('general');
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [selectedSections, setSelectedSections] = useState<Record<string, boolean>>({
    general: true,
    contacts: true,
    experience: true,
    education: true,
    skills: true,
    projects: true,
    certifications: true,
  });

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
      setMessage('CV uploaded and scanned by AI successfully! Review the extracted data below.');
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

      setMessage('All selected CV details imported into your public portfolio profile successfully!');

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

  const handleAiEnhanceSummary = async () => {
    if (!extraction?.extractedData?.summary) return;
    setAiLoading(true);
    try {
      const res: any = await api.post('/cv/ai/enhance-summary', {
        summary: extraction.extractedData.summary,
        profession: extraction.extractedData.personalInfo?.title || 'Professional',
      });
      setExtraction((prev: any) => ({
        ...prev,
        extractedData: {
          ...prev.extractedData,
          summary: res.data.enhancedSummary,
        },
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  const extracted = extraction?.extractedData;

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">AI CV Parser & Importer</h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            Upload your existing resume (PDF, DOCX, TXT) to automatically populate all Edit Profile tabs with AI.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate('/admin/profile')}
          leftIcon={<ArrowRight className="w-4 h-4" />}
        >
          Open Profile Editor
        </Button>
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
          <h3 className="text-lg font-bold text-white">Drag & drop your CV file here</h3>
          <p className="text-xs text-slate-400">Supports PDF, Word (DOCX), or TXT documents up to 10MB</p>
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
            Process with AI
          </Button>
        </div>
      </form>

      {/* Extraction Review Section */}
      {isLoadingExtraction ? (
        <div className="py-12 flex justify-center"><Spinner /></div>
      ) : extracted ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <span>AI Extracted Profile Data</span>
              </h2>
              <p className="text-xs text-slate-400">Review the scanned sections before applying to your live profile.</p>
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
                Apply & Open Profile Editor →
              </Button>
            </div>
          </div>

          {/* Section Selection and Import Mode */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Select Sections to Auto-Fill:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { key: 'general', label: 'General Bio & Headline' },
                  { key: 'contacts', label: 'Contact & Socials' },
                  { key: 'experience', label: `Experience (${extracted.experiences?.length || 0})` },
                  { key: 'education', label: `Education (${extracted.education?.length || 0})` },
                  { key: 'skills', label: `Skills (${extracted.skills?.length || 0})` },
                  { key: 'projects', label: `Projects (${extracted.projects?.length || 0})` },
                  { key: 'certifications', label: `Certifications (${extracted.certifications?.length || 0})` },
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
                  <span>Clean Replace (Recommended)</span>
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
                  <span>Append Mode</span>
                </label>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-slate-800 gap-4 text-xs sm:text-sm font-semibold text-slate-400 overflow-x-auto no-scrollbar">
            <button onClick={() => setActiveTab('general')} className={`pb-3 border-b-2 transition whitespace-nowrap ${activeTab === 'general' ? 'border-indigo-500 text-white' : 'border-transparent hover:text-white'}`}>General Bio</button>
            <button onClick={() => setActiveTab('contacts')} className={`pb-3 border-b-2 transition whitespace-nowrap ${activeTab === 'contacts' ? 'border-indigo-500 text-white' : 'border-transparent hover:text-white'}`}>Contact & Social</button>
            <button onClick={() => setActiveTab('experience')} className={`pb-3 border-b-2 transition whitespace-nowrap ${activeTab === 'experience' ? 'border-indigo-500 text-white' : 'border-transparent hover:text-white'}`}>Work Experience ({extracted.experiences?.length || 0})</button>
            <button onClick={() => setActiveTab('education')} className={`pb-3 border-b-2 transition whitespace-nowrap ${activeTab === 'education' ? 'border-indigo-500 text-white' : 'border-transparent hover:text-white'}`}>Education ({extracted.education?.length || 0})</button>
            <button onClick={() => setActiveTab('skills')} className={`pb-3 border-b-2 transition whitespace-nowrap ${activeTab === 'skills' ? 'border-indigo-500 text-white' : 'border-transparent hover:text-white'}`}>Skills ({extracted.skills?.length || 0})</button>
            <button onClick={() => setActiveTab('projects')} className={`pb-3 border-b-2 transition whitespace-nowrap ${activeTab === 'projects' ? 'border-indigo-500 text-white' : 'border-transparent hover:text-white'}`}>Projects ({extracted.projects?.length || 0})</button>
            <button onClick={() => setActiveTab('certifications')} className={`pb-3 border-b-2 transition whitespace-nowrap ${activeTab === 'certifications' ? 'border-indigo-500 text-white' : 'border-transparent hover:text-white'}`}>Certifications ({extracted.certifications?.length || 0})</button>
          </div>

          {/* Tab 1: General Bio */}
          {activeTab === 'general' && (
            <div className="space-y-4 p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-semibold">Extracted Full Name</label>
                  <p className="p-3 rounded-xl bg-slate-950 text-white font-bold text-sm border border-slate-800">
                    {extracted.personalInfo?.fullName || 'Not specified'}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-semibold">Professional Title</label>
                  <p className="p-3 rounded-xl bg-slate-950 text-white font-bold text-sm border border-slate-800">
                    {extracted.personalInfo?.title || 'Not specified'}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold">Tagline / Headline</label>
                <p className="p-3 rounded-xl bg-slate-950 text-slate-200 text-sm border border-slate-800">
                  {extracted.headline || 'Not specified'}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-400 font-semibold">Professional Summary</label>
                  <button
                    type="button"
                    onClick={handleAiEnhanceSummary}
                    disabled={aiLoading}
                    className="px-3 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{aiLoading ? 'Enhancing...' : 'Enhance with AI'}</span>
                  </button>
                </div>

                <textarea
                  rows={4}
                  value={extracted.summary || ''}
                  onChange={(e) =>
                    setExtraction({
                      ...extraction,
                      extractedData: { ...extraction.extractedData, summary: e.target.value },
                    })
                  }
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
                  <label className="text-xs text-slate-400 font-semibold flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-indigo-400" /> Email</label>
                  <p className="p-3 rounded-xl bg-slate-950 text-white text-sm border border-slate-800">{extracted.personalInfo?.email || 'Not specified'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-semibold flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-emerald-400" /> Phone</label>
                  <p className="p-3 rounded-xl bg-slate-950 text-white text-sm border border-slate-800">{extracted.personalInfo?.phone || 'Not specified'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-semibold flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-amber-400" /> Location</label>
                  <p className="p-3 rounded-xl bg-slate-950 text-white text-sm border border-slate-800">{extracted.personalInfo?.location || 'Not specified'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-semibold flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-purple-400" /> Website</label>
                  <p className="p-3 rounded-xl bg-slate-950 text-indigo-400 text-sm border border-slate-800">{extracted.personalInfo?.website || 'Not specified'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-semibold">LinkedIn Profile</label>
                  <p className="p-3 rounded-xl bg-slate-950 text-indigo-400 text-sm border border-slate-800">{extracted.personalInfo?.linkedin || 'Not specified'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-semibold">GitHub Profile</label>
                  <p className="p-3 rounded-xl bg-slate-950 text-indigo-400 text-sm border border-slate-800">{extracted.personalInfo?.github || 'Not specified'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Experience */}
          {activeTab === 'experience' && (
            <div className="space-y-3">
              {extracted.experiences?.map((exp: any, idx: number) => (
                <div key={idx} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-base font-bold text-white">{exp.position}</h4>
                      <p className="text-xs text-indigo-400 font-semibold">{exp.company} {exp.location ? `• ${exp.location}` : ''}</p>
                    </div>
                    <span className="text-xs font-mono text-slate-400 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800">
                      {exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate || 'Present'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed pt-1">{exp.description}</p>
                  {exp.responsibilities && exp.responsibilities.length > 0 && (
                    <ul className="list-disc list-inside text-xs text-slate-400 space-y-1 pt-1">
                      {exp.responsibilities.map((r: string, rIdx: number) => (
                        <li key={rIdx}>{r}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Tab 4: Education */}
          {activeTab === 'education' && (
            <div className="space-y-3">
              {extracted.education?.map((edu: any, idx: number) => (
                <div key={idx} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-white">{edu.qualification} in {edu.field}</h4>
                    <p className="text-xs text-slate-400">{edu.institution} {edu.grade ? `(${edu.grade})` : ''}</p>
                  </div>
                  <span className="text-xs font-mono text-slate-400 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800">
                    {edu.startDate} – {edu.endDate || 'Present'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Tab 5: Skills */}
          {activeTab === 'skills' && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Extracted Skills & Competencies</h3>
              <div className="flex flex-wrap gap-2">
                {extracted.skills?.map((s: any, idx: number) => {
                  const skillName = typeof s === 'string' ? s : s.name;
                  const category = typeof s === 'object' && s.category ? s.category : 'Technical';
                  const proficiency = typeof s === 'object' && s.proficiency ? s.proficiency : 90;
                  return (
                    <span key={idx} className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs flex items-center gap-2">
                      <span className="font-semibold">{skillName}</span>
                      <span className="text-[10px] text-indigo-400 font-mono">({category} • {proficiency}%)</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 6: Projects */}
          {activeTab === 'projects' && (
            <div className="grid sm:grid-cols-2 gap-4">
              {extracted.projects?.map((p: any, idx: number) => (
                <div key={idx} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h4 className="text-base font-bold text-white">{p.title}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{p.description}</p>
                    {p.technologies && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(Array.isArray(p.technologies) ? p.technologies : String(p.technologies).split(',')).map((tech: string, tIdx: number) => (
                          <span key={tIdx} className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-400 text-[10px] font-mono border border-slate-800">
                            {tech.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 7: Certifications */}
          {activeTab === 'certifications' && (
            <div className="space-y-3">
              {extracted.certifications?.map((c: any, idx: number) => (
                <div key={idx} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-white">{c.name}</h4>
                    <p className="text-xs text-slate-400">{c.issuingOrganization}</p>
                  </div>
                  <span className="text-xs font-mono text-slate-400 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800">
                    Issued: {c.issueDate}
                  </span>
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

