import React, { useState } from 'react';
import api from '../../api/client';
import {
  EmploymentStatusBadge,
  EMPLOYMENT_STATUS_MAP,
} from '../ui/EmploymentStatusBadge';
import { EmploymentStatusType } from '../../types';
import {
  Check,
  ChevronDown,
  Edit2,
  Eye,
  EyeOff,
  Sparkles,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmploymentStatusQuickEditorProps {
  initialStatus?: string;
  initialCustomText?: string | null;
  initialShowBadge?: boolean;
  onStatusUpdated?: (updated: {
    employmentStatus: string;
    employmentStatusCustom?: string | null;
    showEmploymentBadge: boolean;
  }) => void;
}

export const EmploymentStatusQuickEditor: React.FC<EmploymentStatusQuickEditorProps> = ({
  initialStatus = 'OPEN_TO_WORK',
  initialCustomText = '',
  initialShowBadge = true,
  onStatusUpdated,
}) => {
  const [currentStatus, setCurrentStatus] = useState<string>(initialStatus || 'OPEN_TO_WORK');
  const [customText, setCustomText] = useState<string>(initialCustomText || '');
  const [showBadge, setShowBadge] = useState<boolean>(initialShowBadge !== false);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditingCustom, setIsEditingCustom] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const statuses = Object.values(EMPLOYMENT_STATUS_MAP);

  const saveChanges = async (
    newStatus: string,
    newCustom: string,
    newShowBadge: boolean
  ) => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await api.put('/profile', {
        employmentStatus: newStatus,
        employmentStatusCustom: newCustom.trim() || null,
        showEmploymentBadge: newShowBadge,
      });

      setCurrentStatus(newStatus);
      setCustomText(newCustom);
      setShowBadge(newShowBadge);
      setSaveSuccess(true);
      if (onStatusUpdated) {
        onStatusUpdated({
          employmentStatus: newStatus,
          employmentStatusCustom: newCustom.trim() || null,
          showEmploymentBadge: newShowBadge,
        });
      }
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to update employment status:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectStatus = (statusKey: EmploymentStatusType) => {
    saveChanges(statusKey, customText, showBadge);
    setIsOpen(false);
  };

  const handleToggleVisibility = () => {
    const nextShow = !showBadge;
    saveChanges(currentStatus, customText, nextShow);
  };

  const handleSaveCustomText = (e: React.FormEvent) => {
    e.preventDefault();
    saveChanges(currentStatus, customText, showBadge);
    setIsEditingCustom(false);
  };

  return (
    <div className="relative inline-block text-left w-full sm:w-auto">
      {/* Trigger Bar */}
      <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 hover:border-indigo-500/50 rounded-xl p-1.5 sm:p-2 transition shadow-md backdrop-blur-sm">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 group text-left cursor-pointer focus:outline-none"
          title="Click to update your employment status"
        >
          <EmploymentStatusBadge
            status={currentStatus}
            customText={customText}
            size="sm"
            pulsing={showBadge}
            className={!showBadge ? 'opacity-50 grayscale-[40%]' : ''}
          />
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        <div className="h-4 w-[1px] bg-slate-800" />

        {/* Visibility quick toggle */}
        <button
          type="button"
          onClick={handleToggleVisibility}
          disabled={isSaving}
          className={`p-1 rounded-md text-xs transition flex items-center gap-1 ${
            showBadge
              ? 'text-emerald-400 hover:bg-emerald-500/10'
              : 'text-slate-500 hover:bg-slate-800 hover:text-slate-400'
          }`}
          title={showBadge ? 'Badge visible on public site. Click to hide.' : 'Badge hidden. Click to show.'}
        >
          {showBadge ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </button>

        {/* Edit custom text */}
        <button
          type="button"
          onClick={() => {
            setIsEditingCustom(!isEditingCustom);
            setIsOpen(false);
          }}
          className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-md transition"
          title="Customize badge tagline"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>

        {saveSuccess && (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 animate-in fade-in duration-200 pl-1">
            <Check className="w-3 h-3" />
            <span className="hidden sm:inline">Saved</span>
          </span>
        )}
        {isSaving && (
          <RefreshCw className="w-3 h-3 text-indigo-400 animate-spin ml-1" />
        )}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 sm:right-auto sm:left-0 mt-2 w-80 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Work Availability Status
              </span>
              <span className="text-[10px] text-slate-500">Live on portfolio</span>
            </div>

            <div className="space-y-1.5">
              {statuses.map((item) => {
                const isSelected = currentStatus.toUpperCase() === item.key;
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleSelectStatus(item.key)}
                    className={`w-full text-left p-2.5 rounded-xl transition flex items-start justify-between gap-3 group ${
                      isSelected
                        ? 'bg-indigo-600/15 border border-indigo-500/40 text-white'
                        : 'hover:bg-slate-800/80 border border-transparent text-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{ backgroundColor: item.bgLight, color: item.textColor }}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold flex items-center gap-1.5">
                          <span>{item.label}</span>
                          {isSelected && (
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1 leading-snug">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-1" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 mt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsEditingCustom(true);
                }}
                className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" />
                Customize Tagline
              </button>
              <Link
                to="/admin/profile"
                className="text-slate-400 hover:text-white flex items-center gap-1"
              >
                Profile Editor
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </>
      )}

      {/* Custom Tagline Modal / Popover */}
      {isEditingCustom && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
            onClick={() => setIsEditingCustom(false)}
          />
          <div className="absolute left-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
            <h4 className="text-xs font-bold text-white mb-1">
              Custom Status Tagline
            </h4>
            <p className="text-[11px] text-slate-400 mb-3">
              Replace default badge text with your personal note (e.g. "Open to Lead Backend Roles", "Available from Nov").
            </p>
            <form onSubmit={handleSaveCustomText} className="space-y-3">
              <input
                type="text"
                maxLength={60}
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="e.g. Open to Senior Frontend Roles"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setCustomText('');
                    saveChanges(currentStatus, '', showBadge);
                    setIsEditingCustom(false);
                  }}
                  className="text-[11px] text-slate-400 hover:text-rose-400 transition"
                >
                  Clear Custom Text
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingCustom(false)}
                    className="px-3 py-1.5 text-xs text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-md transition disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Apply'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};
