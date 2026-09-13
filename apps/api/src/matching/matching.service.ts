import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MatchRequestSchema } from '@hireup/shared';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service';
import { EntitlementsService } from '../users/entitlements.service';
import { ResumesService } from '../resumes/resumes.service';
import { ResumeScoringService } from './resume-scoring.service';

@Injectable()
export class MatchingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementsService,
    private readonly resumes: ResumesService,
    private readonly scoring: ResumeScoringService,
  ) {}

  async match(
    userId: string,
    resumeId: string,
    input: z.infer<typeof MatchRequestSchema>,
  ) {
    const gate = await this.entitlements.can(userId, 'runMatch');
    if (!gate.allowed) {
      throw new ForbiddenException(gate.reason);
    }

    const rich = (await this.entitlements.can(userId, 'richFeedback')).allowed;
    const resume = await this.resumes.get(userId, resumeId);
    const hash = this.scoring.contentHash(resume.content, input.jobDescription);

    const cached = await this.prisma.jobMatch.findFirst({
      where: { resumeId, contentHash: hash, userId },
      orderBy: { createdAt: 'desc' },
    });
    if (cached) {
      return this.serialize(cached);
    }

    const result = await this.scoring.score(
      resume.content,
      input.jobDescription,
      rich,
    );

    await this.entitlements.consumeMatch(userId);

    const created = await this.prisma.jobMatch.create({
      data: {
        userId,
        resumeId,
        jobTitle: input.jobTitle,
        jobDescription: input.jobDescription,
        jobUrl: input.jobUrl || null,
        contentHash: hash,
        overall: result.scores.overall,
        ats: result.scores.ats,
        skills: result.scores.skills,
        experience: result.scores.experience,
        interviewClearance: result.scores.interviewClearance,
        feedback: result.feedback as unknown as Prisma.InputJsonValue,
      },
    });

    return { ...this.serialize(created), provider: result.provider };
  }

  async listForResume(userId: string, resumeId: string) {
    await this.resumes.get(userId, resumeId);
    const rows = await this.prisma.jobMatch.findMany({
      where: { userId, resumeId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return rows.map((r) => this.serialize(r));
  }

  async getOne(userId: string, id: string) {
    const row = await this.prisma.jobMatch.findFirst({ where: { id, userId } });
    if (!row) throw new NotFoundException('Match not found');
    return this.serialize(row);
  }

  private serialize(row: {
    id: string;
    resumeId: string;
    jobTitle: string | null;
    jobDescription: string;
    jobUrl: string | null;
    overall: number;
    ats: number;
    skills: number;
    experience: number;
    interviewClearance: number;
    feedback: Prisma.JsonValue;
    createdAt: Date;
  }) {
    return {
      id: row.id,
      resumeId: row.resumeId,
      jobTitle: row.jobTitle,
      jobDescription: row.jobDescription,
      jobUrl: row.jobUrl,
      scores: {
        overall: row.overall,
        ats: row.ats,
        skills: row.skills,
        experience: row.experience,
        interviewClearance: row.interviewClearance,
      },
      feedback: row.feedback,
      createdAt: row.createdAt,
    };
  }
}
