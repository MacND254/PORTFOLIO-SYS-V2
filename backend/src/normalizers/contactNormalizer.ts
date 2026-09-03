import { EmailContact, EmailType, LocationInfo, PhoneContact, PhoneType } from '../types/schema';

export class ContactNormalizer {
  private static EMAIL_REGEX = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;

  // Phone regex patterns:
  // 1. International: starts with + or 00 followed by country code (1-4 digits) and 7-12 digits
  // 2. Local: starts with 0 followed by area/mobile prefix and remaining digits (minimum 10 total digits)
  private static INTL_PHONE_REGEX = /(?:\+|00)[1-9]\d{0,3}[\s().-]*\d{1,4}[\s().-]*\d{2,4}[\s().-]*\d{2,4}(?:[\s().-]*\d{1,4})?/g;
  private static LOCAL_PHONE_REGEX = /\b0[1-9]\d{1,2}[\s().-]*\d{2,4}[\s().-]*\d{2,4}(?:[\s().-]*\d{1,4})?\b/g;

  // P.O. Box and postal code patterns (e.g., 284-00900, P.O. Box 284-00900, Box 12345 - 00100)
  private static PO_BOX_REGEX = /(?:p\.?\s*o\.?\s*box|post\s*office\s*box|p\s*\.?\s*box|box\s*(?:no\.?|number)?)\s*[:#-]?\s*\d+(?:\s*-\s*\d+)?/i;
  private static BOX_POSTAL_PAIR_REGEX = /\b\d{2,6}\s*-\s*(?:00\d{3}|\d{4,6})\b/;

  /**
   * Checks whether a given string is a P.O. Box, postal code, or postal box pair (e.g., "284-00900").
   */
  public static isPoBoxOrPostalCode(value: string): boolean {
    if (!value || typeof value !== 'string') return false;
    const clean = value.trim();

    // Explicit P.O. Box keywords
    if (this.PO_BOX_REGEX.test(clean)) return true;

    // Pattern like "284-00900" (Box-PostalCode pair)
    if (this.BOX_POSTAL_PAIR_REGEX.test(clean)) return true;

    // Standalone keyword check
    if (/\b(?:postal|p\.?o\.?\s*box|post\s*box|zip\s*code|postal\s*code)\b/i.test(clean)) return true;

    return false;
  }

  /**
   * Validates whether a given string is an authentic telephone number:
   * - Must NOT be a P.O. Box or postal code.
   * - Must NOT be a date range (e.g., "2018-2022" or "19982002").
   * - Must contain at least 10 digits for local numbers starting with 0,
   *   or at least 9 digits for country-code prefixed numbers starting with + or 00.
   */
  public static isValidPhoneNumber(value: string): boolean {
    if (!value || typeof value !== 'string') return false;
    const clean = value.trim();

    // Reject obvious PO Box / postal code strings
    if (this.isPoBoxOrPostalCode(clean)) return false;

    // Reject date ranges and year pairs
    if (/^(?:19|20)\d{2}\s*[-–—]\s*(?:19|20)\d{2}$/.test(clean)) return false;
    if (/^(?:19|20)\d{2}(?:19|20)\d{2}$/.test(clean)) return false;

    const digits = clean.replace(/\D/g, '');

    // International numbers (+ or 00 prefix)
    if (clean.startsWith('+') || clean.startsWith('00')) {
      return digits.length >= 9 && digits.length <= 16;
    }

    // Local numbers (must start with 0 and have at least 10 digits, e.g. 0712345678, 0112345678, 0201234567)
    if (clean.startsWith('0') || digits.startsWith('0')) {
      return digits.length >= 10 && digits.length <= 15;
    }

    // Numbers without + or leading 0: only valid if 10-15 digits
    return digits.length >= 10 && digits.length <= 15;
  }

  /**
   * Normalizes an array of email contacts, deduplicating and assigning primary flags.
   */
  public static normalizeEmails(emails?: Array<Partial<EmailContact> | string> | null): EmailContact[] {
    if (!emails || !Array.isArray(emails)) return [];

    const seen = new Set<string>();
    const result: EmailContact[] = [];

    for (const item of emails) {
      let emailStr = '';
      let type: EmailType = 'PERSONAL';
      let isPrimary = false;

      if (typeof item === 'string') {
        emailStr = item.trim().toLowerCase();
      } else if (item && typeof item === 'object') {
        emailStr = (item.email || '').trim().toLowerCase();
        type = item.type || 'PERSONAL';
        isPrimary = Boolean(item.isPrimary);
      }

      if (!emailStr || !this.EMAIL_REGEX.test(emailStr) || seen.has(emailStr)) {
        continue;
      }

      seen.add(emailStr);

      // Infer type if personal/work
      if (emailStr.includes('work') || emailStr.includes('office') || emailStr.includes('corp')) {
        type = 'WORK';
      } else if (
        emailStr.includes('gmail') ||
        emailStr.includes('yahoo') ||
        emailStr.includes('outlook') ||
        emailStr.includes('icloud') ||
        emailStr.includes('hotmail')
      ) {
        type = 'PERSONAL';
      }

      result.push({
        email: emailStr,
        type,
        isPrimary,
      });
    }

    if (result.length > 0) {
      const hasPrimary = result.some((e) => e.isPrimary);
      if (!hasPrimary) {
        result[0].isPrimary = true;
      }
    }

    return result;
  }

  /**
   * Normalizes phone numbers with clean digits, strict validation (ignoring PO boxes),
   * formatting and type detection.
   */
  public static normalizePhones(phones?: Array<Partial<PhoneContact> | string> | null): PhoneContact[] {
    if (!phones || !Array.isArray(phones)) return [];

    const seen = new Set<string>();
    const result: PhoneContact[] = [];

    for (const item of phones) {
      let rawPhone = '';
      let formatted = '';
      let type: PhoneType = 'MOBILE';
      let isPrimary = false;

      if (typeof item === 'string') {
        rawPhone = item.trim();
      } else if (item && typeof item === 'object') {
        rawPhone = (item.phone || item.formatted || '').trim();
        formatted = (item.formatted || '').trim();
        type = item.type || 'MOBILE';
        isPrimary = Boolean(item.isPrimary);
      }

      // Strictly validate phone candidate
      if (!rawPhone || !this.isValidPhoneNumber(rawPhone)) {
        continue;
      }

      const digits = rawPhone.replace(/\D/g, '');
      if (seen.has(digits)) {
        continue;
      }

      seen.add(digits);

      // Clean formatted phone
      const cleanPhone = rawPhone.startsWith('+') ? `+${digits}` : digits;
      const formattedNumber = formatted || this.formatPhoneNumber(rawPhone, digits);

      result.push({
        phone: cleanPhone,
        formatted: formattedNumber,
        type,
        isPrimary,
      });
    }

    if (result.length > 0) {
      const hasPrimary = result.some((p) => p.isPrimary);
      if (!hasPrimary) {
        result[0].isPrimary = true;
      }
    }

    return result;
  }

  /**
   * Automatically scans document text to recover genuine phone numbers if AI extraction
   * missed them or mistakenly extracted a P.O. Box into the phone field.
   */
  public static recoverPhonesFromText(text: string): PhoneContact[] {
    if (!text || typeof text !== 'string') return [];

    const candidates: string[] = [];

    // 1. Scan international phone patterns
    const intlMatches = text.match(this.INTL_PHONE_REGEX) || [];
    candidates.push(...intlMatches);

    // 2. Scan local phone patterns
    const localMatches = text.match(this.LOCAL_PHONE_REGEX) || [];
    candidates.push(...localMatches);

    return this.normalizePhones(candidates);
  }

  /**
   * Extracts any P.O. Box or postal code from phone candidates or text to enrich location.
   */
  public static extractPoBoxCandidate(candidates: Array<Partial<PhoneContact> | string>): string | null {
    if (!candidates || !Array.isArray(candidates)) return null;

    for (const item of candidates) {
      const raw = typeof item === 'string' ? item : item?.phone || item?.formatted || '';
      if (this.isPoBoxOrPostalCode(raw)) {
        return raw.trim();
      }
    }
    return null;
  }

  /**
   * Normalizes and enriches a location object, recognizing P.O. Box addresses and postal codes.
   */
  public static normalizeLocation(locationInput?: Partial<LocationInfo> | string | null): LocationInfo {
    if (!locationInput) {
      return { raw: '', city: null, state: null, country: null, postalCode: null };
    }

    if (typeof locationInput === 'string') {
      const raw = locationInput.replace(/^(location|address)\s*:\s*/i, '').trim();
      const parsed = this.parseLocationString(raw);
      return {
        raw,
        city: parsed.city,
        state: parsed.state,
        country: parsed.country,
        postalCode: parsed.postalCode,
      };
    }

    const raw = (locationInput.raw || '').replace(/^(location|address)\s*:\s*/i, '').trim();
    const parsed = raw ? this.parseLocationString(raw) : { city: null, state: null, country: null, postalCode: null };

    return {
      raw: raw || locationInput.city || locationInput.country || '',
      city: locationInput.city ?? parsed.city,
      state: locationInput.state ?? parsed.state,
      country: locationInput.country ?? parsed.country,
      postalCode: locationInput.postalCode ?? parsed.postalCode,
    };
  }

  private static formatPhoneNumber(raw: string, digits: string): string {
    if (raw.startsWith('+')) {
      return raw.replace(/\s+/g, ' ');
    }
    if (digits.length === 10) {
      if (digits.startsWith('0')) {
        return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
      }
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return raw;
  }

  private static parseLocationString(raw: string): { city: string | null; state: string | null; country: string | null; postalCode: string | null } {
    if (!raw) return { city: null, state: null, country: null, postalCode: null };

    // Postal code match: US ZIP, Canadian, Kenyan/international Box-Postal code (e.g. 284-00900 -> 00900), or 5-digit code
    let postalCode: string | null = null;

    const boxPostalMatch = raw.match(this.BOX_POSTAL_PAIR_REGEX);
    if (boxPostalMatch) {
      const parts = boxPostalMatch[0].split('-');
      postalCode = (parts[1] || parts[0]).trim();
    } else {
      const standardPostalMatch = raw.match(/\b\d{5}(?:-\d{4})?\b|\b[A-Z]\d[A-Z]\s*\d[A-Z]\d\b|\b00\d{3}\b/i);
      postalCode = standardPostalMatch ? standardPostalMatch[0] : null;
    }

    const parts = raw.split(/[,|•]/).map((p) => p.trim()).filter(Boolean);
    if (parts.length === 1) {
      return { city: parts[0], state: null, country: null, postalCode };
    }
    if (parts.length === 2) {
      return { city: parts[0], state: null, country: parts[1], postalCode };
    }
    return {
      city: parts[0] || null,
      state: parts[1] || null,
      country: parts[2] || null,
      postalCode,
    };
  }
}

