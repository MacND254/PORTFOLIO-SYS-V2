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
    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-400" />
          <span className="text-sm font-bold text-white">Profile Completeness</span>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full border text-xs font-semibold ${getBadgeColor(score)}`}>
          {score}% Completed
        </span>
      </div>

      <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500 rounded-full"
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
    </div>
  );
};
