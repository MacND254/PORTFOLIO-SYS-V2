import React, { useState } from 'react';
import { ExternalLink, Copy, Check, Globe } from 'lucide-react';

interface SubdomainUrlBadgeProps {
  subdomain: string;
}

export const SubdomainUrlBadge: React.FC<SubdomainUrlBadgeProps> = ({ subdomain }) => {
  const [copied, setCopied] = useState(false);
  const domain = 'myportfolio.com';
  const fullUrl = `http://${subdomain}.${domain}:5000`; // Dev URL or production domain

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2 p-2 px-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
      <Globe className="w-4 h-4 text-indigo-400 shrink-0" />
      <span className="font-mono text-slate-300 truncate max-w-[180px]">{subdomain}.{domain}</span>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={handleCopy}
          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          title="Copy Link"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
        <a
          href={`/p/${subdomain}`}
          target="_blank"
          rel="noreferrer"
          className="p-1 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 transition"
          title="Open Portfolio"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
