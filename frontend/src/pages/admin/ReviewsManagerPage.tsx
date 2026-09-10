import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { Modal } from '../../components/ui/Modal';
import { Star, Check, X, Trash2, Share2, Copy, Send, Mail, CheckCircle, AlertTriangle } from 'lucide-react';

export const ReviewsManagerPage: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [requestData, setRequestData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Invite Modal state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerEmail, setReviewerEmail] = useState('');
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ success?: boolean; message?: string } | null>(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const [reviewsRes, tokenRes]: [any, any] = await Promise.all([
        api.get('/reviews'),
        api.get('/reviews/request-token'),
      ]);
      setReviews(reviewsRes.data);
      setRequestData(tokenRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModerate = async (id: string, action: 'APPROVE' | 'REJECT' | 'TOGGLE_FEATURE' | 'DELETE') => {
    try {
      await api.put(`/reviews/${id}/moderate`, { action });
      fetchReviews();
    } catch (e) {
      console.error(e);
    }
  };

  const shareUrl = requestData?.shareableUrl ? `${window.location.origin}${requestData.shareableUrl}` : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName || !reviewerEmail) return;

    setIsSendingInvite(true);
    setInviteResult(null);

    try {
      const res: any = await api.post('/reviews/send-invite', {
        reviewerEmail,
        reviewerName,
      });
      setInviteResult({ success: true, message: res.message || 'Testimonial invitation sent!' });
      setReviewerName('');
      setReviewerEmail('');
    } catch (err: any) {
      setInviteResult({
        success: false,
        message: err?.response?.data?.message || 'Failed to dispatch email invitation.',
      });
    } finally {
      setIsSendingInvite(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 flex justify-center"><Spinner size="lg" /></div>;
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-6xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Star className="w-4 h-4" />
            </div>
            Testimonials &amp; Client Reviews
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Collect, invite, and moderate client reviews displayed on your portfolio.</p>
        </div>

        <Button
          variant="primary"
          size="sm"
          className="text-xs px-3 py-1.5"
          onClick={() => {
            setInviteResult(null);
            setIsInviteModalOpen(true);
          }}
          leftIcon={<Send className="w-3.5 h-3.5" />}
        >
          Send Testimonial Invite
        </Button>
      </div>

      {/* Share Review Link Box */}
      <div className="p-3.5 rounded-xl bg-indigo-600/10 border border-indigo-500/30 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h3 className="text-xs font-bold text-white flex items-center gap-2">
            <Share2 className="w-4 h-4 text-indigo-400" />
            <span>Shareable Review Request Link</span>
          </h3>
          <p className="text-[11px] text-slate-300">Send this link to clients or colleagues to collect verified 5-star testimonials.</p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-indigo-300 w-full md:w-64"
          />
          <Button variant="primary" size="sm" className="text-xs px-3 py-1.5" onClick={handleCopyLink} leftIcon={copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}>
            {copied ? 'Copied' : 'Copy Link'}
          </Button>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Client Submissions ({reviews.length})</h3>

        {reviews.length > 0 ? (
          <div className="space-y-3">
            {reviews.map((rev) => (
              <div key={rev.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-800 font-bold text-white text-xs flex items-center justify-center">
                      {rev.reviewerName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{rev.reviewerName}</h4>
                      <p className="text-[11px] text-slate-400">{rev.reviewerJobTitle} {rev.reviewerCompany ? `@ ${rev.reviewerCompany}` : ''} ({rev.reviewerEmail})</p>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${rev.isApproved ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'}`}>
                    {rev.isApproved ? 'APPROVED (PUBLIC)' : 'PENDING MODERATION'}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-amber-400">
                  {Array.from({ length: rev.rating }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>

                <p className="text-xs text-slate-300 italic leading-relaxed">"{rev.reviewText}"</p>

                <div className="flex items-center gap-2 pt-2.5 border-t border-slate-800/80">
                  {!rev.isApproved ? (
                    <Button variant="success" size="sm" className="text-xs px-2.5 py-1" onClick={() => handleModerate(rev.id, 'APPROVE')} leftIcon={<Check className="w-3.5 h-3.5" />}>
                      Approve Review
                    </Button>
                  ) : (
                    <Button variant="secondary" size="sm" className="text-xs px-2.5 py-1" onClick={() => handleModerate(rev.id, 'REJECT')} leftIcon={<X className="w-3.5 h-3.5" />}>
                      Hide / Reject
                    </Button>
                  )}

                  <Button variant="danger" size="sm" className="text-xs px-2.5 py-1" onClick={() => handleModerate(rev.id, 'DELETE')} leftIcon={<Trash2 className="w-3.5 h-3.5" />}>
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-900/60 rounded-xl border border-slate-800 text-slate-400 text-xs">
            No testimonial reviews received yet. Share your review request link or send a direct invite above.
          </div>
        )}
      </div>

      {/* Send Review Invite Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Send Direct Testimonial Email Request"
      >
        <form onSubmit={handleSendInvite} className="space-y-4">
          <p className="text-xs text-slate-400">
            Dispatch an automated email invitation containing a unique direct review link to your client or colleague.
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Client / Reviewer Name *</label>
            <input
              type="text"
              required
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Client Email Address *</label>
            <div className="relative">
              <input
                type="email"
                required
                value={reviewerEmail}
                onChange={(e) => setReviewerEmail(e.target.value)}
                placeholder="john.doe@company.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
              />
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            </div>
          </div>

          {inviteResult && (
            <div
              className={`p-4 rounded-xl text-xs flex items-start gap-3 border ${
                inviteResult.success
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}
            >
              {inviteResult.success ? (
                <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
              )}
              <div>
                <span className="font-bold block">{inviteResult.success ? 'Invite Sent' : 'Failed'}</span>
                <p className="mt-0.5 opacity-90">{inviteResult.message}</p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={() => setIsInviteModalOpen(false)}>
              Close
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isSendingInvite}
              leftIcon={<Send className="w-4 h-4" />}
            >
              Send Invite Email
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
