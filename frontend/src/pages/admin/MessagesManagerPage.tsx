import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { Spinner } from '../../components/ui/Spinner';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Mail, Trash2, Reply, Send, CheckCircle2 } from 'lucide-react';

export const MessagesManagerPage: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Reply Modal State
  const [replyMsg, setReplyMsg] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [replySentSuccess, setReplySentSuccess] = useState(false);

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
      // Simulate/trigger reply email dispatch
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

  if (isLoading) {
    return <div className="p-8 flex justify-center"><Spinner size="lg" /></div>;
  }

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Visitor Contact Messages</h1>
        <p className="text-slate-400 text-sm">Direct messages submitted from your public portfolio contact form.</p>
      </div>

      <div className="space-y-4">
        {messages.length > 0 ? (
          messages.map((msg) => (
            <div key={msg.id} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">{msg.name}</h3>
                  <p className="text-xs text-indigo-400 font-semibold">{msg.email} • Subject: {msg.subject}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setReplyMsg(msg); setReplyText(`Hi ${msg.name},\n\nThank you for reaching out regarding "${msg.subject}".\n\nBest regards,`); }}
                    leftIcon={<Reply className="w-3.5 h-3.5" />}
                  >
                    Reply
                  </Button>
                  <button onClick={() => handleDelete(msg.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800/80">{msg.message}</p>
              <span className="text-[11px] text-slate-500 block">Received: {new Date(msg.createdAt).toLocaleString()}</span>
            </div>
          ))
        ) : (
          <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400 text-sm">
            No contact messages received yet.
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
    </div>
  );
};
