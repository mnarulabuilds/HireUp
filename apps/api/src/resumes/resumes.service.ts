import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateResumeSchema,
  ResumeContent,
  ResumeContentSchema,
  UpdateResumeSchema,
  emptyResumeContent,
  computeAtsReadinessScore,
  getResumeSuggestions,
  normalizeResumeContent,
  renderResumePlainText,
} from '@hireup/shared';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EntitlementsService } from '../users/entitlements.service';
import { ResumeParserService } from './resume-parser.service';
import { ResumePdfService } from './resume-pdf.service';

@Injectable()
export class ResumesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementsService,
    private readonly parser: ResumeParserService,
    private readonly pdf: ResumePdfService,
  ) {}

  async list(userId: string) {
    return this.prisma.resume.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        source: true,
        status: true,
        updatedAt: true,
        createdAt: true,
      },
    });
  }

  async get(userId: string, id: string) {
    const resume = await this.prisma.resume.findFirst({
      where: { id, userId },
    });
    if (!resume) {
      throw new NotFoundException('Resume not found');
    }
    const content = normalizeResumeContent(
      ResumeContentSchema.parse(resume.content),
    );
    return {
      ...resume,
      content,
    };
  }

  async suggestions(userId: string, id: string) {
    const resume = await this.get(userId, id);
    return {
      atsReadiness: computeAtsReadinessScore(resume.content),
      suggestions: getResumeSuggestions(resume.content),
    };
  }

  async create(userId: string, input: z.infer<typeof CreateResumeSchema>) {
    const gate = await this.entitlements.can(userId, 'createResume');
    if (!gate.allowed) {
      throw new ForbiddenException(gate.reason);
    }

    const content = input.content
      ? ResumeContentSchema.parse(input.content)
      : emptyResumeContent();

    return this.prisma.resume.create({
      data: {
        userId,
        title: input.title,
        source: input.source,
        content: content as Prisma.InputJsonValue,
      },
    });
  }

  async update(
    userId: string,
    id: string,
    input: z.infer<typeof UpdateResumeSchema>,
  ) {
    await this.get(userId, id);
    const data: Prisma.ResumeUpdateInput = {};
    if (input.title) data.title = input.title;
    if (input.status) data.status = input.status;
    if (input.content) {
      data.content = normalizeResumeContent(
        ResumeContentSchema.parse(input.content),
      ) as Prisma.InputJsonValue;
    }
    return this.prisma.resume.update({ where: { id }, data });
  }

  async remove(userId: string, id: string) {
    await this.get(userId, id);
    await this.prisma.resume.delete({ where: { id } });
    return { ok: true };
  }

  async createFromUpload(userId: string, file: Express.Multer.File) {
    const gate = await this.entitlements.can(userId, 'createResume');
    if (!gate.allowed) {
      throw new ForbiddenException(gate.reason);
    }
    const content = await this.parser.parse(file);
    return this.prisma.resume.create({
      data: {
        userId,
        title: content.basics.fullName
          ? `${content.basics.fullName} Resume`
          : 'Uploaded Resume',
        source: 'UPLOAD',
        content: content as Prisma.InputJsonValue,
        status: 'DRAFT',
      },
    });
  }

  async exportText(userId: string, id: string) {
    const gate = await this.entitlements.can(userId, 'export');
    if (!gate.allowed) {
      throw new ForbiddenException(gate.reason);
    }
    const resume = await this.get(userId, id);
    return {
      filename: `${resume.title.replace(/\s+/g, '-').toLowerCase()}.txt`,
      body: renderResumePlainText(resume.content),
    };
  }

  async exportPdf(userId: string, id: string) {
    const gate = await this.entitlements.can(userId, 'export');
    if (!gate.allowed) {
      throw new ForbiddenException(gate.reason);
    }
    const resume = await this.get(userId, id);
    const buffer = await this.pdf.buildPdf(resume.content, resume.title);
    return {
      filename: `${resume.title.replace(/\s+/g, '-').toLowerCase()}.pdf`,
      buffer,
    };
  }
}
