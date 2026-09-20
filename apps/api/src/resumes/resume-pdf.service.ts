import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import type { ResumeContent, SectionType } from '@hireup/shared';
import {
  enabledSections,
  formatRoleDateRange,
  normalizeResumeContent,
  sectionHeading,
  visibleCustomSections,
  visibleEducationEntries,
  visibleExperienceRoles,
  visibleProjects,
} from '@hireup/shared';

type PdfDoc = InstanceType<typeof PDFDocument>;

/** Standard ATS-safe fonts (built into PDF, no embedding). */
const FONT = {
  regular: 'Times-Roman',
  bold: 'Times-Bold',
  italic: 'Times-Italic',
} as const;

const MARGINS = { top: 54, bottom: 54, left: 54, right: 54 };
const NAME_SIZE = 18;
const SUBHEAD_SIZE = 11;
const CONTACT_SIZE = 10;
const SECTION_SIZE = 11;
const BODY_SIZE = 10.5;
const META_SIZE = 10;
const LINE_GAP = 2;
const SECTION_SPACE = 10;
const ENTRY_SPACE = 8;

@Injectable()
export class ResumePdfService {
  async buildPdf(content: ResumeContent, title: string): Promise<Buffer> {
    const normalized = normalizeResumeContent(content);
    const config = normalized.sectionConfig!;
    const sections = enabledSections(config);

    const doc = new PDFDocument({
      size: 'LETTER',
      margins: MARGINS,
      bufferPages: true,
      info: {
        Title: title,
        Author: normalized.basics.fullName.trim() || 'HireUp',
        Creator: 'HireUp',
        Producer: 'HireUp',
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    const finished = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    this.renderHeader(doc, normalized);

    for (const sectionType of sections) {
      this.renderSection(doc, sectionType, normalized, config);
    }

    doc.end();
    return finished;
  }

  private width(doc: PdfDoc): number {
    return doc.page.width - doc.page.margins.left - doc.page.margins.right;
  }

  private ensureSpace(doc: PdfDoc, needed: number) {
    const bottom = doc.page.height - doc.page.margins.bottom;
    if (doc.y + needed > bottom) doc.addPage();
  }

  private gap(doc: PdfDoc, px: number) {
    doc.y += px;
  }

  private rule(doc: PdfDoc, weight = 0.75) {
    const x = doc.page.margins.left;
    const w = this.width(doc);
    const y = doc.y + 2;
    doc
      .strokeColor('#222222')
      .lineWidth(weight)
      .moveTo(x, y)
      .lineTo(x + w, y)
      .stroke();
    doc.y = y + 6;
    doc.x = doc.page.margins.left;
  }

  private write(
    doc: PdfDoc,
    text: string,
    style: {
      font?: (typeof FONT)[keyof typeof FONT];
      size?: number;
      color?: string;
      indent?: number;
      align?: 'left' | 'center' | 'right';
      paragraphGap?: number;
    } = {},
  ) {
    if (!text.trim()) return;
    doc
      .font(style.font ?? FONT.regular)
      .fontSize(style.size ?? BODY_SIZE)
      .fillColor(style.color ?? '#111111')
      .text(text, {
        width: this.width(doc),
        indent: style.indent ?? 0,
        align: style.align ?? 'left',
        lineGap: LINE_GAP,
        paragraphGap: style.paragraphGap ?? 0,
      });
  }

  private sectionHeadingBlock(doc: PdfDoc, label: string) {
    this.ensureSpace(doc, 56);
    if (doc.y > doc.page.margins.top + 12) {
      this.gap(doc, SECTION_SPACE);
    }
    this.write(doc, label.toUpperCase(), {
      font: FONT.bold,
      size: SECTION_SIZE,
      color: '#000000',
    });
    this.rule(doc);
  }

  private renderHeader(doc: PdfDoc, content: ResumeContent) {
    const name = content.basics.fullName.trim() || 'Candidate';

    this.write(doc, name, { font: FONT.bold, size: NAME_SIZE, color: '#000000' });

    if (content.basics.headline?.trim()) {
      this.write(doc, content.basics.headline.trim(), {
        font: FONT.regular,
        size: SUBHEAD_SIZE,
        color: '#222222',
      });
    }

    const contactParts = [
      content.basics.email?.trim(),
      content.basics.phone?.trim(),
      content.basics.location?.trim(),
    ].filter(Boolean);

    for (const link of content.basics.links ?? []) {
      if (!link.url?.trim()) continue;
      const label = link.label?.trim() || 'Link';
      contactParts.push(`${label}: ${link.url.trim()}`);
    }

    if (contactParts.length) {
      this.write(doc, contactParts.join(' | '), {
        size: CONTACT_SIZE,
        color: '#333333',
      });
    }

    this.rule(doc, 1);
    this.gap(doc, 4);
  }

  private renderSection(
    doc: PdfDoc,
    sectionType: SectionType,
    content: ResumeContent,
    config: NonNullable<ResumeContent['sectionConfig']>,
  ): boolean {
    switch (sectionType) {
      case 'summary':
        return this.renderSummary(doc, content, config);
      case 'experience':
        return this.renderExperience(doc, content, config);
      case 'education':
        return this.renderEducation(doc, content, config);
      case 'skills':
        return this.renderSkills(doc, content, config);
      case 'projects':
        return this.renderProjects(doc, content, config);
      case 'custom':
        return this.renderCustom(doc, content);
      default:
        return false;
    }
  }

  private renderSummary(
    doc: PdfDoc,
    content: ResumeContent,
    config: NonNullable<ResumeContent['sectionConfig']>,
  ): boolean {
    const text = content.summary.trim();
    if (!text) return false;
    this.sectionHeadingBlock(doc, sectionHeading('summary', config));
    this.write(doc, text);
    return true;
  }

  private renderExperience(
    doc: PdfDoc,
    content: ResumeContent,
    config: NonNullable<ResumeContent['sectionConfig']>,
  ): boolean {
    const roles = visibleExperienceRoles(content.experience);
    if (!roles.length) return false;

    this.sectionHeadingBlock(doc, sectionHeading('experience', config));

    roles.forEach((exp, index) => {
      this.ensureSpace(doc, 64);
      const titleLine = [exp.title.trim(), exp.company.trim()].filter(Boolean).join(', ');
      if (titleLine) {
        this.write(doc, titleLine, { font: FONT.bold, size: BODY_SIZE });
      }

      const dates = formatRoleDateRange(exp.startDate, exp.endDate, exp.current);
      const meta = [dates, exp.location?.trim()].filter(Boolean).join(' | ');
      if (meta) {
        this.write(doc, meta, { size: META_SIZE, color: '#333333' });
      }

      const bullets = exp.bullets.map((b) => b.trim()).filter(Boolean);
      for (const bullet of bullets) {
        this.write(doc, `- ${bullet}`, { indent: 14, size: BODY_SIZE });
      }

      if (index < roles.length - 1) {
        this.gap(doc, ENTRY_SPACE);
      }
    });
    return true;
  }

  private renderEducation(
    doc: PdfDoc,
    content: ResumeContent,
    config: NonNullable<ResumeContent['sectionConfig']>,
  ): boolean {
    const entries = visibleEducationEntries(content.education);
    if (!entries.length) return false;

    this.sectionHeadingBlock(doc, sectionHeading('education', config));

    entries.forEach((ed, index) => {
      const line = [ed.degree.trim(), ed.field?.trim(), ed.school.trim()]
        .filter(Boolean)
        .join(', ');
      if (line) {
        this.write(doc, line, { font: FONT.bold, size: BODY_SIZE });
      }
      const dates = [ed.startDate, ed.endDate].filter(Boolean).join(' - ');
      if (dates) {
        this.write(doc, dates, { size: META_SIZE, color: '#333333' });
      }
      if (ed.details?.trim()) {
        this.write(doc, ed.details.trim());
      }
      if (index < entries.length - 1) {
        this.gap(doc, ENTRY_SPACE);
      }
    });
    return true;
  }

  private renderSkills(
    doc: PdfDoc,
    content: ResumeContent,
    config: NonNullable<ResumeContent['sectionConfig']>,
  ): boolean {
    const skills = content.skills.map((s) => s.trim()).filter(Boolean);
    if (!skills.length) return false;
    this.sectionHeadingBlock(doc, sectionHeading('skills', config));
    this.write(doc, skills.join(', '), { size: BODY_SIZE, color: '#111111' });
    return true;
  }

  private renderProjects(
    doc: PdfDoc,
    content: ResumeContent,
    config: NonNullable<ResumeContent['sectionConfig']>,
  ): boolean {
    const projects = visibleProjects(content.projects);
    if (!projects.length) return false;

    this.sectionHeadingBlock(doc, sectionHeading('projects', config));

    projects.forEach((p, index) => {
      if (p.name.trim()) {
        this.write(doc, p.name.trim(), { font: FONT.bold, size: BODY_SIZE });
      }
      if (p.url?.trim()) {
        this.write(doc, p.url.trim(), { size: META_SIZE, color: '#333333' });
      }
      if (p.description?.trim()) {
        this.write(doc, p.description.trim());
      }
      const bullets = p.bullets.map((b) => b.trim()).filter(Boolean);
      for (const bullet of bullets) {
        this.write(doc, `- ${bullet}`, { indent: 14 });
      }
      if (index < projects.length - 1) {
        this.gap(doc, ENTRY_SPACE);
      }
    });
    return true;
  }

  private renderCustom(doc: PdfDoc, content: ResumeContent): boolean {
    const blocks = visibleCustomSections(content.customSections);
    if (!blocks.length) return false;

    blocks.forEach((block, index) => {
      this.sectionHeadingBlock(doc, block.title.trim() || 'Additional Information');
      this.write(doc, block.content.trim());
      if (index < blocks.length - 1) {
        this.gap(doc, SECTION_SPACE);
      }
    });
    return true;
  }
}
