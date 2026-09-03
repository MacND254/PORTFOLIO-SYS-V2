import { StructuredDate } from '../types/schema';

export class DateNormalizer {
  private static MONTHS: Record<string, number> = {
    jan: 1, january: 1,
    feb: 2, february: 2,
    mar: 3, march: 3,
    apr: 4, april: 4,
    may: 5,
    jun: 6, june: 6,
    jul: 7, july: 7,
    aug: 8, august: 8,
    sep: 9, sept: 9, september: 9,
    oct: 10, october: 10,
    nov: 11, november: 11,
    dec: 12, december: 12,
  };

  /**
   * Parses any raw date representation into a standardized StructuredDate.
   */
  public static normalize(dateInput?: string | StructuredDate | null): StructuredDate | null {
    if (!dateInput) return null;

    if (typeof dateInput === 'object' && dateInput !== null) {
      if ('raw' in dateInput) {
        const raw = (dateInput.raw || '').trim();
        const isCurrent = Boolean(dateInput.isCurrent || /present|current|now|ongoing/i.test(raw));
        return {
          raw,
          year: typeof dateInput.year === 'number' ? dateInput.year : this.extractYear(raw),
          month: typeof dateInput.month === 'number' ? dateInput.month : this.extractMonth(raw),
          isCurrent,
        };
      }
      return null;
    }

    const raw = String(dateInput).trim();
    if (!raw) return null;

    const isCurrent = /^(present|current|now|ongoing|today)$/i.test(raw) || /present|current|ongoing/i.test(raw);
    const year = this.extractYear(raw);
    const month = this.extractMonth(raw);

    return {
      raw,
      year,
      month,
      isCurrent,
    };
  }

  /**
   * Parses a date range like "Jan 2020 - Present" into start and end StructuredDate objects.
   */
  public static parseRange(rangeText: string): { startDate: StructuredDate | null; endDate: StructuredDate | null; isCurrent: boolean } {
    if (!rangeText) {
      return { startDate: null, endDate: null, isCurrent: false };
    }

    const clean = rangeText.trim();
    const parts = clean.split(/\s*(?:–|—|-|\bto\b)\s*/i);

    if (parts.length === 1) {
      const date = this.normalize(parts[0]);
      return {
        startDate: date,
        endDate: null,
        isCurrent: Boolean(date?.isCurrent),
      };
    }

    const startDate = this.normalize(parts[0]);
    const endDate = this.normalize(parts[1]);
    const isCurrent = Boolean(startDate?.isCurrent || endDate?.isCurrent || /present|current|ongoing/i.test(parts[1]));

    return {
      startDate,
      endDate: isCurrent ? null : endDate,
      isCurrent,
    };
  }

  private static extractYear(text: string): number | null {
    const match = text.match(/\b(19\d{2}|20\d{2})\b/);
    return match ? parseInt(match[1], 10) : null;
  }

  private static extractMonth(text: string): number | null {
    const lower = text.toLowerCase();
    for (const [name, num] of Object.entries(this.MONTHS)) {
      const regex = new RegExp(`\\b${name}\\b`, 'i');
      if (regex.test(lower)) return num;
    }

    // Check numeric MM/YYYY or YYYY-MM
    const slashMatch = text.match(/\b(0?[1-9]|1[0-2])\s*[/-]\s*(?:19|20)\d{2}\b/);
    if (slashMatch) return parseInt(slashMatch[1], 10);

    const isoMatch = text.match(/\b(?:19|20)\d{2}\s*[/-]\s*(0?[1-9]|1[0-2])\b/);
    if (isoMatch) return parseInt(isoMatch[1], 10);

    return null;
  }
}
