import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { logger } from '../config/logger';

export class DocumentParser {
  /**
   * Extract plain text from an uploaded CV file (.txt, .pdf, .docx, .doc)
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
        const text = this.parseDocx(buffer);
        if (text && text.trim().length > 30) return text;
      }

      if (ext === '.pdf' || mimeType === 'application/pdf') {
        const text = this.parsePdf(buffer);
        if (text && text.trim().length > 30) return text;
      }

      // Generic fallback: inspect buffer for ASCII / UTF-8 printable strings
      const fallbackText = this.extractPrintableStrings(buffer);
      if (fallbackText && fallbackText.trim().length > 50) {
        return fallbackText;
      }

      return this.parseTxt(buffer);
    } catch (err: any) {
      logger.warn(`Error during document text extraction: ${err.message}. Falling back to string scan.`);
      return this.extractPrintableStrings(buffer) || '';
    }
  }

  /**
   * Parse plain UTF-8 text file
   */
  private static parseTxt(buffer: Buffer): string {
    return buffer.toString('utf-8').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  }

  /**
   * Parse DOCX by extracting and decompressing word/document.xml from the ZIP container
   */
  private static parseDocx(buffer: Buffer): string {
    try {
      // Find word/document.xml in ZIP binary
      const targetName = 'word/document.xml';
      let offset = 0;
      let documentXml = '';

      while (offset < buffer.length - 30) {
        // Look for Local File Header signature: PK\x03\x04 (0x04034b50)
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
              // Deflate compression
              const decompressed = zlib.inflateRawSync(compressedData);
              documentXml = decompressed.toString('utf-8');
            } else if (compressionMethod === 0) {
              // Stored (no compression)
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
        // Try searching for uncompressed XML snippets in buffer
        const match = buffer.toString('binary').match(/<w:document[\s\S]*?<\/w:document>/);
        if (match) documentXml = match[0];
      }

      if (documentXml) {
        // Convert <w:p> to newlines and extract all <w:t> text nodes
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
   * Parse PDF text by decompressing stream objects and decoding text operators
   */
  private static parsePdf(buffer: Buffer): string {
    const extractedLines: string[] = [];

    try {
      const pdfString = buffer.toString('binary');

      // Find all stream ... endstream blocks
      const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
      let match: RegExpExecArray | null;

      while ((match = streamRegex.exec(pdfString)) !== null) {
        const streamRaw = match[1];
        let streamContent = streamRaw;

        // Check if stream is Flate compressed
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
            // Not compressed or raw stream
            streamContent = streamRaw;
          }
        }

        // Extract text from BT ... ET blocks
        const btRegex = /BT([\s\S]*?)ET/g;
        let btMatch: RegExpExecArray | null;

        while ((btMatch = btRegex.exec(streamContent)) !== null) {
          const block = btMatch[1];
          let blockText = '';

          // 1. Array strings: [(Hello) 10 (World)] TJ
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

          // 2. Simple string operators: (Text) Tj or (Text) ' or (Text) "
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

      // Fallback: search for parenthesized strings throughout the PDF
      const simpleStrings = pdfString.match(/\([A-Za-z0-9\s.,;:_@\-\/]{3,}\)/g);
      if (simpleStrings && simpleStrings.length > 10) {
        return simpleStrings.map((s) => s.slice(1, -1)).join('\n');
      }
    } catch (e: any) {
      logger.warn(`PDF parser error: ${e.message}`);
    }

    return '';
  }

  /**
   * Extract contiguous printable ASCII & UTF-8 character sequences from binary
   */
  private static extractPrintableStrings(buffer: Buffer): string {
    const raw = buffer.toString('latin1');
    // Match contiguous sequences of letters, numbers, spaces, and punctuation
    const matches = raw.match(/[A-Za-z0-9\s.,!?:;@#%&*()_\-+=/<>'"[\]{}]{4,}/g);
    if (!matches) return '';

    return matches
      .map((s) => s.trim())
      .filter((s) => s.length >= 3 && !/^[0-9a-fA-F]{16,}$/.test(s))
      .join('\n');
  }
}
