import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Share2, Download, Copy, Check } from 'lucide-react';

interface QrModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolioUrl: string;
  fullName: string;
}

export const QrModal: React.FC<QrModalProps> = ({
  isOpen,
  onClose,
  portfolioUrl,
  fullName,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(portfolioUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Portfolio QR Code & Link" maxWidth="md">
      <div className="text-center space-y-6">
        <p className="text-slate-300 text-sm">
          Scan this QR code with any mobile camera to instantly open <span className="font-semibold text-white">{fullName}</span>'s public portfolio.
        </p>

        <div className="flex justify-center p-6 bg-white rounded-2xl border border-slate-700 shadow-xl max-w-[240px] mx-auto">
          <QRCodeSVG value={portfolioUrl} size={190} level="H" includeMargin />
        </div>

        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
          <span className="text-xs font-mono text-indigo-400 truncate">{portfolioUrl}</span>
          <button
            onClick={handleCopy}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" className="w-full" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" className="w-full" onClick={handleCopy} leftIcon={<Share2 className="w-4 h-4" />}>
            Share Portfolio
          </Button>
        </div>
      </div>
    </Modal>
  );
};
