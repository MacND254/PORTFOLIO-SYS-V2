import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import {
  ShieldCheck,
  Key,
  FileText,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Lock,
  User,
  Clock,
  Send,
  Building,
  Mail,
  Eye,
  Download,
} from 'lucide-react';
import { VERIFIED_DOCUMENT_TYPES } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  subdomain: string;
  ownerName: string;
  hasDocuments?: boolean;
  initialTab?: 'unlock' | 'request';
}

export const VerifiedDocumentsUnlockModal: React.FC<Props> = ({
  isOpen,
  onClose,
  subdomain,
  ownerName,
  initialTab = 'unlock',
}) => {
  const [activeTab, setActiveTab] = useState<'unlock' | 'request'>(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Unlock mode state
  const [key, setKey] = useState('');
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [unlockError, setUnlockError] = useState('');
  const [result, setResult] = useState<{
    recipientName?: string;
    unlockedAt: string;
    documents: any[];
  } | null>(null);
  const [previewDoc, setPreviewDoc] = useState<any>(null);

  // Request mode state
  const [reqName, setReqName] = useState('');
  const [reqEmail, setReqEmail] = useState('');
  const [reqCompany, setReqCompany] = useState('');
  const [reqMessage, setReqMessage] = useState('');
  const [reqLoading, setReqLoading] = useState(false);
  const [reqError, setReqError] = useState('');
  const [reqSuccess, setReqSuccess] = useState(false);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockLoading(true);
    setUnlockError('');
    try {
      const res: any = await api.post(`/portfolio/public/${subdomain}/unlock-verified-documents`, { key });
      setResult(res.data);
    } catch (err: any) {
      setUnlockError(err?.message || 'Invalid or expired access key. Please request a new key from the owner.');
    } finally {
      setUnlockLoading(false);
    }
  };

  const handleRequestKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setReqLoading(true);
    setReqError('');
    try {
      await api.post('/messages/public/request-key', {
        subdomain,
        name: reqName,
        email: reqEmail,
        company: reqCompany,
        message: reqMessage,
      });
      setReqSuccess(true);
    } catch (err: any) {
      setReqError(err?.message || 'Failed to submit key request. Please try again.');
    } finally {
      setReqLoading(false);
    }
  };

  const handleClose = () => {
    setKey('');
    setUnlockError('');
    setResult(null);
    setReqName('');
    setReqEmail('');
    setReqCompany('');
    setReqMessage('');
    setReqError('');
    setReqSuccess(false);
    setActiveTab('unlock');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Verified Documents Access"
    >
      {!result ? (
        <div className="space-y-5">
          {/* Top Mode Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('unlock')}
              className={`py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === 'unlock'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>Unlock With Key</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('request')}
              className={`py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === 'request'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Request Access Key</span>
            </button>
          </div>

          {/* Header Info Banner */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-emerald-300">Secure Recruiter Verification</p>
              <p className="text-[11px] text-emerald-400/80 leading-relaxed">
                <strong>{ownerName}</strong> has verified identity credentials on file (Government ID, Tax PIN, Good Conduct). Access is restricted to authorized recruiters via one-time keys.
              </p>
            </div>
          </div>

          {activeTab === 'unlock' ? (
            /* Tab 1: Unlock With Key */
            <form onSubmit={handleUnlock} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  Enter 6-Character Access Key
                </label>
                <input
                  type="text"
                  required
                  value={key}
                  onChange={(e) => setKey(e.target.value.toUpperCase())}
                  placeholder="DOC-XXXXXX"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 text-white rounded-xl font-mono tracking-widest text-center text-lg uppercase focus:border-indigo-500 focus:outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-600 placeholder:text-sm"
                  maxLength={10}
                />
                <p className="text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Don't have a key?</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('request')}
                    className="text-emerald-400 hover:underline font-semibold"
                  >
                    Request key from {ownerName} →
                  </button>
                </p>
              </div>

              {unlockError && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-300">{unlockError}</p>
                </div>
              )}

              <Button type="submit" variant="primary" className="w-full" isLoading={unlockLoading} leftIcon={<Key className="w-4 h-4" />}>
                Unlock &amp; View Documents
              </Button>
            </form>
          ) : (
            /* Tab 2: Request Key from Owner */
            reqSuccess ? (
              <div className="py-6 text-center space-y-3">
                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
                <h3 className="text-base font-bold text-white">Access Key Requested!</h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                  Your request has been delivered to <strong>{ownerName}</strong>'s portfolio messages module. 
                  Once approved, your one-time access key will be sent via <strong>Portfolio Message Forwarder</strong> directly to <strong>{reqEmail}</strong>.
                </p>
                <Button variant="secondary" size="sm" onClick={() => { setReqSuccess(false); setActiveTab('unlock'); }}>
                  Return to Unlock Tab
                </Button>
              </div>
            ) : (
              <form onSubmit={handleRequestKey} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                      <User className="w-3 h-3 text-emerald-400" />
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={reqName}
                      onChange={(e) => setReqName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-lg text-xs focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-emerald-400" />
                      Recruiter Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="jane@company.com"
                      value={reqEmail}
                      onChange={(e) => setReqEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-lg text-xs focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                    <Building className="w-3 h-3 text-emerald-400" />
                    Company / Organization Name
                  </label>
                  <input
                    type="text"
                    placeholder="Acme Hiring Solutions"
                    value={reqCompany}
                    onChange={(e) => setReqCompany(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-lg text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">
                    Reason / Verification Context
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Background check for senior developer position..."
                    value={reqMessage}
                    onChange={(e) => setReqMessage(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-lg text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {reqError && (
                  <div className="flex items-start gap-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-300">{reqError}</p>
                  </div>
                )}

                <Button type="submit" variant="primary" className="w-full" isLoading={reqLoading} leftIcon={<Send className="w-3.5 h-3.5" />}>
                  Submit Access Key Request
                </Button>
              </form>
            )
          )}
        </div>
      ) : (
        /* Result Screen after successful unlock */
        <div className="space-y-5">
          {/* Success Banner */}
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-1">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="text-sm font-bold text-emerald-300">Documents Unlocked Successfully</p>
            <div className="flex items-center justify-center gap-4 text-[11px] text-emerald-400/70 pt-1">
              {result.recipientName && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {result.recipientName}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(result.unlockedAt).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-300/80">
              This access key has been consumed and can no longer be used. Please download or save documents as needed.
            </p>
          </div>

          {result.documents.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-slate-400">No documents are currently available from this portfolio owner.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-300">Verified Documents from {ownerName}:</p>
              {result.documents.map((doc: any) => {
                const typeLabel = VERIFIED_DOCUMENT_TYPES.find(d => d.type === doc.documentType)?.label || doc.documentType;
                return (
                  <div key={doc.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/30 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{doc.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">{typeLabel}</span>
                          {doc.isVerified && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1">
                              <CheckCircle className="w-2.5 h-2.5" />Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {doc.fileUrl && (
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(doc)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 text-xs font-semibold transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <Button variant="secondary" className="w-full" onClick={handleClose}>
            Close
          </Button>
        </div>
      )}

      {/* Embedded Document Preview Modal with Download Option */}
      {previewDoc && (
        <Modal
          isOpen={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          title={previewDoc.title || 'Document Viewer'}
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <p className="text-xs font-bold text-white">{previewDoc.title}</p>
                <span className="text-[10px] text-emerald-400 font-mono">
                  {VERIFIED_DOCUMENT_TYPES.find(d => d.type === previewDoc.documentType)?.label || previewDoc.documentType}
                </span>
              </div>
              <a
                href={previewDoc.fileUrl}
                download={previewDoc.title || 'Verified_Document'}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 transition"
              >
                <Download className="w-4 h-4" />
                Download Document
              </a>
            </div>

            <div className="bg-slate-950 rounded-2xl border border-slate-800 p-2 overflow-hidden flex items-center justify-center min-h-[380px]">
              {previewDoc.fileUrl?.toLowerCase().endsWith('.pdf') || previewDoc.fileUrl?.includes('/pdf') ? (
                <iframe
                  src={previewDoc.fileUrl}
                  title={previewDoc.title}
                  className="w-full h-[500px] rounded-xl border-none"
                />
              ) : (
                <img
                  src={previewDoc.fileUrl}
                  alt={previewDoc.title}
                  className="max-h-[500px] w-auto max-w-full object-contain rounded-xl"
                />
              )}
            </div>

            <div className="flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setPreviewDoc(null)}>
                Back to Documents List
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  );
};
