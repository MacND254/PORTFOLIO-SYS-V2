import React from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password?: string;
  compact?: boolean;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password = '',
  compact = false,
}) => {
  const rules = [
    { label: '8+ chars', longLabel: 'At least 8 characters', valid: password.length >= 8 },
    { label: 'Uppercase', longLabel: 'Uppercase letter (A-Z)', valid: /[A-Z]/.test(password) },
    { label: 'Lowercase', longLabel: 'Lowercase letter (a-z)', valid: /[a-z]/.test(password) },
    { label: 'Number', longLabel: 'Number (0-9)', valid: /[0-9]/.test(password) },
    { label: 'Symbol', longLabel: 'Symbol (!@#$%^&*)', valid: /[^A-Za-z0-9]/.test(password) },
  ];

  const passedCount = rules.filter((r) => r.valid).length;

  const getStrengthLabel = () => {
    if (!password) return 'Enter password';
    if (passedCount <= 2) return 'Weak';
    if (passedCount <= 4) return 'Good';
    return 'Strong';
  };

  const getSegmentColor = (index: number) => {
    if (index >= passedCount) return 'bg-slate-800';
    if (passedCount <= 2) return 'bg-rose-500';
    if (passedCount <= 4) return 'bg-amber-400';
    return 'bg-emerald-400';
  };

  if (compact) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400 font-medium">Strength:</span>
          <span
            className={`font-semibold transition-colors ${
              passedCount === 5
                ? 'text-emerald-400'
                : passedCount >= 3
                ? 'text-amber-400'
                : password
                ? 'text-rose-400'
                : 'text-slate-500'
            }`}
          >
            {getStrengthLabel()}
          </span>
        </div>

        {/* 5-segment bar */}
        <div className="grid grid-cols-5 gap-1 h-1.5 w-full">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${getSegmentColor(i)}`}
            />
          ))}
        </div>

        {/* Compact Micro-rules */}
        <div className="flex flex-wrap gap-x-2 gap-y-0.5 pt-0.5">
          {rules.map((rule, idx) => (
            <span
              key={idx}
              className={`text-[10px] flex items-center gap-0.5 transition-colors ${
                rule.valid ? 'text-emerald-400 font-medium' : 'text-slate-500'
              }`}
            >
              {rule.valid ? (
                <Check className="w-2.5 h-2.5 text-emerald-400" />
              ) : (
                <span className="w-1 h-1 rounded-full bg-slate-600 inline-block" />
              )}
              {rule.label}
            </span>
          ))}
        </div>
      </div>
    );
  }

  const getMeterColor = () => {
    if (passedCount <= 1) return 'bg-rose-500';
    if (passedCount <= 3) return 'bg-amber-500';
    if (passedCount === 4) return 'bg-blue-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="space-y-2 mt-2 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-slate-400">Password Strength:</span>
        <span className={`font-bold ${passedCount === 5 ? 'text-emerald-400' : 'text-amber-400'}`}>
          {passedCount === 5 ? 'Strong Password' : `${passedCount} of 5 rules met`}
        </span>
      </div>

      {/* Strength Bar */}
      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden flex gap-1">
        <div
          className={`h-full transition-all duration-300 ${getMeterColor()}`}
          style={{ width: `${(passedCount / 5) * 100}%` }}
        />
      </div>

      {/* Rules list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
        {rules.map((rule, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-1.5 text-[11px] ${
              rule.valid ? 'text-emerald-400' : 'text-slate-500'
            }`}
          >
            {rule.valid ? (
              <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
            ) : (
              <X className="w-3.5 h-3.5 shrink-0 text-slate-600" />
            )}
            <span>{rule.longLabel}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

