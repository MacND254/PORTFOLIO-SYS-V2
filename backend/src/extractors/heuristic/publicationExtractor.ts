import crypto from 'crypto';
import { DateNormalizer } from '../../normalizers/dateNormalizer';
import { Publication } from '../../types/schema';

export class PublicationExtractor {
  public static extractPublications(lines: string[]): Publication[] {
    const results: Publication[] = [];

    for (const line of lines) {
      const clean = line.replace(/^[-•*]\s*/, '').trim();
      if (!clean || clean.length < 5) continue;

      const dateMatch = clean.match(/(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(?:19|20)\d{2}|(?:19|20)\d{2}/i);
      const publicationDate = DateNormalizer.normalize(dateMatch ? dateMatch[0] : null);

      const urlMatch = clean.match(/https?:\/\/\S+/i);
      const url = urlMatch ? urlMatch[0] : null;

      const parts = clean.replace(url || '', '').split(/\s*[|•–—-]\s*/).map((s) => s.trim()).filter(Boolean);
      const title = parts[0] || clean;
      const publisher = parts.length > 1 ? parts[1] : null;

      results.push({
        id: crypto.randomUUID(),
        title,
        publisher,
        publicationDate,
        url,
        description: parts.slice(2).join(' ') || null,
        authors: [],
      });
    }

    return results;
  }
}
