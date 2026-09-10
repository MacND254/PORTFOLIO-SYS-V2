import React, { useEffect, useState, useCallback } from 'react';
import api from '../../api/client';
import { Spinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import {
  Palette, Save, RefreshCw, Eye, EyeOff, RotateCcw,
  ChevronDown, ChevronUp, Sparkles, Check, AlertCircle,
} from 'lucide-react';

const FONT_OPTIONS = [
  'Inter', 'Outfit', 'Poppins', 'Roboto', 'Space Grotesk', 'JetBrains Mono',
  'Fira Code', 'Plus Jakarta Sans', 'Syne', 'Cinzel', 'Merriweather', 'Lora',
  'Playfair Display', 'Libre Baskerville', 'Lato', 'Nunito', 'Raleway', 'DM Sans',
];

const ANIMATION_OPTIONS = [
  { value: 'none',    label: 'None — Instant Render' },
  { value: 'fade',    label: 'Fade In (Subtle)' },
  { value: 'slide',   label: 'Slide Up (Professional)' },
  { value: 'zoom',    label: 'Zoom In (Dynamic)' },
  { value: 'flip',    label: 'Flip Card (Creative)' },
  { value: 'glitch',  label: 'Glitch Shift (Cyber)' },
  { value: 'ripple',  label: 'Ripple Pulse (Medical)' },
  { value: 'bounce',  label: 'Bounce In (Marketing)' },
];

const LAYOUT_OPTIONS = [
  { value: 'classic',    label: 'Classic — Centered Column' },
  { value: 'sidebar',    label: 'Sidebar — Profile + Content' },
  { value: 'grid',       label: 'Grid — Magazine Layout' },
  { value: 'timeline',   label: 'Timeline — Vertical Flow' },
  { value: 'fullwidth',  label: 'Full Width — Edge-to-Edge' },
  { value: 'minimal',    label: 'Minimal — Content Focus' },
  { value: 'card-deck',  label: 'Card Deck — Floating Panels' },
];

const CARD_STYLE_OPTIONS = [
  { value: 'glass',   label: 'Glassmorphism' },
  { value: 'solid',   label: 'Solid Bordered' },
  { value: 'shadow',  label: 'Deep Shadow' },
  { value: 'flat',    label: 'Flat Minimal' },
  { value: 'neon',    label: 'Neon Outline' },
  { value: 'raised',  label: 'Raised 3D' },
];

const LEGACY_LAYOUT_ALIASES: Record<string, string> = {
  developer: 'sidebar', analytics: 'grid', 'matrix-terminal': 'timeline', infrastructure: 'grid',
  pipeline: 'card-deck', 'case-study': 'minimal', masonry: 'grid', editorial: 'classic',
  blueprint: 'timeline', schematic: 'sidebar', industrial: 'card-deck', clinical: 'minimal',
  'formal-legal': 'classic', 'corporate-finance': 'grid', 'campaign-impact': 'fullwidth',
  'darkroom-gallery': 'fullwidth', 'academic-warm': 'card-deck', 'paper-publication': 'classic',
  'consulting-packages': 'sidebar', 'asymmetrical-art': 'grid',
};

const LEGACY_CARD_STYLE_ALIASES: Record<string, string> = {
  'data-grid': 'raised', 'bordered-dark': 'neon', 'system-panel': 'solid', 'docker-card': 'glass',
  'soft-shadow': 'shadow', 'image-focus': 'shadow', 'architectural-grid': 'flat', 'steel-border': 'solid',
  'circuit-panel': 'neon', 'metallic-card': 'raised', 'clean-teal': 'solid', 'gold-trimmed': 'flat',
  'slate-border': 'solid', 'stat-highlight': 'raised', 'frameless-photo': 'flat', 'soft-card': 'shadow',
  'paper-bordered': 'flat', 'pricing-card': 'raised', 'floating-glass': 'glass',
};

export const ThemeManagerPage: React.FC = () => {
  const [themes, setThemes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editState, setEditState] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [resetting, setResetting] = useState<string | null>(null);
  const [previewTheme, setPreviewTheme] = useState<any>(null);
  const [searchQ, setSearchQ] = useState('');

  useEffect(() => { fetchThemes(); }, []);

  const fetchThemes = async () => {
    setIsLoading(true);
    try {
      const res: any = await api.get('/admin/themes');
      const data = res.data as any[];
      setThemes(data);
      // Init edit state from current theme values
      const init: Record<string, any> = {};
      data.forEach((t) => {
        init[t.themeId] = {
          name: t.name,
          profession: t.profession || '',
          description: t.description || '',
          defaultColors: { ...t.defaultColors },
          typography: { ...t.typography },
          layoutConfig: {
            ...t.layoutConfig,
            layout: LEGACY_LAYOUT_ALIASES[t.layoutConfig?.layout] || t.layoutConfig?.layout || 'classic',
            cardStyle: LEGACY_CARD_STYLE_ALIASES[t.layoutConfig?.cardStyle] || t.layoutConfig?.cardStyle || 'solid',
            animation: t.layoutConfig?.animation || 'fade',
            heroStyle: t.layoutConfig?.heroStyle || '',
          },
        };
      });
      setEditState(init);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const patchEdit = (themeId: string, path: string[], value: any) => {
    setEditState((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      let cur = next[themeId];
      for (let i = 0; i < path.length - 1; i++) cur = cur[path[i]];
      cur[path[path.length - 1]] = value;
      return next;
    });
  };

  const handleSave = async (themeId: string) => {
    setSaving(themeId);
    try {
      await api.put(`/admin/themes/${themeId}`, editState[themeId]);
      setSaved(themeId);
      setTimeout(() => setSaved(null), 2000);
      await fetchThemes();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(null);
    }
  };

  const handleTogglePublish = async (themeId: string) => {
    try {
      await api.post(`/admin/themes/${themeId}/toggle-publish`);
      await fetchThemes();
    } catch (e) {
      console.error(e);
    }
  };

  const handleReset = async (themeId: string) => {
    if (!window.confirm('Reset this theme’s visual settings to the platform defaults? This cannot be undone.')) return;
    setResetting(themeId);
    try {
      await api.post(`/admin/themes/${themeId}/reset`);
      await fetchThemes();
    } catch (e) {
      console.error(e);
    } finally {
      setResetting(null);
    }
  };

  const filteredThemes = themes.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQ.toLowerCase()) ||
      t.profession?.toLowerCase().includes(searchQ.toLowerCase()),
  );

  if (isLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center gap-4">
        <Spinner size="lg" />
        <p className="text-slate-400 text-sm animate-pulse">Loading 20 profession themes...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            Platform Theme Studio
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Customize colors, fonts, animations, and layouts for all 20 profession-specific themes. Changes apply platform-wide instantly.
          </p>
        </div>
        <Button variant="outline" size="sm" leftIcon={<RefreshCw className="w-3.5 h-3.5" />} onClick={fetchThemes}>
          Refresh All
        </Button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Themes', value: themes.length, color: 'text-indigo-400' },
          { label: 'Published', value: themes.filter((t) => t.isPublished).length, color: 'text-emerald-400' },
          { label: 'Hidden', value: themes.filter((t) => !t.isPublished).length, color: 'text-amber-400' },
          { label: 'Profession Categories', value: new Set(themes.map((t) => t.profession)).size, color: 'text-purple-400' },
        ].map((stat) => (
          <div key={stat.label} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search themes by name or profession..."
        value={searchQ}
        onChange={(e) => setSearchQ(e.target.value)}
        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none transition"
      />

      {/* Theme Cards */}
      <div className="space-y-4">
        {filteredThemes.map((theme) => {
          const edit = editState[theme.themeId] || {};
          const isOpen = expanded === theme.themeId;
          const colors = edit.defaultColors || theme.defaultColors || {};
          const isSaved = saved === theme.themeId;
          const isSaving = saving === theme.themeId;

          return (
            <div
              key={theme.themeId}
              className="rounded-2xl border transition-all duration-200"
              style={{
                borderColor: isOpen ? colors.primary || '#6366f1' : 'rgba(51,65,85,0.8)',
                background: isOpen
                  ? `linear-gradient(135deg, ${colors.background || '#0f172a'}22, #0f172a)`
                  : '#0f172a',
                boxShadow: isOpen ? `0 0 30px ${colors.primary || '#6366f1'}18` : 'none',
              }}
            >
              {/* Theme Header Row */}
              <div
                className="flex items-center justify-between p-5 cursor-pointer select-none"
                onClick={() => setExpanded(isOpen ? null : theme.themeId)}
              >
                <div className="flex items-center gap-4">
                  {/* Color Swatch Preview */}
                  <div className="flex gap-1.5">
                    {[colors.primary, colors.secondary, colors.accent].map((c, i) => (
                      <div
                        key={i}
                        className="w-5 h-5 rounded-full ring-1 ring-white/10 shadow-md"
                        style={{ background: c || '#6366f1' }}
                      />
                    ))}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-bold text-base">{theme.name}</h3>
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{
                          background: `${colors.primary || '#6366f1'}25`,
                          color: colors.primary || '#818cf8',
                          border: `1px solid ${colors.primary || '#6366f1'}40`,
                        }}
                      >
                        {theme.profession}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{theme.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Published badge */}
                  <span
                    onClick={(e) => { e.stopPropagation(); handleTogglePublish(theme.themeId); }}
                    className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition select-none ${
                      theme.isPublished
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                        : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {theme.isPublished ? '● Published' : '○ Hidden'}
                  </span>

                  {/* Preview button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setPreviewTheme({ ...theme, ...edit, layoutConfig: { ...theme.layoutConfig, ...edit.layoutConfig } }); }}
                    className="p-2 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition"
                    title="Preview Theme Styles"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </div>

              {/* Expanded Editor */}
              {isOpen && (
                <div className="border-t border-slate-800/50 p-6 space-y-8">
                  {/* ── Colors Section ── */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <Palette className="w-3.5 h-3.5" /> Color Palette
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      {[
                        { key: 'primary', label: 'Primary' },
                        { key: 'secondary', label: 'Secondary' },
                        { key: 'accent', label: 'Accent' },
                        { key: 'background', label: 'Background' },
                        { key: 'surface', label: 'Surface' },
                        { key: 'text', label: 'Text' },
                      ].map(({ key, label }) => (
                        <div key={key} className="space-y-2">
                          <label className="text-[11px] text-slate-300 font-medium">{label}</label>
                          <div className="relative flex items-center gap-2">
                            <input
                              type="color"
                              value={colors[key] || '#6366f1'}
                              onChange={(e) => patchEdit(theme.themeId, ['defaultColors', key], e.target.value)}
                              className="w-10 h-10 rounded-lg cursor-pointer border border-slate-700 bg-transparent"
                            />
                            <input
                              type="text"
                              value={colors[key] || ''}
                              onChange={(e) => patchEdit(theme.themeId, ['defaultColors', key], e.target.value)}
                              className="flex-1 uppercase text-[11px] font-mono px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none"
                              maxLength={7}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Typography ── */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Typography</h4>
                    <div className="grid md:grid-cols-3 gap-4">
                      {[
                        { key: 'heading', label: 'Heading Font' },
                        { key: 'body', label: 'Body Font' },
                        { key: 'code', label: 'Code / Mono Font (optional)' },
                      ].map(({ key, label }) => (
                        <div key={key} className="space-y-1.5">
                          <label className="text-xs text-slate-300">{label}</label>
                          <select
                            value={edit.typography?.[key] || 'Inter'}
                            onChange={(e) => patchEdit(theme.themeId, ['typography', key], e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
                          >
                            {FONT_OPTIONS.map((f) => (
                              <option key={f} value={f}>{f}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>

                    {/* Live font preview */}
                    <div
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1"
                      style={{ fontFamily: edit.typography?.heading || 'Inter' }}
                    >
                      <p className="text-white text-xl font-bold" style={{ color: colors.primary || '#6366f1' }}>
                        {theme.name} — Heading Preview
                      </p>
                      <p className="text-slate-300 text-sm" style={{ fontFamily: edit.typography?.body || 'Inter' }}>
                        Body text sample in full professional context. Showcasing real layout readability.
                      </p>
                    </div>
                  </div>

                  {/* ── Layout & Structure ── */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Layout & Structure</h4>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-300">Page Layout</label>
                        <select
                          value={edit.layoutConfig?.layout || 'classic'}
                          onChange={(e) => patchEdit(theme.themeId, ['layoutConfig', 'layout'], e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
                        >
                          {LAYOUT_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-300">Card Style</label>
                        <select
                          value={edit.layoutConfig?.cardStyle || 'solid'}
                          onChange={(e) => patchEdit(theme.themeId, ['layoutConfig', 'cardStyle'], e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
                        >
                          {CARD_STYLE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-300">Section Animation</label>
                        <select
                          value={edit.layoutConfig?.animation || 'fade'}
                          onChange={(e) => patchEdit(theme.themeId, ['layoutConfig', 'animation'], e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
                        >
                          {ANIMATION_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Layout preview chip */}
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: 'showCodeBadges', label: 'Code Badges' },
                        { key: 'showCharts', label: 'Analytics Charts' },
                        { key: 'showTerminalHeader', label: 'Terminal Header' },
                        { key: 'showPrototypes', label: 'Interactive Prototypes Link' },
                        { key: 'showQrInPdf', label: 'QR Code Action' },
                      ].map(({ key, label }) => (
                        <button
                          key={key}
                          onClick={() => patchEdit(theme.themeId, ['layoutConfig', key], !edit.layoutConfig?.[key])}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                            edit.layoutConfig?.[key]
                              ? 'text-white border-indigo-500/60 bg-indigo-500/20'
                              : 'text-slate-400 border-slate-700 bg-transparent hover:border-slate-600'
                          }`}
                        >
                          {edit.layoutConfig?.[key] ? '✓ ' : ''}
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ── Description editor ── */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-300 font-medium">Theme Name</label>
                      <input
                        type="text"
                        value={edit.name || ''}
                        onChange={(e) => patchEdit(theme.themeId, ['name'], e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
                        maxLength={80}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-300 font-medium">Profession Category</label>
                      <input
                        type="text"
                        value={edit.profession || ''}
                        onChange={(e) => patchEdit(theme.themeId, ['profession'], e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
                        maxLength={80}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-300 font-medium">Theme Description</label>
                    <textarea
                      rows={2}
                      value={edit.description || ''}
                      onChange={(e) => patchEdit(theme.themeId, ['description'], e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  {/* ── Color gradient preview ── */}
                  <div
                    className="h-16 rounded-2xl shadow-inner"
                    style={{
                      background: `linear-gradient(135deg, ${colors.primary || '#6366f1'}, ${colors.secondary || '#3b82f6'}, ${colors.accent || '#22c55e'})`,
                    }}
                  />

                  {/* ── Action Buttons ── */}
                  <div className="flex items-center gap-3 flex-wrap pt-2 border-t border-slate-800/60">
                    <Button
                      variant="primary"
                      size="sm"
                      isLoading={isSaving}
                      leftIcon={isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                      onClick={() => handleSave(theme.themeId)}
                    >
                      {isSaved ? 'Saved!' : 'Save Changes'}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      isLoading={resetting === theme.themeId}
                      leftIcon={<RotateCcw className="w-4 h-4" />}
                      onClick={() => handleReset(theme.themeId)}
                    >
                      Reset to Default
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={theme.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      onClick={() => handleTogglePublish(theme.themeId)}
                    >
                      {theme.isPublished ? 'Hide Theme' : 'Publish Theme'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Preview Modal */}
      <Modal isOpen={!!previewTheme} onClose={() => setPreviewTheme(null)} title={`Preview — ${previewTheme?.name}`}>
        {previewTheme && (
          <div className="space-y-6">
            {/* Color swatches */}
            <div>
              <p className="text-xs text-slate-400 mb-3 font-semibold uppercase tracking-widest">Color Palette</p>
              <div className="flex gap-3 flex-wrap">
                {Object.entries(previewTheme.defaultColors || {}).map(([k, v]: [string, any]) => (
                  <div key={k} className="text-center space-y-1.5">
                    <div className="w-12 h-12 rounded-xl shadow-lg ring-1 ring-white/10" style={{ background: v }} />
                    <p className="text-[10px] text-slate-400 capitalize">{k}</p>
                    <p className="text-[10px] text-slate-500 font-mono uppercase">{v}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Gradient Banner */}
            <div
              className="h-20 rounded-2xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${previewTheme.defaultColors?.primary}, ${previewTheme.defaultColors?.secondary}, ${previewTheme.defaultColors?.accent})`,
              }}
            >
              <span
                className="text-2xl font-extrabold text-white"
                style={{ fontFamily: previewTheme.typography?.heading || 'Inter' }}
              >
                {previewTheme.name}
              </span>
            </div>

            {/* Typography specimen */}
            <div
              className="p-5 rounded-2xl border border-slate-800 space-y-2"
              style={{
                background: previewTheme.defaultColors?.background,
                fontFamily: previewTheme.typography?.heading,
              }}
            >
              <p className="font-extrabold text-xl" style={{ color: previewTheme.defaultColors?.primary }}>
                Heading: {previewTheme.typography?.heading}
              </p>
              <p style={{ color: previewTheme.defaultColors?.text, fontFamily: previewTheme.typography?.body, fontSize: 14 }}>
                Body: {previewTheme.typography?.body} — Lorem ipsum dolor sit amet consectetur adipiscing elit.
              </p>
            </div>

            {/* Layout info */}
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: 'Layout', value: previewTheme.layoutConfig?.layout || 'classic' },
                { label: 'Cards', value: previewTheme.layoutConfig?.cardStyle || 'solid' },
                { label: 'Animation', value: previewTheme.layoutConfig?.animation || 'fade' },
              ].map(({ label, value }) => (
                <div key={label} className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">{label}</p>
                  <p className="text-white text-sm font-semibold capitalize mt-1">{value}</p>
                </div>
              ))}
            </div>

            {/* Live portfolio link */}
            <a
              href={`http://localhost:3080/p/francis`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition"
            >
              <Eye className="w-4 h-4" /> Open Live Demo Portfolio
            </a>
          </div>
        )}
      </Modal>
    </div>
  );
};
