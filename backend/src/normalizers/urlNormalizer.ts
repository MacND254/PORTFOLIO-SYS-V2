import { SocialProfiles } from '../types/schema';

export class UrlNormalizer {
  /**
   * Cleans and ensures a URL has a valid protocol.
   */
  public static cleanUrl(url?: string | null): string | null {
    if (!url) return null;
    let clean = url.trim();
    if (!clean) return null;

    // Remove leading punctuation or markdown artifacts
    clean = clean.replace(/^[<(\[]+|[>)\].,;]+$/g, '');

    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      if (clean.includes('@') && !clean.startsWith('mailto:')) {
        return null; // Ignore emails masquerading as URLs
      }
      clean = `https://${clean}`;
    }

    try {
      const parsed = new URL(clean);
      return parsed.href;
    } catch {
      return clean;
    }
  }

  /**
   * Normalizes an object or raw URLs into canonical SocialProfiles structure.
   */
  public static normalizeProfiles(profilesInput?: Partial<SocialProfiles> | string[] | null): SocialProfiles {
    const result: SocialProfiles = {
      linkedin: null,
      github: null,
      gitlab: null,
      twitter: null,
      behance: null,
      dribbble: null,
      medium: null,
      stackoverflow: null,
      youtube: null,
      orcid: null,
      website: null,
      other: [],
    };

    if (!profilesInput) return result;

    if (Array.isArray(profilesInput)) {
      for (const rawUrl of profilesInput) {
        this.assignUrlToProfile(rawUrl, result);
      }
      return result;
    }

    // Handle object structure
    for (const [key, value] of Object.entries(profilesInput)) {
      if (!value) continue;

      if (key === 'other' && Array.isArray(value)) {
        result.other = value.map((item) => ({
          platform: item.platform || 'Other',
          url: this.cleanUrl(item.url) || item.url,
        }));
        continue;
      }

      if (typeof value === 'string') {
        const cleaned = this.cleanUrl(value);
        if (!cleaned) continue;

        if (key in result && key !== 'other') {
          (result as any)[key] = cleaned;
        } else {
          this.assignUrlToProfile(cleaned, result);
        }
      }
    }

    return result;
  }

  private static assignUrlToProfile(urlStr: string, profiles: SocialProfiles): void {
    const cleaned = this.cleanUrl(urlStr);
    if (!cleaned) return;

    const lower = cleaned.toLowerCase();
    if (lower.includes('linkedin.com/')) {
      profiles.linkedin = cleaned;
    } else if (lower.includes('github.com/')) {
      profiles.github = cleaned;
    } else if (lower.includes('gitlab.com/')) {
      profiles.gitlab = cleaned;
    } else if (lower.includes('twitter.com/') || lower.includes('x.com/')) {
      profiles.twitter = cleaned;
    } else if (lower.includes('behance.net/')) {
      profiles.behance = cleaned;
    } else if (lower.includes('dribbble.com/')) {
      profiles.dribbble = cleaned;
    } else if (lower.includes('medium.com/')) {
      profiles.medium = cleaned;
    } else if (lower.includes('stackoverflow.com/')) {
      profiles.stackoverflow = cleaned;
    } else if (lower.includes('youtube.com/')) {
      profiles.youtube = cleaned;
    } else if (lower.includes('orcid.org/')) {
      profiles.orcid = cleaned;
    } else if (!profiles.website) {
      profiles.website = cleaned;
    } else {
      if (Array.isArray(profiles.other)) {
        profiles.other.push({ platform: 'Link', url: cleaned });
      }
    }
  }
}
