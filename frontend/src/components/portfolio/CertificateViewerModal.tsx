import React, { useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Shield, Eye, Lock, FileText, X } from 'lucide-react';

interface CertificateViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificateUrl: string;
  title: string;
  issuer?: string;
}

export const CertificateViewerModal: React.FC<CertificateViewerModalProps> = ({
  isOpen,
  onClose,
  certificateUrl,
  title,
  issuer,
}) => {
  useEffect(() => {
    const preventShortcuts = (e: KeyboardEvent) => {
      // Prevent Ctrl+S (Save), Ctrl+P (Print), Ctrl+U (View Source) when modal is open
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'p' || e.key === 'u')) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', preventShortcuts);
    }
    return () => {
      window.removeEventListener('keydown', preventShortcuts);
    };
  }, [isOpen]);

  if (!isOpen || !certificateUrl) return null;

  const isPdf = certificateUrl.toLowerCase().endsWith('.pdf') || certificateUrl.includes('/pdf');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title || 'Official Certificate'}>
      <div
        className="space-y-4 select-none"
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      >
        {/* Security Info Banner */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-950/80 border border-indigo-500/40 text-indigo-200 text-xs">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
            <span className="font-semibold">View-Only Certificate</span>
          </div>
          <span className="text-[11px] font-mono bg-indigo-900/90 px-2 py-0.5 rounded border border-indigo-400/30 text-indigo-300">
            Downloads Disabled
          </span>
        </div>

        {issuer && (
          <p className="text-xs text-slate-400 font-medium">
            Issued by: <span className="text-white font-semibold">{issuer}</span>
          </p>
        )}

        {/* Certificate Display Area */}
        <div className="relative w-full h-[65vh] rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
          {/* Subtle Watermark */}
          <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center opacity-10">
            <span className="text-3xl md:text-5xl font-extrabold text-white tracking-widest uppercase transform -rotate-12 select-none">
              Protected Certificate • View Only
            </span>
          </div>

          {isPdf ? (
            <div className="relative w-full h-full">
              {/* PDF frame with hidden toolbar */}
              <iframe
                src={`${certificateUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                className="w-full h-full border-none pointer-events-auto"
                title={title}
              />
              {/* Transparent overlay over top toolbar of PDF viewer to prevent clicking download/print */}
              <div
                className="absolute top-0 left-0 right-0 h-14 bg-transparent z-10"
                onContextMenu={(e) => e.preventDefault()}
              />
            </div>
          ) : (
            <div className="w-full h-full p-2 flex items-center justify-center overflow-auto bg-slate-950/90">
              <img
                src={certificateUrl}
                alt={title}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl pointer-events-none select-none"
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
              />
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-indigo-400" /> Guaranteed authentic document. Direct downloads and printing are disabled by system security policy.
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </Modal>
  );
};
