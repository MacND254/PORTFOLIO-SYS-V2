import crypto from 'crypto';
import { Reference } from '../../types/schema';
import { ContactNormalizer } from '../../normalizers/contactNormalizer';

export class ReferenceExtractor {
  private static EMAIL_REGEX = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;

  public static extractReferences(lines: string[]): Reference[] {
    const results: Reference[] = [];
    const fullText = lines.join(' ');

    if (/available (upon|on) request|furnished upon request|references upon request/i.test(fullText)) {
      results.push({
        id: crypto.randomUUID(),
        name: 'Available Upon Request',
        title: null,
        company: null,
        email: null,
        phone: null,
        relationship: null,
        isAvailableUponRequest: true,
      });
      return results;
    }

    const groups = this.groupEntries(lines);
    for (const group of groups) {
      if (!group || group.length === 0) continue;
      const text = group.join(' ');
      const emailMatch = text.match(this.EMAIL_REGEX);

      // Extract valid phone using ContactNormalizer (guarantees no PO box confusion)
      const phoneCandidates = ContactNormalizer.recoverPhonesFromText(text);
      const phone = phoneCandidates.length > 0 ? phoneCandidates[0].formatted || phoneCandidates[0].phone : null;

      const firstLine = (group[0] || '').replace(/^[-•*]\s*/, '').trim();
      // Skip if first line is a section title or too long
      if (!firstLine || firstLine.length < 2 || firstLine.length > 60 || /references|referees/i.test(firstLine)) {
        continue;
      }

      // Check if first line contains name + position e.g. "Dr. John Doe - Senior Lecturer, UoN"
      const nameParts = firstLine.split(/\s*[-–|]\s*/);
      const name = nameParts[0].trim();
      let title: string | null = nameParts.length > 1 ? nameParts[1].trim() : null;
      let company: string | null = null;
      let relationship: string | null = null;

      // Scan remaining lines in group
      for (let i = 1; i < group.length; i++) {
        const line = group[i].replace(/^[-•*]\s*/, '').trim();
        if (!line) continue;

        // Relationship
        const relMatch = line.match(/(?:relationship|relation)\s*[:=]?\s*([^,;]+)/i);
        if (relMatch) {
          relationship = relMatch[1].trim();
          continue;
        }

        // Email or phone line?
        if (this.EMAIL_REGEX.test(line) || /^(tel|phone|mobile|cell|call)\b/i.test(line)) {
          continue;
        }

        // Title and Company
        if (!title) {
          if (/\bat\b|\bof\b|,/i.test(line)) {
            const splitParts = line.split(/\s*(?:\bat\b|,)\s*/i);
            title = splitParts[0].trim();
            company = splitParts.slice(1).join(', ').trim() || null;
          } else {
            title = line;
          }
        } else if (!company) {
          company = line.replace(/^(company|organization|institution)\s*[:=]?\s*/i, '').trim();
        }
      }

      results.push({
        id: crypto.randomUUID(),
        name,
        title,
        company,
        email: emailMatch ? emailMatch[0] : null,
        phone,
        relationship,
        isAvailableUponRequest: false,
      });
    }

    return results;
  }

  private static groupEntries(lines: string[]): string[][] {
    const groups: string[][] = [];
    let current: string[] = [];

    for (const line of lines) {
      const isNew = !/^[-•*]/.test(line) && current.length >= 2;
      if (isNew && current.length) {
        groups.push(current);
        current = [line];
      } else {
        current.push(line);
      }
    }
    if (current.length) groups.push(current);
    return groups;
  }
}
