import crypto from 'crypto';
import { DateNormalizer } from '../../normalizers/dateNormalizer';
import { Education } from '../../types/schema';

export class EducationExtractor {
  private static DEGREE_PATTERN = /\b(bachelor|master|ph\.?d|doctorate|diploma|certificate|associate|b\.sc|b\.a|b\.eng|m\.sc|m\.a|mba|btech|mtech|bba)\b/i;
  private static INSTITUTION_PATTERN = /\b(university|college|institute|school|polytechnic|academy|faculty|campus)\b/i;

  public static extractEducation(lines: string[]): Education[] {
    const records: Education[] = [];

    for (let index = 0; index < lines.length; index++) {
      const currentLine = lines[index];
      if (!this.DEGREE_PATTERN.test(currentLine) && !this.INSTITUTION_PATTERN.test(currentLine)) {
        continue;
      }

      const context = lines.slice(Math.max(0, index - 1), Math.min(lines.length, index + 4));
      const joined = context.join(' ');

      const rangeMatch = joined.match(/(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+)?(?:19|20)\d{2}\s*(?:-|–|—|to)\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+)?(?:(?:19|20)\d{2}|present|current|graduated)/i) ||
                         joined.match(/\b(?:19|20)\d{2}\b/);
      const rangeStr = rangeMatch ? rangeMatch[0] : '';

      const institution = context.find((l) => this.INSTITUTION_PATTERN.test(l)) || 'Institution';
      const degreeLine = context.find((l) => this.DEGREE_PATTERN.test(l)) || currentLine;

      const degreeClean = degreeLine.replace(rangeStr, '').replace(institution, '').replace(/\s*[|•]\s*$/, '').trim();
      const institutionClean = institution.replace(rangeStr, '').replace(/\s*[|•]\s*$/, '').trim();

      const fieldMatch = degreeClean.match(/\b(?:in|of)\s+([A-Za-z\s&,]+)/i);
      const fieldOfStudy = fieldMatch ? fieldMatch[1].trim() : null;

      const gpaMatch = joined.match(/\b(?:gpa|grade|score)\s*[:=]?\s*([0-4](?:\.\d{1,2})?|\d{1,3}%|[A-F][+-]?)\b/i);
      const gpa = gpaMatch ? gpaMatch[1] : null;

      const honors: string[] = [];
      if (/cum laude|magna cum laude|summa cum laude|first class|distinction|dean's list/i.test(joined)) {
        const hMatch = joined.match(/(cum laude|magna cum laude|summa cum laude|first class honors?|distinction|dean's list)/i);
        if (hMatch) honors.push(hMatch[0]);
      }

      const { startDate, endDate } = DateNormalizer.parseRange(rangeStr);

      records.push({
        id: crypto.randomUUID(),
        institution: institutionClean || 'University / College',
        degree: degreeClean || 'Degree / Diploma',
        fieldOfStudy,
        startDate,
        endDate,
        honors,
        gpa,
        grade: gpa,
        activities: [],
      });

      index += Math.min(2, context.length - 1);
    }

    return records;
  }
}
