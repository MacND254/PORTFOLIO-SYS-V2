import crypto from 'crypto';
import { DateNormalizer } from '../../normalizers/dateNormalizer';
import { Volunteering } from '../../types/schema';

export class VolunteeringExtractor {
  public static extractVolunteering(lines: string[]): Volunteering[] {
    const results: Volunteering[] = [];

    for (const line of lines) {
      const clean = line.replace(/^[-•*]\s*/, '').trim();
      if (!clean || clean.length < 5) continue;

      const rangeMatch = clean.match(/(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+)?(?:19|20)\d{2}\s*(?:-|–|—|to)\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+)?(?:(?:19|20)\d{2}|present|current|now)/i);
      const { startDate, endDate, isCurrent } = DateNormalizer.parseRange(rangeMatch ? rangeMatch[0] : '');

      const cleanWithoutDate = (rangeMatch ? clean.replace(rangeMatch[0], '') : clean).trim();
      const parts = cleanWithoutDate.split(/\s*[|•–—-]\s*/).map((s) => s.trim()).filter(Boolean);

      const role = parts[0] || 'Volunteer';
      const organization = parts.length > 1 ? parts[1] : 'Organization';
      const description = parts.slice(2).join(' ') || null;

      results.push({
        id: crypto.randomUUID(),
        organization,
        role,
        startDate,
        endDate,
        current: isCurrent,
        description,
        cause: null,
      });
    }

    return results;
  }
}
