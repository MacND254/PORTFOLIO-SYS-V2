import crypto from 'crypto';
import { DateNormalizer } from '../../normalizers/dateNormalizer';
import { WorkExperience } from '../../types/schema';

export class ExperienceExtractor {
  private static TITLE_TERMS = /\b(engineer|developer|designer|manager|analyst|consultant|specialist|director|architect|accountant|officer|technician|administrator|coordinator|supervisor|researcher|lecturer|teacher|nurse|electrician|intern|lead|head|vp|president|officer)\b/i;
  private static COMPANY_TERMS = /\b(ltd|limited|inc|llc|plc|company|corp|corporation|group|solutions|technologies|tech|studio|agency|services|hospital|bank|agency|ministry|school|college|institute|university|co)\b/i;
  private static TECH_TERMS = /\b(javascript|typescript|python|java|react|node|aws|docker|sql|graphql|angular|vue|c#|go|rust|mongodb|kubernetes)\b/i;

  public static extractExperience(lines: string[]): WorkExperience[] {
    const groups = this.groupExperienceEntries(lines);
    const results: WorkExperience[] = [];

    for (const group of groups) {
      const parsed = this.buildExperience(group);
      if (parsed) {
        results.push(parsed);
      }
    }

    return results;
  }

  private static groupExperienceEntries(lines: string[]): string[][] {
    const groups: string[][] = [];
    let current: string[] = [];

    for (const line of lines) {
      const hasDate = /(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+)?(?:19|20)\d{2}\s*(?:-|–|—|to)\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+)?(?:(?:19|20)\d{2}|present|current|now)/i.test(line);
      const currentHasDate = current.some((item) => /(?:19|20)\d{2}\s*(?:-|–|—|to)/i.test(item));

      if (currentHasDate && (hasDate || (!/^[-•*]/.test(line) && this.TITLE_TERMS.test(line)))) {
        groups.push(current);
        current = [];
      }
      current.push(line);
    }
    if (current.length) groups.push(current);
    return groups;
  }

  private static buildExperience(group: string[]): WorkExperience | null {
    const joined = group.join(' ');
    const rangeMatch = joined.match(/(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+)?(?:19|20)\d{2}\s*(?:-|–|—|to)\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+)?(?:(?:19|20)\d{2}|present|current|now)/i);
    const rangeStr = rangeMatch ? rangeMatch[0] : '';

    const compact = group.map((l) => (rangeStr ? l.replace(rangeStr, '') : l).trim()).filter(Boolean);
    const pipeParts = compact.flatMap((line) => line.split(/\s*[|•]\s*/).map((p) => p.trim()).filter(Boolean));

    const jobTitle = pipeParts.find((p) => this.TITLE_TERMS.test(p)) || compact.find((l) => this.TITLE_TERMS.test(l)) || pipeParts[0] || '';
    const company = pipeParts.find((p) => p !== jobTitle && this.COMPANY_TERMS.test(p)) || compact.find((l) => l !== jobTitle && this.COMPANY_TERMS.test(l)) || (pipeParts[1] !== jobTitle ? pipeParts[1] : '') || 'Organization';

    if (!jobTitle) return null;

    const { startDate, endDate, isCurrent } = DateNormalizer.parseRange(rangeStr);

    const bodyLines = compact.filter((l) => !l.includes(jobTitle) && !l.includes(company));
    const responsibilities = bodyLines.filter((l) => /^[-•*]/.test(l)).map((l) => l.replace(/^[-•*]\s*/, '').trim());
    if (responsibilities.length === 0 && bodyLines.length > 0) {
      responsibilities.push(...bodyLines);
    }

    const achievements = responsibilities.filter((l) => /\b(increased|reduced|improved|delivered|saved|grew|awarded|optimized|spearheaded|scaled)\b/i.test(l));

    // Extract technologies mentioned in bullets
    const techSet = new Set<string>();
    for (const line of bodyLines) {
      const matches = Array.from(line.matchAll(new RegExp(this.TECH_TERMS.source, 'gi'))).map((m) => m[0]);
      for (const t of matches) {
        techSet.add(t);
      }
    }

    return {
      id: crypto.randomUUID(),
      company: company || 'Company',
      jobTitle,
      location: null,
      startDate: startDate || { raw: rangeStr ? rangeStr.split(/[-–—to]/i)[0]?.trim() || '' : '' },
      endDate: endDate || null,
      current: isCurrent,
      responsibilities,
      achievements,
      technologies: Array.from(techSet),
    };
  }
}
