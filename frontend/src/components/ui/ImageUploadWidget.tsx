import React, { useRef, useState } from 'react';
import api from '../../api/client';
import { Upload, X, ImageIcon, Loader2, CheckCircle2 } from 'lucide-react';

interface ImageUploadWidgetProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  aspectRatio?: 'square' | 'banner';
}

export const ImageUploadWidget: React.FC<ImageUploadWidgetProps> = ({
  label,
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

    const formData = new FormData();
    formData.append('file', file);

    try {
      // NOTE: api interceptor unwraps response.data automatically,
      // so the result here IS the { message, data } wrapper — access .data.url
      const result: any = await api.post('/profile/upload-media', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // api interceptors returns response.data (the API envelope), so result = { message, data }
      const url = result?.data?.url ?? result?.url;
      if (url) {
        onChange(url);
        setJustUploaded(true);
        setTimeout(() => setJustUploaded(false), 2500);
      } else {
        setUploadError('Upload succeeded but no URL was returned.');
      }
    } catch (e: any) {
      setUploadError(e?.message || 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
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
    // Reset input so same file can be re-selected
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
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all flex items-center justify-center overflow-hidden bg-slate-950/70 ${
          dragOver
            ? 'border-indigo-500 bg-indigo-600/10 scale-[1.01]'
            : 'border-slate-800 hover:border-indigo-700/60 hover:bg-slate-900/60'
        } ${aspectRatio === 'banner' ? 'h-32 w-full' : 'h-28 w-28'}`}
      >
        {/* Uploading spinner overlay */}
        {isUploading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm rounded-2xl">
            <div className="text-center space-y-1">
              <Loader2 className="w-6 h-6 text-indigo-400 animate-spin mx-auto" />
              <span className="text-[10px] text-slate-300 font-medium">Uploading…</span>
            </div>
          </div>
        )}

        {value ? (
          <div className="relative w-full h-full group">
            <img
              src={value}
              alt="Uploaded Media"
              className="w-full h-full object-cover"
            />

            {/* Success flash overlay */}
            {justUploaded && (
              <div className="absolute inset-0 bg-emerald-950/60 flex items-center justify-center animate-in fade-in duration-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
            )}

            {/* Hover controls */}
            {!justUploaded && (
              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                <span className="text-[11px] font-bold text-white bg-slate-800/90 px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow">
                  <Upload className="w-3 h-3 text-indigo-400" />
                  Change
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange('');
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
              {aspectRatio === 'banner' ? 'Drag & drop cover photo or click to browse' : 'Drag & drop or click'}
            </span>
            <span className="text-[9px] text-slate-500 uppercase tracking-wider font-mono">
              JPG · PNG · WEBP · GIF · SVG · HEIC · AVIF · BMP — up to 10 MB
            </span>
          </div>
        )}
      </div>

      {/* Error message */}
      {uploadError && (
        <p className="text-[11px] text-rose-400 font-medium mt-1 flex items-center gap-1">
          <X className="w-3 h-3 shrink-0" />
          {uploadError}
        </p>
      )}
    </div>
  );
};
