import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Star, CheckCircle2 } from 'lucide-react';
import api from '../../api/client';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileId: string;
  fullName: string;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  profileId,
  fullName,
}) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerEmail, setReviewerEmail] = useState('');
  const [reviewerCompany, setReviewerCompany] = useState('');
  const [reviewerJobTitle, setReviewerJobTitle] = useState('');
  const [reviewText, setReviewText] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await api.post(`/reviews/public/${profileId}`, {
        reviewerName,
        reviewerEmail,
        reviewerCompany,
        reviewerJobTitle,
        rating,
        reviewText,
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit review.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Review ${fullName}`} maxWidth="lg">
      {submitted ? (
        <div className="text-center py-8 space-y-4">
          <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto" />
          <h3 className="text-xl font-bold text-white">Review Submitted!</h3>
          <p className="text-slate-300 text-sm">
            Thank you for providing your feedback for {fullName}. Your testimonial will be published once approved by the profile owner.
          </p>
          <Button variant="primary" onClick={onClose} className="mt-4">
            Done
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">{error}</div>}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Overall Rating</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 text-amber-400 hover:scale-110 transition"
                >
                  <Star className={`w-6 h-6 ${(hoverRating || rating) >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Your Full Name *</label>
              <input
                type="text"
                required
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                placeholder="Sarah Jenkins"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Your Email Address *</label>
              <input
                type="email"
                required
                value={reviewerEmail}
                onChange={(e) => setReviewerEmail(e.target.value)}
                placeholder="sarah@example.com"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Company Name</label>
              <input
                type="text"
                value={reviewerCompany}
                onChange={(e) => setReviewerCompany(e.target.value)}
                placeholder="Acme Corp"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Job Title</label>
              <input
                type="text"
                value={reviewerJobTitle}
                onChange={(e) => setReviewerJobTitle(e.target.value)}
                placeholder="VP of Product"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Testimonial / Review Text *</label>
            <textarea
              rows={4}
              required
              minLength={10}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Describe your experience working with this professional..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} className="w-full">
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading} className="w-full">
              Submit Testimonial
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
