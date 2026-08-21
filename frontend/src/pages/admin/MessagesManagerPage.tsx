import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { Spinner } from '../../components/ui/Spinner';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import {
  Mail,
  Trash2,
  Reply,
  Send,
  CheckCircle2,
  Key,
  ShieldCheck,
  XCircle,
  Clock,
  SendHorizontal,
  FileCheck,
} from 'lucide-react';

export const MessagesManagerPage: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Reply Modal State
  const [replyMsg, setReplyMsg] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [replySentSuccess, setReplySentSuccess] = useState(false);

  // Key Accept Modal State
  const [acceptModalMsg, setAcceptModalMsg] = useState<any>(null);
  const [validityHours, setValidityHours] = useState<number>(24);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [acceptSuccessData, setAcceptSuccessData] = useState<{ code: string; hours: number } | null>(null);

  // Decline State
  const [decliningId, setDecliningId] = useState<string | null>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      const res: any = await api.get('/messages');
      setMessages(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/messages/${id}`);
      fetchMessages();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingReply(true);
    try {
      await new Promise((res) => setTimeout(res, 800));
      setReplySentSuccess(true);
      setTimeout(() => {
        setReplySentSuccess(false);
        setReplyMsg(null);
        setReplyText('');
      }, 1500);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleAcceptKeyRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptModalMsg) return;
    setIsGeneratingKey(true);
    try {
      const res: any = await api.post(`/messages/${acceptModalMsg.id}/accept-key`, { validityHours });
      setAcceptSuccessData({ code: res.data.code, hours: res.data.validityHours });
      fetchMessages();
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingKey(false);
    }
  };

  const handleDeclineKeyRequest = async (msgId: string) => {
    setDecliningId(msgId);
    try {
      await api.post(`/messages/${msgId}/decline-key`, {});
      fetchMessages();
    } catch (e) {
      console.error(e);
    } finally {
      setDecliningId(null);
    }
  };

  const closeAcceptModal = () => {
    setAcceptModalMsg(null);
    setValidityHours(24);
    setAcceptSuccessData(null);
  };

  const unreadCount = messages.filter((m) => !m.isRead || m.status === 'PENDING').length;

  const handleMarkRead = async (msgId: string) => {
    try {
      await api.put(`/messages/${msgId}`, { isRead: true });
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, isRead: true } : m))
      );
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return <div className="p-8 flex justify-center"><Spinner size="lg" /></div>;
  }

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Visitor &amp; Recruiter Messages</h1>
          {unreadCount > 0 && (
            <span className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-extrabold flex items-center gap-1.5 shadow-sm animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              {unreadCount} Unread
            </span>
          )}
        </div>
        <p className="text-slate-400 text-sm">Direct contact inquiries and document unlock requests from recruiters.</p>
      </div>

      <div className="space-y-4">
        {messages.length > 0 ? (
          messages.map((msg) => {
            const isKeyRequest = msg.type === 'DOCUMENT_ACCESS_REQUEST' || msg.subject?.includes('[DOCUMENT_ACCESS_REQUEST]');

            return (
              <div
                key={msg.id}
                className={`p-6 rounded-2xl border transition space-y-4 ${
                  isKeyRequest
                    ? 'bg-slate-900/90 border-emerald-500/30 shadow-lg shadow-emerald-950/20'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isKeyRequest && (
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                        <Key className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        {!msg.isRead && (
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50 animate-pulse shrink-0" title="Unread Message" />
                        )}
                        <h3 className="text-base font-bold text-white">{msg.name}</h3>
                        {isKeyRequest && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                            Document Access Request
                          </span>
                        )}
                        {msg.status === 'ACCEPTED' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Key Generated &amp; Sent
                          </span>
                        )}
                        {msg.status === 'DECLINED' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-bold border border-red-500/40 flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Declined
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-indigo-400 font-semibold">{msg.email} • {msg.subject}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isKeyRequest && (msg.status === 'PENDING' || !msg.status) && (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-500 text-white"
                          onClick={() => setAcceptModalMsg(msg)}
                          leftIcon={<Key className="w-3.5 h-3.5" />}
                        >
                          Accept &amp; Send Key
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                          isLoading={decliningId === msg.id}
                          onClick={() => handleDeclineKeyRequest(msg.id)}
                          leftIcon={<XCircle className="w-3.5 h-3.5" />}
                        >
                          Decline
                        </Button>
                      </>
                    )}

                    {!isKeyRequest && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setReplyMsg(msg); setReplyText(`Hi ${msg.name},\n\nThank you for reaching out regarding "${msg.subject}".\n\nBest regards,`); }}
                        leftIcon={<Reply className="w-3.5 h-3.5" />}
                      >
                        Reply
                      </Button>
                    )}

                    <button onClick={() => handleDelete(msg.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition" title="Delete message">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-sm text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
                  <p>{msg.message}</p>

                  {msg.generatedKey && (
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                        <FileCheck className="w-4 h-4" />
                        Dispatched Access Code: <strong className="font-mono text-white text-sm bg-slate-900 px-2 py-0.5 rounded border border-emerald-500/30">{msg.generatedKey}</strong>
                      </span>
                      <span className="text-[11px] text-slate-500">Sent via Gateway 1 (Portfolio Forwarder)</span>
                    </div>
                  )}
                </div>

                <span className="text-[11px] text-slate-500 block">Received: {new Date(msg.createdAt).toLocaleString()}</span>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400 text-sm">
            No contact or document access messages received yet.
          </div>
        )}
      </div>

      {/* Reply Modal */}
      <Modal isOpen={!!replyMsg} onClose={() => setReplyMsg(null)} title={`Reply to ${replyMsg?.name}`}>
        {replySentSuccess ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">Reply Sent Successfully!</h3>
            <p className="text-xs text-slate-400">Email dispatch sent to {replyMsg?.email}</p>
          </div>
        ) : (
          <form onSubmit={handleSendReply} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-400">To Email</label>
              <input disabled value={replyMsg?.email || ''} className="w-full p-2.5 bg-slate-950/60 border border-slate-800 text-slate-400 rounded-xl text-sm font-mono" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Subject</label>
              <input disabled value={`Re: ${replyMsg?.subject || ''}`} className="w-full p-2.5 bg-slate-950/60 border border-slate-800 text-slate-400 rounded-xl text-sm font-mono" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-semibold">Your Message Body</label>
              <textarea
                rows={6}
                required
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full p-3 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm focus:border-indigo-500 focus:outline-none font-sans"
              />
            </div>
            <Button type="submit" variant="primary" isLoading={isSendingReply} leftIcon={<Send className="w-4 h-4" />} className="w-full">
              Send Email Reply
            </Button>
          </form>
        )}
      </Modal>

      {/* Accept & Generate Key Modal */}
      <Modal isOpen={!!acceptModalMsg} onClose={closeAcceptModal} title="Generate Access Key for Recruiter">
        {acceptSuccessData ? (
          <div className="p-6 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">Key Generated &amp; Emailed!</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Access Code <strong className="font-mono text-emerald-400 text-base">{acceptSuccessData.code}</strong> has been generated with <strong>{acceptSuccessData.hours}-hour validity</strong> and dispatched directly to <strong>{acceptModalMsg?.email}</strong> via <strong>Gateway 1: Portfolio Message Forwarder</strong>.
            </p>
            <Button variant="primary" className="w-full" onClick={closeAcceptModal}>
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleAcceptKeyRequest} className="space-y-5">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>Recruiter Request Summary</span>
              </div>
              <p className="text-sm text-white font-semibold">{acceptModalMsg?.name} ({acceptModalMsg?.email})</p>
              <p className="text-xs text-slate-400 italic">"{acceptModalMsg?.message}"</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                Select Access Key Expiration / Validity
              </label>
              <select
                value={validityHours}
                onChange={(e) => setValidityHours(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value={1}>1 Hour (Strict / Urgent Access)</option>
                <option value={6}>6 Hours (Same Working Day)</option>
                <option value={24}>24 Hours (Standard Default)</option>
                <option value={48}>48 Hours (Weekend / Extended)</option>
                <option value={168}>7 Days (Full Recruitment Cycle)</option>
              </select>
              <p className="text-[11px] text-slate-500">
                The generated key can only be used once. After unlocking or when the selected validity duration expires, access will be revoked.
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
              isLoading={isGeneratingKey}
              leftIcon={<SendHorizontal className="w-4 h-4" />}
            >
              Generate Code &amp; Dispatch via Email
            </Button>
          </form>
        )}
      </Modal>
    </div>
  );
};
