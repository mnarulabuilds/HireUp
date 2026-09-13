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
} from '@hireup/shared';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EntitlementsService } from '../users/entitlements.service';
import { ResumeParserService } from './resume-parser.service';

@Injectable()
export class ResumesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementsService,
    private readonly parser: ResumeParserService,
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
    return {
      ...resume,
      content: ResumeContentSchema.parse(resume.content),
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
      data.content = ResumeContentSchema.parse(
        input.content,
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
      body: this.renderer(resume.content),
    };
  }

  private renderer(content: ResumeContent) {
    const lines: string[] = [];
    lines.push(content.basics.fullName || 'Candidate');
    if (content.basics.headline) lines.push(content.basics.headline);
    lines.push(
      [content.basics.email, content.basics.phone, content.basics.location]
        .filter(Boolean)
        .join(' | '),
    );
    if (content.summary) {
      lines.push('', 'SUMMARY', content.summary);
    }
    if (content.experience.length) {
      lines.push('', 'EXPERIENCE');
      for (const exp of content.experience) {
        lines.push(`${exp.title} — ${exp.company}`);
        for (const b of exp.bullets) lines.push(`• ${b}`);
      }
    }
    if (content.education.length) {
      lines.push('', 'EDUCATION');
      for (const ed of content.education) {
        lines.push(`${ed.degree} — ${ed.school}`);
      }
    }
    if (content.skills.length) {
      lines.push('', 'SKILLS', content.skills.join(', '));
    }
    return lines.join('\n');
  }
}
