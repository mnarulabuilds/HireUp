import { Injectable, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service';
import { EntitlementsService } from '../users/entitlements.service';
import { ResumeScoringService } from '../matching/resume-scoring.service';
import { emptyResumeContent } from '@hireup/shared';

export const CreateCoachingSchema = z.object({
  targetRole: z.string().min(2).max(120),
  focusAreas: z.string().min(2).max(500),
});

@Injectable()
export class CoachingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementsService,
    private readonly scoring: ResumeScoringService,
  ) {}

  async list(userId: string) {
    return this.prisma.coachingSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, input: z.infer<typeof CreateCoachingSchema>) {
    const gate = await this.entitlements.can(userId, 'coaching');
    const session = await this.prisma.coachingSession.create({
      data: {
        userId,
        targetRole: input.targetRole,
        focusAreas: input.focusAreas,
        paid: gate.allowed,
        planJson: gate.allowed
          ? (this.buildPlan(input) as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
    });

    if (!gate.allowed) {
      return {
        session,
        requiresPayment: true,
        message: 'Complete Coach checkout to unlock your interview plan',
      };
    }

    return { session, requiresPayment: false };
  }

  async unlockPaid(userId: string, sessionId: string) {
    const gate = await this.entitlements.can(userId, 'coaching');
    if (!gate.allowed) {
      throw new ForbiddenException('Coach plan required');
    }
    const existing = await this.prisma.coachingSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!existing) {
      throw new ForbiddenException('Session not found');
    }
    const plan = this.buildPlan({
      targetRole: existing.targetRole,
      focusAreas: existing.focusAreas,
    });
    return this.prisma.coachingSession.update({
      where: { id: sessionId },
      data: {
        paid: true,
        planJson: plan as unknown as Prisma.InputJsonValue,
      },
    });
  }

  buildPlan(input: z.infer<typeof CreateCoachingSchema>) {
    // Reuse heuristic scorer shape for coaching tips without requiring a resume
    const stub = emptyResumeContent();
    stub.basics.headline = input.targetRole;
    stub.summary = input.focusAreas;
    const { feedback } = this.scoring.scoreHeuristic(
      stub,
      `Interview preparation for ${input.targetRole}. Focus: ${input.focusAreas}`,
      true,
    );
    return {
      targetRole: input.targetRole,
      focusAreas: input.focusAreas,
      agenda: [
        'Day 1: Role narrative and elevator pitch',
        'Day 2: Behavioral stories (STAR) for focus areas',
        'Day 3: Technical / case deep dive',
        'Day 4: Mock interviewer Q&A',
        'Day 5: Closing questions and negotiation notes',
      ],
      tips: feedback.actions,
      stages: feedback.interviewStages,
    };
  }
}
