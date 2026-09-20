import { BadRequestException, Injectable } from '@nestjs/common';
import { ResumeContent, emptyResumeContent } from '@hireup/shared';
import {
  RESUME_FORMAT_EXTRACTORS,
  type ResumeFormatExtractor,
} from './resume-format.extractors';

@Injectable()
export class ResumeParserService {
  private readonly formatExtractors: ResumeFormatExtractor[] = RESUME_FORMAT_EXTRACTORS;

  async parse(file: Express.Multer.File): Promise<ResumeContent> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Empty file');
    }

    const extractor = this.formatExtractors.find((candidate) =>
      candidate.supports(file),
    );
    if (!extractor) {
      throw new BadRequestException('Supported formats: PDF, DOCX, TXT');
    }

    const text = await extractor.extractText(file);
    return this.heuristicExtract(text);
  }

  heuristicExtract(text: string): ResumeContent {
    const content = emptyResumeContent();
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines[0]) {
      content.basics.fullName = lines[0].slice(0, 80);
    }

    const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    if (emailMatch) content.basics.email = emailMatch[0];

    const phoneMatch = text.match(
      /(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{3}\)?[\s-]?)?\d{3}[\s-]?\d{4}/,
    );
    if (phoneMatch) content.basics.phone = phoneMatch[0];

    const skillsIdx = lines.findIndex((l) => /^skills\b/i.test(l));
    if (skillsIdx >= 0) {
      const skillLine = lines[skillsIdx + 1] ?? '';
      content.skills = skillLine
        .split(/[,|•]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 1)
        .slice(0, 40);
    }

    const summaryIdx = lines.findIndex((l) =>
      /^(summary|profile|about)\b/i.test(l),
    );
    if (summaryIdx >= 0) {
      content.summary = lines.slice(summaryIdx + 1, summaryIdx + 4).join(' ');
    }

    // Capture a few experience-looking lines as a single stub role
    const expIdx = lines.findIndex((l) =>
      /^(experience|work history|employment)\b/i.test(l),
    );
    if (expIdx >= 0) {
      const chunk = lines.slice(expIdx + 1, expIdx + 8);
      content.experience = [
        {
          company: chunk[0] ?? 'Previous Company',
          title: chunk[1] ?? 'Role',
          bullets: chunk.slice(2).filter((l) => l.length > 10).slice(0, 5),
        },
      ];
    }

    return content;
  }
}
