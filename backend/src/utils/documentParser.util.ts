import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { logger } from '../config/logger';

const execFileAsync = promisify(execFile);
const mammoth: any = require('mammoth');
const pdfParse: any = require('pdf-parse');
const WordExtractor: any = require('word-extractor');

export interface ParsedDocumentResult {
  text: string;
  isScannedOrImage: boolean;
  pageCount?: number;
  mimeType?: string;
}

export class DocumentParser {
  /**
   * Extract layout-aware plain text from an uploaded CV file (.txt, .pdf, .docx, .doc)
   */
  public static async extractText(filePath: string, mimeType?: string): Promise<string> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const ext = path.extname(filePath).toLowerCase();
    const buffer = fs.readFileSync(filePath);

    logger.info(`Extracting text from file: ${path.basename(filePath)} (ext: ${ext}, mime: ${mimeType}, size: ${buffer.length} bytes)`);

    try {
      if (ext === '.txt' || mimeType === 'text/plain') {
        return this.parseTxt(buffer);
      }

      if (ext === '.docx' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        return await this.extractDocx(buffer);
      }

      if (ext === '.pdf' || mimeType === 'application/pdf') {
        return await this.extractPdf(buffer);
      }

      if (ext === '.doc' || mimeType === 'application/msword') {
        return await this.extractLegacyDoc(filePath, buffer);
      }

      // Check if file is readable UTF-8 text before attempting binary parsing
      const rawUtf8 = buffer.toString('utf-8');
      if (this.isReadableText(rawUtf8)) {
        return this.normalizeText(rawUtf8);
      }

      return '';
    } catch (err: any) {
      logger.warn(`Error during document text extraction: ${err.message}`);
      return '';
    }
  }

  /**
   * PDF Extraction with spatial layout analysis to prevent column interleaving
   */
  private static async extractPdf(buffer: Buffer): Promise<string> {
    try {
      // Custom pagerender to cluster text by vertical and horizontal positioning
      const customPageRender = async (pageData: any) => {
        const textContent = await pageData.getTextContent({
          normalizeWhitespace: true,
          disableCombineTextItems: false,
        });

        if (!textContent || !textContent.items || textContent.items.length === 0) {
          return '';
        }

        const items = textContent.items.map((item: any) => ({
          text: item.str || '',
          x: item.transform ? item.transform[4] : 0,
          y: item.transform ? item.transform[5] : 0,
          width: item.width || 0,
          height: item.height || 0,
        })).filter((item: any) => item.text.trim().length > 0);

        if (items.length === 0) return '';

        // Detect if the page has multiple columns (e.g. 2-column resume layout)
        const pageWidth = pageData.view ? pageData.view[2] : 600;
        const columnThreshold = pageWidth * 0.45;

        // Check if there are distinct left and right clusters
        const leftItems = items.filter((it: any) => it.x < columnThreshold);
        const rightItems = items.filter((it: any) => it.x >= columnThreshold);

        const isTwoColumn = leftItems.length >= 10 && rightItems.length >= 10;

        const sortItemsByFlow = (itemList: any[]) => {
          // Sort items by Y descending (top-to-bottom) then X ascending (left-to-right)
          return itemList.sort((a, b) => {
            const yDiff = Math.abs(a.y - b.y);
            // If items are on approximately the same line (within 4px)
            if (yDiff <= 4) {
              return a.x - b.x;
            }
            return b.y - a.y; // Top to bottom
          });
        };

        const buildTextFromItems = (itemList: any[]) => {
          const sorted = sortItemsByFlow(itemList);
          const lines: string[] = [];
          let currentLine = '';
          let lastY = -1;

          for (const item of sorted) {
            if (lastY === -1) {
              currentLine = item.text;
              lastY = item.y;
            } else if (Math.abs(item.y - lastY) <= 4) {
              currentLine += ' ' + item.text;
            } else {
              if (currentLine.trim()) lines.push(currentLine.trim());
              currentLine = item.text;
              lastY = item.y;
            }
          }
          if (currentLine.trim()) lines.push(currentLine.trim());
          return lines.join('\n');
        };

        if (isTwoColumn) {
          // Process left column first, then right column to preserve section continuity
          const leftText = buildTextFromItems(leftItems);
          const rightText = buildTextFromItems(rightItems);
          return `${leftText}\n\n${rightText}`;
        } else {
          return buildTextFromItems(items);
        }
      };

      const options = {
        pagerender: customPageRender,
      };

      const result = await pdfParse(buffer, options);
      if (result.text && result.text.trim().length > 30) {
        return this.normalizeText(result.text);
      }

      // Fallback to internal PDF decompressor if standard parser produced minimal text
      const decompressedText = this.parsePdfStreams(buffer);
      if (decompressedText && decompressedText.trim().length > 30) {
        return this.normalizeText(decompressedText);
      }

      return '';
    } catch (e: any) {
      logger.warn(`PDF parser library error: ${e.message}. Trying stream parser.`);
      const decompressedText = this.parsePdfStreams(buffer);
      return decompressedText ? this.normalizeText(decompressedText) : '';
    }
  }

  /**
   * DOCX Extraction preserving headings, tables and list bullets
   */
  private static async extractDocx(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      if (result.value && result.value.trim().length > 30) {
        return this.normalizeText(result.value);
      }
    } catch {
      // Mammoth fallback
    }

    const xmlText = this.parseDocxXml(buffer);
    if (xmlText && xmlText.trim().length > 30) {
      return this.normalizeText(xmlText);
    }

    return '';
  }

  /**
   * Legacy .doc binary extraction
   */
  private static async extractLegacyDoc(filePath: string, buffer: Buffer): Promise<string> {
    try {
      const document = await new WordExtractor().extract(filePath);
      const text = document.getBody?.() || '';
      if (text.trim().length > 30) {
        return this.normalizeText(text);
      }
    } catch (error: any) {
      logger.warn(`Native .doc extraction failed: ${error.message}`);
    }

    const libreText = await this.convertLegacyWordToText(filePath);
    if (libreText.trim().length > 30) {
      return libreText;
    }

    return '';
  }

  /**
   * Parse plain UTF-8 text file
   */
  private static parseTxt(buffer: Buffer): string {
    return this.normalizeText(buffer.toString('utf-8'));
  }

  /**
   * Normalizes line breaks, whitespace and unicode formatting artifacts
   */
  public static normalizeText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\u0000/g, '')
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // Zero-width spaces
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * Checks if string has high readable ASCII / text character density
   */
  private static isReadableText(str: string): boolean {
    if (!str || str.length < 30) return false;
    let readableCount = 0;
    for (let i = 0; i < Math.min(str.length, 1000); i++) {
      const code = str.charCodeAt(i);
      if ((code >= 32 && code <= 126) || code === 10 || code === 13 || code === 9) {
        readableCount++;
      }
    }
    return readableCount / Math.min(str.length, 1000) > 0.85;
  }

  /**
   * Parse DOCX XML directly from zip container
   */
  private static parseDocxXml(buffer: Buffer): string {
    try {
      const targetName = 'word/document.xml';
      let offset = 0;
      let documentXml = '';

      while (offset < buffer.length - 30) {
        if (buffer[offset] === 0x50 && buffer[offset + 1] === 0x4b && buffer[offset + 2] === 0x03 && buffer[offset + 3] === 0x04) {
          const compressionMethod = buffer.readUInt16LE(offset + 8);
          const compressedSize = buffer.readUInt32LE(offset + 18);
          const fileNameLength = buffer.readUInt16LE(offset + 26);
          const extraFieldLength = buffer.readUInt16LE(offset + 28);

          const fileNameStart = offset + 30;
          const fileNameEnd = fileNameStart + fileNameLength;
          const fileName = buffer.toString('utf-8', fileNameStart, fileNameEnd);

          const dataStart = fileNameEnd + extraFieldLength;
          const dataEnd = dataStart + compressedSize;

          if (fileName === targetName && dataEnd <= buffer.length) {
            const compressedData = buffer.slice(dataStart, dataEnd);
            if (compressionMethod === 8) {
              const decompressed = zlib.inflateRawSync(compressedData);
              documentXml = decompressed.toString('utf-8');
            } else if (compressionMethod === 0) {
              documentXml = compressedData.toString('utf-8');
            }
            break;
          }
          offset = dataEnd;
        } else {
          offset++;
        }
      }

      if (!documentXml) {
        const match = buffer.toString('binary').match(/<w:document[\s\S]*?<\/w:document>/);
        if (match) documentXml = match[0];
      }

      if (documentXml) {
        return documentXml
          .replace(/<w:p[^>]*>/gi, '\n')
          .replace(/<w:br[^>]*>/gi, '\n')
          .replace(/<w:tab[^>]*>/gi, '\t')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          .replace(/[ \t]+/g, ' ')
          .replace(/\n\s*\n/g, '\n')
          .trim();
      }
    } catch (e: any) {
      logger.warn(`DOCX parser error: ${e.message}`);
    }

    return '';
  }

  /**
   * Parse PDF text by decompressing stream objects
   */
  private static parsePdfStreams(buffer: Buffer): string {
    const extractedLines: string[] = [];

    try {
      const pdfString = buffer.toString('binary');
      const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
      let match: RegExpExecArray | null;

      while ((match = streamRegex.exec(pdfString)) !== null) {
        const streamRaw = match[1];
        let streamContent = streamRaw;

        try {
          const streamBuffer = Buffer.from(streamRaw, 'binary');
          const decompressed = zlib.inflateSync(streamBuffer);
          streamContent = decompressed.toString('latin1');
        } catch {
          try {
            const streamBuffer = Buffer.from(streamRaw, 'binary');
            const decompressed = zlib.inflateRawSync(streamBuffer);
            streamContent = decompressed.toString('latin1');
          } catch {
            streamContent = streamRaw;
          }
        }

        const btRegex = /BT([\s\S]*?)ET/g;
        let btMatch: RegExpExecArray | null;

        while ((btMatch = btRegex.exec(streamContent)) !== null) {
          const block = btMatch[1];
          let blockText = '';

          const tjArrayRegex = /\[(.*?)\]\s*TJ/g;
          let tjArrMatch: RegExpExecArray | null;
          while ((tjArrMatch = tjArrayRegex.exec(block)) !== null) {
            const inner = tjArrMatch[1];
            const strMatches = inner.match(/\((?:[^()\\]|\\.)*\)/g);
            if (strMatches) {
              const line = strMatches
                .map((s) => s.slice(1, -1).replace(/\\([0-9]{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8))))
                .join('');
              blockText += line + ' ';
            }
          }

          const tjRegex = /\(((?:[^()\\]|\\.)*)\)\s*(?:Tj|'|")/g;
          let tjMatch: RegExpExecArray | null;
          while ((tjMatch = tjRegex.exec(block)) !== null) {
            const unescaped = tjMatch[1].replace(/\\([0-9]{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)));
            blockText += unescaped + ' ';
          }

          if (blockText.trim()) {
            extractedLines.push(blockText.trim());
          }
        }
      }

      if (extractedLines.length > 0) {
        return extractedLines.join('\n');
      }
    } catch (e: any) {
      logger.warn(`PDF stream parser error: ${e.message}`);
    }

    return '';
  }

  /**
   * LibreOffice conversion fallback
   */
  private static async convertLegacyWordToText(filePath: string): Promise<string> {
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-cv-'));
    try {
      const commands = process.platform === 'win32' ? ['soffice.exe', 'soffice'] : ['soffice', 'libreoffice'];
      for (const command of commands) {
        try {
          await execFileAsync(command, ['--headless', '--convert-to', 'txt:Text', '--outdir', outDir, filePath], { windowsHide: true, timeout: 30000 });
          const output = path.join(outDir, `${path.basename(filePath, path.extname(filePath))}.txt`);
          if (fs.existsSync(output)) return this.normalizeText(fs.readFileSync(output, 'utf8'));
        } catch {
          // continue
        }
      }
      return '';
    } finally {
      fs.rmSync(outDir, { recursive: true, force: true });
    }
  }
}
