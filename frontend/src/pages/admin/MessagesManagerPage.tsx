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
  CheckCheck,
  AlertTriangle,
} from 'lucide-react';

export const MessagesManagerPage: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Reply Modal State
  const [replyMsg, setReplyMsg] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [replySentSuccess, setReplySentSuccess] = useState(false);
  const [replyError, setReplyError] = useState('');

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
      const data = Array.isArray(res.data) ? res.data : [];
      setMessages(data);

      // Reset counter on messages module after messages have been seen
      const hasUnread = data.some((m: any) => !m.isRead);
      if (hasUnread) {
        api.post('/messages/mark-all-seen')
          .then(() => {
            window.dispatchEvent(new CustomEvent('messages-seen'));
          })
          .catch((err) => console.error('Failed to mark messages seen:', err));
      }
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
    if (!replyMsg) return;
    setIsSendingReply(true);
    setReplyError('');
    try {
      await api.post(`/messages/${replyMsg.id}/reply`, {
        message: replyText,
        subject: replyMsg.subject,
      });
      setReplySentSuccess(true);
      setMessages((prev) =>
        prev.map((m) => (m.id === replyMsg.id ? { ...m, isRead: true } : m))
      );
      window.dispatchEvent(new CustomEvent('messages-seen'));
      setTimeout(() => {
        setReplySentSuccess(false);
        setReplyMsg(null);
        setReplyText('');
      }, 1500);
    } catch (e: any) {
      console.error('Failed to send reply:', e);
      setReplyError(e?.response?.data?.message || e?.message || 'Failed to dispatch email reply via Gateway 1. Please check mail settings.');
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
      window.dispatchEvent(new CustomEvent('messages-seen'));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.post('/messages/mark-all-seen');
      setMessages((prev) => prev.map((m) => ({ ...m, isRead: true })));
      window.dispatchEvent(new CustomEvent('messages-seen'));
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return <div className="p-8 flex justify-center"><Spinner size="lg" /></div>;
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-6xl mx-auto pb-10">
      <div className="space-y-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Mail className="w-4 h-4" />
              </div>
              Visitor &amp; Recruiter Messages
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-1.5 shadow-sm animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                {unreadCount} Unread
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              leftIcon={<CheckCheck className="w-3.5 h-3.5 text-indigo-400" />}
              className="text-xs"
            >
              Mark all as read
            </Button>
          )}
        </div>
        <p className="text-xs text-slate-400">Direct contact inquiries and document unlock requests from recruiters.</p>
      </div>

      <div className="space-y-3">
        {messages.length > 0 ? (
          messages.map((msg) => {
            const isKeyRequest = msg.type === 'DOCUMENT_ACCESS_REQUEST' || msg.subject?.includes('[DOCUMENT_ACCESS_REQUEST]');

            return (
              <div
                key={msg.id}
                className={`p-4 rounded-xl border transition space-y-3 ${
                  isKeyRequest
                    ? 'bg-slate-900/90 border-emerald-500/30 shadow-lg shadow-emerald-950/20'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    {isKeyRequest && (
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                        <Key className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {!msg.isRead && (
                          <button
                            type="button"
                            onClick={() => handleMarkRead(msg.id)}
                            className="flex items-center gap-1 text-[10px] text-rose-400 hover:text-rose-300 font-semibold bg-rose-500/10 hover:bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-500/30 transition cursor-pointer"
                            title="Click to mark as read"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                            <span>Unread</span>
                          </button>
                        )}
                        <h3 className="text-sm font-bold text-white">{msg.name}</h3>
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
                      <p className="text-xs text-indigo-400 font-medium">{msg.email} • {msg.subject}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-start sm:self-auto">
                    {isKeyRequest && (msg.status === 'PENDING' || !msg.status) && (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-2.5 py-1"
                          onClick={() => setAcceptModalMsg(msg)}
                          leftIcon={<Key className="w-3.5 h-3.5" />}
                        >
                          Accept &amp; Send Key
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs px-2.5 py-1"
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
                        className="text-xs px-2.5 py-1"
                        onClick={() => { setReplyMsg(msg); setReplyText(`Hi ${msg.name},\n\nThank you for reaching out regarding "${msg.subject}".\n\nBest regards,`); }}
                        leftIcon={<Reply className="w-3.5 h-3.5" />}
                      >
                        Reply
                      </Button>
                    )}

                    <button onClick={() => handleDelete(msg.id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition" title="Delete message">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-xs text-slate-300 bg-slate-950/70 p-3 rounded-lg border border-slate-800/80 space-y-2">
                  <p className="leading-relaxed">{msg.message}</p>

                  {msg.generatedKey && (
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                        <FileCheck className="w-3.5 h-3.5" />
                        Dispatched Access Code: <strong className="font-mono text-white text-xs bg-slate-900 px-2 py-0.5 rounded border border-emerald-500/30">{msg.generatedKey}</strong>
                      </span>
                      <span className="text-[10px] text-slate-500">Sent via Gateway 1 (Portfolio Forwarder)</span>
                    </div>
                  )}
                </div>

                <span className="text-[10px] text-slate-500 block">Received: {new Date(msg.createdAt).toLocaleString()}</span>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center bg-slate-900/60 rounded-xl border border-slate-800 text-slate-400 text-xs">
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
            {replyError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{replyError}</span>
              </div>
            )}
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
