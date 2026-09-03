import { ContactNormalizer } from '../../normalizers/contactNormalizer';
import { LocationInfo } from '../../types/schema';

export class IdentityExtractor {
  private static TITLE_TERMS = /\b(engineer|developer|designer|manager|analyst|consultant|specialist|director|architect|accountant|officer|technician|administrator|coordinator|supervisor|researcher|lecturer|teacher|nurse|electrician|intern|student|executive|lead|scientist|specialist|strategist|writer|editor|producer|founder|ceo|cto|cfo|coo)\b/i;

  public static extractIdentity(
    headerLines: string[],
    allLines: string[],
    summaryLines: string[]
  ): {
    fullName: string;
    title: string;
    headline: string;
    summary: string;
    location: LocationInfo;
  } {
    const fullName = this.extractFullName(headerLines);
    const title = this.extractTitle(headerLines, fullName);
    const location = this.extractLocation(headerLines);
    const summary = summaryLines.join(' ').trim();

    return {
      fullName,
      title,
      headline: title,
      summary,
      location,
    };
  }

  private static extractFullName(headerLines: string[]): string {
    for (const line of headerLines.slice(0, 5)) {
      const clean = line.replace(/^(name|curriculum vitae|resume)\s*:\s*/i, '').trim();
      const words = clean.split(/\s+/);
      if (
        words.length >= 2 &&
        words.length <= 4 &&
        /^[A-Za-zÀ-ÿ' -]+$/.test(clean) &&
        !/resume|curriculum|profile|summary|experience|contact|email|phone|street|road|avenue/i.test(clean) &&
        !this.TITLE_TERMS.test(clean)
      ) {
        return clean;
      }
    }
    return headerLines[0] || '';
  }

  private static extractTitle(headerLines: string[], name: string): string {
    const labelled = headerLines.find((line) => /^(title|role|position|profession|headline)\s*:/i.test(line));
    if (labelled) {
      return labelled.replace(/^(title|role|position|profession|headline)\s*:\s*/i, '').split(/\s+[|•]\s+/)[0].trim();
    }

    const candidate = headerLines.find(
      (line) => line !== name && this.TITLE_TERMS.test(line) && !/@|https?:|\b(?:19|20)\d{2}\b/.test(line)
    );
    return (candidate || '').split(/\s+[|•]\s+/)[0].trim();
  }

  private static extractLocation(headerLines: string[]): LocationInfo {
    const locationLine = headerLines.find(
      (line) =>
        (/\b(nairobi|kenya|uganda|tanzania|london|new york|california|toronto|berlin|remote|city|location|address|street|road|avenue|box|postal)\b/i.test(line) ||
          ContactNormalizer.isPoBoxOrPostalCode(line)) &&
        !/@/.test(line)
    );
    return ContactNormalizer.normalizeLocation(locationLine || '');
  }
}
