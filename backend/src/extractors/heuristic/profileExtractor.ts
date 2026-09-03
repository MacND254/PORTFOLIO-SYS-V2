import { UrlNormalizer } from '../../normalizers/urlNormalizer';
import { SocialProfiles } from '../../types/schema';

export class ProfileExtractor {
  private static URL_REGEX = /(?:https?:\/\/)?(?:www\.)?[\w.-]+\.(?:com|io|dev|org|net|me|ai|app|co)(?:\/[^\s|)<>"]*)?/gi;

  public static extractProfiles(allText: string): SocialProfiles {
    const rawUrls = Array.from(allText.matchAll(this.URL_REGEX)).map((m) => m[0]);
    return UrlNormalizer.normalizeProfiles(rawUrls);
  }
}
