import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { History, RotateCcw, Clock, Check, FileText } from 'lucide-react';

interface PortfolioRevisionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestored?: () => void;
}

export const PortfolioRevisionsModal: React.FC<PortfolioRevisionsModalProps> = ({
  isOpen,
  onClose,
  onRestored,
}) => {
  const [revisions, setRevisions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchRevisions();
    }
  }, [isOpen]);

  const fetchRevisions = async () => {
    setIsLoading(true);
    try {
      const res: any = await api.get('/portfolio/revisions');
      setRevisions(res.data || []);
    } catch (e) {
      console.error('Failed to fetch revisions', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (revisionId: string) => {
    setRestoringId(revisionId);
    try {
      await api.post(`/portfolio/revisions/${revisionId}/restore`);
      if (onRestored) onRestored();
      onClose();
    } catch (e) {
      console.error('Failed to restore revision', e);
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Portfolio Revision History & Backups">
      <div className="space-y-4">
        <p className="text-xs text-slate-400">
          Restore previous snapshots of your portfolio bio, title, headline, avatar, and theme settings.
        </p>

        {isLoading ? (
          <div className="py-8 text-center text-slate-400 text-xs animate-pulse">
            Loading revision snapshots...
          </div>
        ) : revisions.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs bg-slate-950 rounded-xl border border-slate-800">
            No previous snapshots found yet. Snapshots are created automatically when you update customization or profile data.
          </div>
        ) : (
          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {revisions.map((rev) => {
              const snapshot = rev.snapshotData || {};
              const dateStr = new Date(rev.createdAt).toLocaleString();

              return (
                <div
                  key={rev.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-xs font-bold text-white">{dateStr}</span>
                    </div>
                    <p className="text-[11px] text-indigo-400 font-semibold">{rev.revisionNote}</p>
                    {snapshot.title && (
                      <p className="text-[10px] text-slate-400 truncate max-w-xs">
                        Title: {snapshot.title}
                      </p>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    isLoading={restoringId === rev.id}
                    onClick={() => handleRestore(rev.id)}
                    leftIcon={<RotateCcw className="w-3.5 h-3.5 text-emerald-400" />}
                  >
                    Restore
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};
