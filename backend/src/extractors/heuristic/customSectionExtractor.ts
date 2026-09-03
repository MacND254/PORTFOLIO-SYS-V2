import { CustomSection } from '../../types/schema';

export class CustomSectionExtractor {
  public static extractCustomSections(
    sections: Record<string, string[]>,
    knownSectionKeys: Set<string>
  ): CustomSection[] {
    const results: CustomSection[] = [];

    for (const [key, lines] of Object.entries(sections)) {
      if (knownSectionKeys.has(key.toLowerCase()) || lines.length === 0) {
        continue;
      }

      const items = lines.filter((l) => /^[-•*]/.test(l)).map((l) => l.replace(/^[-•*]\s*/, '').trim());
      const content = lines.join('\n').trim();

      results.push({
        sectionName: this.formatSectionName(key),
        items: items.length > 0 ? items : undefined,
        content: content || undefined,
      });
    }

    return results;
  }

  private static formatSectionName(name: string): string {
    return name
      .replace(/[_-]/g, ' ')
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
}
