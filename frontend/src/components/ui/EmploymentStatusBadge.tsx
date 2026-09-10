import React from 'react';
import { Sparkles, Briefcase, Zap, CheckCircle2, Clock, Compass } from 'lucide-react';
import { EmploymentStatusType } from '../../types';

export interface EmploymentStatusMeta {
  key: EmploymentStatusType;
  label: string;
  badgeDefaultText: string;
  description: string;
  dotColor: string;
  ringColor: string;
  bgLight: string;
  borderColor: string;
  textColor: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

export const EMPLOYMENT_STATUS_MAP: Record<EmploymentStatusType, EmploymentStatusMeta> = {
  OPEN_TO_WORK: {
    key: 'OPEN_TO_WORK',
    label: 'Open to Work',
    badgeDefaultText: 'Open to Work & Collaborations',
    description: 'Actively seeking and interviewing for new professional roles',
    dotColor: '#10b981',
    ringColor: 'rgba(16, 185, 129, 0.4)',
    bgLight: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
    textColor: '#34d399',
    icon: Sparkles,
  },
  OPEN_TO_OFFERS: {
    key: 'OPEN_TO_OFFERS',
    label: 'Open to Opportunities',
    badgeDefaultText: 'Open to Selective Opportunities',
    description: 'Casually exploring compelling offers or leadership roles',
    dotColor: '#0ea5e9',
    ringColor: 'rgba(14, 165, 233, 0.4)',
    bgLight: 'rgba(14, 165, 233, 0.12)',
    borderColor: 'rgba(14, 165, 233, 0.35)',
    textColor: '#38bdf8',
    icon: Compass,
  },
  FREELANCE: {
    key: 'FREELANCE',
    label: 'Available for Hire / Contract',
    badgeDefaultText: 'Available for Freelance & Projects',
    description: 'Available for contract, consulting, advisory, or freelance work',
    dotColor: '#a855f7',
    ringColor: 'rgba(168, 85, 247, 0.4)',
    bgLight: 'rgba(168, 85, 247, 0.12)',
    borderColor: 'rgba(168, 85, 247, 0.35)',
    textColor: '#c084fc',
    icon: Zap,
  },
  EMPLOYED: {
    key: 'EMPLOYED',
    label: 'Employed / Not Looking',
    badgeDefaultText: 'Currently Employed',
    description: 'Happily employed and not actively seeking new opportunities',
    dotColor: '#94a3b8',
    ringColor: 'rgba(148, 163, 184, 0.3)',
    bgLight: 'rgba(148, 163, 184, 0.1)',
    borderColor: 'rgba(148, 163, 184, 0.3)',
    textColor: '#cbd5e1',
    icon: CheckCircle2,
  },
  UNAVAILABLE: {
    key: 'UNAVAILABLE',
    label: 'Currently Unavailable',
    badgeDefaultText: 'Currently Unavailable',
    description: 'On sabbatical, study leave, or fully booked for now',
    dotColor: '#f59e0b',
    ringColor: 'rgba(245, 158, 11, 0.4)',
    bgLight: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
    textColor: '#fbbf24',
    icon: Clock,
  },
};

export interface EmploymentStatusBadgeProps {
  status?: string | null;
  customText?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  themeColors?: { primary?: string; accent?: string };
  showDot?: boolean;
  pulsing?: boolean;
  className?: string;
  onClick?: () => void;
}

export const EmploymentStatusBadge: React.FC<EmploymentStatusBadgeProps> = ({
  status = 'OPEN_TO_WORK',
  customText,
  size = 'md',
  themeColors,
  showDot = true,
  pulsing = true,
  className = '',
  onClick,
}) => {
  const normKey = (status?.toUpperCase() || 'OPEN_TO_WORK') as EmploymentStatusType;
  const meta = EMPLOYMENT_STATUS_MAP[normKey] || EMPLOYMENT_STATUS_MAP.OPEN_TO_WORK;
  const Icon = meta.icon;

  const displayText = customText?.trim() || meta.badgeDefaultText;

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[10px] gap-1',
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3 py-1.5 text-xs font-medium gap-2',
    lg: 'px-4 py-2 text-sm font-semibold gap-2.5',
  }[size];

  const iconSizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size];

  const dotSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  }[size];

  // If themeColors are provided (e.g. within Public Portfolio), blend with theme colors
  const finalBg = themeColors?.primary ? `${themeColors.primary}18` : meta.bgLight;
  const finalBorder = themeColors?.primary ? `${themeColors.primary}40` : meta.borderColor;
  const finalTextColor = themeColors?.primary || meta.textColor;
  const finalDotColor = themeColors?.accent || meta.dotColor;

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center rounded-full border transition-all duration-300 shadow-sm backdrop-blur-sm select-none ${sizeClasses} ${
        onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
      } ${className}`}
      style={{
        backgroundColor: finalBg,
        borderColor: finalBorder,
        color: finalTextColor,
      }}
      title={`${meta.label}: ${meta.description}`}
    >
      <Icon className={`${iconSizes} shrink-0`} style={{ color: finalTextColor }} />

      <span className="truncate max-w-[240px] sm:max-w-none tracking-tight">
        {displayText}
      </span>

      {showDot && (
        <span className="relative flex items-center justify-center shrink-0">
          {pulsing && (normKey === 'OPEN_TO_WORK' || normKey === 'OPEN_TO_OFFERS' || normKey === 'FREELANCE') && (
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ backgroundColor: finalDotColor }}
            />
          )}
          <span
            className={`relative inline-flex rounded-full ${dotSizes}`}
            style={{ backgroundColor: finalDotColor }}
          />
        </span>
      )}
    </div>
  );
};
