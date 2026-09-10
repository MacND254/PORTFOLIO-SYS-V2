/**
 * Subdomain and Public Portfolio URL Helpers
 * Supports RFC 6761 localhost subdomains (e.g. francis.localhost:5173) in local dev
 * and production custom/wildcard domains (e.g. francis.myportfolio.com).
 */

export function isLocalEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host === '127.0.0.1' ||
    /^(127\.|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(host)
  );
}

function getPlatformDomain(): string | null {
  const domain = import.meta.env.VITE_PLATFORM_DOMAIN?.trim().toLowerCase();
  return domain || null;
}

export function getPublicPortfolioUrl(subdomain: string): string {
  if (!subdomain) return '/';
  if (typeof window === 'undefined') return `/p/${subdomain}`;

  if (isLocalEnvironment()) {
    const port = window.location.port ? `:${window.location.port}` : '';
    return `${window.location.protocol}//${subdomain}.localhost${port}`;
  }

  // A custom domain is required for production tenant subdomains.
  const domain = getPlatformDomain();
  if (!domain) return `/p/${subdomain}`;
  return `https://${subdomain}.${domain}`;
}

export function getPublicPortfolioDisplay(subdomain: string): string {
  if (!subdomain) return '';
  if (isLocalEnvironment()) {
    return `${subdomain}.localhost`;
  }
  const domain = getPlatformDomain();
  return domain ? `${subdomain}.${domain}` : subdomain;
}

export function extractSubdomainFromHostname(hostname: string): string | null {
  if (!hostname) return null;
  const host = hostname.toLowerCase().split(':')[0]; // strip port

  // 1. *.localhost (e.g. francis.localhost)
  if (host.endsWith('.localhost')) {
    const parts = host.split('.');
    if (parts.length >= 2 && parts[0] && parts[0] !== 'localhost' && parts[0] !== 'www') {
      return parts[0];
    }
  }

  // 2. Production wildcard subdomains (e.g. francis.myportfolio.com).
  // Never infer a tenant from an arbitrary host: Railway's generated domain is
  // also multi-part and would otherwise be treated as a portfolio slug.
  const platformDomain = getPlatformDomain();
  if (!platformDomain || !host.endsWith(`.${platformDomain}`)) return null;

  const sub = host.slice(0, -(platformDomain.length + 1));
  const reserved = ['www', 'api', 'admin', 'app', 'mail', 'superadmin'];
  if (sub && !sub.includes('.') && !reserved.includes(sub) && isNaN(Number(sub))) {
    return sub;
  }

  return null;
}
