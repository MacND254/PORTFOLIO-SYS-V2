import React, { useRef, useState } from 'react';
import api from '../../api/client';
import { Upload, X, FileText, Loader2, CheckCircle2, AlertCircle, Eye, Shield } from 'lucide-react';

interface CertificateUploadWidgetProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
}

export const CertificateUploadWidget: React.FC<CertificateUploadWidgetProps> = ({
  label = 'Upload Official Certificate (PDF or Image)',
  value,
  onChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [justUploaded, setJustUploaded] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const isPdf = value ? value.toLowerCase().endsWith('.pdf') || value.includes('/pdf') : false;

  const handleFileChange = async (file: File) => {
    if (!file) return;
    setUploadError('');
    setJustUploaded(false);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res: any = await api.post('/profile/upload-certificate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const uploadedUrl: string = res?.data?.url;
      if (!uploadedUrl) throw new Error('No file URL returned from server.');

      onChange(uploadedUrl);
      setJustUploaded(true);
      setTimeout(() => setJustUploaded(false), 2500);
    } catch (e: any) {
      const msg = e?.message || 'Certificate upload failed. Please try again.';
      setUploadError(msg);
      console.error('[CertificateUploadWidget] Upload error:', msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    onChange('');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileChange(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileChange(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
        <span>{label}</span>
        <span className="text-[10px] text-indigo-400 font-mono flex items-center gap-1">
          <Shield className="w-3 h-3" /> View-Only Frontend Protection Enabled
        </span>
      </label>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleInputChange}
        accept="image/*,application/pdf,.pdf"
        className="hidden"
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative rounded-2xl border-2 border-dashed transition-all p-4 flex flex-col items-center justify-center bg-slate-950/80 ${
          isUploading ? 'cursor-wait' : 'cursor-pointer'
        } ${
          dragOver
            ? 'border-indigo-500 bg-indigo-600/10 scale-[1.01]'
            : 'border-slate-800 hover:border-indigo-600/70 hover:bg-slate-900/80'
        }`}
      >
        {isUploading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-sm rounded-2xl gap-2">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
            <span className="text-xs text-slate-200 font-medium">Uploading certificate document...</span>
          </div>
        )}

        {value ? (
          <div className="w-full flex items-center justify-between gap-4 p-2 bg-slate-900/90 rounded-xl border border-slate-800">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 font-bold text-xs uppercase">
                {isPdf ? 'PDF' : <FileText className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate max-w-[240px]">
                  {value.split('/').pop() || 'Certificate File'}
                </p>
                <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Attached & Active
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={value}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                title="Preview document"
              >
                <Eye className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition"
                title="Remove certificate"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center space-y-2 py-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <Upload className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-slate-200">
                Click or Drag & Drop certificate here
              </p>
              <p className="text-[11px] text-slate-400">
                Supports PDF diplomas, degree transcripts, PNG, JPG certificates (up to 15MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {uploadError && (
        <p className="text-xs text-rose-400 font-medium flex items-center gap-1.5 pt-1">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {uploadError}
        </p>
      )}
    </div>
  );
};
