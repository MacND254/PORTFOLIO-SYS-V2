import crypto from 'crypto';
import { LanguageItem, LanguageProficiency } from '../../types/schema';

export class LanguageExtractor {
  private static KNOWN_LANGUAGES = new Set([
    'english', 'spanish', 'french', 'german', 'mandarin', 'chinese', 'japanese', 'arabic',
    'russian', 'portuguese', 'italian', 'hindi', 'swahili', 'kiswahili', 'korean', 'dutch',
    'polish', 'turkish', 'vietnamese', 'thai', 'greek', 'hebrew', 'swedish', 'norwegian',
    'danish', 'finnish', 'czech', 'hungarian', 'ukrainian', 'somali', 'kikuyu', 'luo', 'kalenjin', 'luhya',
    'amharic', 'yoruba', 'igbo', 'hausa', 'zulu', 'afrikaans', 'tagalog', 'urdu', 'bengali', 'persian', 'farsi',
    'romanian', 'cantonese', 'latin', 'gujarati', 'punjabi', 'tamil', 'telugu', 'indonesian', 'malay'
  ]);

  private static LANGUAGE_ALIASES: Record<string, string> = {
    kiswahili: 'Swahili',
    mandarin: 'Chinese (Mandarin)',
    cantonese: 'Chinese (Cantonese)',
    farsi: 'Persian',
  };

  public static extractLanguages(lines: string[]): LanguageItem[] {
    const candidates = lines.flatMap((line) => line.split(/[,|•;/\n]/)).map((v) => v.replace(/^[-•*]\s*/, '').trim());
    const seen = new Set<string>();
    const results: LanguageItem[] = [];

    for (const candidate of candidates) {
      if (!candidate) continue;

      // Check each word or 2-word phrase against known languages
      for (const known of this.KNOWN_LANGUAGES) {
        const regex = new RegExp(`\\b${known}\\b`, 'i');
        if (regex.test(candidate) && !seen.has(known)) {
          seen.add(known);

          const standardName = this.LANGUAGE_ALIASES[known] ||
            (known.charAt(0).toUpperCase() + known.slice(1).toLowerCase());

          // Match proficiency
          const textLower = candidate.toLowerCase();
          let proficiency: LanguageProficiency = 'PROFESSIONAL';

          if (/\b(native|mother tongue|first language|bilingual)\b/i.test(textLower)) {
            proficiency = 'NATIVE';
          } else if (/\b(fluent|full professional|c2|c1)\b/i.test(textLower)) {
            proficiency = 'FLUENT';
          } else if (/\b(intermediate|conversational|working proficiency|b2|b1)\b/i.test(textLower)) {
            proficiency = 'INTERMEDIATE';
          } else if (/\b(basic|elementary|beginner|a2|a1|limited)\b/i.test(textLower)) {
            proficiency = 'BASIC';
          } else if (/\b(professional|advanced)\b/i.test(textLower)) {
            proficiency = 'PROFESSIONAL';
          }

          results.push({
            id: crypto.randomUUID(),
            language: standardName,
            proficiency,
          });
          break;
        }
      }
    }

    return results;
  }
}
