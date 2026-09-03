import crypto from 'crypto';
import { DateNormalizer } from '../../normalizers/dateNormalizer';
import { Project } from '../../types/schema';

export class ProjectExtractor {
  private static TECH_TERMS = /\b(javascript|typescript|python|java|react|node|aws|docker|sql|graphql|angular|vue|c#|go|rust|mongodb|kubernetes|next\.js|tailwind|express|django|flask|fastapi)\b/i;

  public static extractProjects(lines: string[]): Project[] {
    const entries = this.groupEntries(lines);
    const results: Project[] = [];

    for (const group of entries) {
      const text = group.join(' ');
      const title = group[0]?.replace(/^[-•*]\s*/, '').trim() || '';
      if (!title) continue;

      const urlMatch = text.match(/https?:\/\/[^\s|)]+/i);
      const url = urlMatch ? urlMatch[0] : null;
      const isGitHub = url ? /github\.com/i.test(url) : false;

      const rangeMatch = text.match(/(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+)?(?:19|20)\d{2}\s*(?:-|–|—|to)\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+)?(?:(?:19|20)\d{2}|present|current|now)/i);
      const { startDate, endDate, isCurrent } = DateNormalizer.parseRange(rangeMatch ? rangeMatch[0] : '');

      const bodyLines = group.slice(1);
      const highlights = bodyLines.filter((l) => /^[-•*]/.test(l)).map((l) => l.replace(/^[-•*]\s*/, '').trim());
      const description = bodyLines.join(' ').trim() || title;

      const techSet = new Set<string>();
      for (const line of group) {
        const matches = Array.from(line.matchAll(new RegExp(this.TECH_TERMS.source, 'gi'))).map((m) => m[0]);
        for (const t of matches) {
          techSet.add(t);
        }
      }

      results.push({
        id: crypto.randomUUID(),
        name: title.split(/\s*[-|–—]\s*/)[0].trim(),
        role: null,
        startDate,
        endDate,
        current: isCurrent,
        description,
        highlights,
        technologies: Array.from(techSet),
        url: !isGitHub ? url : null,
        repositoryUrl: isGitHub ? url : null,
      });
    }

    return results;
  }

  private static groupEntries(lines: string[]): string[][] {
    const groups: string[][] = [];
    let current: string[] = [];

    for (const line of lines) {
      const isHeading = !/^[-•*]/.test(line) && (line.length < 50 || current.length > 2);
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
