import fs from 'fs/promises';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { config } from '../config/env';
import { logger } from '../config/logger';
import { DocumentParser } from '../utils/documentParser.util';
import { ScanEngine } from './scanEngine';
import { StructuredResume } from '../types/schema';
import { ContactNormalizer } from '../normalizers/contactNormalizer';

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
 * CV Document Extraction powered exclusively by Google Gemini AI.
 * All OCR scanning (Tesseract / Poppler) has been entirely removed.
 */
export class GeminiCvService {
  static async extract(filePath: string, mimeType: string): Promise<{ rawText: string; data: ExtractedCvData; structured?: StructuredResume }> {
    let rawText = mimeType === 'application/pdf'
      ? await this.extractPdfWithLayout(filePath)
      : await DocumentParser.extractText(filePath, mimeType);

    // If file has no selectable text stream (e.g. scanned PDF or image), transcribe directly via Google Gemini Multimodal
    if (rawText.trim().length < 50) {
      logger.info('[GeminiCvService] Selectable text below threshold. Transcribing document directly using Google Gemini Multimodal...');
      const geminiText = await this.extractDocumentWithGemini(filePath, mimeType);
      if (geminiText.trim()) {
        rawText = geminiText;
      }
    }

    if (!rawText.trim()) {
      throw new Error('No readable resume content could be found in this document. Please ensure your GEMINI_API_KEY is configured or upload a standard text PDF/DOCX file.');
    }
    
    // Process strictly with Google Gemini AI Engine
    const structured = await ScanEngine.processScan(rawText, { forceEngine: 'gemini' });
    const data = ScanEngine.toExtractedCvData(structured);
    return { rawText, data, structured };
  }

  /**
   * Multimodal document transcription using Google Gemini API.
   * Completely replaces legacy OCR.
   */
  private static async extractDocumentWithGemini(filePath: string, mimeType: string): Promise<string> {
    const apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      logger.warn('[GeminiCvService] GEMINI_API_KEY is missing. Cannot perform Gemini multimodal extraction.');
      return '';
    }

    try {
      const modelName = config.geminiModel || process.env.GEMINI_MODEL || 'gemini-3.6-flash';
      const ai = new GoogleGenAI({ apiKey });
      const fileBuffer = await fs.readFile(filePath);
      const base64Data = fileBuffer.toString('base64');

      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            inlineData: {
              mimeType: mimeType || 'application/pdf',
              data: base64Data,
            },
          },
          'Transcribe every readable resume detail from this document accurately into structured plain text. Preserve all headings, job titles, companies, dates, degree names, skills, contact emails, phone numbers, and URLs verbatim. Output the text faithfully without adding conversational remarks.',
        ],
      });

      return response.text?.trim() || '';
    } catch (error: any) {
      logger.error(`[GeminiCvService] Google Gemini Multimodal document extraction error: ${error?.message || error}`);
      return '';
    }
  }

  /**
   * Reconstruct visual lines from PDF coordinates before parsing. This keeps
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
      const columns = left.length >= 3 && right.length >= 3 ? [left, right] : [pageLines];
      for (const column of columns) output.push(...column.sort((a, b) => a.y - b.y).map((line) => line.text));
    }
    return output.join('\n');
  }
}
