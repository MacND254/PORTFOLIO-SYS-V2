import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { prisma } from '../database/client';
import { NotFoundError } from '../utils/errors';
import { config } from '../config/env';

// ─── Layout constants ────────────────────────────────────────────────────────
const PAGE_W = 595.28;  // A4 width  (pt)
const PAGE_H = 841.89;  // A4 height (pt)
const MARGIN  = 0;      // outer page margin – we handle panels manually

const SIDEBAR_W = 175;
const SIDEBAR_X = 0;
const MAIN_X    = SIDEBAR_W + 20;
const MAIN_W    = PAGE_W - MAIN_X - 28;

// Colour palette
const BRAND   = '#4f46e5'; // indigo-600
const DARK    = '#1e293b'; // slate-800
const SIDEBAR_BG = '#0f172a'; // slate-950
const WHITE   = '#ffffff';
const GREY    = '#94a3b8';  // slate-400
const LIGHT   = '#e2e8f0';  // slate-200
const ACCENT  = '#818cf8';  // indigo-400

export class PDFService {
  // ─── Public API ────────────────────────────────────────────────────────────
  public static async generateResumePdf(userId: string): Promise<Buffer> {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        experiences:    { orderBy: { orderIndex: 'asc' } },
        educations:     { orderBy: { orderIndex: 'asc' } },
        skills:         { orderBy: { orderIndex: 'asc' } },
        certifications: { orderBy: { orderIndex: 'asc' } },
        projects:       { orderBy: { orderIndex: 'asc' }, take: 6 },
        awards:         { orderBy: { orderIndex: 'asc' } },
        publications:   { orderBy: { orderIndex: 'asc' } },
        services:       { orderBy: { orderIndex: 'asc' } },
        memberships:    { orderBy: { orderIndex: 'asc' } },
        languages:      { orderBy: { orderIndex: 'asc' } },
        references:     { where: { isPublic: true }, orderBy: { orderIndex: 'asc' } },
        customSections: { where: { isVisible: true }, orderBy: { orderIndex: 'asc' } },
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
    const portfolioUrl = `https://${primarySubdomain}.${config.platformDomain || 'myportfolio.com'}`;

    // QR code buffer
    let qrBuffer: Buffer | null = null;
    try {
      qrBuffer = await QRCode.toBuffer(portfolioUrl, {
        width: 90, margin: 1,
        color: { dark: '#ffffff', light: '#0f172a' },
      });
    } catch (_) { /* skip silently */ }

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        margin: MARGIN,
        size:   'A4',
        bufferPages: true,
        info: {
          Title:   `${profile.user.fullName} - Resume`,
          Author:  profile.user.fullName,
          Subject: profile.title || 'Professional Resume',
          Creator: 'Portfolio SaaS Platform',
        },
      });

      const buffers: Buffer[] = [];
      doc.on('data',  (b: Buffer) => buffers.push(b));
      doc.on('end',   () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // ── Draw left sidebar background (full page height) ──
      doc.rect(SIDEBAR_X, 0, SIDEBAR_W, PAGE_H).fill(SIDEBAR_BG);

      // ── SIDEBAR CONTENT ─────────────────────────────────
      let sy = 30; // sidebar cursor y

      // Avatar circle placeholder or text monogram
      const avatarCy = sy + 46;
      const avatarCx = SIDEBAR_W / 2;
      const avatarR  = 44;

      doc.circle(avatarCx, avatarCy, avatarR).fill(BRAND);
      // Monogram initials
      const initials = profile.user.fullName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
      doc.fillColor(WHITE)
         .fontSize(22)
         .font('Helvetica-Bold')
         .text(initials, avatarCx - 18, avatarCy - 14, { width: 36, align: 'center' });

      sy = avatarCy + avatarR + 14;

      // Name
      doc.fillColor(WHITE)
         .fontSize(11)
         .font('Helvetica-Bold')
         .text(profile.user.fullName, SIDEBAR_X + 8, sy, { width: SIDEBAR_W - 16, align: 'center' });
      sy += 16;

      // Title
      if (profile.title) {
        doc.fillColor(ACCENT)
           .fontSize(8)
           .font('Helvetica')
           .text(profile.title, SIDEBAR_X + 8, sy, { width: SIDEBAR_W - 16, align: 'center' });
        sy += 14;
      }

      // Thin divider
      sy += 6;
      this.sidebarDivider(doc, sy);
      sy += 10;

      // CONTACT
      sy = this.sidebarSection(doc, 'CONTACT', sy);

      const profileUser = profile.user as any;
      const contactItems: { icon: string; text: string }[] = [];
      const publicEmail = (profile as any).contactEmail || profileUser.email;
      if (publicEmail) contactItems.push({ icon: '@', text: publicEmail });
      if (profile.phone) contactItems.push({ icon: 'T', text: profile.phone });
      if (profile.location) contactItems.push({ icon: 'L', text: profile.location });
      if (profile.website) contactItems.push({ icon: 'W', text: profile.website.replace(/^https?:\/\//, '') });
      if (profile.linkedin) contactItems.push({ icon: 'in', text: profile.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\//i, '') });
      if (profile.github) contactItems.push({ icon: 'gh', text: profile.github.replace(/^https?:\/\/(www\.)?github\.com\//i, '') });

      for (const item of contactItems) {
        doc.fillColor(ACCENT).fontSize(7.5).font('Helvetica-Bold')
           .text(item.icon, SIDEBAR_X + 10, sy, { width: 14 });
        doc.fillColor(LIGHT).fontSize(7).font('Helvetica')
           .text(item.text, SIDEBAR_X + 26, sy, { width: SIDEBAR_W - 34, lineBreak: false });
        sy += 13;
      }
      sy += 4;

      // SKILLS
      if (profile.skills && profile.skills.length > 0) {
        this.sidebarDivider(doc, sy); sy += 10;
        sy = this.sidebarSection(doc, 'SKILLS', sy);

        // Group by category
        const grouped: Record<string, string[]> = {};
        for (const sk of profile.skills) {
          const cat = sk.category || 'Technical';
          if (!grouped[cat]) grouped[cat] = [];
          grouped[cat].push(sk.name);
        }

        for (const [cat, names] of Object.entries(grouped)) {
          doc.fillColor(ACCENT).fontSize(6.5).font('Helvetica-Bold')
             .text(cat.toUpperCase(), SIDEBAR_X + 10, sy, { width: SIDEBAR_W - 20 });
          sy += 10;
          for (const name of names.slice(0, 12)) {
            // pill‑style skill tag drawn as a mini row
            doc.fillColor(GREY).fontSize(7.5).font('Helvetica')
               .text(`- ${name}`, SIDEBAR_X + 12, sy, { width: SIDEBAR_W - 22 });
            sy += 11;
          }
          sy += 2;
        }
      }

      // LANGUAGES
      if (profile.languages && profile.languages.length > 0) {
        this.sidebarDivider(doc, sy); sy += 10;
        sy = this.sidebarSection(doc, 'LANGUAGES', sy);

        for (const lang of profile.languages.slice(0, 4)) {
          doc.fillColor(LIGHT).fontSize(7.5).font('Helvetica-Bold')
             .text(lang.language, SIDEBAR_X + 10, sy, { width: SIDEBAR_W - 20 });
          doc.fillColor(GREY).fontSize(7).font('Helvetica')
             .text(lang.proficiency, SIDEBAR_X + 10, sy + 9, { width: SIDEBAR_W - 20 });
          sy += 21;
        }
      }

      // CERTIFICATIONS (sidebar — brief)
      if (profile.certifications && profile.certifications.length > 0) {
        this.sidebarDivider(doc, sy); sy += 10;
        sy = this.sidebarSection(doc, 'CERTIFICATIONS', sy);

        for (const cert of profile.certifications.slice(0, 3)) {
          doc.fillColor(LIGHT).fontSize(7.5).font('Helvetica-Bold')
             .text(cert.name, SIDEBAR_X + 10, sy, { width: SIDEBAR_W - 20 });
          doc.fillColor(GREY).fontSize(6.5).font('Helvetica-Oblique')
             .text(`${cert.issuingOrganization} | ${cert.issueDate}`, SIDEBAR_X + 10, sy + 9, { width: SIDEBAR_W - 20 });
          sy += 22;
        }
      }

      // QR code at bottom of sidebar
      if (qrBuffer && profile.customization?.showQrInPdf !== false) {
        const qrSize = 70;
        const qrX = (SIDEBAR_W - qrSize) / 2;
        const qrY = PAGE_H - qrSize - 30;
        doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });
        doc.fillColor(GREY).fontSize(6).font('Helvetica')
           .text('Scan for live portfolio', SIDEBAR_X + 8, qrY + qrSize + 3, {
             width: SIDEBAR_W - 16, align: 'center',
           });
      }

      // ── MAIN CONTENT ─────────────────────────────────────
      // Header bar
      const headerBarH = 52;
      doc.rect(SIDEBAR_W, 0, PAGE_W - SIDEBAR_W, headerBarH).fill(BRAND);

      // Name in header
      doc.fillColor(WHITE).fontSize(19).font('Helvetica-Bold')
         .text(profile.user.fullName, MAIN_X, 12, { width: MAIN_W });

      // Title / headline
      const subtitle = profile.headline || profile.title || '';
      if (subtitle) {
        doc.fillColor('#c7d2fe').fontSize(9).font('Helvetica')
           .text(subtitle, MAIN_X, 34, { width: MAIN_W });
      }

      let my = headerBarH + 18; // main cursor y

      // SUMMARY
      if (profile.summary || profile.careerObjective || profile.bio) {
        my = this.mainSection(doc, 'PROFESSIONAL SUMMARY', my);
        doc.fillColor(DARK).fontSize(9).font('Helvetica')
           .text((profile.summary || profile.careerObjective || profile.bio)!, MAIN_X, my, {
             width: MAIN_W, align: 'justify',
           });
        my = doc.y + 10;
      }

      // WORK EXPERIENCE
      if (profile.experiences && profile.experiences.length > 0) {
        my = this.mainSection(doc, 'WORK EXPERIENCE', my);
        for (const exp of profile.experiences) {
          // Check for page overflow
          if (my > PAGE_H - 100) { doc.addPage(); this.redrawSidebar(doc, profile.user.fullName, profile.title); my = headerBarH + 18; }

          // Title row
          doc.fillColor(DARK).fontSize(10.5).font('Helvetica-Bold')
             .text(exp.position, MAIN_X, my, { width: MAIN_W - 90 });

          const dateStr = `${exp.startDate} - ${exp.isCurrent ? 'Present' : (exp.endDate || '')}`;
          const tw = doc.widthOfString(dateStr) + 2;
          doc.fillColor(BRAND).fontSize(7.5).font('Helvetica')
             .text(dateStr, MAIN_X + MAIN_W - tw, my, { width: tw });
          my = doc.y;

          doc.fillColor(GREY).fontSize(8.5).font('Helvetica-Oblique')
             .text(`${exp.company}${exp.location ? ' | ' + exp.location : ''}`, MAIN_X, my, { width: MAIN_W });
          my = doc.y + 3;

          if (exp.description) {
            doc.fillColor(DARK).fontSize(8.5).font('Helvetica')
               .text(exp.description, MAIN_X, my, { width: MAIN_W });
            my = doc.y + 3;
          }

          const bullets = [...(exp.responsibilities || []), ...(exp.achievements || [])];
          for (const bullet of bullets.slice(0, 5)) {
            doc.fillColor(BRAND).fontSize(7).font('Helvetica')
               .text('-', MAIN_X, my, { width: 10 });
            doc.fillColor(DARK).fontSize(8.5).font('Helvetica')
               .text(bullet, MAIN_X + 12, my, { width: MAIN_W - 12 });
            my = doc.y + 1;
          }
          my += 7;
        }
      }

      // EDUCATION
      if (profile.educations && profile.educations.length > 0) {
        if (my > PAGE_H - 80) { doc.addPage(); this.redrawSidebar(doc, profile.user.fullName, profile.title); my = headerBarH + 18; }
        my = this.mainSection(doc, 'EDUCATION', my);

        for (const edu of profile.educations) {
          if (my > PAGE_H - 60) { doc.addPage(); this.redrawSidebar(doc, profile.user.fullName, profile.title); my = headerBarH + 18; }
          const qual = `${edu.qualification}${edu.field ? ' in ' + edu.field : ''}`;
          doc.fillColor(DARK).fontSize(10.5).font('Helvetica-Bold')
             .text(qual, MAIN_X, my, { width: MAIN_W });
          my = doc.y;

          const dateRange = `${edu.startDate} - ${edu.isCurrent ? 'Present' : (edu.endDate || '')}`;
          doc.fillColor(GREY).fontSize(8.5).font('Helvetica')
             .text(`${edu.institution}${edu.grade ? ' | Grade: ' + edu.grade : ''} | ${dateRange}`,
               MAIN_X, my, { width: MAIN_W });
          my = doc.y + 6;

          if (edu.description) {
            doc.fillColor(DARK).fontSize(8.5).font('Helvetica')
               .text(edu.description, MAIN_X, my, { width: MAIN_W });
            my = doc.y + 4;
          }
        }
        my += 4;
      }

      // FEATURED PROJECTS
      if (profile.projects && profile.projects.length > 0) {
        if (my > PAGE_H - 80) { doc.addPage(); this.redrawSidebar(doc, profile.user.fullName, profile.title); my = headerBarH + 18; }
        my = this.mainSection(doc, 'FEATURED PROJECTS', my);

        for (const proj of profile.projects) {
          if (my > PAGE_H - 60) { doc.addPage(); this.redrawSidebar(doc, profile.user.fullName, profile.title); my = headerBarH + 18; }

          // Title + link
          doc.fillColor(BRAND).fontSize(10).font('Helvetica-Bold')
             .text(proj.title, MAIN_X, my, { width: MAIN_W - 80 });

          if (proj.demoUrl || proj.githubUrl) {
            const link = proj.demoUrl || proj.githubUrl || '';
            const linkTxt = proj.demoUrl ? 'Demo' : 'GitHub';
            const lw = doc.widthOfString(linkTxt) + 2;
            doc.fillColor(ACCENT).fontSize(7.5).font('Helvetica')
               .text(linkTxt, MAIN_X + MAIN_W - lw, my,
                     { width: lw, link: link });
          }
          my = doc.y;

          if (proj.role) {
            doc.fillColor(GREY).fontSize(7.5).font('Helvetica-Oblique')
               .text(`Role: ${proj.role}`, MAIN_X, my, { width: MAIN_W });
            my = doc.y + 2;
          }

          doc.fillColor(DARK).fontSize(8.5).font('Helvetica')
             .text(proj.description, MAIN_X, my, { width: MAIN_W, align: 'justify' });
          my = doc.y + 2;

          if (proj.technologies && proj.technologies.length > 0) {
            doc.fillColor(ACCENT).fontSize(7.5).font('Helvetica-Oblique')
               .text(`Tech: ${proj.technologies.join(' | ')}`, MAIN_X, my, { width: MAIN_W });
            my = doc.y + 3;
          }
          my += 6;
        }
      }

      // AWARDS
      if (profile.awards && profile.awards.length > 0) {
        if (my > PAGE_H - 70) { doc.addPage(); this.redrawSidebar(doc, profile.user.fullName, profile.title); my = headerBarH + 18; }
        my = this.mainSection(doc, 'AWARDS & HONOURS', my);

        for (const aw of profile.awards) {
          if (my > PAGE_H - 50) { doc.addPage(); this.redrawSidebar(doc, profile.user.fullName, profile.title); my = headerBarH + 18; }
          doc.fillColor(DARK).fontSize(10).font('Helvetica-Bold')
             .text(aw.title, MAIN_X, my, { width: MAIN_W - 80 });
          const awDateW = doc.widthOfString(aw.date) + 2;
          doc.fillColor(BRAND).fontSize(7.5).font('Helvetica')
             .text(aw.date, MAIN_X + MAIN_W - awDateW, my, { width: awDateW });
          my = doc.y;

          doc.fillColor(GREY).fontSize(8.5).font('Helvetica-Oblique')
             .text(aw.organization, MAIN_X, my, { width: MAIN_W });
          my = doc.y + 2;

          if (aw.description) {
            doc.fillColor(DARK).fontSize(8.5).font('Helvetica')
               .text(aw.description, MAIN_X, my, { width: MAIN_W });
            my = doc.y + 2;
          }
          my += 5;
        }
      }

      // PUBLICATIONS
      if (profile.publications && profile.publications.length > 0) {
        if (my > PAGE_H - 70) { doc.addPage(); this.redrawSidebar(doc, profile.user.fullName, profile.title); my = headerBarH + 18; }
        my = this.mainSection(doc, 'PUBLICATIONS', my);

        for (const pub of profile.publications) {
          if (my > PAGE_H - 50) { doc.addPage(); this.redrawSidebar(doc, profile.user.fullName, profile.title); my = headerBarH + 18; }
          doc.fillColor(DARK).fontSize(9.5).font('Helvetica-Bold')
             .text(pub.title, MAIN_X, my, { width: MAIN_W });
          my = doc.y;
          doc.fillColor(GREY).fontSize(8).font('Helvetica-Oblique')
             .text(`${pub.publisher} | ${pub.date}${pub.url ? ' | ' + pub.url : ''}`, MAIN_X, my, { width: MAIN_W });
          my = doc.y + 2;
          if (pub.description) {
            doc.fillColor(DARK).fontSize(8).font('Helvetica')
               .text(pub.description, MAIN_X, my, { width: MAIN_W });
            my = doc.y + 2;
          }
          my += 5;
        }
      }

      // REFERENCES
      if (profile.references && profile.references.length > 0) {
        if (my > PAGE_H - 70) { doc.addPage(); this.redrawSidebar(doc, profile.user.fullName, profile.title); my = headerBarH + 18; }
        my = this.mainSection(doc, 'REFERENCES', my);

        // Two-column refs
        const half = Math.ceil(profile.references.length / 2);
        const col2x = MAIN_X + MAIN_W / 2 + 5;
        let col1y = my;
        let col2y = my;

        profile.references.forEach((ref: any, i: number) => {
          const cx = i < half ? MAIN_X : col2x;
          let cy   = i < half ? col1y  : col2y;
          const cw = MAIN_W / 2 - 10;

          doc.fillColor(DARK).fontSize(9).font('Helvetica-Bold')
             .text(ref.name, cx, cy, { width: cw });
          cy = doc.y;
          doc.fillColor(GREY).fontSize(7.5).font('Helvetica')
             .text(`${ref.position}, ${ref.organization}`, cx, cy, { width: cw });
          cy = doc.y;
          if (ref.email) {
            doc.fillColor(ACCENT).fontSize(7.5).font('Helvetica')
               .text(ref.email, cx, cy, { width: cw });
            cy = doc.y;
          }
          if (ref.phone) {
            doc.fillColor(GREY).fontSize(7.5).font('Helvetica')
               .text(ref.phone, cx, cy, { width: cw });
            cy = doc.y;
          }
          cy += 8;

          if (i < half) col1y = cy;
          else           col2y = cy;
        });
        my = Math.max(col1y, col2y) + 4;
      }

      // CUSTOM SECTIONS
      for (const cs of profile.customSections || []) {
        if (my > PAGE_H - 70) { doc.addPage(); this.redrawSidebar(doc, profile.user.fullName, profile.title); my = headerBarH + 18; }
        my = this.mainSection(doc, cs.title.toUpperCase(), my);
        doc.fillColor(DARK).fontSize(9).font('Helvetica')
           .text(cs.content, MAIN_X, my, { width: MAIN_W });
        my = doc.y + 10;
      }

      // ── Footer on every page ──────────────────────────────────────────────
      const pageCount = (doc.bufferedPageRange().count);
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        // Footer bar
        doc.rect(SIDEBAR_W, PAGE_H - 18, PAGE_W - SIDEBAR_W, 18).fill(BRAND);
        doc.fillColor(WHITE).fontSize(6.5).font('Helvetica')
           .text(
              `${profile.user.fullName} - Professional Resume | ${portfolioUrl} | Page ${i + 1} of ${pageCount}`,
             MAIN_X, PAGE_H - 13,
             { width: MAIN_W, align: 'center' }
           );
      }

      doc.end();
    });
  }

  public static async generateQrCodeDataUrl(url: string): Promise<string> {
    return QRCode.toDataURL(url, { width: 300, margin: 2 });
  }

  // ─── Private helpers ───────────────────────────────────────────────────────
  private static sidebarDivider(doc: InstanceType<typeof PDFDocument>, y: number) {
    doc.strokeColor('#334155').lineWidth(0.5)
       .moveTo(SIDEBAR_X + 10, y)
       .lineTo(SIDEBAR_W - 10, y)
       .stroke();
  }

  private static sidebarSection(doc: InstanceType<typeof PDFDocument>, title: string, y: number): number {
    doc.fillColor(ACCENT).fontSize(7.5).font('Helvetica-Bold')
       .text(title, SIDEBAR_X + 10, y, { width: SIDEBAR_W - 20, characterSpacing: 1 });
    return y + 14;
  }

  /** Draw section heading in main column and return new y */
  private static mainSection(doc: InstanceType<typeof PDFDocument>, title: string, y: number): number {
    doc.fillColor(BRAND).fontSize(10).font('Helvetica-Bold')
       .text(title, MAIN_X, y, { width: MAIN_W, characterSpacing: 0.5 });
    const lineY = doc.y + 1;
    doc.strokeColor(BRAND).lineWidth(1)
       .moveTo(MAIN_X, lineY).lineTo(MAIN_X + MAIN_W, lineY).stroke();
    return lineY + 7;
  }

  /** Draw continuation-page chrome so multi-page resumes remain readable. */
  private static redrawSidebar(doc: InstanceType<typeof PDFDocument>, fullName: string, title?: string | null) {
    doc.rect(SIDEBAR_X, 0, SIDEBAR_W, PAGE_H).fill(SIDEBAR_BG);
    doc.rect(SIDEBAR_W, 0, PAGE_W - SIDEBAR_W, 52).fill(BRAND);
    doc.fillColor(WHITE).fontSize(14).font('Helvetica-Bold')
       .text(fullName, MAIN_X, 13, { width: MAIN_W });
    doc.fillColor('#c7d2fe').fontSize(7.5).font('Helvetica')
       .text(title || 'Professional Resume', MAIN_X, 32, { width: MAIN_W });
    doc.fillColor(ACCENT).fontSize(8).font('Helvetica-Bold')
       .text('RESUME CONTINUED', SIDEBAR_X + 10, 28, { width: SIDEBAR_W - 20, align: 'center', characterSpacing: 0.8 });
    doc.fillColor(GREY).fontSize(7).font('Helvetica')
       .text(fullName, SIDEBAR_X + 10, 44, { width: SIDEBAR_W - 20, align: 'center' });
  }
}
