import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';

export const CvImportPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [extraction, setExtraction] = useState<any>(null);
  const [isLoadingExtraction, setIsLoadingExtraction] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

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

    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/cv/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage('CV Uploaded and processed by AI successfully!');
      fetchLatestExtraction();
    } catch (err: any) {
      setMessage(err.message || 'CV processing failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleImportToProfile = async () => {
    if (!extraction || !extraction.extractedData) return;
    setIsImporting(true);
    try {
      await api.post('/cv/import', extraction.extractedData);
      setMessage('All CV details imported into your public portfolio profile successfully!');
    } catch (err: any) {
      setMessage(err.message || 'Import failed.');
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
        profession: 'Software Engineer',
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

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 max-w-6xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">AI CV Parser & Importer</h1>
        <p className="text-slate-400 text-xs sm:text-sm">
          Upload your existing resume (PDF, DOCX) to automatically populate your professional portfolio sections.
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Upload Zone */}
      <form onSubmit={handleUploadCV} className="p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-slate-900 border-2 border-dashed border-slate-800 hover:border-indigo-500/50 transition text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto">
          <FileUp className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white">Drag & drop your CV file here</h3>
          <p className="text-xs text-slate-400">Supports PDF, DOCX, DOC, or TXT up to 10MB</p>
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
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition border border-slate-700"
          >
            {file ? file.name : 'Choose File'}
          </label>

          <Button type="submit" variant="primary" size="sm" isLoading={isUploading} disabled={!file}>
            Process with AI
          </Button>
        </div>
      </form>

      {/* Extraction Review Section */}
      {isLoadingExtraction ? (
        <div className="py-12 flex justify-center"><Spinner /></div>
      ) : extraction && extraction.extractedData ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">AI Extracted Information</h2>
              <p className="text-xs text-slate-400">Review and refine AI results before applying to your live profile.</p>
            </div>
            <Button
              variant="success"
              onClick={handleImportToProfile}
              isLoading={isImporting}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              Import Into Portfolio
            </Button>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Extracted Summary</h3>
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
              value={extraction.extractedData.summary || ''}
              onChange={(e) =>
                setExtraction({
                  ...extraction,
                  extractedData: { ...extraction.extractedData, summary: e.target.value },
                })
              }
              className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Extracted Experiences */}
          {extraction.extractedData.experiences && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-400" />
                <span>Extracted Work Experiences ({extraction.extractedData.experiences.length})</span>
              </h3>

              <div className="space-y-3">
                {extraction.extractedData.experiences.map((exp: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex justify-between text-sm font-bold text-white">
                      <span>{exp.position} — {exp.company}</span>
                      <span className="text-xs font-mono text-slate-400">{exp.startDate} – {exp.endDate || 'Present'}</span>
                    </div>
                    <p className="text-xs text-slate-300">{exp.description}</p>
                  </div>
                ))}
              </div>
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
