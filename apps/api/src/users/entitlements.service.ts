import { Injectable, NotFoundException } from '@nestjs/common';
import { ENTITLEMENTS, FeatureKey, PlanTier } from '@hireup/shared';
import { PrismaService } from '../prisma/prisma.service';
import { ENTITLEMENT_GATE_BY_FEATURE } from './entitlement-feature.gates';

@Injectable()
export class EntitlementsService {
  constructor(private readonly prisma: PrismaService) {}

  getLimits(plan: PlanTier) {
    return ENTITLEMENTS[plan];
  }

  monthKey(date = new Date()) {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  async can(
    userId: string,
    feature: FeatureKey,
  ): Promise<{ allowed: boolean; reason?: string; plan: PlanTier }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const plan = user.plan as PlanTier;
    const limits = this.getLimits(plan);
    const gate = ENTITLEMENT_GATE_BY_FEATURE.get(feature);
    if (!gate) {
      return { allowed: false, plan, reason: 'Unknown feature' };
    }

    const monthKey = this.monthKey();
    const resumeCount =
      feature === 'createResume'
        ? await this.prisma.resume.count({ where: { userId } })
        : undefined;

    return gate.evaluate({
      userId,
      user,
      plan,
      limits,
      monthKey,
      resumeCount,
    });
  }

  async consumeMatch(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const key = this.monthKey();
    const used = user.matchMonthKey === key ? user.matchesUsedMonth : 0;
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        matchMonthKey: key,
        matchesUsedMonth: used + 1,
      },
    });
  }
}
