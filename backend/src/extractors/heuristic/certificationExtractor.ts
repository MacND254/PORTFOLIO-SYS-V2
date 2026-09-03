import crypto from 'crypto';
import { DateNormalizer } from '../../normalizers/dateNormalizer';
import { Certification } from '../../types/schema';

export class CertificationExtractor {
  private static readonly KNOWN_ISSUERS = [
    'Amazon Web Services',
    'AWS',
    'Microsoft',
    'Azure',
    'Google Cloud',
    'Google',
    'Cisco',
    'CompTIA',
    'Oracle',
    'IBM',
    'Red Hat',
    'Linux Foundation',
    'Salesforce',
    'HashiCorp',
    'Kubernetes',
    'CNCF',
    'Docker',
    'Coursera',
    'Udemy',
    'edX',
    'LinkedIn Learning',
    'Pluralsight',
    'Udacity',
    'freeCodeCamp',
    'Codecademy',
    'ALX',
    'Moringa School',
    'DataCamp',
    'Project Management Institute',
    'PMI',
    'Scrum Alliance',
    'Scrum.org',
    'IIBA',
    'ISACA',
    '(ISC)²',
    'KASNEB',
    'ACCA',
    'IEEE',
    'British Council',
    'Harvard',
    'Stanford',
    'MIT',
  ];

  public static extractCertifications(lines: string[], fullText?: string): Certification[] {
    const results: Certification[] = [];
    const seenNames = new Set<string>();

    const entries = this.groupEntries(lines);

    // If section lines are empty or sparse, scan full text for standalone cert bullet points
    if (entries.length === 0 && fullText) {
      const candidateLines = fullText
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => /\b(certified|certification|certificate of|credential|accredited|license|bootcamp|coursera|udemy|aws certified|cisco certified)\b/i.test(l));
      if (candidateLines.length > 0) {
        entries.push(...candidateLines.map((l) => [l]));
      }
    }

    for (const entry of entries) {
      const text = entry.join(' ').replace(/\s+/g, ' ').trim();
      if (!text || text.length < 3) continue;

      // Skip entries that are pure university degrees with no certification context
      if (/^\s*(?:bachelor of|master of|ph\.?d\b|b\.?sc\b|m\.?sc\b|doctor of)\b/i.test(text) &&
          !/\b(certif|credential|license|course|bootcamp|training|accredit)\b/i.test(text)) {
        continue;
      }

      // Split text by common separators
      const parts = text.split(/\s*[|•–—]\s*/).map((s) => s.trim()).filter(Boolean);
      const nameCandidate = (parts[0] || '').replace(/^[-•*#\d.]+\s*/, '').trim();

      if (!nameCandidate || nameCandidate.length < 3 || nameCandidate.length > 150) {
        continue;
      }

      // Check for certificate indicators
      const isCertLike =
        /\b(certif|license|credential|aws|microsoft|azure|cisco|comptia|pmp|scrum|google|oracle|coursera|udemy|edx|csm|cka|security\+|network\+|accreditation|specialization|training|bootcamp|fellowship|diploma|associate|professional|expert|practitioner|engineer|developer|foundation|badge)\b/i.test(text) ||
        (entry.length === 1 && nameCandidate.length >= 5 && nameCandidate.length <= 90);

      if (!isCertLike) {
        continue;
      }

      // Deduplicate by normalized name
      const normKey = nameCandidate.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (seenNames.has(normKey)) {
        continue;
      }
      seenNames.add(normKey);

      // Extract Issuer
      let issuer = 'Not specified';
      const matchedKnown = this.KNOWN_ISSUERS.find((k) => new RegExp(`\\b${k.replace(/[()]/g, '\\$&')}\\b`, 'i').test(text));
      if (matchedKnown) {
        issuer = matchedKnown;
      } else {
        const issuerMatch = text.match(/(?:issued by|provided by|provider|issuer|organization|by|at|from)\s*[:=]?\s*([A-Za-z0-9&.\s'-]+?)(?:,|\.|\(|\d{4}|$)/i);
        if (issuerMatch && issuerMatch[1]?.trim()) {
          issuer = issuerMatch[1].trim();
        } else if (parts.length > 1 && !/(?:19|20)\d{2}/.test(parts[1])) {
          issuer = parts[1].replace(/^(issued by|provided by)\s*/i, '').trim();
        } else {
          const institutionalMatch = entry.slice(1).find((l) => /academy|institute|university|college|foundation|school|board|council/i.test(l));
          if (institutionalMatch) {
            issuer = institutionalMatch.trim();
          }
        }
      }

      // Extract Issue Date
      const dateMatches = text.match(/(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(?:19|20)\d{2}|(?:19|20)\d{2}/gi);
      const issueDate = DateNormalizer.normalize(dateMatches && dateMatches[0] ? dateMatches[0] : null);

      // Extract Expiry Date
      const expiryDateMatch = text.match(/(?:expires|expiry|valid (?:through|until|thru))\s*[:=]?\s*([A-Za-z0-9\s,]+?(?:19|20)\d{2})/i);
      const expiryDate = DateNormalizer.normalize(expiryDateMatch ? expiryDateMatch[1].trim() : (dateMatches && dateMatches.length > 1 ? dateMatches[1] : null));

      // Extract Credential ID
      const credIdMatch = text.match(/\b(?:credential ID|id|license no|license #|cert no|cert #|verification|reg no|badge ID)\s*[:=]?\s*([A-Za-z0-9-_]+)\b/i);
      const credentialId = credIdMatch ? credIdMatch[1] : null;

      // Extract Credential URL
      const urlMatch = text.match(/https?:\/\/[^\s),;]+/i);
      const credentialUrl = urlMatch ? urlMatch[0].replace(/[),;.]+$/, '') : null;

      results.push({
        id: crypto.randomUUID(),
        name: nameCandidate,
        issuer: (issuer || 'Not specified').replace(/^(issued|provided) by\s*:?\s*/i, '').trim(),
        issueDate,
        expiryDate,
        credentialId,
        credentialUrl,
        doesNotExpire: /does not expire|never expires|no expiration/i.test(text),
      });
    }

    return results;
  }

  private static groupEntries(lines: string[]): string[][] {
    const groups: string[][] = [];
    let current: string[] = [];

    for (const line of lines) {
      const isHeading = !/^[-•*]/.test(line) && (/(?:19|20)\d{2}/.test(line) || current.length > 2);
      if (isHeading && current.length) {
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
