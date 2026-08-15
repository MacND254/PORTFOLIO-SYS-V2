const RESERVED_SUBDOMAINS = new Set([
  'admin',
  'administrator',
  'api',
  'app',
  'dashboard',
  'login',
  'register',
  'support',
  'help',
  'mail',
  'www',
  'superadmin',
  'system',
  'root',
  'auth',
  'portal',
  'billing',
  'checkout',
  'account',
  'user',
  'public',
  'assets',
  'static',
  'portfolio',
  'cv',
  'myportfolio',
  'subdomain',
  'test',
  'demo'
]);

export function normalizeSubdomain(rawSlug: string): string {
  if (!rawSlug) return '';
  return rawSlug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '') // remove illegal characters
    .replace(/-+/g, '-')       // collapse consecutive hyphens
    .replace(/^-|-$/g, '');     // trim leading/trailing hyphens
}

export function isReservedSubdomain(slug: string): boolean {
  const normalized = normalizeSubdomain(slug);
  return RESERVED_SUBDOMAINS.has(normalized);
}

export function validateSubdomainFormat(slug: string): { isValid: boolean; reason?: string } {
  const normalized = normalizeSubdomain(slug);

  if (!normalized || normalized.length < 3) {
    return { isValid: false, reason: 'Subdomain must be at least 3 characters long.' };
  }

  if (normalized.length > 30) {
    return { isValid: false, reason: 'Subdomain must not exceed 30 characters.' };
  }

  if (isReservedSubdomain(normalized)) {
    return { isValid: false, reason: `Subdomain "${normalized}" is a reserved system name.` };
  }

  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(normalized) && normalized.length > 1) {
    return { isValid: false, reason: 'Subdomain must start and end with an alphanumeric character.' };
  }

  return { isValid: true };
}
