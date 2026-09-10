import React, { useState } from 'react';
import { ExternalLink, Copy, Check, Globe } from 'lucide-react';
import { getPublicPortfolioUrl, getPublicPortfolioDisplay } from '../../utils/url';

interface SubdomainUrlBadgeProps {
  subdomain: string;
}

export const SubdomainUrlBadge: React.FC<SubdomainUrlBadgeProps> = ({ subdomain }) => {
  const [copied, setCopied] = useState(false);
  const fullUrl = getPublicPortfolioUrl(subdomain);
  const displayUrl = getPublicPortfolioDisplay(subdomain);

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-1.5 p-1 px-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px]">
      <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
      <span className="font-mono text-slate-300 truncate max-w-[170px]" title={fullUrl}>{displayUrl}</span>
      <div className="flex items-center gap-1 shrink-0 ml-1">
        <button
          onClick={handleCopy}
          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          title="Copy Link"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
        </button>
        <a
          href={fullUrl}
          target="_blank"
          rel="noreferrer"
          className="p-1 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 transition"
          title="Open Portfolio"
        >
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
