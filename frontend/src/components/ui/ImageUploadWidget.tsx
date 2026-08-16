import React, { useRef, useState } from 'react';
import api from '../../api/client';
import { Upload, X, ImageIcon, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface ImageUploadWidgetProps {
  label: string;
  /** The field name on the profile model (e.g. 'avatarUrl', 'coverUrl', or custom) */
  fieldName?: string;
  value: string;
  onChange: (url: string) => void;
  aspectRatio?: 'square' | 'banner';
}

export const ImageUploadWidget: React.FC<ImageUploadWidgetProps> = ({
  label,
  fieldName,
  value,
  onChange,
  aspectRatio = 'square',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [justUploaded, setJustUploaded] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = async (file: File) => {
    if (!file) return;
    setUploadError('');
    setJustUploaded(false);
    setIsUploading(true);

    try {
      // Step 1: Upload the file
      const formData = new FormData();
      formData.append('file', file);

      const endpoint = fieldName
        ? `/profile/upload-media?field=${fieldName}`
        : '/profile/upload-media';

      const uploadResult: any = await api.post(
        endpoint,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      const uploadedUrl: string = uploadResult?.data?.url;

      if (!uploadedUrl) {
        throw new Error('No URL returned from upload server.');
      }

      onChange(uploadedUrl);

      setJustUploaded(true);
      setTimeout(() => setJustUploaded(false), 2500);
    } catch (e: any) {
      const msg = e?.message || 'Upload failed. Please try again.';
      setUploadError(msg);
      console.error('[ImageUploadWidget] Upload error:', msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = async () => {
    if (fieldName === 'avatarUrl' || fieldName === 'coverUrl') {
      try {
        await api.put('/profile', { [fieldName]: '' });
      } catch (e) {
        console.error('[ImageUploadWidget] Failed to clear image:', e);
      }
    }
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
    // Reset so the same file can be re-selected
    e.target.value = '';
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-slate-300 block">{label}</label>

      {/* Hidden file input — accepts ALL image formats */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleInputChange}
        accept="image/*"
        className="hidden"
      />

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative rounded-2xl border-2 border-dashed transition-all flex items-center justify-center overflow-hidden bg-slate-950/70 ${
          isUploading ? 'cursor-wait' : 'cursor-pointer'
        } ${
          dragOver
            ? 'border-indigo-500 bg-indigo-600/10 scale-[1.01]'
            : 'border-slate-800 hover:border-indigo-700/60 hover:bg-slate-900/60'
        } ${aspectRatio === 'banner' ? 'h-32 w-full' : 'h-28 w-28'}`}
      >
        {/* Uploading spinner overlay */}
        {isUploading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm rounded-2xl gap-2">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
            <span className="text-[10px] text-slate-300 font-medium tracking-wide">Uploading & saving…</span>
          </div>
        )}

        {value ? (
          <div className="relative w-full h-full group">
            <img
              key={value}
              src={value}
              alt="Uploaded Media"
              className="w-full h-full object-cover"
              onError={() => {
                console.warn('[ImageUploadWidget] Media failed to load:', value);
              }}
            />

            {/* Success flash */}
            {justUploaded && (
              <div className="absolute inset-0 bg-emerald-950/70 flex flex-col items-center justify-center gap-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                <span className="text-[10px] font-bold text-emerald-300">Saved!</span>
              </div>
            )}

            {/* Hover overlay controls */}
            {!justUploaded && !isUploading && (
              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                <span className="text-[11px] font-bold text-white bg-slate-800/90 px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow">
                  <Upload className="w-3 h-3 text-indigo-400" />
                  Change
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  className="p-1.5 rounded-lg bg-rose-600/90 text-white hover:bg-rose-500 transition shadow"
                  title="Remove image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-3 text-center space-y-1.5 pointer-events-none">
            <ImageIcon className="w-6 h-6 text-indigo-400/70" />
            <span className="text-[11px] font-semibold text-slate-300">
              {aspectRatio === 'banner'
                ? 'Drag & drop cover photo or click to browse'
                : 'Drag & drop or click to upload'}
            </span>
            <span className="text-[9px] text-slate-500 uppercase tracking-wider font-mono">
              Any image format (JPG, PNG, WEBP, HEIC…) — up to 10 MB
            </span>
          </div>
        )}
      </div>

      {/* Error message */}
      {uploadError && (
        <p className="text-[11px] text-rose-400 font-medium flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {uploadError}
        </p>
      )}
    </div>
  );
};
