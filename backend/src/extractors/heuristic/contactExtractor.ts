import { ContactNormalizer } from '../../normalizers/contactNormalizer';
import { EmailContact, LocationInfo, PhoneContact } from '../../types/schema';

export class ContactExtractor {
  private static EMAIL_REGEX = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;

  public static extractContacts(
    allText: string,
    headerLines: string[],
    locationFallback: LocationInfo
  ): {
    emails: EmailContact[];
    phones: PhoneContact[];
    location: LocationInfo;
  } {
    // Extract emails
    const rawEmails = Array.from(allText.matchAll(this.EMAIL_REGEX)).map((m) => m[0]);
    const emails = ContactNormalizer.normalizeEmails(rawEmails);

    // Extract phones using robust normalizer and recovery (strictly ignoring PO boxes)
    const headerText = headerLines.join('\n');
    let phones = ContactNormalizer.recoverPhonesFromText(headerText);
    if (phones.length === 0) {
      phones = ContactNormalizer.recoverPhonesFromText(allText);
    }

    // Check if header contained a P.O. Box to enrich location
    const poBox = ContactNormalizer.extractPoBoxCandidate(headerLines);
    let location = locationFallback;
    if (poBox && !location.raw?.includes(poBox)) {
      location = ContactNormalizer.normalizeLocation(
        location.raw ? `${poBox}, ${location.raw}` : poBox
      );
    }

    return {
      emails,
      phones,
      location,
    };
  }
}

