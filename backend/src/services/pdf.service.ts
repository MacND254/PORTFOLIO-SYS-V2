import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { prisma } from '../database/client';
import { NotFoundError } from '../utils/errors';
import { config } from '../config/env';

export class PDFService {
  public static async generateResumePdf(userId: string): Promise<Buffer> {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        experiences: { orderBy: { orderIndex: 'asc' } },
        educations: { orderBy: { orderIndex: 'asc' } },
        skills: { orderBy: { orderIndex: 'asc' } },
        certifications: { orderBy: { orderIndex: 'asc' } },
        projects: { orderBy: { orderIndex: 'asc' } },
        awards: { orderBy: { orderIndex: 'asc' } },
        customization: true,
        user: {
          select: {
            fullName: true,
            email: true,
            subdomains: { where: { isPrimary: true } },
          },
        },
      },
    });

    if (!profile) throw new NotFoundError('Profile not found.');

    const primarySubdomain = profile.user.subdomains[0]?.slug || 'portfolio';
    const portfolioUrl = `https://${primarySubdomain}.${config.platformDomain}`;

    // Generate QR Code PNG Buffer if enabled
    let qrBuffer: Buffer | null = null;
    if (profile.customization?.showQrInPdf !== false) {
      try {
        qrBuffer = await QRCode.toBuffer(portfolioUrl, {
          width: 100,
          margin: 1,
          color: { dark: '#0f172a', light: '#ffffff' },
        });
      } catch (e) {
        console.error('QR generation failed for PDF:', e);
      }
    }

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const accentColor = '#3b82f6';
      const textColor = '#1e293b';
      const secondaryTextColor = '#64748b';

      // --- HEADER ---
      doc.fillColor(accentColor).fontSize(22).font('Helvetica-Bold').text(profile.user.fullName);
      doc.fillColor(secondaryTextColor).fontSize(12).font('Helvetica').text(profile.title || 'Professional');

      // Contact Line
      const contactParts = [
        profile.user.email,
        profile.phone,
        profile.location,
        profile.linkedin ? `LinkedIn: ${profile.linkedin}` : null,
        profile.github ? `GitHub: ${profile.github}` : null,
      ].filter(Boolean);

      doc.moveDown(0.4);
      doc.fontSize(9).fillColor(textColor).text(contactParts.join(' | '));
      doc.moveDown(0.5);

      // Embed QR Code in top right if generated
      if (qrBuffer) {
        doc.image(qrBuffer, 460, 35, { fit: [75, 75] });
        doc.fontSize(7).fillColor(secondaryTextColor).text('Scan Portfolio', 465, 112);
      }

      // Horizontal Divider
      doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(40, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.8);

      // --- SUMMARY ---
      if (profile.summary) {
        this.addSectionHeader(doc, 'PROFESSIONAL SUMMARY', accentColor);
        doc.fontSize(9.5).fillColor(textColor).font('Helvetica').text(profile.summary, { align: 'justify' });
        doc.moveDown(0.8);
      }

      // --- EXPERIENCE ---
      if (profile.experiences && profile.experiences.length > 0) {
        this.addSectionHeader(doc, 'WORK EXPERIENCE', accentColor);
        for (const exp of profile.experiences) {
          doc.fontSize(11).font('Helvetica-Bold').fillColor(textColor).text(`${exp.position} — ${exp.company}`);
          const dateStr = `${exp.startDate} – ${exp.isCurrent ? 'Present' : exp.endDate || ''} ${exp.location ? '| ' + exp.location : ''}`;
          doc.fontSize(8.5).font('Helvetica-Oblique').fillColor(secondaryTextColor).text(dateStr);
          doc.moveDown(0.3);

          if (exp.description) {
            doc.fontSize(9).font('Helvetica').fillColor(textColor).text(exp.description);
          }

          if (exp.responsibilities && exp.responsibilities.length > 0) {
            for (const resp of exp.responsibilities) {
              doc.fontSize(9).font('Helvetica').fillColor(textColor).text(`  • ${resp}`);
            }
          }
          doc.moveDown(0.6);
        }
      }

      // --- EDUCATION ---
      if (profile.educations && profile.educations.length > 0) {
        this.addSectionHeader(doc, 'EDUCATION', accentColor);
        for (const edu of profile.educations) {
          doc.fontSize(10.5).font('Helvetica-Bold').fillColor(textColor).text(`${edu.qualification}${edu.field ? ' in ' + edu.field : ''}`);
          doc.fontSize(8.5).font('Helvetica').fillColor(secondaryTextColor).text(`${edu.institution} (${edu.startDate} – ${edu.endDate || 'Present'}) ${edu.grade ? '| ' + edu.grade : ''}`);
          doc.moveDown(0.5);
        }
      }

      // --- SKILLS ---
      if (profile.skills && profile.skills.length > 0) {
        this.addSectionHeader(doc, 'TECHNICAL & PROFESSIONAL SKILLS', accentColor);
        const skillNames = profile.skills.map((s) => s.name).join(', ');
        doc.fontSize(9.5).font('Helvetica').fillColor(textColor).text(skillNames);
        doc.moveDown(0.8);
      }

      // --- PROJECTS ---
      if (profile.projects && profile.projects.length > 0) {
        this.addSectionHeader(doc, 'FEATURED PROJECTS', accentColor);
        for (const proj of profile.projects) {
          doc.fontSize(10).font('Helvetica-Bold').fillColor(textColor).text(proj.title);
          doc.fontSize(9).font('Helvetica').fillColor(textColor).text(proj.description);
          if (proj.technologies && proj.technologies.length > 0) {
            doc.fontSize(8).font('Helvetica-Oblique').fillColor(secondaryTextColor).text(`Tech: ${proj.technologies.join(', ')}`);
          }
          doc.moveDown(0.5);
        }
      }

      // --- CERTIFICATIONS ---
      if (profile.certifications && profile.certifications.length > 0) {
        this.addSectionHeader(doc, 'CERTIFICATIONS', accentColor);
        for (const cert of profile.certifications) {
          doc.fontSize(9.5).font('Helvetica-Bold').fillColor(textColor).text(`${cert.name} — ${cert.issuingOrganization} (${cert.issueDate})`);
        }
      }

      doc.end();
    });
  }

  public static async generateQrCodeDataUrl(url: string): Promise<string> {
    return QRCode.toDataURL(url, { width: 300, margin: 2 });
  }

  private static addSectionHeader(doc: typeof PDFDocument, title: string, color: string) {
    doc.fontSize(12).font('Helvetica-Bold').fillColor(color).text(title);
    doc.moveDown(0.2);
    doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(40, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.4);
  }
}
