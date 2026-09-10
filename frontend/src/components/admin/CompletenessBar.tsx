import React from 'react';
import { Award, CheckCircle2 } from 'lucide-react';

interface CompletenessBarProps {
  score: number;
}

export const CompletenessBar: React.FC<CompletenessBarProps> = ({ score }) => {
  const getBadgeColor = (s: number) => {
    if (s >= 90) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (s >= 70) return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30';
    if (s >= 40) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  };

  return (
    <div className="p-3 sm:p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Award className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold text-white">Profile Completeness</span>
        </div>
        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${getBadgeColor(score)}`}>
          {score}% Completed
        </span>
      </div>

      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500 rounded-full"
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
    </div>
  );
};
