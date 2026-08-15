import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { Star, Check, X, Trash2, Share2, Copy } from 'lucide-react';

export const ReviewsManagerPage: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [requestData, setRequestData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

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

  if (isLoading) {
    return <div className="p-8 flex justify-center"><Spinner size="lg" /></div>;
  }

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Testimonials & Reviews</h1>
        <p className="text-slate-400 text-sm">Collect and moderate client reviews displayed on your portfolio.</p>
      </div>

      {/* Share Review Link Box */}
      <div className="p-6 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Share2 className="w-5 h-5 text-indigo-400" />
            <span>Shareable Review Request Link</span>
          </h3>
          <p className="text-xs text-slate-300">Send this link to clients or colleagues to collect verified 5-star testimonials.</p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-indigo-300 w-full md:w-64"
          />
          <Button variant="primary" size="sm" onClick={handleCopyLink} leftIcon={copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}>
            {copied ? 'Copied' : 'Copy Link'}
          </Button>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white">Client Submissions ({reviews.length})</h3>

        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((rev) => (
              <div key={rev.id} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 font-bold text-white flex items-center justify-center">
                      {rev.reviewerName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">{rev.reviewerName}</h4>
                      <p className="text-xs text-slate-400">{rev.reviewerJobTitle} {rev.reviewerCompany ? `@ ${rev.reviewerCompany}` : ''} ({rev.reviewerEmail})</p>
                    </div>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${rev.isApproved ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'}`}>
                    {rev.isApproved ? 'APPROVED (PUBLIC)' : 'PENDING MODERATION'}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-amber-400">
                  {Array.from({ length: rev.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>

                <p className="text-sm text-slate-300 italic">"{rev.reviewText}"</p>

                <div className="flex items-center gap-3 pt-3 border-t border-slate-800/80">
                  {!rev.isApproved ? (
                    <Button variant="success" size="sm" onClick={() => handleModerate(rev.id, 'APPROVE')} leftIcon={<Check className="w-3.5 h-3.5" />}>
                      Approve Review
                    </Button>
                  ) : (
                    <Button variant="secondary" size="sm" onClick={() => handleModerate(rev.id, 'REJECT')} leftIcon={<X className="w-3.5 h-3.5" />}>
                      Hide / Reject
                    </Button>
                  )}

                  <Button variant="danger" size="sm" onClick={() => handleModerate(rev.id, 'DELETE')} leftIcon={<Trash2 className="w-3.5 h-3.5" />}>
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400 text-sm">
            No testimonial reviews received yet. Share your review request link above.
          </div>
        )}
      </div>
    </div>
  );
};
