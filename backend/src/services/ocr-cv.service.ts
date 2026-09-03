import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { DocumentParser } from '../utils/documentParser.util';
import { ScanEngine } from './scanEngine';
import { StructuredResume } from '../types/schema';
import { ContactNormalizer } from '../normalizers/contactNormalizer';

const execFileAsync = promisify(execFile);

interface LayoutLine { text: string; x: number; y: number; width: number; page: number; }

/** The persisted shape consumed by Portfolio's existing review and import flow. */
export interface ExtractedCvData {
  personalInfo: {
    fullName: string;
    title: string;
    email: string;
    phone: string;
    location: string;
    address?: string;
    website?: string;
    linkedin?: string;
    github?: string;
    twitter?: string;
    behance?: string;
    dribbble?: string;
    facebook?: string;
    instagram?: string;
  };
  headline: string;
  summary: string;
  experiences: Array<{ company: string; position: string; location?: string; startDate: string; endDate?: string; isCurrent?: boolean; description: string; responsibilities?: string[]; achievements?: string[] }>;
  education: Array<{ institution: string; qualification: string; field?: string; startDate: string; endDate?: string; isCurrent?: boolean; grade?: string; description?: string }>;
  skills: Array<{ name: string; category: 'Technical' | 'Soft' | 'Tool' | 'Industry'; proficiency?: number | null; level?: 'Beginner' | 'Intermediate' | 'Expert' }>;
  projects: Array<{ title: string; description: string; longDescription?: string; technologies: string[]; demoUrl?: string; githubUrl?: string; role?: string; featured?: boolean }>;
  certifications: Array<{ name: string; issuingOrganization: string; issueDate: string; expiryDate?: string; credentialId?: string; credentialUrl?: string }>;
  languages: Array<{ language: string; proficiency: 'Native' | 'Fluent' | 'Professional' | 'Intermediate' | 'Basic' }>;
  references?: Array<{ name: string; position: string; organization: string; email?: string; phone?: string; relationship?: string }>;
  fieldEvidence?: Record<string, { sourceSnippet: string; confidence: number }>;
}

type Sections = Record<string, string[]>;

/**
 * Adapted from CV-SCAN's extraction pipeline. PDF text is preferred, while
 * image-only PDFs are rendered with Poppler and read locally by Tesseract.
 */
export class OcrCvService {
  static async extract(filePath: string, mimeType: string): Promise<{ rawText: string; data: ExtractedCvData; structured?: StructuredResume; ocr: { applied: boolean; pages: number } }> {
    let rawText = mimeType === 'application/pdf'
      ? await this.extractPdfWithLayout(filePath)
      : await DocumentParser.extractText(filePath, mimeType);
    let ocrApplied = false;
    let ocrPages = 0;

    if (mimeType === 'application/pdf' && rawText.trim().length < 80) {
      const result = await this.ocrPdf(filePath);
      if (result.text.trim()) rawText = result.text;
      ocrApplied = result.pages > 0;
      ocrPages = result.pages;
    }

    if (!rawText.trim()) throw new Error('No readable text was found. For scanned PDFs, ensure the server has Poppler available for OCR.');
    
    const structured = await ScanEngine.processScan(rawText, { ocrApplied });
    const data = ScanEngine.toExtractedCvData(structured);
    return { rawText, data, structured, ocr: { applied: ocrApplied, pages: ocrPages } };
  }

  private static async ocrPdf(pdfPath: string): Promise<{ text: string; pages: number }> {
    const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'portfolio-cv-ocr-'));
    const prefix = path.join(temporaryDirectory, 'page');
    try {
      await execFileAsync('pdftoppm', ['-r', '250', '-png', pdfPath, prefix], { windowsHide: true, timeout: 120000 });
      const images = (await fs.readdir(temporaryDirectory)).filter((name) => /^page-\d+\.png$/i.test(name)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      if (!images.length) return { text: '', pages: 0 };
      // Keep the module name dynamic so TypeScript can compile before the
      // production dependency installation has completed.
      const moduleName = 'tesseract.js';
      const { createWorker } = await import(moduleName) as any;
      const worker = await createWorker('eng');
      try {
        const pages: string[] = [];
        for (const image of images) {
          const result = await worker.recognize(path.join(temporaryDirectory, image));
          if (result.data.text.trim()) pages.push(result.data.text);
        }
        return { text: pages.join('\n\n'), pages: pages.length };
      } finally {
        await worker.terminate();
      }
    } catch (error: any) {
      if (error?.code === 'ENOENT') throw new Error('OCR requires Poppler (pdftoppm). It is included in the Portfolio Docker image.');
      throw error;
    } finally {
      await fs.rm(temporaryDirectory, { recursive: true, force: true });
    }
  }

  /**
   * Reconstruct visual lines from PDF coordinates before parsing.  This keeps
   * vertically related content together and reads multi-column CVs one column
   * at a time, instead of interleaving left and right column text by page.
   */
  private static async extractPdfWithLayout(pdfPath: string): Promise<string> {
    try {
      const moduleName = 'pdfjs-dist/legacy/build/pdf.js';
      const pdfjs: any = await import(moduleName);
      const buffer = await fs.readFile(pdfPath);
      const document = await pdfjs.getDocument({ data: new Uint8Array(buffer), useSystemFonts: true, disableFontFace: true }).promise;
      const lines: LayoutLine[] = [];
      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
        const page = await document.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1 });
        const content = await page.getTextContent({ normalizeWhitespace: true });
        const items: Array<{ text: string; x: number; y: number; width: number }> = content.items.filter((item: any) => item.str?.trim()).map((item: any) => ({ text: item.str.trim(), x: item.transform[4], y: viewport.height - item.transform[5], width: item.width || 0 }));
        const rows: Array<{ y: number; items: typeof items }> = [];
        for (const item of items.sort((a: any, b: any) => a.y - b.y || a.x - b.x)) {
          const row = rows.find((candidate) => Math.abs(candidate.y - item.y) <= 4);
          if (row) row.items.push(item); else rows.push({ y: item.y, items: [item] });
        }
        for (const row of rows) {
          row.items.sort((a, b) => a.x - b.x);
          const x = row.items[0].x;
          lines.push({ text: row.items.map((item) => item.text).join(' '), x, y: row.y, width: Math.max(...row.items.map((item) => item.x + item.width)) - x, page: pageNumber });
        }
      }
      return this.readLayoutLines(lines);
    } catch {
      // pdf-parse remains a dependable fallback for malformed or encrypted PDFs.
      return DocumentParser.extractText(pdfPath, 'application/pdf');
    }
  }

  private static readLayoutLines(lines: LayoutLine[]): string {
    const output: string[] = [];
    for (const page of [...new Set(lines.map((line) => line.page))]) {
      const pageLines = lines.filter((line) => line.page === page);
      if (!pageLines.length) continue;
      const minX = Math.min(...pageLines.map((line) => line.x));
      const maxX = Math.max(...pageLines.map((line) => line.x + line.width));
      const midpoint = (minX + maxX) / 2;
      const left = pageLines.filter((line) => line.x < midpoint - 25);
      const right = pageLines.filter((line) => line.x >= midpoint - 25);
      // Only treat it as two columns when both sides contain meaningful content.
      const columns = left.length >= 3 && right.length >= 3 ? [left, right] : [pageLines];
      for (const column of columns) output.push(...column.sort((a, b) => a.y - b.y).map((line) => line.text));
    }
    return output.join('\n');
  }

  private static structure(rawText: string): ExtractedCvData {
    const lines = rawText.replace(/\r/g, '').split('\n').map((line) => line.replace(/\s+/g, ' ').trim()).filter(Boolean);
    const sections = this.detectSections(lines);
    const header = sections.header || lines.slice(0, 12);
    const allText = lines.join('\n');
    const email = allText.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i)?.[0] || '';
    const phone = this.extractPhone(header, allText);
    const urls = Array.from(allText.matchAll(/(?:https?:\/\/)?(?:www\.)?[\w.-]+\.(?:com|io|dev|org|net|me)(?:\/[^\s|]*)?/gi)).map((match) => match[0]);
    const firstNameLine = header.find((line) => this.looksLikeName(line)) || '';
    const title = this.extractTitle(header, firstNameLine);
    const location = header.find((line) => (/\b(nairobi|kenya|uganda|tanzania|remote|city|location|address|street|road|avenue|box|postal)\b/i.test(line) || ContactNormalizer.isPoBoxOrPostalCode(line)) && !/@/.test(line)) || '';
    const summaryLines = sections.summary || [];
    const evidence = (value: string, confidence: number) => ({ sourceSnippet: value.slice(0, 160), confidence });

    return {
      personalInfo: {
        fullName: firstNameLine,
        title,
        email,
        phone,
        location: location.replace(/^(location|address)\s*:\s*/i, ''),
        website: urls.find((url) => !/linkedin|github|twitter|x\.com/i.test(url)) || '',
        linkedin: urls.find((url) => /linkedin\.com/i.test(url)) || '',
        github: urls.find((url) => /github\.com/i.test(url)) || '',
        twitter: urls.find((url) => /(?:twitter\.com|x\.com)/i.test(url)) || '',
      },
      headline: title,
      summary: summaryLines.join(' ').trim(),
      experiences: this.extractExperience(sections.experience || []),
      education: this.extractEducation(sections.education || []),
      skills: this.extractSkills(sections.skills || [], allText),
      projects: this.extractProjects(sections.projects || []),
      certifications: this.extractCertifications(sections.certifications || []),
      languages: this.extractLanguages(sections.languages || []),
      fieldEvidence: {
        'general.fullName': evidence(firstNameLine, firstNameLine ? .9 : 0),
        'general.title': evidence(title, title ? .88 : 0),
        'general.summary': evidence(summaryLines.join(' '), summaryLines.length ? .9 : 0),
        'contacts.contactEmail': evidence(email, email ? .99 : 0),
        'contacts.phone': evidence(phone, phone ? .94 : 0),
      },
    };
  }

  private static detectSections(lines: string[]): Sections {
    const labels: Array<[string, RegExp]> = [
      ['summary', /^(professional )?(summary|profile|objective|about( me)?|career summary|personal statement)$/i],
      ['experience', /^(work|professional|relevant|employment|career|industry|practical)?\s*(experience|history|employment record)(?:\s*(?:and|&)\s*(?:achievements|responsibilities))?$/i],
      ['education', /^(education|academic (background|history|qualifications)|qualifications)$/i],
      ['skills', /^(technical |core |key )?(skills|competencies|proficiencies|technologies|tools)$/i],
      ['projects', /^(key |personal |selected |academic )?projects$/i],
      ['certifications', /^(professional )?(certifications?|certificates?|credentials?|licenses?( and certifications?)?|training and certifications?)$/i],
      ['languages', /^(languages?( spoken| proficiency| skills)?|spoken( and written)? languages?|language abilities)$/i],
    ];
    const sections: Sections = { header: [] };
    let current = 'header';
    for (const line of lines) {
      const found = labels.find(([, pattern]) => pattern.test(line.replace(/[:|–—-]/g, '').replace(/\s+/g, ' ').trim()));
      if (found) { current = found[0]; sections[current] ||= []; continue; }
      sections[current].push(line);
    }
    return sections;
  }

  private static extractExperience(lines: string[]) {
    const groups = this.groupExperienceEntries(lines);
    return groups.map((group) => this.buildExperience(group)).filter((item): item is NonNullable<typeof item> => Boolean(item));
  }

  private static extractEducation(lines: string[]) {
    const degreePattern = /\b(bachelor|master|ph\.?d|diploma|certificate|b\.sc|b\.a|b\.eng|m\.sc|m\.a|mba)\b/i;
    const institutionPattern = /\b(university|college|institute|school|polytechnic|academy)\b/i;
    const records: Array<{ institution: string; qualification: string; field: string; startDate: string; endDate: string; isCurrent: boolean; description: string }> = [];
    for (let index = 0; index < lines.length; index++) {
      if (!degreePattern.test(lines[index])) continue;
      const context = lines.slice(Math.max(0, index - 1), Math.min(lines.length, index + 3));
      const joined = context.join(' ');
      const institution = context.find((line) => institutionPattern.test(line)) || '';
      const years = joined.match(/(?:19|20)\d{2}\s*(?:-|–|—|to)\s*(?:(?:19|20)\d{2}|present|current)/i)?.[0] || '';
      const qualification = lines[index].replace(years, '').trim();
      records.push({ institution: institution.replace(years, '').replace(/\s*[|•]\s*$/, '').trim(), qualification, field: qualification.match(/\bin\s+(.+)/i)?.[1] || '', startDate: years.split(/\s*(?:-|–|—|to)\s*/i)[0] || '', endDate: years.split(/\s*(?:-|–|—|to)\s*/i)[1] || '', isCurrent: /present|current/i.test(years), description: context.filter((line) => line !== lines[index] && line !== institution).join(' ') });
    }
    return records;
  }

  private static extractSkills(section: string[], allText: string) {
    const known = ['JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Laravel', 'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Git', 'Figma', 'Excel', 'Power BI', 'Communication', 'Leadership', 'Project Management'];
    const text = `${section.join(' ')} ${allText}`;
    const values = section.flatMap((line) => line.replace(/^(skills?|technologies)\s*:\s*/i, '').split(/[,|•;/]/)).map((value) => value.trim()).filter((value) => value.length > 1 && value.length < 40);
    for (const skill of known) if (new RegExp(`\\b${skill.replace('.', '\\.')}\\b`, 'i').test(text)) values.push(skill);
    return [...new Set(values.map((value) => value.replace(/^[-•*]\s*/, '')))].map((name) => ({ name, category: (/communication|leadership|management/i.test(name) ? 'Soft' : /git|figma|excel|power bi/i.test(name) ? 'Tool' : 'Technical') as 'Technical' | 'Soft' | 'Tool' }));
  }

  private static extractProjects(lines: string[]) { return this.groupEntries(lines).map((group) => { const text = group.join(' '); const url = text.match(/https?:\/\/\S+|github\.com\/\S+/i)?.[0] || ''; return { title: group[0] || '', description: group.slice(1).join(' ') || group[0] || '', technologies: [], demoUrl: /github\.com/i.test(url) ? '' : url, githubUrl: /github\.com/i.test(url) ? url : '' }; }).filter((item) => item.title); }
  private static extractCertifications(lines: string[]) {
    const entries = this.groupEntries(lines);
    return entries.map((entry) => {
      const text = entry.join(' ');
      // Degrees belong to Education even when an OCR document places them near certificates.
      if (/\b(bachelor|master|ph\.?d|degree|diploma|electrical engineering|computer science)\b/i.test(text)) return null;
      const parts = entry.join(' ').split(/\s*[|•]\s*/).map((item) => item.trim()).filter(Boolean);
      const name = (parts[0] || '').replace(/^[-•*]\s*/, '').trim();
      if (!name || !/\b(certif|license|aws|microsoft|cisco|compTIA|pmp|scrum|first aid|osha)\b/i.test(text)) return null;
      const issuer = parts.slice(1).find((item) => !/(?:19|20)\d{2}/.test(item)) || entry.slice(1).find((line) => /issued by|provided by|academy|institute|microsoft|aws|cisco|comptia|coursera|udemy/i.test(line))?.replace(/^(issued|provided) by\s*:?\s*/i, '') || 'Not specified';
      const issueDate = text.match(/(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(?:19|20)\d{2}|(?:19|20)\d{2}/i)?.[0] || '';
      return { name, issuingOrganization: issuer, issueDate };
    }).filter((item): item is NonNullable<typeof item> => Boolean(item));
  }
  private static extractLanguages(lines: string[]) {
    const knownLanguages = new Set(['english', 'swahili', 'kiswahili', 'french', 'spanish', 'german', 'arabic', 'portuguese', 'italian', 'chinese', 'mandarin', 'japanese', 'korean', 'russian', 'hindi', 'somali', 'kikuyu', 'luo', 'kalenjin', 'luhya', 'kamba', 'meru', 'gikuyu']);
    const candidates = lines.flatMap((line) => line.split(/[,|•;/]/)).map((value) => value.replace(/^[-•*]\s*/, '').trim());
    const seen = new Set<string>();
    return candidates.map((candidate) => {
      const name = candidate.match(/[A-Za-z]+(?:\s+[A-Za-z]+)?/)?.[0] || '';
      const canonical = name.toLowerCase();
      if (!knownLanguages.has(canonical) || seen.has(canonical)) return null;
      seen.add(canonical);
      const level = candidate.match(/\b(native|fluent|professional|intermediate|basic|conversational)\b/i)?.[1]?.toLowerCase();
      return { language: name.replace(/^./, (value) => value.toUpperCase()), proficiency: (level === 'conversational' ? 'Intermediate' : level ? level.replace(/^./, (value) => value.toUpperCase()) : 'Professional') as 'Native' | 'Fluent' | 'Professional' | 'Intermediate' | 'Basic' };
    }).filter((item): item is NonNullable<typeof item> => Boolean(item));
  }
  private static groupEntries(lines: string[]) { const groups: string[][] = []; let current: string[] = []; for (const line of lines) { const isHeading = !/^[-•*]/.test(line) && (/(?:19|20)\d{2}/.test(line) || current.length > 2); if (isHeading && current.length) { groups.push(current); current = [line]; } else current.push(line); } if (current.length) groups.push(current); return groups; }
  private static extractPhone(header: string[], allText: string) {
    const headerPhones = ContactNormalizer.recoverPhonesFromText(header.join('\n'));
    if (headerPhones.length > 0) {
      return headerPhones[0].phone;
    }
    const allPhones = ContactNormalizer.recoverPhonesFromText(allText);
    return allPhones.length > 0 ? allPhones[0].phone : '';
  }
  private static extractTitle(header: string[], name: string) {
    const titleTerms = /\b(engineer|developer|designer|manager|analyst|consultant|specialist|director|architect|accountant|officer|technician|administrator|coordinator|supervisor|researcher|lecturer|teacher|nurse|electrician|intern|student)\b/i;
    const labelled = header.find((line) => /^(title|role|position|profession|headline)\s*:/i.test(line));
    const candidate = labelled || header.find((line) => line !== name && titleTerms.test(line) && !/@|https?:|\b(?:19|20)\d{2}\b/.test(line));
    return (candidate || '').replace(/^(title|role|position|profession|headline)\s*:\s*/i, '').split(/\s+[|•]\s+/)[0].trim();
  }
  private static groupExperienceEntries(lines: string[]) {
    const groups: string[][] = []; let current: string[] = [];
    const roleLine = /\b(engineer|developer|designer|manager|analyst|consultant|specialist|director|architect|accountant|officer|technician|administrator|coordinator|supervisor|researcher|lecturer|teacher|nurse|electrician|intern)\b/i;
    for (const line of lines) {
      const hasDate = /(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+)?(?:19|20)\d{2}\s*(?:-|–|—|to)\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+)?(?:(?:19|20)\d{2}|present|current)/i.test(line);
      const currentHasDate = current.some((item) => /(?:19|20)\d{2}\s*(?:-|–|—|to)/.test(item));
      // A new role after a completed date range begins the next vertical card,
      // even when its dates appear on a following line.
      if (currentHasDate && (hasDate || (!/^[-•*]/.test(line) && roleLine.test(line)))) { groups.push(current); current = []; }
      current.push(line);
    }
    if (current.length) groups.push(current);
    return groups;
  }
  private static buildExperience(group: string[]) {
    const joined = group.join(' ');
    const range = joined.match(/(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+)?(?:19|20)\d{2}\s*(?:-|–|—|to)\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+)?(?:(?:19|20)\d{2}|present|current)/i)?.[0] || '';
    const titleTerms = /\b(engineer|developer|designer|manager|analyst|consultant|specialist|director|architect|accountant|officer|technician|administrator|coordinator|supervisor|researcher|lecturer|teacher|nurse|electrician|intern)\b/i;
    const companyTerms = /\b(ltd|limited|inc|llc|plc|company|corp|corporation|group|solutions|technologies|university|hospital|bank|agency|ministry|school|college|institute)\b/i;
    const compact = group.map((line) => line.replace(range, '').trim()).filter(Boolean);
    const pipeParts = compact.flatMap((line) => line.split(/\s*[|•]\s*/).map((part) => part.trim()).filter(Boolean));
    const position = pipeParts.find((part) => titleTerms.test(part)) || compact.find((line) => titleTerms.test(line)) || '';
    const company = pipeParts.find((part) => part !== position && companyTerms.test(part)) || compact.find((line) => line !== position && companyTerms.test(line)) || '';
    if (!position || !company || !range) return null;
    const [startDate, endDate] = range.split(/\s*(?:-|–|—|to)\s*/i);
    const body = compact.filter((line) => !line.includes(position) && !line.includes(company));
    const responsibilities = body.filter((line) => /^[-•*]/.test(line)).map((line) => line.replace(/^[-•*]\s*/, ''));
    return { position, company, startDate: startDate || '', endDate: endDate || '', isCurrent: /present|current/i.test(endDate || ''), description: body.join(' '), responsibilities, achievements: responsibilities.filter((line) => /\b(increased|reduced|improved|delivered|saved|grew)\b/i.test(line)) };
  }
  private static looksLikeName(line: string) { const words = line.split(/\s+/); return words.length >= 2 && words.length <= 4 && /^[A-Za-zÀ-ÿ' -]+$/.test(line) && !/resume|curriculum|profile|summary|experience/i.test(line); }
}
