import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import {
  Palette, CheckCircle2, Globe, Eye, Save, Check,
  Sparkles, ExternalLink, RefreshCw, Layers, ShieldCheck,
} from 'lucide-react';

export const CustomizerPage: React.FC = () => {
  const [themes, setThemes] = useState<any[]>([]);
  const [customization, setCustomization] = useState<any>({});
  const [subdomain, setSubdomain] = useState('francis');
  const [newSubdomain, setNewSubdomain] = useState('');
  const [subdomainMessage, setSubdomainMessage] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchCustomizerData();
  }, []);

  const fetchCustomizerData = async () => {
    setIsLoading(true);
    try {
      const [themesRes, profileRes]: [any, any] = await Promise.all([
        api.get('/themes'),
        api.get('/profile'),
      ]);
      setThemes(themesRes.data || []);
      if (profileRes.data?.customization) {
        const cust = profileRes.data.customization;
        const colorPal = (cust.colorPalette as Record<string, any>) || {};
        setCustomization({
          ...cust,
          cardStyle: cust.cardStyle || colorPal.cardStyle,
          animationStyle: cust.animationStyle || colorPal.animationStyle,
          avatarStyle: cust.avatarStyle || colorPal.avatarStyle,
        });
      }
      const sub = profileRes.data?.user?.subdomains?.[0]?.slug || 'francis';
      setSubdomain(sub);
      setNewSubdomain(sub);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTheme = (themeId: string) => {
    const matchedTheme = themes.find((t) => t.themeId === themeId);
    setCustomization((prev: any) => ({
      ...prev,
      themeId,
      theme: matchedTheme || prev?.theme,
    }));
  };

  const FONT_OPTIONS = [
    'Inter', 'Outfit', 'Poppins', 'Roboto', 'Space Grotesk', 'JetBrains Mono',
    'Fira Code', 'Plus Jakarta Sans', 'Syne', 'Cinzel', 'Merriweather', 'Lora',
    'Playfair Display', 'Libre Baskerville', 'Lato', 'Nunito', 'Raleway', 'DM Sans',
  ];
  const CARD_STYLE_OPTIONS = ['glass', 'solid', 'shadow', 'flat', 'neon', 'raised'];
  const ANIMATION_OPTIONS = ['none', 'fade', 'slide', 'zoom', 'flip', 'glitch', 'ripple', 'bounce'];

  const handleSaveCustomization = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const res: any = await api.put('/portfolio/customization', {
        themeId: selectedThemeId,
        fontHeading: customization.fontHeading,
        fontBody: customization.fontBody,
        cardStyle: customization.cardStyle,
        animationStyle: customization.animationStyle,
        avatarStyle: customization.avatarStyle,
      });
      if (res.data) {
        const cust = res.data;
        const colorPal = (cust.colorPalette as Record<string, any>) || {};
        setCustomization({
          ...cust,
          cardStyle: cust.cardStyle || colorPal.cardStyle,
          animationStyle: cust.animationStyle || colorPal.animationStyle,
          avatarStyle: cust.avatarStyle || colorPal.avatarStyle,
        });
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangeSubdomain = async () => {
    if (!newSubdomain || newSubdomain === subdomain) return;
    try {
      const res: any = await api.post('/portfolio/subdomain', { newSubdomain });
      setSubdomain(res.data.slug);
      setSubdomainMessage(`Subdomain updated to ${res.data.slug}`);
    } catch (err: any) {
      setSubdomainMessage(err.message || 'Failed to update subdomain.');
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center space-y-3">
        <Spinner size="lg" />
        <p className="text-slate-400 text-sm animate-pulse">Loading Theme Customizer...</p>
      </div>
    );
  }

  const selectedThemeId = customization.themeId || 'software-engineer';
  const activeThemeObj = themes.find((t) => t.themeId === selectedThemeId) || customization.theme || themes[0];
  const activeColors = activeThemeObj?.defaultColors || {};
  const activeTypography = activeThemeObj?.typography || {};
  const activeLayout = activeThemeObj?.layoutConfig || {};

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Palette className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-400 shrink-0" />
            <span>Portfolio Theme & Customizer</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Choose a profession-tailored design system. Selecting a theme dynamically transforms your public portfolio's colors, fonts, layout, and visual identity.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <Button
            variant="primary"
            onClick={handleSaveCustomization}
            isLoading={isSaving}
            leftIcon={saveSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
            className="flex-1 sm:flex-none justify-center"
          >
            {saveSuccess ? 'Theme Saved!' : 'Apply Theme'}
          </Button>

          <a
            href={`/p/${subdomain}`}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition flex items-center justify-center gap-2 border border-slate-700 shrink-0"
          >
            <Eye className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">View Live Portfolio</span>
            <span className="sm:hidden">Live</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>
      </div>

      {/* Active Theme Specimen Card (Live Interactive Preview) */}
      {activeThemeObj && (
        <div
          className="p-4 sm:p-6 rounded-2xl border transition-all duration-300 space-y-4 overflow-hidden"
          style={{
            borderColor: activeColors.primary || '#6366f1',
            background: `linear-gradient(135deg, ${activeColors.background || '#0f172a'}44, #0f172a)`,
            boxShadow: `0 0 30px ${activeColors.primary || '#6366f1'}20`,
          }}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                      style={{ background: `${activeColors.primary}25`, color: activeColors.primary, border: `1px solid ${activeColors.primary}40` }}>
                  {activeThemeObj.profession}
                </span>
                <span className="text-xs text-slate-400">• Active Theme</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">{activeThemeObj.name}</h2>
              <p className="text-xs text-slate-300">{activeThemeObj.description}</p>
            </div>

            {/* Color Swatch Bar */}
            <div className="flex items-center gap-2 bg-slate-950/80 p-2.5 sm:p-3 rounded-xl border border-slate-800 overflow-x-auto max-w-full">
              {['primary', 'secondary', 'accent', 'background', 'surface', 'text'].map((k) => (
                <div key={k} className="text-center shrink-0">
                  <div
                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg shadow-md ring-1 ring-white/10"
                    style={{ background: activeColors[k] || '#6366f1' }}
                    title={`${k}: ${activeColors[k]}`}
                  />
                  <span className="text-[8px] sm:text-[9px] text-slate-400 capitalize block mt-1">{k}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Typography, Layout & Avatar View Customizer Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Heading Font</p>
              <select
                value={customization.fontHeading || activeTypography.heading || 'Inter'}
                onChange={(e) => setCustomization((prev: any) => ({ ...prev, fontHeading: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 text-white text-xs font-semibold rounded-lg px-2 py-1.5 focus:border-indigo-500 focus:outline-none"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={`heading-${f}`} value={f}>{f}</option>
                ))}
              </select>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Body Font</p>
              <select
                value={customization.fontBody || activeTypography.body || 'Inter'}
                onChange={(e) => setCustomization((prev: any) => ({ ...prev, fontBody: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 text-white text-xs font-semibold rounded-lg px-2 py-1.5 focus:border-indigo-500 focus:outline-none"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={`body-${f}`} value={f}>{f}</option>
                ))}
              </select>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Card Style</p>
              <select
                value={customization.cardStyle || activeLayout.cardStyle || 'solid'}
                onChange={(e) => setCustomization((prev: any) => ({ ...prev, cardStyle: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 text-white text-xs font-semibold capitalize rounded-lg px-2 py-1.5 focus:border-indigo-500 focus:outline-none"
              >
                {CARD_STYLE_OPTIONS.map((c) => (
                  <option key={c} value={c} className="capitalize">{c}</option>
                ))}
              </select>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Animation Style</p>
              <select
                value={customization.animationStyle || activeLayout.animation || 'fade'}
                onChange={(e) => setCustomization((prev: any) => ({ ...prev, animationStyle: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 text-white text-xs font-semibold capitalize rounded-lg px-2 py-1.5 focus:border-indigo-500 focus:outline-none"
              >
                {ANIMATION_OPTIONS.map((a) => (
                  <option key={a} value={a} className="capitalize">{a}</option>
                ))}
              </select>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Avatar View Shape</p>
              <select
                value={customization.avatarStyle || 'default'}
                onChange={(e) => setCustomization((prev: any) => ({ ...prev, avatarStyle: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 text-white text-xs font-semibold rounded-lg px-2 py-1.5 focus:border-indigo-500 focus:outline-none"
              >
                <option value="default">Theme Default</option>
                <option value="round">Round (Circle)</option>
                <option value="oval">Oval (Capsule)</option>
                <option value="square">Square / Rectangular</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Subdomain Manager */}
      <div className="p-4 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Globe className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>Personal Subdomain Manager</span>
        </h3>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={newSubdomain}
              onChange={(e) => setNewSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm font-mono focus:border-indigo-500 focus:outline-none pr-32"
            />
            <span className="absolute right-3 top-3 text-[10px] sm:text-xs text-slate-500 font-mono pointer-events-none">.myportfolio.com</span>
          </div>

          <Button variant="secondary" size="sm" onClick={handleChangeSubdomain} disabled={newSubdomain === subdomain} className="justify-center">
            Update Subdomain
          </Button>
        </div>

        {subdomainMessage && <p className="text-xs font-semibold text-indigo-400">{subdomainMessage}</p>}
      </div>

      {/* 20 Profession Themes Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Palette className="w-5 h-5 text-indigo-400" />
            <span>Select a Profession Theme ({themes.length} Available)</span>
          </h3>
          <span className="text-xs text-slate-400">Click any card to preview, then click Apply Theme</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {themes.map((theme) => {
            const isSelected = selectedThemeId === theme.themeId;
            const colors = theme.defaultColors || {};

            return (
              <div
                key={theme.themeId}
                onClick={() => handleSelectTheme(theme.themeId)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between space-y-4 ${
                  isSelected
                    ? 'bg-indigo-600/10 border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                      {theme.profession}
                    </span>
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />}
                  </div>

                  <h4 className="text-base font-bold text-white">{theme.name}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{theme.description}</p>
                </div>

                {/* Color swatches preview */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-1.5">
                    {[colors.primary, colors.secondary, colors.accent].map((c, i) => (
                      <div
                        key={i}
                        className="w-4 h-4 rounded-full ring-1 ring-white/10"
                        style={{ background: c || '#6366f1' }}
                      />
                    ))}
                  </div>

                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {isSelected ? 'Selected' : 'Select'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
