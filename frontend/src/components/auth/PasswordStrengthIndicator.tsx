import React from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password?: string;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ password = '' }) => {
  const rules = [
    { label: 'At least 8 characters long', valid: password.length >= 8 },
    { label: 'At least one uppercase letter (A-Z)', valid: /[A-Z]/.test(password) },
    { label: 'At least one lowercase letter (a-z)', valid: /[a-z]/.test(password) },
    { label: 'At least one number (0-9)', valid: /[0-9]/.test(password) },
    { label: 'At least one special character (!@#$%^&*)', valid: /[^A-Za-z0-9]/.test(password) },
  ];

  const passedCount = rules.filter((r) => r.valid).length;
  const getMeterColor = () => {
    if (passedCount <= 1) return 'bg-rose-500';
    if (passedCount <= 3) return 'bg-amber-500';
    if (passedCount === 4) return 'bg-blue-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="space-y-2 mt-2 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-slate-400">Password Strength:</span>
        <span className={`font-bold ${passedCount === 5 ? 'text-emerald-400' : 'text-amber-400'}`}>
          {passedCount === 5 ? 'Strong Password' : `${passedCount} of 5 rules met`}
        </span>
      </div>

      {/* Strength Bar */}
      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden flex gap-1">
        <div className={`h-full transition-all duration-300 ${getMeterColor()}`} style={{ width: `${(passedCount / 5) * 100}%` }} />
      </div>

      {/* Rules list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
        {rules.map((rule, idx) => (
          <div key={idx} className={`flex items-center gap-1.5 text-[11px] ${rule.valid ? 'text-emerald-400' : 'text-slate-500'}`}>
            {rule.valid ? <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" /> : <X className="w-3.5 h-3.5 shrink-0 text-slate-600" />}
            <span>{rule.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
