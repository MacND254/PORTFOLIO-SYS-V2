import crypto from 'crypto';
import { DateNormalizer } from '../../normalizers/dateNormalizer';
import { Award } from '../../types/schema';

export class AwardExtractor {
  public static extractAwards(lines: string[]): Award[] {
    const results: Award[] = [];

    for (const line of lines) {
      const clean = line.replace(/^[-•*]\s*/, '').trim();
      if (!clean || clean.length < 3) continue;

      const dateMatch = clean.match(/(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(?:19|20)\d{2}|(?:19|20)\d{2}/i);
      const date = DateNormalizer.normalize(dateMatch ? dateMatch[0] : null);

      const parts = clean.split(/\s*[|•–—-]\s*/).map((s) => s.trim()).filter(Boolean);
      const title = parts[0] || clean;
      const issuer = parts.length > 1 ? parts[1] : null;

      results.push({
        id: crypto.randomUUID(),
        title,
        issuer,
        date,
        description: parts.slice(2).join(' ') || null,
      });
    }

    return results;
  }
}
